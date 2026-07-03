import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from 'src/config/env.schema';
import { EMAIL_QUEUE } from './email-verification.constants';
import { EmailVerificationProcessor } from './email-verification.processor';
import { EmailVerificationProducer } from './email-verification.producer';
import { FakeMailerService } from './fake-mailer.service';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        connection: {
          host: config.getOrThrow('REDIS_HOST'),
          port: config.getOrThrow('REDIS_PORT'),
        },
      }),
    }),
    BullModule.registerQueue({
      name: EMAIL_QUEUE,
    }),
  ],
  providers: [
    EmailVerificationProducer,
    EmailVerificationProcessor,
    FakeMailerService,
  ],
  exports: [EmailVerificationProducer],
})
export class EmailVerificationModule {}
