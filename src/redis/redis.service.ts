import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly redis: Redis;

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.getOrThrow<string>('REDIS_HOST'),
      port: this.configService.getOrThrow<number>('REDIS_PORT'),
    });

    this.redis.on('error', (error) => {
      console.error('Redis connection error', error);
    });
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }

  get(key: string) {
    return this.redis.get(key);
  }
  set(key: string, value: string) {
    return this.redis.set(key, value);
  }

  setWithTtl(key: string, value: string, ttlSeconds: number) {
    return this.redis.set(key, value, 'EX', ttlSeconds);
  }

  delete(key: string) {
    return this.redis.del(key);
  }

  increment(key: string) {
    return this.redis.incr(key);
  }

  expire(key: string, ttlSeconds: number) {
    return this.redis.expire(key, ttlSeconds);
  }

  ttl(key: string) {
    return this.redis.ttl(key);
  }
}
