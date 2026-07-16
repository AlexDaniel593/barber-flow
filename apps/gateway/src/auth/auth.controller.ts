import { Controller, Get, Post, Body } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  @Post('login')
  login(@Body() dto: any) {
    return {
      access_token: 'mock-jwt-token',
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
