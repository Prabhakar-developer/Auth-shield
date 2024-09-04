import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { Prisma, Users } from '@prisma/client';
import { paginator } from '@nodeteam/nestjs-prisma-pagination';
import { PaginatorTypes } from '@nodeteam/nestjs-prisma-pagination';


@Injectable()
export class UserRepository {
  private readonly logger: Logger = new Logger(UserRepository.name);
  private readonly paginate: PaginatorTypes.PaginateFunction;

  constructor(private prisma: PrismaService) {
    /**
     * @desc Create a paginate function
     * @param model
     * @param options
     * @returns Promise<PaginatorTypes.PaginatedResult<T>>
     */
    this.paginate = paginator({
      page: 1,
      perPage: 10,
    });
  }

  findById(id: string): Promise<Users | null> {
    return this.prisma.users.findUnique({
      where: { uuid: id },
    });
  }

  /**
   * @desc Find a user by params
   * @param params Prisma.UserFindFirstArgs
   * @returns Promise<User | null>
   *       If the user is not found, return null
   */
  async findOne(params: Prisma.UsersFindFirstArgs): Promise<Users | null> {
    try {
      return await this.prisma.users.findFirst({
        where: params.where,
      });
    } catch (error) {
      console.error('Error querying users:', error);
    }
    
    return null
    // return this.prisma.users.findFirst(params);
  }

  /**
   * @desc Create a new user
   * @param data Prisma.UserCreateInput
   * @returns Promise<User>
   */
  async create(data: Prisma.UsersCreateInput): Promise<Users> {
    return this.prisma.users.create({
      data,
    });
  }

  /**
   * @desc Find all users with pagination
   * @param where Prisma.UserWhereInput
   * @param orderBy Prisma.UserOrderByWithRelationInput
   * @returns Promise<PaginatorTypes.PaginatedResult<User>>
   */
  async findAll(
    where: Prisma.UsersWhereInput,
    orderBy: Prisma.UsersOrderByWithRelationInput,
  ): Promise<PaginatorTypes.PaginatedResult<Users>> {
    return this.paginate(this.prisma.users, {
      where,
      orderBy,
    });
  }

  /**
   * Updates the password of a user.
   * 
   * @param id - The ID of the user whose password is being updated.
   * @param hashedPassword - The new hashed password.
   * @returns The updated user object.
   */
  async updatePassword(id: string, hashedPassword: string): Promise<Users> {
    this.logger.log(`update password id: ${id} and hashpassword: ${hashedPassword}`)
      return this.prisma.users.update({
        where: { uuid: id },
        data: { password_hash: hashedPassword },
      });
  }


  async saveOtp(user_id: string, otp: string): Promise<void> {
    await this.prisma.passwordReset.create({
      data: {
        user_id,
        otp,
        expires_at: new Date(Date.now() + 10 * 60 * 1000), // OTP expires in 10 minutes
      },
    });
  }

  async validateOtp(user_id: string, otp: string): Promise<boolean> {
    const passwordReset = await this.prisma.passwordReset.findFirst({
      where: {
        user_id,
        otp,
        expires_at: {
          gt: new Date(), // Check if the OTP is still valid
        },
      },
    });
    return !!passwordReset; // Return true if the OTP is valid
  }

  async deleteOtp(user_id: string): Promise<void> {
    await this.prisma.passwordReset.deleteMany({
      where: { user_id },
    });
  }

  
  // async create(createUserDto: CreateUserDto): Promise<User> {
  //   this.logger.log('Repository: Creating a new user in the database');
  //   return this.prisma.users.create({
  //     data: {
  //       username: createUserDto.username,
  //       email: createUserDto.email,
  //       password_hash: createUserDto.password,
  //       first_name: createUserDto.firstName,
  //       last_name: createUserDto.lastName,
  //     },
  //   });
  // }

  // async findAll(): Promise<User[]> {
  //   this.logger.log('Repository: Fetching all users from the database');
  //   return this.prisma.users.findMany();
  // }

  // async findOne(id: string): Promise<User> {
  //   this.logger.log(`Repository: Fetching user with id: ${id} from the database`);
  //   return this.prisma.users.findUnique({
  //     where: { uuid: id },
  //   });
  // }

  // async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
  //   this.logger.log(`Repository: Updating user with id: ${id} in the database`);
  //   return this.prisma.users.update({
  //     where: { uuid: id },
  //     data: {
  //       username: updateUserDto.username,
  //       email: updateUserDto.email,
  //       first_name: updateUserDto.firstName,
  //       last_name: updateUserDto.lastName,
  //     },
  //   });
  // }

  // async delete(id: string): Promise<User> {
  //   this.logger.log(`Repository: Deleting user with id: ${id} from the database`);
  //   return this.prisma.users.delete({
  //     where: { uuid: id },
  //   });
  // }

  // async updateProfile(id: string, userProfileDto: UserProfileDto): Promise<Users> {
  //   this.logger.log(`Repository: Updating profile for user with id: ${id} in the database`);
  //   return this.prisma.users.update({
  //     where: { uuid: id },
  //     data: {
  //       User_Profiles: {
  //         update: {
  //           phone_number: userProfileDto.phoneNumber,
  //           address: userProfileDto.address,
  //           profile_picture: userProfileDto.profilePicture,
  //           bio: userProfileDto.bio,
  //         },
  //       },
  //     },
  //     include: {
  //       User_Profiles: true,
  //     },
  //   });
  // }
}
