import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
  EMAIL_QUEUE,
  EMAIL_VERIFICATION_JOB,
} from './email-verification.constants';
import { FakeMailerService } from './fake-mailer.service';
import { EmailVerificationJobPayload } from './types/email-verification-job.type';

@Processor(EMAIL_QUEUE)
export class EmailVerificationProcessor extends WorkerHost {
  constructor(private readonly mailer: FakeMailerService) {
    super();
  }

  process(job: Job<EmailVerificationJobPayload>): Promise<void> {
    if (job.name !== EMAIL_VERIFICATION_JOB) {
      return Promise.resolve();
    }

    this.mailer.sendVerificationEmail(
      job.data.email,
      job.data.verificationToken,
    );

    return Promise.resolve();
  }
}
