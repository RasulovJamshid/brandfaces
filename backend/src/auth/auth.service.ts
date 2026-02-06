import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
    private verificationCodes = new Map<string, { code: string; expiresAt: Date }>();

    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.prisma.admin.findUnique({ where: { email } });
        if (user && (await bcrypt.compare(pass, user.password))) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        const payload = { username: user.email, sub: user.id };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }

    // Generate verification code for linking Telegram account
    async generateVerificationCode(adminId: number): Promise<string> {
        const code = randomBytes(3).toString('hex').toUpperCase(); // 6-character code
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        this.verificationCodes.set(`${adminId}`, { code, expiresAt });

        // Clean up expired codes
        setTimeout(() => {
            this.verificationCodes.delete(`${adminId}`);
        }, 10 * 60 * 1000);

        return code;
    }

    // Link Telegram account to admin
    async linkTelegramAccount(verificationCode: string, telegramId: string, telegramUsername?: string): Promise<any> {
        // Find admin with this verification code
        let adminId: number | null = null;
        for (const [id, data] of this.verificationCodes.entries()) {
            if (data.code === verificationCode && data.expiresAt > new Date()) {
                adminId = parseInt(id);
                break;
            }
        }

        if (!adminId) {
            throw new BadRequestException('Invalid or expired verification code');
        }

        // Check if Telegram ID is already linked
        const existingLink = await this.prisma.admin.findUnique({
            where: { telegramId },
        });

        if (existingLink && existingLink.id !== adminId) {
            throw new BadRequestException('This Telegram account is already linked to another admin');
        }

        // Link the account
        const admin = await this.prisma.admin.update({
            where: { id: adminId },
            data: {
                telegramId,
                telegramUsername,
            },
            select: {
                id: true,
                email: true,
                name: true,
                telegramId: true,
                telegramUsername: true,
            },
        });

        // Remove verification code
        this.verificationCodes.delete(`${adminId}`);

        return admin;
    }

    // Request password reset via Telegram
    async requestPasswordReset(email: string, telegramId: string): Promise<string> {
        // Find admin with this email and Telegram ID
        const admin = await this.prisma.admin.findFirst({
            where: {
                email,
                telegramId,
                isActive: true,
            },
        });

        if (!admin) {
            throw new NotFoundException('No active admin found with this email and Telegram account');
        }

        // Check rate limiting (max 3 requests per hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentTokens = await this.prisma.passwordResetToken.count({
            where: {
                adminId: admin.id,
                createdAt: { gte: oneHourAgo },
            },
        });

        if (recentTokens >= 3) {
            throw new BadRequestException('Too many reset requests. Please try again later.');
        }

        // Generate secure token
        const token = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        // Save token
        await this.prisma.passwordResetToken.create({
            data: {
                adminId: admin.id,
                token,
                expiresAt,
            },
        });

        return token;
    }

    // Verify reset token
    async verifyResetToken(token: string): Promise<{ valid: boolean; email?: string }> {
        const resetToken = await this.prisma.passwordResetToken.findUnique({
            where: { token },
            include: { admin: true },
        });

        if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
            return { valid: false };
        }

        return {
            valid: true,
            email: resetToken.admin.email,
        };
    }

    // Reset password
    async resetPassword(token: string, newPassword: string): Promise<void> {
        const resetToken = await this.prisma.passwordResetToken.findUnique({
            where: { token },
            include: { admin: true },
        });

        if (!resetToken) {
            throw new BadRequestException('Invalid reset token');
        }

        if (resetToken.used) {
            throw new BadRequestException('This reset token has already been used');
        }

        if (resetToken.expiresAt < new Date()) {
            throw new BadRequestException('Reset token has expired');
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password and mark token as used
        await this.prisma.$transaction([
            this.prisma.admin.update({
                where: { id: resetToken.adminId },
                data: { password: hashedPassword },
            }),
            this.prisma.passwordResetToken.update({
                where: { id: resetToken.id },
                data: { used: true },
            }),
        ]);

        // Log activity
        await this.prisma.activityLog.create({
            data: {
                adminId: resetToken.adminId,
                action: 'PASSWORD_RESET',
                entityType: 'ADMIN',
                entityId: resetToken.adminId,
                details: 'Password reset via Telegram',
            },
        });
    }

    // Unlink Telegram account
    async unlinkTelegramAccount(adminId: number): Promise<void> {
        await this.prisma.admin.update({
            where: { id: adminId },
            data: {
                telegramId: null,
                telegramUsername: null,
            },
        });
    }
}
