import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import type { JwtPayload } from './auth.interface';
import { User } from '../user';
import { UserRepository } from './../user/user.repository';
import { Users } from '@prisma/client';
import { SignInDto } from './dto/sign-in.dto';
import { AccessTokens } from './interfaces/access-token';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokenService: TokenService,
  ) {}

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
    const payload: JwtPayload = { username: user.name, sub: user.id };

    return {
      access_token: this.tokenService.createJwtAccessToken(payload),
    };
  }

   /**
   * @desc Create a new user
   * @param signUpDto
   * @returns Promise<User> - Created user
   * @throws ConflictException - User with this email or phone already exists
   */
   async singUp(signUpDto: Users): Promise<Users> {
    const testUser: Users | null = await this.userRepository.findOne({
      where: { email: signUpDto.email },
    });

    if (testUser) {
      throw new ConflictException('User with this email or phone already exists');
    }

    return this.userRepository.create(signUpDto);
  }

  /**
   * @desc Sign in a user
   * @returns AccessTokens - Access and refresh tokens
   * @throws NotFoundException - User not found
   * @throws UnauthorizedException - Invalid credentials
   * @param signInDto - User credentials
   */
  async signIn(signInDto: SignInDto): Promise<AccessTokens> {
    const testUser: Users | null = await this.userRepository.findOne({
      where: {
        email: signInDto.email,
      },
      select: {
        uuid: true,
        email: true,
        password_hash: true,
        User_Roles: true,
      },
    });

    if (!testUser) {
      // 404001: User not found
      throw new NotFoundException('User not found');
    }

    if (
      !(await this.tokenService.isPasswordCorrect(
        signInDto.password,
        testUser.password_hash,
      ))
    ) {
      // 401001: Invalid credentials
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.tokenService.sign({
      id: testUser.uuid,
      email: testUser.email,
    });
  }

  logout(userId: string, accessToken: string): Promise<void> {
    return this.tokenService.logout(userId, accessToken);
  }
}
