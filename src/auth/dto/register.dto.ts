import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @IsString()
  email!: string;

  @MinLength(8)
  @IsString()
  password!: string;
}
