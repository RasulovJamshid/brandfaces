import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BotService implements OnModuleInit {
    private readonly logger = new Logger(BotService.name);
    private currentBot: Telegraf;

    constructor(
        private configService: ConfigService,
    ) {
        // Initialize bot from environment variable
        const botToken = this.configService.get<string>('BOT_TOKEN');
        if (botToken && botToken !== 'change_me') {
            this.currentBot = new Telegraf(botToken);
            this.logger.log('Bot initialized from BOT_TOKEN');
        } else {
            this.logger.warn('BOT_TOKEN not set or invalid. Bot features will be limited until token is updated.');
        }
    }

    onModuleInit() {
        this.logger.log('BotService initialized');
        // Try to set default bot commands on startup
        this.setDefaultCommands().catch((err) => {
            this.logger.error('Failed to set bot commands', err);
        });
    }

    private async setDefaultCommands(): Promise<void> {
        if (!this.currentBot) {
            this.logger.warn('Bot instance not initialized, skipping setMyCommands');
            return;
        }

        try {
            await this.currentBot.telegram.setMyCommands([
                {
                    command: 'start',
                    description: 'Start registration in Casting Bot',
                },
            ]);
            this.logger.log('Bot commands registered with Telegram');
        } catch (error) {
            this.logger.error('Error registering bot commands', error);
        }
    }

    /**
     * Update bot token dynamically without restart
     */
    async updateBotToken(newToken: string): Promise<any> {
        try {
            this.logger.log('Updating bot token...');
            
            // Stop current bot if it exists and is running
            if (this.currentBot) {
                try {
                    await this.currentBot.stop();
                    this.logger.log('Current bot stopped');
                } catch (stopError) {
                    // Bot might not be running, that's okay
                    this.logger.log('Current bot was not running');
                }
            }

            // Create new bot instance with new token
            const newBot = new Telegraf(newToken);
            
            // Test the new token by getting bot info
            const botInfo = await newBot.telegram.getMe();
            this.logger.log(`New bot verified: @${botInfo.username}`);

            // Replace current bot
            this.currentBot = newBot;

            this.logger.log('Bot token updated successfully');
            
            return {
                success: true,
                botInfo,
                message: 'Token updated successfully. Bot is now using the new token.',
            };
        } catch (error) {
            this.logger.error('Failed to update bot token', error);
            throw new Error('Invalid token or failed to initialize bot');
        }
    }

    /**
     * Set webhook for the bot
     */
    async setWebhook(url: string): Promise<any> {
        try {
            this.logger.log(`Setting webhook to: ${url}`);
            const result = await this.currentBot.telegram.setWebhook(url);
            this.logger.log('Webhook set successfully');
            return result;
        } catch (error) {
            this.logger.error('Failed to set webhook', error);
            throw error;
        }
    }

    /**
     * Delete webhook
     */
    async deleteWebhook(): Promise<any> {
        try {
            this.logger.log('Deleting webhook');
            const result = await this.currentBot.telegram.deleteWebhook({ drop_pending_updates: false });
            this.logger.log('Webhook deleted successfully');
            return result;
        } catch (error) {
            this.logger.error('Failed to delete webhook', error);
            throw error;
        }
    }

    /**
     * Drop all pending updates
     */
    async dropPendingUpdates(): Promise<any> {
        try {
            this.logger.log('Dropping pending updates');
            // Delete webhook with drop_pending_updates flag
            const result = await this.currentBot.telegram.deleteWebhook({ drop_pending_updates: true });
            this.logger.log('Pending updates dropped successfully');
            return result;
        } catch (error) {
            this.logger.error('Failed to drop pending updates', error);
            throw error;
        }
    }

    /**
     * Get webhook info
     */
    async getWebhookInfo(): Promise<any> {
        try {
            const info = await this.currentBot.telegram.getWebhookInfo();
            return info;
        } catch (error) {
            this.logger.error('Failed to get webhook info', error);
            throw error;
        }
    }

    /**
     * Get bot info
     */
    async getBotInfo(): Promise<any> {
        try {
            const info = await this.currentBot.telegram.getMe();
            return info;
        } catch (error) {
            this.logger.error('Failed to get bot info', error);
            throw error;
        }
    }

    /**
     * Get current bot instance
     */
    getCurrentBot(): Telegraf {
        return this.currentBot;
    }
}
