import { Action, Ctx, Message, On, Scene, SceneEnter, Wizard, WizardStep } from 'nestjs-telegraf';
import { Scenes, Markup } from 'telegraf';
import { UsersService } from '../../users/users.service';
import { FilesService } from '../../files/files.service';
import { CitiesService } from '../../cities/cities.service';
import { Gender, ExperienceLevel, UserStatus } from '@prisma/client';

interface RegistrationSession extends Scenes.WizardSessionData {
    userData: {
        fullName?: string;
        age?: number;
        gender?: Gender;
        city?: string;  // Keep for backward compatibility
        cityId?: number;  // New field
        photos?: string[];
        phone?: string;
        price?: number;
        socials?: string;
        telegramId?: string;
        username?: string;
    };
}

interface RegistrationContext extends Scenes.WizardContext<RegistrationSession> { }

@Wizard('registration')
export class RegistrationScene {
    constructor(
        private readonly usersService: UsersService,
        private readonly filesService: FilesService,
        private readonly citiesService: CitiesService,
    ) { }

    @SceneEnter()
    async enter(@Ctx() ctx: RegistrationContext) {
        ctx.scene.session.userData = { photos: [] };
        const user = ctx.from;
        if (user) {
            ctx.scene.session.userData.telegramId = user.id.toString();
            ctx.scene.session.userData.username = user.username;
        }

        await ctx.reply('Welcome! Let\'s start your registration. What is your full name?');
    }

    @WizardStep(0)
    @On('text')
    async onName(@Ctx() ctx: RegistrationContext, @Message('text') msg: string) {
        if (msg.length < 2) return ctx.reply('Name is too short.');
        ctx.scene.session.userData.fullName = msg;
        await ctx.reply('Great. How old are you?');
        ctx.wizard.next();
    }

    @WizardStep(1)
    @On('text')
    async onAge(@Ctx() ctx: RegistrationContext, @Message('text') msg: string) {
        const age = parseInt(msg);
        if (isNaN(age) || age <= 16) {
            await ctx.reply('Please enter a valid age (must be > 16).');
            return;
        }
        ctx.scene.session.userData.age = age;
        await ctx.reply('What is your gender?', Markup.keyboard([
            ['Male', 'Female']
        ]).oneTime().resize());
        ctx.wizard.next();
    }

    @WizardStep(2)
    @On('text')
    async onGender(@Ctx() ctx: RegistrationContext, @Message('text') msg: string) {
        const gender = msg.toUpperCase();
        if (gender !== 'MALE' && gender !== 'FEMALE') {
            await ctx.reply('Please select button Male or Female.');
            return;
        }
        ctx.scene.session.userData.gender = gender as Gender;
        
        // Fetch cities and show selection
        const cities = await this.citiesService.findAll();
        const cityButtons = cities.slice(0, 20).map(city => [
            Markup.button.callback(
                city.nameRu || city.name,
                `city_${city.id}`
            )
        ]);
        
        await ctx.reply(
            'Выберите ваш город:',
            Markup.inlineKeyboard(cityButtons)
        );
        ctx.wizard.next();
    }

    @Action(/^city_(\d+)$/)
    async onCitySelect(@Ctx() ctx: any) {
        const match = ctx.match;
        if (!match) return;
        
        const cityId = parseInt(match[1]);
        const city = await this.citiesService.findOne(cityId);
        
        if (!city) {
            await ctx.reply('City not found. Please try again.');
            return;
        }
        
        ctx.scene.session.userData.cityId = cityId;
        ctx.scene.session.userData.city = city.name;  // Keep for display
        
        await ctx.answerCbQuery();
        await ctx.reply(
            `Город: ${city.nameRu || city.name}\n\nПожалуйста, отправьте 2-5 фотографий. Нажмите "Готово" когда закончите.`,
            Markup.keyboard(['Готово']).resize()
        );
        ctx.wizard.selectStep(4);  // Skip to photo step
    }

    @WizardStep(3)
    @On('text')
    async onCityText(@Ctx() ctx: RegistrationContext) {
        // Fallback if user sends text instead of selecting button
        await ctx.reply('Пожалуйста, выберите город из списка выше.');
    }

