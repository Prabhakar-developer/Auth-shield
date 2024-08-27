import { Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { Prisma, Users } from '@prisma/client';
import { PaginatorTypes } from '@nodeteam/nestjs-prisma-pagination';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

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

  
}
