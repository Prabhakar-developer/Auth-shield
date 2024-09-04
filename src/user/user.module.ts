import { Module } from '@nestjs/common';

import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { TokenService } from '../auth/token.service';
import { JwtStrategy } from '../auth/strategies';
import { TokenRepository } from '../auth/token.repository';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get('jwtSecret'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [UserService, UserRepository, JwtStrategy, TokenService, TokenRepository],
  exports: [UserService, UserRepository],
})
export class UserModule {}
