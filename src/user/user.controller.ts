import { Body, Controller, InternalServerErrorException, Logger, Put, Req, UseGuards, 
  // Get, Post, Param, Body, Delete, Patch, Logger
 } from '@nestjs/common';
import { UserService } from './user.service';
// import { CreateUserDto } from './dto/create-user.dto';
// import { UpdateUserDto } from './dto/update-user.dto';
// import { UserProfileDto } from './dto/user-profile.dto';
// import { Users } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller()
export class UserController {
  private readonly logger: Logger = new Logger(UserController.name);

  constructor(private readonly _userService: UserService) {}

  /**
   * Handles password change requests for authenticated users.
   * 
   * @param req - The request object containing user information.
   * @param changePasswordDto - Data Transfer Object containing current and new passwords.
   * @returns A success message if the password is changed successfully.
   * @throws {InternalServerErrorException} If an error occurs during the password change process.
   */
  @UseGuards(JwtAuthGuard)
  @Put('change-password')
  async changePassword(@Req() req: Request, @Body() changePasswordDto: ChangePasswordDto) {
    const { user: { id: userId }} = req as Request | any;
    this.logger.log(`Received password change request for user ID ${userId}`);

    try {
      await this._userService.changePassword(userId, changePasswordDto);
      this.logger.log(`Password successfully changed for user ID ${userId}`);
      return { message: 'Password successfully changed' };
    } catch (error) {
      this.logger.error(`Failed to change password for user ID ${userId}`, error);
      throw new InternalServerErrorException('Failed to change password');
    }
  }

  // @Post()
  // async create(@Body() createUserDto: CreateUserDto): Promise<Users> {
  //   this.logger.log('Creating a new user');
  //   return this.userService.create(createUserDto);
  // }

  // @Get()
  // async findAll(): Promise<Users[]> {
  //   this.logger.log('Fetching all users');
  //   return this.userService.findAll();
  // }

  // @Get(':id')
  // async findOne(@Param('id') id: string): Promise<Users> {
  //   this.logger.log(`Fetching user with id: ${id}`);
  //   return this.userService.findOne(id);
  // }

  // @Patch(':id')
  // async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto): Promise<Users> {
  //   this.logger.log(`Updating user with id: ${id}`);
  //   return this.userService.update(id, updateUserDto);
  // }

  // @Delete(':id')
  // async delete(@Param('id') id: string): Promise<Users> {
  //   this.logger.log(`Deleting user with id: ${id}`);
  //   return this.userService.delete(id);
  // }

  // @Post(':id/profile')
  // async updateProfile(
  //   @Param('id') id: string,
  //   @Body() userProfileDto: UserProfileDto,
  // ): Promise<Users> {
  //   this.logger.log(`Updating profile for user with id: ${id}`);
  //   return this.userService.updateProfile(id, userProfileDto);
  // }
}
