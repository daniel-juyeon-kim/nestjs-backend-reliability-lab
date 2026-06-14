import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @IsString()
  email!: string;

  @MinLength(8)
  @IsString()
  password!: string;
}
