import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('RedisService', () => {
  let service: RedisService;
  let configService: {
    getOrThrow: jest.MockedFunction<(key: string) => string | number>;
  };

  beforeEach(() => {
    configService = {
      getOrThrow: jest.fn((key: string) => {
        if (key === 'REDIS_HOST') {
          return '127.0.0.1';
        }

        return 6379;
      }),
    };

    service = new RedisService(configService as unknown as ConfigService);
  });

  afterEach(async () => {
    await service.delete('test:redis-service:set-get');
    await service.delete('test:redis-service:delete');
    await service.delete('test:redis-service:ttl');
    await service.delete('test:redis-service:increment');
    await service.delete('test:redis-service:expire');
    await service.onModuleDestroy();
  });

  it('stores and reads a value', async () => {
    const key = 'test:redis-service:set-get';

    await service.set(key, 'value');

    await expect(service.get(key)).resolves.toBe('value');
  });

  it('deletes a value', async () => {
    const key = 'test:redis-service:delete';

    await service.set(key, 'value');
    await service.delete(key);

    await expect(service.get(key)).resolves.toBeNull();
  });

  it('expires a value after ttl', async () => {
    const key = 'test:redis-service:ttl';

    await service.setWithTtl(key, 'value', 1);
    await sleep(1100);

    await expect(service.get(key)).resolves.toBeNull();
  });

  it('increments a counter', async () => {
    const key = 'test:redis-service:increment';

    await expect(service.increment(key)).resolves.toBe(1);
    await expect(service.increment(key)).resolves.toBe(2);
  });

  it('sets ttl on an existing key', async () => {
    const key = 'test:redis-service:expire';

    await service.increment(key);
    await service.expire(key, 1);

    expect(await service.ttl(key)).toBeGreaterThan(0);

    await sleep(1100);

    await expect(service.get(key)).resolves.toBeNull();
  });
});
