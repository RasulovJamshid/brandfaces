import { Action, Ctx, Message, On, Scene, SceneEnter, Wizard, WizardStep } from 'nestjs-telegraf';
import { Scenes, Markup } from 'telegraf';
import { UsersService } from '../../users/users.service';
import { FilesService } from '../../files/files.service';
import { CitiesService } from '../../cities/cities.service';
import { Gender, ExperienceLevel, UserStatus } from '@prisma/client';
import { t } from '../i18n/messages';

interface RegistrationSession extends Scenes.WizardSessionData {
    language?: 'uz' | 'ru' | 'en';
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

    private getLang(ctx: RegistrationContext): 'uz' | 'ru' | 'en' {
        return ctx.scene.session.language || 'en';
    }

    @SceneEnter()
    async enter(@Ctx() ctx: RegistrationContext) {
        // Get language from parent session (set in bot.update.ts)
        const parentSession = (ctx as any).session;
        const lang = parentSession?.language || 'en';

        ctx.scene.session.language = lang;
        ctx.scene.session.userData = { photos: [] };
        const user = ctx.from;
        if (user) {
            ctx.scene.session.userData.telegramId = user.id.toString();
            ctx.scene.session.userData.username = user.username;
        }

        await ctx.reply(t(lang, 'welcome'));
    }

    @WizardStep(0)
    @On('text')
    async onName(@Ctx() ctx: RegistrationContext, @Message() msg: any) {
        const lang = this.getLang(ctx);
        const name = msg.text;
        if (!name || name.length < 2) {
            await ctx.reply(t(lang, 'nameShort'));
            return;
        }
        ctx.scene.session.userData.fullName = name;
        await ctx.reply(t(lang, 'askAge'));
        ctx.wizard.next();
    }

    @WizardStep(1)
    @On('text')
    async onAge(@Ctx() ctx: RegistrationContext, @Message() msg: any) {
        const lang = this.getLang(ctx);
        const age = parseInt(msg.text);
        if (isNaN(age) || age <= 16) {
            await ctx.reply(t(lang, 'ageInvalid'));
            return;
        }
        ctx.scene.session.userData.age = age;
        await ctx.reply(t(lang, 'askGender'), Markup.keyboard([
            [t(lang, 'male'), t(lang, 'female')]
        ]).oneTime().resize());
        ctx.wizard.next();
    }

    @WizardStep(2)
    @On('text')
    async onGender(@Ctx() ctx: RegistrationContext, @Message() msg: any) {
        const lang = this.getLang(ctx);
        const text = msg.text;
        // Accept gender in all languages
        const genderMap: Record<string, Gender> = {
            'MALE': 'MALE', 'ERKAK': 'MALE', 'МУЖСКОЙ': 'MALE',
            'FEMALE': 'FEMALE', 'AYOL': 'FEMALE', 'ЖЕНСКИЙ': 'FEMALE'
        };
        const gender = genderMap[text.toUpperCase()];
        if (!gender) {
            await ctx.reply(t(lang, 'genderInvalid'));
            return;
        }
        ctx.scene.session.userData.gender = gender;

        // Fetch cities and show selection
        const cities = await this.citiesService.findAll();
        const cityButtons = cities.slice(0, 20).map(city => {
            // Show city name in selected language
            let cityName = city.name;
            if (lang === 'ru' && city.nameRu) cityName = city.nameRu;
            else if (lang === 'en' && city.nameEn) cityName = city.nameEn;
            
            return [
                Markup.button.callback(
                    cityName,
                    `city_${city.id}`
                )
            ];
        });

        await ctx.reply(
            t(lang, 'askCity'),
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
            const lang = this.getLang(ctx as any);
            await ctx.reply(t(lang, 'cityNotFound'));
            return;
        }

        ctx.scene.session.userData.cityId = cityId;
        ctx.scene.session.userData.city = city.name;  // Keep for display

        const lang = this.getLang(ctx as any);
        
        // Show city name in selected language
        let cityName = city.name;
        if (lang === 'ru' && city.nameRu) cityName = city.nameRu;
        else if (lang === 'en' && city.nameEn) cityName = city.nameEn;
        
        await ctx.answerCbQuery();
        await ctx.reply(
            t(lang, 'citySelected', { city: cityName }),
            Markup.keyboard([[t(lang, 'done')]]).resize()
        );
        ctx.wizard.selectStep(4);  // Skip to photo step
    }

    @WizardStep(3)
    @On('text')
    async onCityText(@Ctx() ctx: RegistrationContext) {
        const lang = this.getLang(ctx);
        await ctx.reply(t(lang, 'citySelectFromList'));
    }

