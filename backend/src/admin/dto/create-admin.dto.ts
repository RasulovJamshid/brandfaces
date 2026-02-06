import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';

export enum AdminRole {
    SUPER_ADMIN = 'SUPER_ADMIN',
    ADMIN = 'ADMIN',
}

export class CreateAdminDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsString()
    name: string;

    @IsEnum(AdminRole)
    @IsOptional()
    role?: AdminRole;
}
