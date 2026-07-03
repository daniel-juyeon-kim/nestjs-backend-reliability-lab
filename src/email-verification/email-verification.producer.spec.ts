import { Queue } from 'bullmq';
import {
  EMAIL_VERIFICATION_JOB,
  EMAIL_QUEUE,
} from './email-verification.constants';
import { EmailVerificationProducer } from './email-verification.producer';
import { EmailVerificationJobPayload } from './types/email-verification-job.type';

describe('EmailVerificationProducer', () => {
  let producer: EmailVerificationProducer;
  let queue: {
    add: jest.MockedFunction<
      (
        name: string,
        payload: EmailVerificationJobPayload,
        options: Record<string, unknown>,
      ) => Promise<unknown>
    >;
  };

  beforeEach(() => {
    queue = {
      add: jest.fn().mockResolvedValue(undefined),
    };
    producer = new EmailVerificationProducer(
      queue as unknown as Queue<EmailVerificationJobPayload>,
    );
  });

  it('이메일 인증 job을 중복 방지 jobId와 retry 설정으로 enqueue한다', async () => {
    const payload = {
      userId: 'user-1',
      email: 'user@example.com',
      verificationToken: 'verification-token',
    };

    await producer.enqueueVerificationEmail(payload);

    expect(queue.add).toHaveBeenCalledWith(EMAIL_VERIFICATION_JOB, payload, {
      jobId: `${EMAIL_QUEUE}:verification:user-1`,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    });
  });
});
