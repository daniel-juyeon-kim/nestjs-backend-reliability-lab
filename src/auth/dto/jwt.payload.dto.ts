export class JwtPayloadDto {
  sub: string;
  email: string;
  jti?: string;
  exp?: number;
}
