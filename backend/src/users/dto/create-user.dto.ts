import { IsString, IsInt, IsEnum, IsOptional, IsDecimal, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { Gender, ExperienceLevel } from '@prisma/client';

export class CreateUserDto {
    @IsString()
    fullName: string;

    @Type(() => Number)
    @IsInt()
    @Min(18)
    @Max(100)
    age: number;

    @IsEnum(Gender)
    gender: Gender;

    @IsString()
    city: string;

    @IsString()
    phone: string;

    @IsString()
    price: string;

    @IsEnum(ExperienceLevel)
    experience: ExperienceLevel;

    @IsString()
    @IsOptional()
    socialLinks?: string;

    @IsString()
    @IsOptional()
    username?: string;
}
