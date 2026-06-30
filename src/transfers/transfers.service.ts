import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { EntityManager, Repository } from 'typeorm';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { User } from '../users/entities/user.entity';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { IdempotencyKey } from './entities/idempotency-key.entity';
import { Transfer } from './entities/transfer.entity';

@Injectable()
export class TransfersService {
  constructor(
    @InjectRepository(Transfer)
    private readonly transfersRepository: Repository<Transfer>,
    @InjectRepository(IdempotencyKey)
    private readonly idempotencyKeysRepository: Repository<IdempotencyKey>,
  ) {}

  async create(
    user: AuthenticatedUser,
    idempotencyKey: string | undefined,
    dto: CreateTransferDto,
  ) {
    if (!idempotencyKey) {
      throw new BadRequestException();
    }

    const requestHash = this.hashTransferRequest(dto.receiverId, dto.amount);

    try {
      return await this.transfersRepository.manager.transaction((tx) =>
        this.createInTransaction(tx, user.id, idempotencyKey, requestHash, dto),
      );
    } catch (error) {
      if (!isDuplicateKeyError(error)) {
        throw error;
      }

      const idempotency = await this.idempotencyKeysRepository.findOneBy({
        userId: user.id,
        key: idempotencyKey,
      });

      if (!idempotency) {
        throw error;
      }

      return this.resolveExistingIdempotency(idempotency, requestHash);
    }
  }

  private async createInTransaction(
    tx: EntityManager,
    senderId: string,
    idempotencyKey: string,
    requestHash: string,
    dto: CreateTransferDto,
  ) {
    const idempotency = await tx.findOneBy(IdempotencyKey, {
      userId: senderId,
      key: idempotencyKey,
    });

    if (idempotency) {
      return this.resolveExistingIdempotency(idempotency, requestHash);
    }

    const receiver = await tx.findOneBy(User, { id: dto.receiverId });

    if (!receiver) {
      throw new NotFoundException('no user');
    }

    const transfer = await tx.save(Transfer, {
      senderId,
      receiverId: dto.receiverId,
      amount: dto.amount,
      status: 'requested',
    });
    const responseBody = this.buildResponseBody(transfer);

    await tx.save(IdempotencyKey, {
      userId: senderId,
      key: idempotencyKey,
      requestHash,
      status: 'completed',
      statusCode: 201,
      responseBody,
    });

    return responseBody;
  }

  private resolveExistingIdempotency(
    idempotency: IdempotencyKey,
    requestHash: string,
  ) {
    if (idempotency.requestHash !== requestHash) {
      throw new ConflictException('다시 시도 idempotencyKey는 이미 사용 중');
    }

    if (!idempotency.responseBody) {
      throw new ConflictException('기존 요청이 깨져있음');
    }

    return idempotency.responseBody;
  }

  private hashTransferRequest(receiverId: string, amount: number) {
    return createHash('sha256').update(`${receiverId}:${amount}`).digest('hex');
  }

  private buildResponseBody(transfer: Transfer) {
    return {
      id: transfer.id,
      senderId: transfer.senderId,
      receiverId: transfer.receiverId,
      amount: transfer.amount,
      status: transfer.status,
    };
  }
}

function isDuplicateKeyError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ER_DUP_ENTRY'
  );
}
