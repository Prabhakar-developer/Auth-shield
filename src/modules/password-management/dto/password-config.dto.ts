import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Min, ValidateIf } from 'class-validator';

export class PasswordConfigDto {
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  PASSWORD_MIN_LENGTH!: number;

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  @ValidateIf(o => o.PASSWORD_MAX_LENGTH >= o.PASSWORD_MIN_LENGTH)
  PASSWORD_MAX_LENGTH!: number;

  @IsBoolean()
  @IsNotEmpty()
  PASSWORD_REQUIRE_UPPERCASE!: boolean;

  @IsBoolean()
  @IsNotEmpty()
  PASSWORD_REQUIRE_LOWERCASE!: boolean;

  @IsBoolean()
  @IsNotEmpty()
  PASSWORD_REQUIRE_DIGIT!: boolean;

  @IsBoolean()
  @IsNotEmpty()
  PASSWORD_REQUIRE_SPECIAL_CHAR!: boolean;

  @IsString()
  @IsNotEmpty()
  PASSWORD_ALLOWED_SPECIAL_CHARS!: string;

  @IsString()
  @IsOptional()
  PASSWORD_EXCLUDE_SEQUENCES?: string;

  @IsString()
  @IsOptional()
  PASSWORD_BLACKLIST?: string;

  @IsBoolean()
  @IsNotEmpty()
  PASSWORD_NO_REPEATED_CHARS!: boolean;
}
