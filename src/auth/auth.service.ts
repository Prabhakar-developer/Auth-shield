import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import type { JwtPayload } from './auth.interface';
import { User } from '../user';
import { UserRepository } from './../user/user.repository';
import { Users } from '@prisma/client';
import { SignInDto } from './dto/sign-in.dto';
import { AccessTokens } from './interfaces/access-token';
import { TokenService } from './token.service';
import { SignUpDto } from './dto/sign-up.dto';
import { v4 as uuidv4 } from 'uuid';
import { ChangePasswordDto } from '../user/dto/change-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  private readonly logger: Logger = new Logger(AuthService.name);
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokenService: TokenService,
  ) {}

    /**
   * @desc Create a new user
   * @param signUpDto
   * @returns Promise<Users> - Created user
   * @throws ConflictException - User with this email or phone already exists
   */
  async signUp(signUpDto: SignUpDto): Promise<Users> {
    try {
      // Log the sign-up attempt
      this.logger.log(`Attempting to create a new user with email: ${signUpDto.email}`);

      // Check if a user with the provided email already exists
      const existingUser: Users | null = await this.userRepository.findOne({
        where: { email: signUpDto.email },
      });

      if (existingUser) {
        // Log conflict case
        this.logger.warn(`User with email ${signUpDto.email} already exists.`);
        throw new ConflictException('User with this email already exists');
      }

      // Log user creation
      this.logger.log(`Creating a new user with email: ${signUpDto.email}`);

      // Create a new user
      const userUUID = uuidv4();
      return await this.userRepository.create({
        uuid: userUUID,
        username: signUpDto.username,
        email: signUpDto.email,
        password_hash: await this.tokenService.hashPassword(signUpDto.password),
        first_name: signUpDto.first_name,
        last_name: signUpDto.last_name,
        is_active: 'INACTIVE',
        created_by: userUUID,
      });

    } catch (error) {
      // Log the error before re-throwing
      this.logger.error('Error occurred during sign-up:', JSON.stringify(error));

      if (error instanceof ConflictException) {
        throw error;
      }

      // Throw a generic internal server error
      throw new InternalServerErrorException('An error occurred during sign-up. Please try again later.');
    }
  }

  /**
   * @desc Sign in a user
   * @returns AccessTokens - Access and refresh tokens
   * @throws NotFoundException - User not found
   * @throws UnauthorizedException - Invalid credentials
   * @param signInDto - User credentials
   */
  async signIn(signInDto: SignInDto): Promise<AccessTokens> {
    try {
      // Log the start of the sign-in process
      this.logger.log(`Attempting to sign in user: ${signInDto.username}`);

      // Find user by username or email
      const user: Users | null = await this.userRepository.findOne({
        where: {
          username: signInDto.username,
        },
        select: {
          uuid: true,
          email: true,
          password_hash: true,
          User_Roles: true,
        },
      });

      this.logger.log(`Attempting to sign in user: ${JSON.stringify(user)}`);

      if (!user) {
        // Log user not found and throw 404
        this.logger.warn(`User not found: ${signInDto.username}`);
        throw new NotFoundException('User not found');
      }

      // Validate password
      const isPasswordValid = await this.tokenService.isPasswordCorrect(
        signInDto.password,
        user.password_hash,
      );

      if (!isPasswordValid) {
        // Log invalid credentials and throw 401
        this.logger.warn(`Invalid credentials for user: ${signInDto.username}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      // Log successful sign-in
      this.logger.log(`User signed in successfully: ${user.email}`);

      // Generate and return access tokens
      return this.tokenService.sign({
        id: user.uuid,
        email: user.email,
      });

    } catch (error) {
      // Log the error and throw a generic error if it's not a known exception
      if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
        throw error;  // Re-throw known exceptions
      } else {
        this.logger.error(`Sign-in failed for user: ${signInDto.username}`, error);
        throw new InternalServerErrorException('An error occurred during sign-in. Please try again later.');
      }
    }
  }

  /**
   * Logs out a user by invalidating their access token.
   *
   * @param userId - The ID of the user who is logging out.
   * @param accessToken - The access token to be invalidated.
   * @returns A promise that resolves when the logout process is complete.
   */
  async logout(userId: string, accessToken: string): Promise<void> {
    this.logger.log(`Logging out user with ID: ${userId}`);

    try {
      await this.tokenService.logout(userId, accessToken);
      this.logger.log(`Successfully logged out user with ID: ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to log out user with ID: ${userId}`, error);
      throw error;
    }
  }

  /**
   * Changes the password for the user.
   * 
   * @param userId - ID of the user whose password is being changed.
   * @param changePasswordDto - Data Transfer Object containing current and new passwords.
   * @throws {UnauthorizedException} If the user is not found.
   * @throws {BadRequestException} If the current password is incorrect.
   */
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const { currentPassword, newPassword } = changePasswordDto;

    try {
      // Log the password change attempt
      this.logger.log(`Attempting to change password for user ID ${userId}`);

      // Fetch the user from the database
      const user = await this.userRepository.findById(userId);

      if (!user) {
        this.logger.warn(`User ID ${userId} not found`);
        throw new UnauthorizedException('User not found');
      }

      // Verify the current password
      const isPasswordValid = await this.tokenService.isPasswordCorrect(currentPassword, user.password_hash);
      if (!isPasswordValid) {
        this.logger.warn(`Incorrect current password for user ID ${userId}`);
        throw new BadRequestException('Current password is incorrect');
      }

      // Hash the new password
      const hashedNewPassword = await this.tokenService.hashPassword(newPassword);

      // Update the user's password in the database
      await this.userRepository.updatePassword(userId, hashedNewPassword)

      // Log successful password change
      this.logger.log(`Password changed successfully for user ID ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to change password for user ID ${userId}`, error);
      throw error;
    }
  }


  async sendOtp(email: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { email }
    });
    if (!user) {
      throw new BadRequestException('User with this email does not exist');
    }

    // Generate OTP and send it (you can use any OTP library or custom logic)
    const otp = this.generateOtp();
    await this.userRepository.saveOtp(user.uuid, otp);
    this.logger.log(`OTP generated and sent to email: ${email} and otp: ${otp}`);
    
    // Send OTP via email (implementation depends on your email service)
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const { email, otp, newPassword } = resetPasswordDto;

    this.logger.log(`Reset password initiated for email: ${email}`);

    const user = await this.userRepository.findOne({
      where: { email },
    });

    this.logger.log(`user details : ${JSON.stringify(user)}`)
    if (!user) {
      this.logger.warn(`Reset password failed: User with email ${email} does not exist`);
      throw new BadRequestException('User with this email does not exist');
    }

    this.logger.log(`User found for email: ${email}. Validating OTP...`);

    // Validate OTP
    const valid = await this.userRepository.validateOtp(user.uuid, otp);
    this.logger.log(`password validation: ${valid}`);

    if (!valid) {
      this.logger.warn(`Reset password failed: Invalid OTP for email ${email}`);
      throw new BadRequestException('Invalid OTP');
    }

    this.logger.log(`OTP validated successfully for email: ${email}. Hashing new password...`);

    // Update password
    const hashedNewPassword: string = await this.tokenService.hashPassword(newPassword);
    await this.userRepository.updatePassword(user.uuid, hashedNewPassword);

    this.logger.log(`Password successfully reset for email: ${email} and otp: ${otp}`);
  }

  private generateOtp(): string {
    // Generate a 6-digit OTP
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * @desc validate User
   * @param username - username
   * @param password - password
   * @returns return access token
   */
  public async validateUser(username: string, password: string): Promise<Partial<Users> | null> {
    const user = await this.userRepository.findOne({
      where: { username },
    });

    if (user?.password_hash === password) {
      const { password_hash: pass, ...result } = user;
      return result;
    }

    return null;
  }

   /**
   * @desc login user
   * @param user
   * @returns return access token
   */
  public login(user: User): { access_token: string } {
    const payload: Partial<JwtPayload> = { username: user.name, sub: user.id };

    return {
      access_token: this.tokenService.createJwtAccessToken(payload),
    };
  }
}
