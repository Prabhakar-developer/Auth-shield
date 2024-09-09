import {  ConflictException, Injectable, InternalServerErrorException, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import type { JwtPayload } from './interfaces/auth';
import { UserService } from '@modules/user/user.service';
import { Users } from '@prisma/client';
import { SignInDto } from './dto/sign-in.dto';
import { AccessTokens } from './interfaces/access-token';
import { TokenService } from '@modules/token/token.service';
import { SignUpDto } from './dto/sign-up.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  private readonly logger: Logger = new Logger(AuthService.name);
  constructor(
    private readonly _userService: UserService,
    private readonly _tokenService: TokenService,
  ) {}

    /**
   * @desc Create a new user
   * @param signUpDto
   * @returns Promise<Users> - Created user
   * @throws ConflictException - User with this email or phone already exists
   */
  async signUp(signUpDto: SignUpDto): Promise<Users | null> {
    try {
      // Log the sign-up attempt
      this.logger.log(`Attempting to create a new user with email: ${signUpDto.email}`);

      // Check if a user with the provided email already exists
      const existingUser: Users | null = await this._userService.findByEmail(signUpDto.email);

      if (existingUser) {
        // Log conflict case
        this.logger.warn(`User with email ${signUpDto.email} already exists.`);
        throw new ConflictException('User with this email already exists');
      }

      // Log user creation
      this.logger.log(`Creating a new user with email: ${signUpDto.email}`);

      // Create a new user
      const userUUID = uuidv4();
      return await this._userService.create({
        uuid: userUUID,
        username: signUpDto.username,
        email: signUpDto.email,
        password_hash: await this._tokenService.hashPassword(signUpDto.password),
        first_name: signUpDto.first_name,
        last_name: signUpDto.last_name,
        is_active: 'ACTIVE',
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
      const user: Users | null = await this._userService.findByUsername(signInDto.username);

      this.logger.log(`Attempting to sign in user: ${JSON.stringify(user)}`);

      if (!user) {
        // Log user not found and throw 404
        this.logger.warn(`User not found: ${signInDto.username}`);
        throw new NotFoundException('User not found');
      }

      // Validate password
      const isPasswordValid = await this._tokenService.isPasswordCorrect(
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
      return this._tokenService.sign({
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
      await this._tokenService.logout(userId, accessToken);
      this.logger.log(`Successfully logged out user with ID: ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to log out user with ID: ${userId}`, error);
      throw error;
    }
  }

 

  /**
   * @desc validate User
   * @param username - username
   * @param password - password
   * @returns return access token
   */
  public async validateUser(username: string, password: string): Promise<Partial<Users> | null> {
    const user = await this._userService.findByUsername(username);

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
  public login(user: any): { access_token: string } {
    const payload: Partial<JwtPayload> = { username: user.name, sub: user.id };

    return {
      access_token: this._tokenService.createJwtAccessToken(payload),
    };
  }
}