    @WizardStep(4)
    @On(['photo', 'text'])
    async onPhoto(@Ctx() ctx: RegistrationContext, @Message() msg: any) {
        const photos = ctx.scene.session.userData.photos ?? []; // Ensure array
        ctx.scene.session.userData.photos = photos;

        if ('text' in msg && msg.text === 'Done') {
            if (photos.length < 2) {
                return ctx.reply(`You need at least 2 photos. You have ${photos.length}.`);
            }
            await ctx.reply('Photos saved. Please share your phone number.', Markup.keyboard([
                Markup.button.contactRequest('Send Contact')
            ]).oneTime().resize());
            return ctx.wizard.next();
        }

        if ('photo' in msg) {
            if (photos.length >= 5) {
                return ctx.reply('Maximum 5 photos allowed. Click "Done" to proceed.');
            }
            const telegramPhotos = msg.photo;
            const largestPhoto = telegramPhotos[telegramPhotos.length - 1];
            const fileId = largestPhoto.file_id;
            const fileUrl = await ctx.telegram.getFileLink(fileId);

            const savedFilename = await this.filesService.downloadFile(fileUrl.href);
            photos.push(savedFilename);
            ctx.scene.session.userData.photos = photos;

            await ctx.reply(`Photo received (${photos.length}/5). Send more or click "Done".`);
        } else {
            await ctx.reply('Please send a photo or click "Done".');
        }
    }

    @WizardStep(5)
    @On(['contact', 'text'])
    async onPhone(@Ctx() ctx: RegistrationContext, @Message() msg: any) {
        let phone = '';
        if ('contact' in msg) {
            phone = msg.contact.phone_number;
        } else if ('text' in msg) {
            phone = msg.text;
        } else {
            return ctx.reply('Please provide a phone number.');
        }
        ctx.scene.session.userData.phone = phone;
        await ctx.reply('What is your price per video (USD)?', Markup.removeKeyboard());
        ctx.wizard.next();
    }

    @WizardStep(6)
    @On('text')
    async onPrice(@Ctx() ctx: RegistrationContext, @Message('text') msg: string) {
        const price = parseFloat(msg);
        if (isNaN(price)) return ctx.reply('Please enter a valid number.');
        ctx.scene.session.userData.price = price;
        await ctx.reply('Share your social links (Instagram, TikTok, etc.) or type "Skip".');
        ctx.wizard.next();
    }

    @WizardStep(7)
    @On('text')
    async onSocials(@Ctx() ctx: RegistrationContext, @Message('text') msg: string) {
        ctx.scene.session.userData.socials = msg;

        // Summary
        const d = ctx.scene.session.userData;
        // Check for required fields before accessing
        if (!d.fullName || !d.age || !d.gender || !d.city || !d.phone || d.price === undefined) {
            await ctx.reply('Something went wrong. Please restart with /start');
            return ctx.scene.leave();
        }

        const summary = `Name: ${d.fullName}\nAge: ${d.age}\nGender: ${d.gender}\nCity: ${d.city}\nPhone: ${d.phone}\nPrice: ${d.price}\nSocials: ${d.socials}`;

        await ctx.reply(`Please confirm your request:\n\n${summary}`, Markup.keyboard([
            ['Confirm', 'Restart']
        ]).oneTime().resize());
        ctx.wizard.next();
    }

    @WizardStep(8)
    @On('text')
    async onConfirm(@Ctx() ctx: RegistrationContext, @Message('text') msg: string) {
        if (msg === 'Restart') {
            await ctx.scene.reenter();
            return;
        }
        if (msg === 'Confirm') {
            const d = ctx.scene.session.userData;
            if (!d.telegramId || !d.fullName || !d.age || !d.gender || !d.city || !d.phone || d.price === undefined) {
                await ctx.reply('Missing data. Please restart.');
                return ctx.scene.leave();
            }

            try {
                // Prepare user data
                const userData: any = {
                    telegramId: BigInt(d.telegramId),
                    username: d.username,
                    fullName: d.fullName,
                    age: d.age,
                    gender: d.gender,
                    phone: d.phone,
                    price: d.price,
                    experience: ExperienceLevel.HAS_EXP,
                    socialLinks: d.socials,
                    status: UserStatus.ACTIVE,
                };
                
                // Use cityId if available, otherwise fallback to city string
                if (d.cityId) {
                    userData.cityId = d.cityId;
                    userData.city = d.city;  // Keep for backward compatibility
                } else {
                    userData.city = d.city;
                }
                
                const user = await this.usersService.createOrUpdate(userData);

                // Save photos
                if (d.photos) {
                    for (const [index, p] of d.photos.entries()) {
                        await this.usersService.savePhoto(user.id, p, index === 0);
                    }
                }

                await ctx.reply('Registration complete! Applications are reviewed by admin.', Markup.removeKeyboard());
                await ctx.scene.leave();
            } catch (e) {
                console.error(e);
                await ctx.reply('Error saving data. Please try again.');
            }
        } else {
            await ctx.reply('Please select Confirm or Restart.');
        }
    }
}
