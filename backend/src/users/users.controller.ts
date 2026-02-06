import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, ParseIntPipe, NotFoundException, UseInterceptors, UploadedFiles, Res } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { UsersService } from './users.service';
import { UserStatus, Gender, ExperienceLevel } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('stats')
    async getStats() {
        return this.usersService.getStats();
    }

    @Get()
    async findAll(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '100',
        @Query('gender') gender?: Gender,
        @Query('ageMin') ageMin?: string,
        @Query('ageMax') ageMax?: string,
        @Query('city') city?: string,
        @Query('priceMin') priceMin?: string,
        @Query('priceMax') priceMax?: string,
        @Query('experience') experience?: ExperienceLevel,
        @Query('search') search?: string,
    ) {
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const where: any = {};

        if (gender) where.gender = gender;
        if (ageMin || ageMax) {
            where.age = {};
            if (ageMin) where.age.gte = parseInt(ageMin);
            if (ageMax) where.age.lte = parseInt(ageMax);
        }
        if (city) where.city = { contains: city, mode: 'insensitive' };
        if (priceMin || priceMax) {
            where.price = {};
            if (priceMin) where.price.gte = parseFloat(priceMin);
            if (priceMax) where.price.lte = parseFloat(priceMax);
        }
        if (experience) where.experience = experience;
        if (search) where.fullName = { contains: search, mode: 'insensitive' };

        const [users, total] = await Promise.all([
            this.usersService.findAll({
                skip,
                take,
                where,
                orderBy: { createdAt: 'desc' },
            }),
            this.usersService.count(where),
        ]);

        return {
            data: users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit)),
            },
        };
    }

    @Get('export')
    async export(
        @Res() res: Response,
        @Query('gender') gender?: Gender,
        @Query('ageMin') ageMin?: string,
        @Query('ageMax') ageMax?: string,
        @Query('city') city?: string,
        @Query('priceMin') priceMin?: string,
        @Query('priceMax') priceMax?: string,
        @Query('experience') experience?: ExperienceLevel,
        @Query('search') search?: string,
    ) {
        const where: any = {};

        if (gender) where.gender = gender;
        if (ageMin || ageMax) {
            where.age = {};
            if (ageMin) where.age.gte = parseInt(ageMin);
            if (ageMax) where.age.lte = parseInt(ageMax);
        }
        if (city) where.city = { contains: city, mode: 'insensitive' };
        if (priceMin || priceMax) {
            where.price = {};
            if (priceMin) where.price.gte = parseFloat(priceMin);
            if (priceMax) where.price.lte = parseFloat(priceMax);
        }
        if (experience) where.experience = experience;
        if (search) where.fullName = { contains: search, mode: 'insensitive' };

        const users = await this.usersService.findAll({
            where,
            orderBy: { createdAt: 'desc' },
        });

        // Generate CSV
        const csv = this.usersService.exportToCSV(users);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=actors-${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csv);
    }

    @Post()
    @UseInterceptors(FilesInterceptor('photos', 10, {
        storage: diskStorage({
            destination: './uploads',
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                return cb(null, `${randomName}${extname(file.originalname)}`);
            }
        })
    }))
    async create(
        @Body() createUserDto: CreateUserDto,
        @UploadedFiles() photos: Array<Express.Multer.File>,
    ) {
        return this.usersService.createManual(createUserDto, photos);
    }

    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        const user = await this.usersService.findOne(id);
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    @Put(':id')
    @UseInterceptors(FilesInterceptor('photos', 10, {
        storage: diskStorage({
            destination: './uploads',
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                return cb(null, `${randomName}${extname(file.originalname)}`);
            }
        })
    }))
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateUserDto: UpdateUserDto,
        @UploadedFiles() photos?: Array<Express.Multer.File>,
    ) {
        return this.usersService.updateUser(id, updateUserDto, photos);
    }

    @Patch(':id/status')
    async updateStatus(
        @Param('id', ParseIntPipe) id: number,
        @Body('status') status: UserStatus,
    ) {
        return this.usersService.updateStatus(id, status);
    }

    @Delete(':id')
    async delete(@Param('id', ParseIntPipe) id: number) {
        return this.usersService.delete(id);
    }
}
