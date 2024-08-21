import { Controller, Logger } from '@nestjs/common';

import { UserService } from './user.service';

@Controller('user')
export class UserController {
  private readonly logger: Logger = new Logger(UserController.name);

  constructor(private readonly _userService: UserService) {}
}
