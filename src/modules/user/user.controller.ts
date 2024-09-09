import {
  Body,
  Controller,
  HttpCode,
  InternalServerErrorException,
  Logger,
  Post,
  Request,
  UseGuards
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/auth/guards';
import { ForgotPasswordDto } from '@modules/auth/dto/forgot-password.dto';
import { ResetPasswordDto } from '@modules/auth/dto/reset-password.dto';

import { UserService } from './user.service';
import { ChangePasswordDto } from './dto/change-password.dto';

@ApiTags('Authentication')  // Adds the 'User Management' tag to all endpoints in this controller
@Controller('user')
export class UserController {
  private readonly logger: Logger = new Logger(UserController.name);

  constructor(
    private readonly _userService: UserService,
  ) {}

  /**
   * Handles password change requests for authenticated users.
   * 
   * Logs the password change request and handles potential errors.
   * 
   * @param req - The request object containing user information.
   * @param changePasswordDto - Data Transfer Object containing current and new passwords.
   * @returns A success message if the password is changed successfully.
   * @throws {InternalServerErrorException} If an error occurs during the password change process.
   */
  @ApiOperation({ summary: 'Change Password' })
  @ApiBody({ 
    type: ChangePasswordDto,
    examples: {
      'application/json': {
        value: {
          currentPassword: "John@123",
          newPassword: "John@1234",
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Password successfully changed.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async changePassword(@Request() req: any, @Body() changePasswordDto: ChangePasswordDto) {
    this.logger.log(`Received password change request for user ID ${req.user.id}`);

    const { id: userId } = req.user;

    try {
      await this._userService.changePassword(userId, changePasswordDto);
      this.logger.log(`Password successfully changed for user ID ${userId}`);
      return { message: 'Password successfully changed' };
    } catch (error) {
      this.logger.error(`Failed to change password for user ID ${userId}`, error);
      throw new InternalServerErrorException('Failed to change password');
    }
  }

  /**
   * Initiates a password reset process by sending an OTP to the user's email.
   * 
   * Logs the forgot password request and handles potential errors.
   * 
   * @param forgotPasswordDto - Data Transfer Object containing the user's email.
   * @returns A success message indicating that the OTP has been sent.
   */
  @ApiOperation({ summary: 'Forgot Password' })
  @ApiBody({ 
    type: ForgotPasswordDto,
    examples: {
      'application/json': {
        value: {
          email: "john.doe@gmail.com",
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'OTP sent to the provided email.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    this.logger.log(`Forgot password request for email: ${forgotPasswordDto.email}`);

    try {
      await this._userService.sendOtp(forgotPasswordDto.email);
      return { message: 'OTP sent to the provided email.' };
    } catch (error) {
      this.logger.error(`Failed to process forgot password request for email ${forgotPasswordDto.email}`, error);
      throw new InternalServerErrorException('Failed to process forgot password request.');
    }
  }

  /**
   * Resets the user's password using the provided reset details.
   * 
   * Logs the reset password request and handles potential errors.
   * 
   * @param resetPasswordDto - Data Transfer Object containing reset details.
   * @returns A success message if the password is reset successfully.
   */
  @ApiOperation({ summary: 'Reset Password' })
  @ApiBody({ 
    type: ResetPasswordDto,
    examples: {
      'application/json': {
        value: {
          email: "john.doe@gmail.com",
          otp: "123456",
          newPassword: "John@1234",
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Password successfully reset.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    this.logger.log(`Reset password request for email: ${resetPasswordDto.email}`);

    try {
      await this._userService.resetPassword(resetPasswordDto);
      return { message: 'Password successfully reset.' };
    } catch (error) {
      this.logger.error(`Failed to reset password for email ${resetPasswordDto.email}`, error);
      throw new InternalServerErrorException('Failed to reset password');
    }
  }
}
