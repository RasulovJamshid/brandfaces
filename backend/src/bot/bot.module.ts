import { Module } from '@nestjs/common';
import { BotUpdate } from './bot.update';
import { BotController } from './bot.controller';
import { BotService } from './bot.service';
import { RegistrationScene } from './scenes/registration.scene';
import { UsersModule } from '../users/users.module';
import { FilesModule } from '../files/files.module';
import { CitiesModule } from '../cities/cities.module';

@Module({
    imports: [UsersModule, FilesModule, CitiesModule],
    controllers: [BotController],
    providers: [BotUpdate, BotService, RegistrationScene],
    exports: [BotService],
})
export class BotModule { }
