import { Injectable } from '@nestjs/common';

@Injectable()
export class FakeMailerService {
  sendVerificationEmail(email: string, verificationToken: string): void {
    void email;
    void verificationToken;
  }
}
