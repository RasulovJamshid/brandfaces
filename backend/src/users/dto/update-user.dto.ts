import { IsString, IsInt, IsEnum, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { Gender, ExperienceLevel, UserStatus } from '@prisma/client';

export class UpdateUserDto {
    @IsString()
    @IsOptional()
    fullName?: string;

    @Type(() => Number)
    @IsInt()
    @Min(18)
    @Max(100)
    @IsOptional()
    age?: number;

    @IsEnum(Gender)
    @IsOptional()
    gender?: Gender;

    @IsString()
    @IsOptional()
    city?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    price?: string;

    @IsEnum(ExperienceLevel)
    @IsOptional()
    experience?: ExperienceLevel;

    @IsString()
    @IsOptional()
    socialLinks?: string;

    @IsString()
    @IsOptional()
    username?: string;

    @IsEnum(UserStatus)
    @IsOptional()
    status?: UserStatus;
}
