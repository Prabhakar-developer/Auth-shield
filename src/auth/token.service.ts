import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { TokenRepository } from './token.repository';
import { Sessions } from '@prisma/client';
import { AccessTokens } from './interfaces/access-token';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly tokenRepository: TokenRepository,
  ) {}

  async sign(payload: any): Promise<AccessTokens> {
    const userId = payload.id;
    const _accessToken = this.createJwtAccessToken(payload);
    const _ipAddress = '127.0.0.1';

    await this.tokenRepository.saveAccessToken(
      userId,
      _accessToken,
      _ipAddress
    );

    return {
      accessToken: _accessToken,
    };
  }

  async getAccessToken(
    accessToken: string,
  ): Promise<Sessions | void> {
    const token = await this.tokenRepository.getAccessToken(
      accessToken,
    );

    if (!token) {
      // check if token is in the whitelist
      throw new UnauthorizedException();
    }
  }

  async logout(userId: string, accessToken: string): Promise<void> {
    const _accessToken: Sessions | null =
      await this.tokenRepository.getUserAccessToken(
        userId,
        accessToken,
      );

      if(_accessToken?.id){
        await this.tokenRepository.deleteAccessToken(_accessToken.id);
      }

    return;
  }

  async isPasswordCorrect(
    dtoPassword: string,
    password: string,
  ): Promise<boolean> {
    return bcrypt.compare(dtoPassword, password);
  }

  createJwtAccessToken(payload: Buffer | object): string {
    return this.jwtService.sign(payload, {
      expiresIn: this.configService.get<number>('jwt.expire_in'),
      secret: this.configService.get<string>('jwt.secret'),
    });
  }
}
