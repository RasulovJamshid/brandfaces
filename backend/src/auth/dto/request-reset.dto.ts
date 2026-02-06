import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class RequestResetDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    telegramId: string;
}
