import { Action, Command, Ctx, Hears, Start, Update, Sender } from 'nestjs-telegraf';
import { Context, Scenes } from 'telegraf';

@Update()
export class BotUpdate {
    @Start()
    async onStart(@Ctx() ctx: Scenes.SceneContext) {
        await ctx.reply('Welcome to Casting Bot!');
        // Usually we have a button to start registration
        // Or just start immediately? Prompt says: Start: Welcome message -> Button "Start Registration".
        await ctx.reply('Click below to start registration.', {
            reply_markup: {
                keyboard: [['Start Registration']],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        });
    }

    @Hears('Start Registration')
    async onStartRegistration(@Ctx() ctx: Scenes.SceneContext) {
        await ctx.scene.enter('registration');
    }
}
