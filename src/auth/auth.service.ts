import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { UsersService } from 'src/users/users.service';
import { JwtPayloadDto } from './dto/jwt.payload.dto';
import { RefreshTokenDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshToken } from './entities/refresh-token.entity';
import { RefreshTokenRepository } from './refresh-token.repository';
import { AuthenticatedUser } from './types/authenticated-user.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async register(dto: RegisterDto) {
    const { email, password } = dto;

    // 이메일 존재하는지 확인 -> 사용자 서비스
    const user = await this.userService.findByEmail(email);

    // 회원이 존재하면 에러 던지기 -> 여기에서 작업
    if (user) {
      throw new ConflictException('이미 가입된 이메일입니다.');
    }

    // 암호화
    const passwordHash = await bcrypt.hash(password, 10);

    // 데이터 저장 -> 사용자 서비스
    const { id } = await this.userService.create({
      email,
      passwordHash,
    });

    return { id, email };
  }

  async login(user: AuthenticatedUser) {
    // 일치하면 jwt 토큰 발급
    const accessToken = await this.jwtService.signAsync<JwtPayloadDto>({
      sub: user.id,
      email: user.email,
    });

    // 리프레시 토큰 발급
    const refreshToken = randomBytes(64).toString('hex');
    const tokenHash = await bcrypt.hash(refreshToken, 10);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14);

    const refreshTokenEntity: Partial<RefreshToken> = {
      userId: user.id,
      tokenHash,
      expiresAt,
      revokedAt: null,
    };

    await this.refreshTokenRepository.create(refreshTokenEntity);

    return { accessToken, refreshToken };
  }

  async refreshAccessToken({ refreshToken }: RefreshTokenDto) {
    const token = await this.findMatchRefreshToken(refreshToken);

    if (token === null) {
      throw new UnauthorizedException();
    }

    const user = await this.userService.findById(token.userId);

    if (user === null) {
      throw new UnauthorizedException();
    }

    const accessToken = await this.jwtService.signAsync<JwtPayloadDto>({
      sub: user.id,
      email: user.email,
    });

    // refresh 토큰 폐기
    await this.refreshTokenRepository.revokeById(token.id);
    // refresh 토큰 생성
    const newRefreshToken = randomBytes(64).toString('hex');
    const tokenHash = await bcrypt.hash(newRefreshToken, 10);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14);

    const refreshTokenEntity: Partial<RefreshToken> = {
      userId: user.id,
      tokenHash,
      expiresAt,
      revokedAt: null,
    };

    // refresh 토큰 저장
    await this.refreshTokenRepository.create(refreshTokenEntity);

    return { accessToken, refreshToken: newRefreshToken };
  }

  private async findMatchRefreshToken(refreshToken: string) {
    const tokens = await this.refreshTokenRepository.findAllAliveTokensByTime(
      new Date(),
    );

    for (const token of tokens) {
      if (await bcrypt.compare(refreshToken, token.tokenHash)) {
        return token;
      }
    }

    return null;
  }

  async logout(dto: RefreshTokenDto) {
    const token = await this.findMatchRefreshToken(dto.refreshToken);

    if (token === null) {
      throw new UnauthorizedException();
    }

    const refreshTokenId = token.id;

    await this.refreshTokenRepository.revokeById(refreshTokenId);
  }
}
