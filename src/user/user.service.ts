import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { Prisma, Users } from '@prisma/client';
import { PaginatorTypes } from '@nodeteam/nestjs-prisma-pagination';
import { ChangePasswordDto } from './dto/change-password.dto';
import { TokenService } from '../auth/token.service';

@Injectable()
export class UserService {
  private readonly logger: Logger = new Logger(UserService.name);
  constructor(
    private readonly userRepository: UserRepository,
    private readonly _tokenService: TokenService

  ) {}

  async findById(id: string): Promise<Users | null> {
    return this.userRepository.findById(id);
  }

  /**
   * @desc Find a user by id
   * @param id
   * @returns Promise<User>
   */
  findOne(id: string): Promise<Users | null> {
    return this.userRepository.findOne({
      where: { uuid: id },
    });
  }

  /**
   * @desc Find all users with pagination
   * @param where
   * @param orderBy
   */
  findAll(
    where: Prisma.UsersWhereInput,
    orderBy: Prisma.UsersOrderByWithRelationInput,
  ): Promise<PaginatorTypes.PaginatedResult<Users>> {
    return this.userRepository.findAll(where, orderBy);
  }

  findByUsername(username: string): Promise<Users | null> {
    return this.userRepository.findOne({
      where: { username },
    });
  }

  /**
   * Changes the password for the user.
   * 
   * @param userId - ID of the user whose password is being changed.
   * @param changePasswordDto - Data Transfer Object containing current and new passwords.
   * @throws {UnauthorizedException} If the user is not found.
   * @throws {BadRequestException} If the current password is incorrect.
   */
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const { currentPassword, newPassword } = changePasswordDto;

    try {
      // Log the password change attempt
      this.logger.log(`Attempting to change password for user ID ${userId}`);

      // Fetch the user from the database
      const user = await this.userRepository.findById(userId);

      if (!user) {
        this.logger.warn(`User ID ${userId} not found`);
        throw new UnauthorizedException('User not found');
      }

      // Verify the current password
      const isPasswordValid = await this._tokenService.isPasswordCorrect(currentPassword, user.password_hash);
      if (!isPasswordValid) {
        this.logger.warn(`Incorrect current password for user ID ${userId}`);
        throw new BadRequestException('Current password is incorrect');
      }

      // Hash the new password
      const hashedNewPassword = await this._tokenService.hashPassword(newPassword);

      // Update the user's password in the database
      await this.userRepository.updatePassword(userId, hashedNewPassword)

      // Log successful password change
      this.logger.log(`Password changed successfully for user ID ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to change password for user ID ${userId}`, error);
      throw error;
    }
  }


  // async create(createUserDto: CreateUserDto): Promise<User> {
  //   this.logger.log('Service: Creating a new user');
  //   return this.userRepository.create(createUserDto);
  // }

  // async findAll(): Promise<User[]> {
  //   this.logger.log('Service: Fetching all users');
  //   return this.userRepository.findAll();
  // }

  // async findOne(id: string): Promise<User> {
  //   this.logger.log(`Service: Fetching user with id: ${id}`);
  //   return this.userRepository.findOne(id);
  // }

  // async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
  //   this.logger.log(`Service: Updating user with id: ${id}`);
  //   return this.userRepository.update(id, updateUserDto);
  // }

  // async delete(id: string): Promise<User> {
  //   this.logger.log(`Service: Deleting user with id: ${id}`);
  //   return this.userRepository.delete(id);
  // }

  // async updateProfile(id: string, userProfileDto: UserProfileDto): Promise<User> {
  //   this.logger.log(`Service: Updating profile for user with id: ${id}`);
  //   return this.userRepository.updateProfile(id, userProfileDto);
  // }

  
}
