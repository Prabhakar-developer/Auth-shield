import { IsString, IsNotEmpty, Validate } from 'class-validator';
import { PasswordPatternConstraint } from '../../password-management/validator-constraint/password-pattern.constraint';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  otp!: string;

  @IsString()   
  @IsNotEmpty()
  // @Validate(PasswordPatternConstraint)
  newPassword!: string;
}