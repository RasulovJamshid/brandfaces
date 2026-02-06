import { IsEmail, IsString, MinLength, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { AdminRole } from './create-admin.dto';

export class UpdateAdminDto {
    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @MinLength(6)
    @IsOptional()
    password?: string;

    @IsString()
    @IsOptional()
    name?: string;

    @IsEnum(AdminRole)
    @IsOptional()
    role?: AdminRole;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsString()
    @IsOptional()
    telegramId?: string;

    @IsString()
    @IsOptional()
    telegramUsername?: string;
}
