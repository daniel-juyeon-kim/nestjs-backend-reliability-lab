import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Env } from 'src/config/env.schema';
import { RedisService } from 'src/redis/redis.service';
import { UsersService } from 'src/users/users.service';
import { ACCESS_TOKEN_BLACKLIST_KEY_PREFIX } from '../auth.constants';
import { JwtPayloadDto } from '../dto/jwt.payload.dto';
import { AccessTokenUser } from '../types/authenticated-user.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly userService: UsersService,
    config: ConfigService<Env, true>,
    private readonly redis: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: JwtPayloadDto): Promise<AccessTokenUser> {
    this.assertJwtPayload(payload);

    await this.rejectBlacklistedToken(payload.jti);

    const user = await this.userService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException();
    }

    return {
      id: user.id,
      email: user.email,
      jti: payload.jti,
      exp: payload.exp,
    };
  }

  private async rejectBlacklistedToken(jti: string) {
    try {
      const key = `${ACCESS_TOKEN_BLACKLIST_KEY_PREFIX}:${jti}`;

      const isBlack = await this.redis.get(key);

      if (isBlack) {
        throw new UnauthorizedException();
      }
    } catch {
      throw new UnauthorizedException();
    }
  }

  private assertJwtPayload(
    payload: JwtPayloadDto,
  ): asserts payload is Required<JwtPayloadDto> {
    if (
      typeof payload.sub !== 'string' ||
      typeof payload.jti !== 'string' ||
      typeof payload.exp !== 'number'
    ) {
      throw new UnauthorizedException();
    }
  }
}
