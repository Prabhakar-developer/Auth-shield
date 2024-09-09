import {
  IsString,
  IsEmail,
  IsNotEmpty,
  Validate,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PasswordPatternConstraint } from '@modules/password-management/validator-constraint/password-pattern.constraint';

export class SignUpDto {
  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  readonly username!: string;

  @ApiProperty({ type: String })
  @IsEmail()
  @IsNotEmpty()
  readonly email!: string;

  @ApiProperty({ type: String, default: 'String!12345' })
  @IsString()
  // @Validate(PasswordPatternConstraint)
  readonly password!: string;

  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsNotEmpty()
  readonly first_name!: string;

  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsNotEmpty()
  readonly last_name!: string;
}
