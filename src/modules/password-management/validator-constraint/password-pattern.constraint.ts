import { Injectable, Logger } from '@nestjs/common';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { PasswordManagementService } from '@modules/password-management/password-management.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
@ValidatorConstraint({ name: 'PasswordPattern', async: false })
export class PasswordPatternConstraint implements ValidatorConstraintInterface {
  private readonly logger = new Logger(PasswordPatternConstraint.name);

  constructor(private readonly passwordManagementService: PasswordManagementService,
    private readonly _configService: ConfigService
  ) {}

  /**
   * Validates the password using the dynamically generated regex and additional checks
   * such as excluded sequences, blacklist, and repeated characters.
   *
   * @param password - The password to validate.
   * @param args - Validation arguments.
   * @returns True if the password is valid, otherwise false.
   */
  validate(password: string, args: ValidationArguments): boolean {
    try {
      this.logger.log('Validating password');

      const config = this.passwordManagementService.getPasswordConfig();
      this.logger.log(`config :: ${config}`)
      const regex = this.buildPasswordRegex(config);

      if (!regex.test(password)) {
        this.logger.warn('Password does not match the regex');
        return false;
      }

      if (this.containsExcludedSequences(password, config.excludeSequences)) {
        this.logger.warn('Password contains excluded sequences');
        return false;
      }

      if (this.isBlacklisted(password, config.blacklist)) {
        this.logger.warn('Password is blacklisted');
        return false;
      }

      if (config.noRepeatedChars && this.hasRepeatedChars(password)) {
        this.logger.warn('Password has repeated characters');
        return false;
      }

      this.logger.log('Password validation successful');
      return true;
    } catch (error) {
      this.logger.error('Error during password validation', JSON.stringify(error));
      return false;
    }
  }

  /**
   * Generates a dynamic regex based on the password configuration.
   *
   * @param config - The password configuration object.
   * @returns The dynamically generated regex.
   */
  private buildPasswordRegex(config: any): RegExp {
    this.logger.log('Building dynamic regex for password validation');

    let pattern = '^';
    if (config.requireLowercase) pattern += '(?=.*[a-z])';
    if (config.requireUppercase) pattern += '(?=.*[A-Z])';
    if (config.requireDigit) pattern += '(?=.*\\d)';
    if (config.requireSpecialChar && config.allowedSpecialChars) {
      const escapedSpecialChars = config.allowedSpecialChars.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      pattern += `(?=.*[${escapedSpecialChars}])`;
    }
    pattern += `[A-Za-z\\d${config.allowedSpecialChars || ''}]{${config.minLength},${config.maxLength}}$`;

    this.logger.log(`regex :: ${pattern}`)
    return new RegExp(pattern);
  }

  /**
   * Checks if the password contains any of the excluded sequences.
   *
   * @param password - The password to check.
   * @param sequences - An array of excluded sequences.
   * @returns True if any excluded sequence is found, otherwise false.
   */
  private containsExcludedSequences(password: string, sequences: string[]): boolean {
    return sequences.some(sequence => password.includes(sequence));
  }

  /**
   * Checks if the password is blacklisted.
   *
   * @param password - The password to check.
   * @param blacklist - An array of blacklisted passwords.
   * @returns True if the password is blacklisted, otherwise false.
   */
  private isBlacklisted(password: string, blacklist: string[]): boolean {
    return blacklist.includes(password);
  }

  /**
   * Checks if the password contains repeated characters.
   *
   * @param password - The password to check.
   * @returns True if repeated characters are found, otherwise false.
   */
  private hasRepeatedChars(password: string): boolean {
    return /(\w)\1{1,}/.test(password);
  }

  /**
   * Returns the default validation failure message.
   *
   * @param args - Validation arguments.
   * @returns The validation failure message.
   */
  defaultMessage(args: ValidationArguments): string {
    return 'Password does not meet the required complexity rules.';
  }
}
