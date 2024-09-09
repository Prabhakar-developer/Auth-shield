import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PasswordManagementService } from './password-management.service';
import { PasswordPatternConstraint } from './validator-constraint/password-pattern.constraint';

@Module({
  imports: [ConfigModule.forRoot()],
  providers: [PasswordManagementService, PasswordPatternConstraint],
  exports: [PasswordManagementService]
})
export class PasswordManagementModule {}
