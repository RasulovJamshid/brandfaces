import { Controller, Post, Body, UnauthorizedException, Get, Query, Param, ParseIntPipe, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LinkTelegramDto } from './dto/link-telegram.dto';
import { RequestResetDto } from './dto/request-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    async login(@Body() body: any) {
        const user = await this.authService.validateUser(body.email, body.password);
        if (!user) {
            throw new UnauthorizedException();
        }
        return this.authService.login(user);
    }

    // Get current admin profile from JWT token
    @Get('me')
    async me(@Req() req: any) {
        const authHeader: string | undefined = req.headers?.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException();
        }

        const token = authHeader.slice('Bearer '.length).trim();
        if (!token) {
            throw new UnauthorizedException();
        }

        return this.authService.getCurrentAdminFromToken(token);
    }

    // Generate verification code for linking Telegram
    @Post('generate-verification-code')
    async generateVerificationCode(@Body('adminId', ParseIntPipe) adminId: number) {
        const code = await this.authService.generateVerificationCode(adminId);
        return { code, expiresIn: '10 minutes' };
    }

    // Link Telegram account (called by Telegram bot)
    @Post('link-telegram')
    async linkTelegram(@Body() dto: LinkTelegramDto) {
        return this.authService.linkTelegramAccount(
            dto.verificationCode,
            dto.telegramId,
            dto.telegramUsername,
        );
    }

    // Request password reset (called by Telegram bot)
    @Post('request-reset')
    async requestReset(@Body() dto: RequestResetDto) {
        const token = await this.authService.requestPasswordReset(dto.email, dto.telegramId);
        return {
            success: true,
            resetUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`,
            expiresIn: '15 minutes',
        };
    }

    // Verify reset token
    @Get('verify-reset-token')
    async verifyToken(@Query('token') token: string) {
        return this.authService.verifyResetToken(token);
    }

    // Reset password
    @Post('reset-password')
    async resetPassword(@Body() dto: ResetPasswordDto) {
        await this.authService.resetPassword(dto.token, dto.newPassword);
        return { success: true, message: 'Password reset successfully' };
    }

    // Unlink Telegram account
    @Post('unlink-telegram')
    async unlinkTelegram(@Body('adminId', ParseIntPipe) adminId: number) {
        await this.authService.unlinkTelegramAccount(adminId);
        return { success: true, message: 'Telegram account unlinked' };
    }
}
