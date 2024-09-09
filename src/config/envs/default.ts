export const config = {
  // Database Configuration
  DATABASE_URL: process.env['DATABASE_URL'] || 'file:./dev.db',

  // JWT Configuration
  jwtSecret: process.env['JWT_SECRET'] || 'secret',
  jwtExpireIn: process.env['JWT_EXPIRE_IN'] || '1d',

  // Password-related configurations
  PASSWORD_MIN_LENGTH: process.env['PASSWORD_MIN_LENGTH'] ? parseInt(process.env['PASSWORD_MIN_LENGTH'], 10) : 8,
  PASSWORD_MAX_LENGTH: process.env['PASSWORD_MAX_LENGTH'] ? parseInt(process.env['PASSWORD_MAX_LENGTH'], 10) : 20,
  PASSWORD_REQUIRE_UPPERCASE: process.env['PASSWORD_REQUIRE_UPPERCASE'] === 'true' ? true : false,
  PASSWORD_REQUIRE_LOWERCASE: process.env['PASSWORD_REQUIRE_LOWERCASE'] === 'true',
  PASSWORD_REQUIRE_DIGIT: process.env['PASSWORD_REQUIRE_DIGIT'] === 'true',
  PASSWORD_REQUIRE_SPECIAL_CHAR: process.env['PASSWORD_REQUIRE_SPECIAL_CHAR'] === 'true',
  PASSWORD_ALLOWED_SPECIAL_CHARS: process.env['PASSWORD_ALLOWED_SPECIAL_CHARS'] || '!@#$%^&*',
  PASSWORD_EXCLUDE_SEQUENCES: process.env['PASSWORD_EXCLUDE_SEQUENCES'] ? process.env['PASSWORD_EXCLUDE_SEQUENCES'].split(',') : ['1234', 'abcd'],
  PASSWORD_BLACKLIST: process.env['PASSWORD_BLACKLIST'] ? process.env['PASSWORD_BLACKLIST'].split(',') : ['password', '12345678'],
  PASSWORD_NO_REPEATED_CHARS: process.env['PASSWORD_NO_REPEATED_CHARS'] === 'true',
};