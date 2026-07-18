import { Controller, Get, Post, Body } from '@nestjs/common';
import { JWT_SECRET } from '../constants';

@Controller('auth')
export class AuthController {
  @Post('login')
  login(@Body() dto: any) {
    const mockToken = Buffer.from(`mock-session:${JWT_SECRET}`).toString('base64');
    return {
      access_token: mockToken,
      user: {
        id: 'mock-id',
        email: dto.email || 'user@example.com',
        name: 'Mock User',
        role: 'client',
      },
    };
  }

  @Post('register')
  register(@Body() dto: any) {
    return {
      id: 'mock-id-' + Date.now(),
      email: dto.email || 'user@example.com',
      name: dto.name || 'Mock User',
      role: 'client',
    };
  }

  @Get('profile')
  getProfile() {
    return {
      id: 'mock-id',
      email: 'user@example.com',
      name: 'Mock User',
      role: 'client',
    };
  }
}
