export type EmailVerificationJobPayload = {
  userId: string;
  email: string;
  verificationToken: string;
};
