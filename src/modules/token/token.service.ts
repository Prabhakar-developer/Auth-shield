import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { TokenRepository } from './token.repository';
import { Sessions } from '@prisma/client';
import { AccessTokens } from './interfaces/access-token';


@Injectable()
export class TokenService {
    private readonly saltRounds = 10;
  private readonly logger: Logger = new Logger(TokenService.name);


  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly tokenRepository: TokenRepository,
  ) {}

  /**
   * @desc Hashes a plain text password
   * @param password - The plain text password
   * @returns Promise<string> - The hashed password
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  /**
   * @desc Compares a plain text password with a hashed password
   * @param dtoPassword - The plain text password provided by the user
   * @param hashedPassword - The hashed password stored in the database
   * @returns Promise<boolean> - Whether the passwords match
   */
  async isPasswordCorrect(dtoPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(dtoPassword, hashedPassword);
  }

  /**
   * Signs in the user by either retrieving an existing access token or creating a new one.
   * 
   * @param payload - The payload containing user information, including user ID and access token.
   * @returns A promise that resolves to an object containing the access token.
   */
  async sign(payload: any): Promise<AccessTokens> {
    const userId = payload.id;
    const _ipAddress = '127.0.0.1';

    // Log the sign-in attempt
    this.logger.log(`Sign-in attempt for user ID: ${userId} from IP: ${_ipAddress}`);

    // Check if access token already exists
    const existingToken = await this.tokenRepository.getAccessToken(payload.accessToken);

    if (existingToken) {
      // Log that an existing token was found
      this.logger.log(`Existing token found for user ID: ${userId}. Returning existing token. ${JSON.stringify(existingToken)}`);

      // Return the existing token
      return {
        accessToken: existingToken.session_token,
      };
    }

    // If no token exists, create a new one
    const _accessToken = this.createJwtAccessToken(payload);

    // Save the new access token in the database
    await this.tokenRepository.saveAccessToken(userId, _ipAddress, _accessToken);

    // Log the creation of a new token
    this.logger.log(`New access token created and saved for user ID: ${userId}.`);

    return {
      accessToken: _accessToken,
    };
  }

  /**
   * Retrieves the access token from the repository.
   * 
   * @param accessToken - The access token to retrieve.
   * @returns A promise that resolves to a Sessions object if found, or throws an UnauthorizedException if not.
   */
  async getAccessToken(accessToken: string): Promise<Sessions | void> {
    // Log the token retrieval attempt
    this.logger.log(`Retrieving access token: ${accessToken}`);

    const token = await this.tokenRepository.getAccessToken(accessToken);

    if (!token) {
      // Log the unauthorized access attempt
      this.logger.warn(`Access token not found or unauthorized: ${accessToken}`);
      throw new UnauthorizedException();
    }

    // Log the successful token retrieval
    this.logger.log(`Access token retrieved successfully: ${accessToken}`);
    return token;
  }

  /**
   * Logs out a user by invalidating the access token.
   * 
   * @param userId - The ID of the user to log out.
   * @param accessToken - The access token to be invalidated.
   * @throws NotFoundException - If the access token is not found in the repository.
   */
  async logout(userId: string, accessToken: string): Promise<void> {
    // Retrieve the access token details from the repository
    const token = await this.tokenRepository.getUserAccessToken(userId, accessToken);

    // If the token is not found, throw an exception
    if (!token) {
      throw new NotFoundException('User access token not found.');
    }

    // If the token is found, delete it from the repository
    await this.tokenRepository.deleteAccessToken(token.id);

    // Log the successful logout operation
    this.logger.log(`User with ID ${userId} successfully logged out.`);
  }

  /**
   * Generates a JWT access token based on the provided payload.
   * 
   * @param payload - The data to be included in the JWT payload, can be an object or a Buffer.
   * @returns A JWT access token as a string.
   */
  createJwtAccessToken(payload: Buffer | object): string {
    return this.jwtService.sign(payload, {
      expiresIn: this.configService.get<number>('jwtExpireIn'),
      secret: this.configService.get<string>('jwtSecret'),
    });
  }
}
