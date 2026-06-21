import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthenticatedUser } from './types/authenticated-user.type';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    register: jest.Mock;
    login: jest.Mock;
    getMe: jest.Mock;
    getSessions: jest.Mock;
    revokeSession: jest.Mock;
  };

  beforeEach(() => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
      getMe: jest.fn(),
      getSessions: jest.fn(),
      revokeSession: jest.fn(),
    };

    controller = new AuthController(authService as unknown as AuthService);
  });

  it('returns the authenticated request user from getMe', () => {
    const user: AuthenticatedUser = {
      id: 'user-1',
      email: 'user@example.com',
    };

    expect(controller.getMe(user)).toEqual(user);
    expect(authService.getMe).not.toHaveBeenCalled();
  });
});
