import { Request } from 'express';

export type AuthenticatedUser = {
  id: string;
  email: string;
  jti?: string;
  exp?: number;
};

export type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};

export type AccessTokenUser = AuthenticatedUser & {
  jti: string;
  exp: number;
};
