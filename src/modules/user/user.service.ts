import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Prisma, Users } from '@prisma/client';
import { PaginatorTypes } from '@nodeteam/nestjs-prisma-pagination';
import { TokenService } from '@modules/token/token.service';
import { ResetPasswordDto } from '@modules/auth/dto/reset-password.dto';

import { UserRepository } from './user.repository';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateUserDto } from './dto/create-user.dto';

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
     * @desc Find a user by email
     * @param id
     * @returns Promise<User>
     */
    findByEmail(email: string): Promise<Users | null> {
        return this.userRepository.findOne({
            where: { email },
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

    async updatePassword(userId: string, newPassword: string): Promise<void> {
        // Hash the new password
        const hashedNewPassword = await this._tokenService.hashPassword(newPassword);
        await this.userRepository.updatePassword(userId, hashedNewPassword)
        return;
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

        // Update the user's password in the database
        await this.updatePassword(userId, newPassword)

        // Log successful password change
        this.logger.log(`Password changed successfully for user ID ${userId}`);
        } catch (error) {
        this.logger.error(`Failed to change password for user ID ${userId}`, error);
        throw error;
        }
    }

    async create(createUserDto: CreateUserDto): Promise<Users | null> {
        this.logger.log(`Creating a new user with this data ${JSON.stringify(createUserDto)}`);
        return this.userRepository.create(createUserDto);
    }

    async saveOtp(id: string, opt: string): Promise<void> {
        this.logger.log(`Saving OTP for user ID ${id}`);
        await this.userRepository.saveOtp(id, opt);
    }

    async validateOtp(id: string, otp: string): Promise<boolean> {
        return await this.userRepository.validateOtp(id, otp)
    }

    async sendOtp(email: string): Promise<void> {
        const user = await this.findByEmail(email);
        if (!user) {
        throw new BadRequestException('User with this email does not exist');
        }

        // Generate OTP and send it (you can use any OTP library or custom logic)
        const otp = this.generateOtp();
        await this.userRepository.saveOtp(user.uuid, otp);
        this.logger.log(`OTP generated and sent to email: ${email} and otp: ${otp}`);
        
        // Send OTP via email (implementation depends on your email service)
    }

    async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
        const { email, otp, newPassword } = resetPasswordDto;

        this.logger.log(`Reset password initiated for email: ${email}`);

        const user = await this.findByEmail(email);

        this.logger.log(`user details : ${JSON.stringify(user)}`)
        if (!user) {
        this.logger.warn(`Reset password failed: User with email ${email} does not exist`);
        throw new BadRequestException('User with this email does not exist');
        }

        this.logger.log(`User found for email: ${email}. Validating OTP...`);

        // Validate OTP
        const valid = await this.validateOtp(user.uuid, otp);
        this.logger.log(`password validation: ${valid}`);

        if (!valid) {
        this.logger.warn(`Reset password failed: Invalid OTP for email ${email}`);
        throw new BadRequestException('Invalid OTP');
        }

        this.logger.log(`OTP validated successfully for email: ${email}. Hashing new password...`);

        // Update password
        await this.updatePassword(user.uuid, newPassword);

        this.logger.log(`Password successfully reset for email: ${email} and otp: ${otp}`);
    }

    private generateOtp(): string {
        // Generate a 6-digit OTP
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
}
