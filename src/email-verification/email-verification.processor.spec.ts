import { Job } from 'bullmq';
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
});