    @WizardStep(4)
    @On(['photo', 'text', 'document'])
    async onPhoto(@Ctx() ctx: RegistrationContext, @Message() msg: any) {
        const lang = this.getLang(ctx);
        const photos = ctx.scene.session.userData.photos ?? [];
        ctx.scene.session.userData.photos = photos;

        console.log('Photo step - message:', JSON.stringify({ text: msg.text, hasPhoto: !!msg.photo, hasDoc: !!msg.document }));

        // Check for "Done" in all languages - MUST BE FIRST
        if (msg.text) {
            const doneButtons = ['Done', 'Готово', 'Tayyor'];
            const text = msg.text.trim();
            console.log('Comparing text:', JSON.stringify(text), 'against:', doneButtons);

            if (doneButtons.includes(text)) {
                console.log('Done button pressed, photos count:', photos.length);
                if (photos.length < 2) {
                    await ctx.reply(t(lang, 'photosMin', { count: photos.length }));
                    return;
                }
                console.log('Moving to next step (phone)');
                await ctx.reply(t(lang, 'photosSaved'), Markup.keyboard([
                    Markup.button.contactRequest(t(lang, 'sendContact'))
                ]).oneTime().resize());
                ctx.wizard.next();
                return;
            } else {
                // User sent text but not "Done"
                console.log('Text received but not Done button:', text);
                await ctx.reply(t(lang, 'sendPhotoOrDone'));
                return;
            }
        }

        if (msg.document) {
            await ctx.reply(t(lang, 'sendPhotoOrDone') + ' (Please send as "Photo" with compression, not "File")');
            return;
        }

        if (msg.photo) {
            if (photos.length >= 5) {
                await ctx.reply(t(lang, 'photosMax'));
                return;
            }

            try {
                const telegramPhotos = msg.photo;
                const largestPhoto = telegramPhotos[telegramPhotos.length - 1];
                const fileId = largestPhoto.file_id;
                const fileUrl = await ctx.telegram.getFileLink(fileId);

                const savedFilename = await this.filesService.downloadFile(fileUrl.href);

                // Re-read photos in case of concurrent updates (basic mitigation)
                const currentPhotos = ctx.scene.session.userData.photos ?? [];
                currentPhotos.push(savedFilename);
                ctx.scene.session.userData.photos = currentPhotos;

                await ctx.reply(t(lang, 'photoReceived', { count: currentPhotos.length }));
            } catch (error) {
                console.error('Error saving photo:', error);
                await ctx.reply(t(lang, 'errorSaving') + ' (Try again)');
            }
        }
    }

    @WizardStep(5)
    @On(['contact', 'text'])
    async onPhone(@Ctx() ctx: RegistrationContext, @Message() msg: any) {
        const lang = this.getLang(ctx);
        let phone = '';
        if ('contact' in msg) {
            phone = msg.contact.phone_number;
        } else if ('text' in msg) {
            phone = msg.text;
        } else {
            await ctx.reply(t(lang, 'providePhone'));
            return;
        }
        ctx.scene.session.userData.phone = phone;
        await ctx.reply(t(lang, 'askPrice'), Markup.removeKeyboard());
        ctx.wizard.next();
    }

    @WizardStep(6)
    @On('text')
    async onPrice(@Ctx() ctx: RegistrationContext, @Message() msg: any) {
        const lang = this.getLang(ctx);
        const price = parseFloat(msg.text);
        if (isNaN(price)) {
            await ctx.reply(t(lang, 'priceInvalid'));
            return;
        }
        ctx.scene.session.userData.price = price;
        await ctx.reply(
            t(lang, 'askSocials'),
            Markup.keyboard([[t(lang, 'skip')]]).oneTime().resize(),
        );
        ctx.wizard.next();
    }

    @WizardStep(7)
    @On('text')
    async onSocials(@Ctx() ctx: RegistrationContext, @Message() msg: any) {
        const lang = this.getLang(ctx);
        const text = (msg.text || '').trim();

        // If user presses Skip/Next button, treat as no socials
        if (text === t(lang, 'skip')) {
            ctx.scene.session.userData.socials = undefined;
        } else {
            ctx.scene.session.userData.socials = text;
        }

        // Summary
        const d = ctx.scene.session.userData;
        // Check for required fields before accessing
        if (!d.fullName || !d.age || !d.gender || !d.city || !d.phone || d.price === undefined) {
            await ctx.reply(t(lang, 'somethingWrong'));
            return ctx.scene.leave();
        }

        const summary = t(lang, 'summary', {
            fullName: d.fullName,
            age: d.age,
            gender: d.gender,
            city: d.city,
            phone: d.phone,
            price: d.price,
            socials: d.socials || '-'
        });

        await ctx.reply(t(lang, 'confirmRequest', { summary }), Markup.keyboard([
            [t(lang, 'confirm'), t(lang, 'restart')]
        ]).oneTime().resize());
        ctx.wizard.next();
    }

    @WizardStep(8)
    @On('text')
    async onConfirm(@Ctx() ctx: RegistrationContext, @Message() msg: any) {
        const lang = this.getLang(ctx);
        const text = msg.text;
        const restartButtons = ['Restart', 'Начать заново', 'Qaytadan boshlash'];
        const confirmButtons = ['Confirm', 'Подтвердить', 'Tasdiqlash'];

        if (restartButtons.includes(text)) {
            await ctx.scene.reenter();
            return;
        }
        if (confirmButtons.includes(text)) {
            const d = ctx.scene.session.userData;
            if (!d.telegramId || !d.fullName || !d.age || !d.gender || !d.city || !d.phone || d.price === undefined) {
                await ctx.reply(t(lang, 'missingData'));
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

                await ctx.reply(t(lang, 'registrationComplete'), Markup.removeKeyboard());
                await ctx.scene.leave();
            } catch (e) {
                console.error(e);
                await ctx.reply(t(lang, 'errorSaving'));
            }
        } else {
            await ctx.reply(t(lang, 'selectConfirmOrRestart'));
        }
    }
}
