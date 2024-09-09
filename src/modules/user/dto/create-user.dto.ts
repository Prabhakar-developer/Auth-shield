// src/user/dto/create-user.dto.ts
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';


export class CreateUserDto {
    @ApiProperty({ type: String })
    @IsString()
    @IsNotEmpty()
    readonly uuid!: string;
    
    @ApiProperty({ type: String })
    @IsString()
    @IsNotEmpty()
    readonly username!: string;

    @IsEmail()
    @IsNotEmpty()
    readonly email!: string;

    @IsString()
    @MinLength(6)
    @IsNotEmpty()
    readonly password_hash!: string;

    @IsString()
    readonly first_name?: string;

    @IsString()
    readonly last_name?: string;

    @IsString()
    @IsNotEmpty()
    is_active!: string;

    @IsString()
    @IsNotEmpty()
    created_by!: string;
}


//   uuid                  String                  @id @unique @default(uuid()) @db.VarChar(255)
//   username              String                  @unique @db.VarChar(255)
//   email                 String                  @unique @db.VarChar(255)
//   password_hash         String                  @db.VarChar(255)
//   first_name            String?                 @db.VarChar(255)
//   last_name             String?                 @db.VarChar(255)
//   is_active             IsActive                @default(ACTIVE)
//   created_at            DateTime                @default(now())
//   created_by            String                  @default("STORE UUID") @db.VarChar(255)
//   updated_at            DateTime                @default(now()) @updatedAt
//   updated_by            String?                 @default("STORE UUID") @db.VarChar(255)
//   deleted_at            DateTime?               @default(now())
//   deleted_by            String?                 @default("STORE UUID") @db.VarChar(255)
//   User_Profiles         User_Profiles[]
//   User_Roles            User_Roles[]
//   Account_Verifications Account_Verifications[]
//   Activity_Logs         Activity_Logs[]
//   Sessions              Sessions[]
//   AuditLog              AuditLog[]