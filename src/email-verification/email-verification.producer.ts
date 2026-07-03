import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  EMAIL_QUEUE,
  EMAIL_VERIFICATION_JOB,
} from './email-verification.constants';
import { EmailVerificationJobPayload } from './types/email-verification-job.type';

@Injectable()
export class EmailVerificationProducer {
  constructor(
    @InjectQueue(EMAIL_QUEUE)
    private readonly queue: Queue<EmailVerificationJobPayload>,
  ) {}

  async enqueueVerificationEmail(
    payload: EmailVerificationJobPayload,
  ): Promise<void> {
    const jobId = `${EMAIL_QUEUE}:verification:${payload.userId}`;

    await this.queue.add(EMAIL_VERIFICATION_JOB, payload, {
      jobId,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    });
  }
}
