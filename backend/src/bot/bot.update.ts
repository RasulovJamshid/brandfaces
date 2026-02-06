import { Action, Command, Ctx, Hears, Message, Start, Update, Sender } from 'nestjs-telegraf';
import { Context, Scenes, Markup } from 'telegraf';
import { AuthService } from '../auth/auth.service';

interface SessionData extends Scenes.SceneSession {
    language?: 'uz' | 'ru' | 'en';
    linkAccountPending?: boolean;
}

interface BotContext extends Scenes.SceneContext {
    session: SessionData;
}

@Update()
export class BotUpdate {
    constructor(private readonly authService: AuthService) { }

    @Start()
    async onStart(@Ctx() ctx: BotContext) {
        // Ask for language selection
        await ctx.reply(
            '🌐 Tilni tanlang / Выберите язык / Choose language:',
            Markup.keyboard([
                ['🇺🇿 O\'zbekcha', '🇷🇺 Русский'],
                ['🇬🇧 English']
            ]).resize().oneTime()
        );
    }

    @Hears(['🇺🇿 O\'zbekcha', 'O\'zbekcha'])
    async onUzbek(@Ctx() ctx: BotContext) {
        ctx.session.language = 'uz';
        await ctx.reply(
            '✅ Til tanlandi: O\'zbekcha\n\n' +
            'Casting Bot\'ga xush kelibsiz! 🎬\n\n' +
            'Ro\'yxatdan o\'tish uchun quyidagi tugmani bosing:',
            Markup.keyboard([['📝 Ro\'yxatdan o\'tish']]).resize().oneTime()
        );
    }

    @Hears(['🇷🇺 Русский', 'Русский'])
    async onRussian(@Ctx() ctx: BotContext) {
        ctx.session.language = 'ru';
        await ctx.reply(
            '✅ Язык выбран: Русский\n\n' +
            'Добро пожаловать в Casting Bot! 🎬\n\n' +
            'Нажмите кнопку ниже, чтобы начать регистрацию:',
            Markup.keyboard([['📝 Начать регистрацию']]).resize().oneTime()
        );
    }

    @Hears(['🇬🇧 English', 'English'])
    async onEnglish(@Ctx() ctx: BotContext) {
        ctx.session.language = 'en';
        await ctx.reply(
            '✅ Language selected: English\n\n' +
            'Welcome to Casting Bot! 🎬\n\n' +
            'Click the button below to start registration:',
            Markup.keyboard([['📝 Start Registration']]).resize().oneTime()
        );
    }

    @Hears(['📝 Ro\'yxatdan o\'tish', '📝 Начать регистрацию', '📝 Start Registration', 'Start Registration'])
    async onStartRegistration(@Ctx() ctx: BotContext) {
        await ctx.scene.enter('registration');
    }

    @Command('linkaccount')
    async onLinkAccount(@Ctx() ctx: BotContext) {
        const lang: 'uz' | 'ru' | 'en' = (ctx.session.language ?? 'en');
        ctx.session.linkAccountPending = true;

        if (lang === 'uz') {
            await ctx.reply('Iltimos, boshqaruv panelidan 6 raqamli tasdiqlash kodini kiriting:');
        } else if (lang === 'ru') {
            await ctx.reply('Пожалуйста, введите 6-значный код подтверждения из панели управления:');
        } else {
            await ctx.reply('Please enter your 6-character verification code from the dashboard:');
        }
    }

    @Hears(/^[A-Za-z0-9]{6}$/)
    async onLinkAccountCode(@Ctx() ctx: BotContext, @Message('text') code: string) {
        if (!ctx.session.linkAccountPending) {
            return;
        }

        const lang: 'uz' | 'ru' | 'en' = ctx.session.language;
        const telegramId = String(ctx.from?.id ?? '');
        const telegramUsername = (ctx.from as any)?.username as string | undefined;

        try {
            const admin = await this.authService.linkTelegramAccount(code.trim(), telegramId, telegramUsername);
            ctx.session.linkAccountPending = false;
            const email = (admin as any)?.email || '';

            if (lang === 'uz') {
                await ctx.reply(`✅ Muvaffaqiyatli! Telegram hisobingiz ${email} ga bog'landi`);
            } else if (lang === 'ru') {
                await ctx.reply(`✅ Успешно! Ваш аккаунт Telegram привязан к ${email}`);
            } else {
                await ctx.reply(`✅ Success! Your Telegram account has been linked to ${email}`);
            }
        } catch (e: any) {
            // Keep pending so user can try again with another code
            const errorMessage: string = e?.response?.message || e?.message || '';
            let reply: string;

            if (errorMessage.includes('already linked')) {
                if (lang === 'uz') reply = '⚠️ Bu Telegram hisobi boshqa administratorga bog\'langan.';
                else if (lang === 'ru') reply = '⚠️ Этот аккаунт Telegram уже привязан к другому администратору.';
                else reply = '⚠️ This Telegram account is already linked to another admin.';
            } else if (errorMessage.includes('Invalid or expired verification code')) {
                if (lang === 'uz') reply = '❌ Noto\'g\'ri yoki muddati o\'tgan kod. Iltimos, boshqaruv panelidan yangi kod yarating.';
                else if (lang === 'ru') reply = '❌ Неверный или истекший код. Пожалуйста, сгенерируйте новый код в панели управления.';
                else reply = '❌ Invalid or expired code. Please generate a new code from the dashboard.';
            } else {
                if (lang === 'uz') reply = '❌ Xatolik yuz berdi. Iltimos, qaytadan urinib ko\'ring.';
                else if (lang === 'ru') reply = '❌ Произошла ошибка. Пожалуйста, попробуйте снова.';
                else reply = '❌ An error occurred. Please try again.';
            }

            await ctx.reply(reply);
        }
    }
}
