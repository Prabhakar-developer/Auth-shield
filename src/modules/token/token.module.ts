import { Module } from '@nestjs/common';
import { TokenService } from './token.service';
import { TokenRepository } from './token.repository';

@Module({
  providers: [TokenService, TokenRepository],
  exports: [TokenService]
})
export class TokenModule {}
