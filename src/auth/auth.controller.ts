import { Controller, Get, Post, UseGuards, Req, Body, HttpCode } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';

import type { Payload } from './auth.interface';
import { AuthService } from './auth.service';
import { JwtAuthGuard, LocalAuthGuard } from './guards';
import { ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { SignUpDto } from './dto/sign-up.dto';
import { Users } from '@prisma/client';
import { SignInDto } from './dto/sign-in.dto';
import { AccessTokens } from './interfaces/access-token';

@Controller()
export class AuthController {
  constructor(private auth: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  public login(@Req() req: FastifyRequest): { access_token: string } {
    return this.auth.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('auth/check')
  public check(@Req() req: FastifyRequest): Payload {
    return req.user;
  }

  @ApiBody({ type: SignUpDto })
  @Post('sign-up')
  create(@Body() signUpDto: SignUpDto): Promise<Users> {
    return this.auth.singUp(signUpDto as any);
  }

  @ApiBody({ type: SignInDto })
  @Post('auth/sign-in')
  signIn(@Body() signInDto: SignInDto): Promise<AccessTokens> {
    return this.auth.signIn(signInDto);
  }

  @Post('auth/logout')
  @ApiBearerAuth()
  @HttpCode(204)
  async logout(@Body() body: any) {
    const { userId, accessToken } = body;
    return this.auth.logout(userId, accessToken);
  }
}
