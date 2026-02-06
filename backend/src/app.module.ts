import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TelegrafModule } from 'nestjs-telegraf';
import { join } from 'path';
import { session } from 'telegraf';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { FilesModule } from './files/files.module';
import { BotModule } from './bot/bot.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { CitiesModule } from './cities/cities.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    // TelegrafModule disabled temporarily - uncomment and add valid BOT_TOKEN to enable
    // TelegrafModule.forRootAsync({
    //   imports: [ConfigModule],
    //   useFactory: (configService: ConfigService) => ({
    //     token: configService.get<string>('BOT_TOKEN') || 'change_me',
    //     middlewares: [session()],
    //     launchOptions: {
    //       dropPendingUpdates: true,
    //     },
    //   }),
    //   inject: [ConfigService],
    // }),
    PrismaModule,
    UsersModule,
    FilesModule,
    // BotModule, // Disabled along with TelegrafModule
    AuthModule,
    AdminModule,
    CitiesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
