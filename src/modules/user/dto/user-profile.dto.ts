// // src/user/dto/user-profile.dto.ts
// import { IsOptional, IsString, IsDate, IsEnum } from 'class-validator';
// import { Gender } from '@prisma/client';

// export class UserProfileDto {
//   @IsString()
//   @IsOptional()
//   readonly phoneNumber?: string;

//   @IsString()
//   @IsOptional()
//   readonly address?: string;

//   @IsString()
//   @IsOptional()
//   readonly profilePicture?: string;

//   @IsString()
//   @IsOptional()
//   readonly bio?: string;

//   @IsDate()
//   @IsOptional()
//   readonly dateOfBirth?: Date;

//   @IsEnum(Gender)
//   @IsOptional()
//   readonly gender?: Gender;
// }
