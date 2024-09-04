import { Controller, Get, Post, UseGuards, Req, Body, HttpCode, Logger, Request, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';

import type { Payload } from './auth.interface';
import { AuthService } from './auth.service';
import { JwtAuthGuard, LocalAuthGuard } from './guards';
import { ApiBody } from '@nestjs/swagger';
import { SignUpDto } from './dto/sign-up.dto';
import { Users } from '@prisma/client';
import { SignInDto } from './dto/sign-in.dto';
import { AccessTokens } from './interfaces/access-token';
import { ChangePasswordDto } from '../user/dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller()
export class AuthController {
  private readonly logger: Logger = new Logger(AuthController.name);
  constructor(private auth: AuthService) {}

  @ApiBody({ type: SignUpDto })
  @Post('sign-up')
  create(@Body() signUpDto: SignUpDto): Promise<Users> {
    this.logger.log('User signing up process started.')
    return this.auth.signUp(signUpDto);
  }

  @ApiBody({ type: SignInDto })
  @Post('auth/sign-in')
  signIn(@Body() signInDto: SignInDto): Promise<AccessTokens> {
    this.logger.log('User signing in process started.')
    return this.auth.signIn(signInDto);
  }

  /**
   * Logs out the user by invalidating the access token.
   * 
   * @param req - The request object containing the user information.
   * @returns A success message with a 200 status code upon successful logout.
   */
  @Get('auth/logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async logout(@Request() req: any) {
    // Extract the access token from the Authorization header
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    const accessToken = authHeader && authHeader.split(' ')[1];

    if (!accessToken) {
      throw new UnauthorizedException('No access token provided');
    }

    // Call the logout function in the auth service
    const { id: userId } = req.user;
    await this.auth.logout(userId, accessToken);

    // Return a success message
    return { message: 'Successfully logged out' };
  }
  
   /**
   * Handles password change requests for authenticated users.
   * 
   * @param req - The request object containing user information.
   * @param changePasswordDto - Data Transfer Object containing current and new passwords.
   * @returns A success message if the password is changed successfully.
   * @throws {InternalServerErrorException} If an error occurs during the password change process.
   */
   @Post('user/change-password')
   @UseGuards(JwtAuthGuard)
   @HttpCode(200)
   async changePassword(@Request() req: any, @Body() changePasswordDto: ChangePasswordDto) {
    this.logger.log(`Received password change request for user ID. ${req}`);

    const { id: userId } = req.user;
     this.logger.log(`Received password change request for user ID ${userId}`);
 
     try {
       await this.auth.changePassword(userId, changePasswordDto);
       this.logger.log(`Password successfully changed for user ID ${userId}`);
       return { message: 'Password successfully changed' };
     } catch (error) {
       this.logger.error(`Failed to change password for user ID ${userId}`, error);
       throw new InternalServerErrorException('Failed to change password');
     }
   }

  @Post('user/forgot-password')
  @HttpCode(200)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    this.logger.log(`Forgot password request for email: ${forgotPasswordDto.email}`);
    return this.auth.sendOtp(forgotPasswordDto.email);
  }

  @Post('user/reset-password')
  @HttpCode(200)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    this.logger.log(`Reset password request for email: ${resetPasswordDto.email}`);
    await this.auth.resetPassword(resetPasswordDto);
    return { message: 'Password successfully reset.' };
  }

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
}
