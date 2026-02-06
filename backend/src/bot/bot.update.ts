import { Action, Command, Ctx, Hears, Start, Update, Sender } from 'nestjs-telegraf';
import { Context, Scenes, Markup } from 'telegraf';

interface SessionData extends Scenes.SceneSession {
    language?: 'uz' | 'ru' | 'en';
}

interface BotContext extends Scenes.SceneContext {
    session: SessionData;
}

@Update()
export class BotUpdate {
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
}
