import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Sessions } from '.prisma/client';
import { PrismaService } from 'nestjs-prisma';

@Injectable()
export class TokenRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  getAccessToken(accessToken: string): Promise<Sessions | null> {
    return this.prisma.sessions.findFirst({
      where: {
        session_token: accessToken,
      },
    });
  }

  getUserAccessToken(
    userId: string,
    accessToken: string,
  ): Promise<Sessions | null> {
    return this.prisma.sessions.findFirst({
      where: {
        user_id: userId,
        session_token: accessToken,
      },
    });
  }

  deleteAccessToken(
    accessTokenId: number,
  ): Promise<Sessions> {
    return this.prisma.sessions.update({
      where: {
        id: accessTokenId,
      },
      data: {
        is_active: 'INACTIVE',
      }
    });
  }

  saveAccessToken(
    userId: string,
    ip_address: string,
    accessToken: string,
  ): Promise<Sessions> {
    const jwtConfig = this.configService.get('jwt');
    const expiredAt = new Date(Date.now() + jwtConfig.jwtExpAccessToken);

    return this.prisma.sessions.create({
      data: {
        user_id: userId,
        session_token: accessToken,
        ip_address,
        created_at: new Date(),
        expires_at: expiredAt,
      },
    });
  }
}
