import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { RefreshTokenDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import type {
  AccessTokenUser,
  AuthenticatedUser,
} from './types/authenticated-user.type';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.login(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return { id: user.id, email: user.email };
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  getSessions(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getSessions(user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('sessions/:sessionId')
  revokeSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('sessionId') sessionId: string,
  ) {
    return this.authService.revokeSession(user, sessionId);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshAccessToken(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Body() dto: RefreshTokenDto, @CurrentUser() user: AccessTokenUser) {
    return this.authService.logout(dto, user);
  }
}
