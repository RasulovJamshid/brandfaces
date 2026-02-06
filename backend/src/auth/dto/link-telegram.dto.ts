import { IsString, IsNotEmpty } from 'class-validator';

export class LinkTelegramDto {
    @IsString()
    @IsNotEmpty()
    verificationCode: string;

    @IsString()
    @IsNotEmpty()
    telegramId: string;

    @IsString()
    telegramUsername?: string;
}
