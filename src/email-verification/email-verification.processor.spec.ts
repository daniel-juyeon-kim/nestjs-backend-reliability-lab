import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { EMAIL_VERIFICATION_JOB } from './email-verification.constants';
import { EmailVerificationProcessor } from './email-verification.processor';
import { EmailVerificationJobPayload } from './types/email-verification-job.type';

describe('EmailVerificationProcessor', () => {
  let processor: EmailVerificationProcessor;
  let mailer: {
    sendVerificationEmail: jest.MockedFunction<
      (email: string, verificationToken: string) => void
    >;
  };

  beforeEach(() => {
    mailer = {
      sendVerificationEmail: jest.fn(),
    };
    processor = new EmailVerificationProcessor(mailer);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('이메일 인증 job을 처리할 때 fake mailer를 호출한다', async () => {
    const job = {
      name: EMAIL_VERIFICATION_JOB,
      data: {
        userId: 'user-1',
        email: 'user@example.com',
        verificationToken: 'verification-token',
      },
    } as Job<EmailVerificationJobPayload>;

    await processor.process(job);

    expect(mailer.sendVerificationEmail).toHaveBeenCalledWith(
      'user@example.com',
      'verification-token',
    );
  });

  it('메일 발송 실패를 BullMQ가 retry할 수 있게 에러로 반환한다', async () => {
    const error = new Error('smtp down');
    const job = {
      name: EMAIL_VERIFICATION_JOB,
      data: {
        userId: 'user-1',
        email: 'user@example.com',
        verificationToken: 'verification-token',
      },
    } as Job<EmailVerificationJobPayload>;

    mailer.sendVerificationEmail.mockImplementation(() => {
      throw error;
    });

    await expect(processor.process(job)).rejects.toThrow('smtp down');
  });

  it('최종 실패한 job은 에러 로그를 남긴다', () => {
    const logger = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    const job = {
      id: 'job-1',
      name: EMAIL_VERIFICATION_JOB,
      data: {
        userId: 'user-1',
        email: 'user@example.com',
        verificationToken: 'verification-token',
      },
    } as Job<EmailVerificationJobPayload>;
    const target = processor as unknown as {
      onFailed: (job: Job<EmailVerificationJobPayload>, error: Error) => void;
    };

    target.onFailed(job, new Error('smtp down'));

    expect(logger).toHaveBeenCalledWith(
      'Email verification job failed',
      expect.any(String),
    );
  });
});
