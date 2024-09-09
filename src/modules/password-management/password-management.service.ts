import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PasswordManagementService {
  private readonly logger = new Logger(PasswordManagementService.name);

  constructor(private readonly _configService: ConfigService) {}

  /**
   * Returns the configuration for password validation, including rules for
   * length, character requirements, and other constraints from environment variables.
   */
  getPasswordConfig() {
    this.logger.log('Fetching password configuration from environment variables');

    return {
      minLength: parseInt(this._configService.get<string>('PASSWORD_MIN_LENGTH', '8')),
      maxLength: parseInt(this._configService.get<string>('PASSWORD_MAX_LENGTH', '20')),
      requireUppercase: this._configService.get<boolean>('PASSWORD_REQUIRE_UPPERCASE', true),
      requireLowercase: this._configService.get<boolean>('PASSWORD_REQUIRE_LOWERCASE', true),
      requireDigit: this._configService.get<boolean>('PASSWORD_REQUIRE_DIGIT', true),
      requireSpecialChar: this._configService.get<boolean>('PASSWORD_REQUIRE_SPECIAL_CHAR', true),
      allowedSpecialChars: this._configService.get<string>('PASSWORD_ALLOWED_SPECIAL_CHARS', '!@#$%^&*'),
      excludeSequences: this._configService.get<string>('PASSWORD_EXCLUDE_SEQUENCES', '1234,abcd').split(','),
      blacklist: this._configService.get<string>('PASSWORD_BLACKLIST', 'password,12345678').split(','),
      noRepeatedChars: this._configService.get<boolean>('PASSWORD_NO_REPEATED_CHARS', true),
    };
  }
}
