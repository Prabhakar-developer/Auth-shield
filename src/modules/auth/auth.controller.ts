import {
  Controller,
  Get,
  Post,
  UseGuards,
  Body,
  HttpCode,
  Logger,
  Request,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards';
import {
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SignUpDto } from './dto/sign-up.dto';
import { Users } from '@prisma/client';
import { SignInDto } from './dto/sign-in.dto';
import { AccessTokens } from './interfaces/access-token';

@ApiTags('Authentication')
@Controller()
export class AuthController {
  private readonly logger: Logger = new Logger(AuthController.name);

  constructor(private auth: AuthService) {}

  /**
   * Handles user sign-up requests.
   * 
   * Logs the sign-up process and handles potential errors.
   * 
   * @param signUpDto - Data Transfer Object containing sign-up information.
   * @returns The created user object or null if the sign-up fails.
   */
  @ApiOperation({ summary: 'User Sign-Up' })
  @ApiBody({ 
    type: SignUpDto,  
    examples: {
      'application/json': {
        value: {
          username: "john.doe@gmail.com",
          email: "john.doe@gmail.com",
          password: "John@123",
          first_name: "John",
          last_name: "Doe"
        }
      }
    }
  })
  @ApiResponse({ status: 201, description: 'User created successfully.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @Post('sign-up')
  async create(@Body() signUpDto: SignUpDto): Promise<Users | null> {
    this.logger.log('User sign-up process started.');

    try {
      const user = await this.auth.signUp(signUpDto);
      this.logger.log('User sign-up process completed successfully.');
      return user;
    } catch (error) {
      this.logger.error('User sign-up process failed.', JSON.stringify(error));
      throw new InternalServerErrorException('Failed to sign up user.');
    }
  }

  /**
   * Handles user sign-in requests.
   * 
   * Logs the sign-in process and handles potential errors.
   * 
   * @param signInDto - Data Transfer Object containing sign-in credentials.
   * @returns The access tokens upon successful sign-in.
   */
  @ApiOperation({ summary: 'User Sign-In' })
  @ApiBody({ 
    type: SignInDto,
    examples: {
      'application/json': {
        value: {
          username: "john.doe@gmail.com",
          password: "John@123",
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'User signed in successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @Post('auth/sign-in')
  async signIn(@Body() signInDto: SignInDto): Promise<AccessTokens> {
    this.logger.log('User sign-in process started.');

    try {
      const tokens = await this.auth.signIn(signInDto);
      this.logger.log('User sign-in process completed successfully.');
      return tokens;
    } catch (error) {
      this.logger.error('User sign-in process failed.', JSON.stringify(error));
      throw new InternalServerErrorException('Failed to sign in user.');
    }
  }

  /**
   * Logs out the user by invalidating the access token.
   * 
   * Logs the logout process and handles potential errors.
   * 
   * @param req - The request object containing user information.
   * @returns A success message with a 200 status code upon successful logout.
   */
  @ApiOperation({ summary: 'User Logout' })
  @ApiResponse({ status: 200, description: 'Successfully logged out.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @Get('auth/logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async logout(@Request() req: any) {
    this.logger.log('User logout process started.');

    try {
      const authHeader = req.headers['authorization'] || req.headers['Authorization'];
      const accessToken = authHeader && authHeader.split(' ')[1];

      if (!accessToken) {
        this.logger.warn('No access token provided.');
        throw new UnauthorizedException('No access token provided.');
      }

      const { id: userId } = req.user;
      await this.auth.logout(userId, accessToken);

      this.logger.log('User logout process completed successfully.');
      return { message: 'Successfully logged out' };
    } catch (error) {
      this.logger.error('User logout process failed.', JSON.stringify(error));
      throw new InternalServerErrorException('Failed to log out user.');
    }
  }
}
