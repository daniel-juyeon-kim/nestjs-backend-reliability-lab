import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { IdempotencyKey } from './entities/idempotency-key.entity';
import { Transfer } from './entities/transfer.entity';
import { TransfersService } from './transfers.service';

describe('TransfersService', () => {
  let service: TransfersService;
  let idempotencyKeysRepository: {
    findOneBy: jest.Mock;
  };
  let tx: {
    findOneBy: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(() => {
    idempotencyKeysRepository = {
      findOneBy: jest.fn(),
    };
    tx = {
      findOneBy: jest.fn(),
      save: jest.fn(),
    };
    const transaction = jest.fn(
      (work: (transactionManager: typeof tx) => unknown) => work(tx),
    );
    const transfersRepository = {
      manager: {
        transaction,
      },
    };

    service = new TransfersService(
      transfersRepository as never,
      idempotencyKeysRepository as never,
    );
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  it('Idempotency-Key가 없으면 BadRequestException을 던진다', async () => {
    await expect(service.create(user, undefined, dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('상대 사용자가 없으면 NotFoundException을 던진다', async () => {
    tx.findOneBy.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

    await expect(service.create(user, 'key-1', dto)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('처음 보는 Idempotency-Key면 송금 요청을 생성하고 응답을 저장한다', async () => {
    tx.findOneBy
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: dto.receiverId });
    tx.save.mockImplementation((entity, value) => {
      if (entity === Transfer) {
        return Promise.resolve({ id: 'transfer-1', ...value });
      }
      return Promise.resolve({ id: 'idempotency-1', ...value });
    });

    const result = await service.create(user, 'key-1', dto);

    expect(result).toEqual(responseBody);
    expect(tx.save).toHaveBeenCalledWith(Transfer, {
      senderId: user.id,
      receiverId: dto.receiverId,
      amount: dto.amount,
      status: 'requested',
    });
    expect(tx.save).toHaveBeenCalledWith(IdempotencyKey, {
      userId: user.id,
      key: 'key-1',
      requestHash: hashTransferRequest(dto.receiverId, dto.amount),
      status: 'completed',
      statusCode: 201,
      responseBody,
    });
  });

  it('같은 Idempotency-Key와 같은 요청이면 저장된 응답을 반환한다', async () => {
    tx.findOneBy.mockResolvedValueOnce({
      requestHash: hashTransferRequest(dto.receiverId, dto.amount),
      responseBody,
    });

    await expect(service.create(user, 'key-1', dto)).resolves.toEqual(
      responseBody,
    );
    expect(tx.save).not.toHaveBeenCalled();
  });

  it('같은 Idempotency-Key와 다른 요청이면 ConflictException을 던진다', async () => {
    tx.findOneBy.mockResolvedValueOnce({
      requestHash: hashTransferRequest('other-receiver-id', dto.amount),
      responseBody,
    });

    await expect(service.create(user, 'key-1', dto)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('동시 생성 중 unique 충돌이 나면 기존 응답을 재조회해 반환한다', async () => {
    tx.findOneBy
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: dto.receiverId });
    tx.save.mockImplementation((entity, value) => {
      if (entity === Transfer) {
        return Promise.resolve({ id: 'transfer-1', ...value });
      }
      return Promise.reject(
        Object.assign(new Error('duplicate key'), { code: 'ER_DUP_ENTRY' }),
      );
    });
    idempotencyKeysRepository.findOneBy.mockResolvedValue({
      requestHash: hashTransferRequest(dto.receiverId, dto.amount),
      responseBody,
    });

    await expect(service.create(user, 'key-1', dto)).resolves.toEqual(
      responseBody,
    );
  });
});

const user = {
  id: 'sender-id',
  email: 'sender@example.com',
};

const dto = {
  receiverId: 'receiver-id',
  amount: 1000,
};

const responseBody = {
  id: 'transfer-1',
  senderId: user.id,
  receiverId: dto.receiverId,
  amount: dto.amount,
  status: 'requested',
};

function hashTransferRequest(receiverId: string, amount: number) {
  return createHash('sha256').update(`${receiverId}:${amount}`).digest('hex');
}
