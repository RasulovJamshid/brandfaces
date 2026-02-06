import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { BotService } from './bot.service';

@Controller('bot')
export class BotController {
    constructor(private readonly botService: BotService) {}

    /**
     * Set Telegram webhook
     * POST /bot/set-webhook
     */
    @Post('set-webhook')
    @HttpCode(HttpStatus.OK)
    async setWebhook(@Body('url') url: string) {
        try {
            const result = await this.botService.setWebhook(url);
            return {
                success: true,
                message: 'Webhook set successfully',
                data: result,
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Delete Telegram webhook
     * POST /bot/delete-webhook
     */
    @Post('delete-webhook')
    @HttpCode(HttpStatus.OK)
    async deleteWebhook() {
        try {
            const result = await this.botService.deleteWebhook();
            return {
                success: true,
                message: 'Webhook deleted successfully',
                data: result,
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Reset pending updates
     * POST /bot/reset-pending-updates
     */
    @Post('reset-pending-updates')
    @HttpCode(HttpStatus.OK)
    async resetPendingUpdates() {
        try {
            const result = await this.botService.dropPendingUpdates();
            return {
                success: true,
                message: 'Pending updates cleared successfully',
                data: result,
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update bot token
     * POST /bot/update-token
     * Updates the bot token dynamically without requiring restart
     */
    @Post('update-token')
    @HttpCode(HttpStatus.OK)
    async updateToken(@Body('token') token: string) {
        try {
            if (!token || token.trim().length === 0) {
                return {
                    success: false,
                    message: 'Token is required',
                };
            }

            const result = await this.botService.updateBotToken(token);
            return {
                success: true,
                message: 'Bot token updated successfully! No restart required.',
                requiresRestart: false,
                data: result,
            };
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Failed to update token',
                error: error.message,
            };
        }
    }
}
