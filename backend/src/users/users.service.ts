import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User, UserStatus, Gender, ExperienceLevel } from '@prisma/client';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async createOrUpdate(data: Prisma.UserCreateInput) {
        // We assume telegramId is unique
        const telegramId = data.telegramId as bigint; // Ensure it's treated correctly if passed, but DTO might have it as string/number? BigInt handling in Prisma is tricky. 
        // Usually deserialized as BigInt.

        // Check if exists
        const existing = await this.prisma.user.findUnique({
            where: { telegramId },
        });

        if (existing) {
            return this.prisma.user.update({
                where: { telegramId },
                data,
            });
        }

        return this.prisma.user.create({
            data,
        });
    }

    async findAll(params: {
        skip?: number;
        take?: number;
        cursor?: Prisma.UserWhereUniqueInput;
        where?: Prisma.UserWhereInput;
        orderBy?: Prisma.UserOrderByWithRelationInput;
    }) {
        const { skip, take, cursor, where, orderBy } = params;
        return this.prisma.user.findMany({
            skip,
            take,
            cursor,
            where,
            orderBy,
            include: { 
                photos: true,
                cityModel: {
                    select: {
                        id: true,
                        name: true,
                        nameEn: true,
                        nameRu: true,
                        region: true,
                    },
                },
            },
        });
    }

    async findOne(id: number) {
        return this.prisma.user.findUnique({
            where: { id },
            include: { 
                photos: true,
                cityModel: {
                    select: {
                        id: true,
                        name: true,
                        nameEn: true,
                        nameRu: true,
                        region: true,
                    },
                },
            },
        });
    }

    async updateStatus(id: number, status: UserStatus) {
        return this.prisma.user.update({
            where: { id },
            data: { status },
        });
    }

    async savePhoto(userId: number, filePath: string, isMain: boolean = false) {
        return this.prisma.photo.create({
            data: {
                userId,
                filePath,
                isMain,
            },
        });
    }

    async count(where?: Prisma.UserWhereInput) {
        return this.prisma.user.count({ where });
    }

    async delete(id: number) {
        // Delete associated photos first
        await this.prisma.photo.deleteMany({
            where: { userId: id },
        });
        // Then delete the user
        return this.prisma.user.delete({
            where: { id },
        });
    }

    async createManual(data: any, photos?: Array<Express.Multer.File>) {
        // Create user without telegramId
        const user = await this.prisma.user.create({
            data: {
                fullName: data.fullName,
                age: parseInt(data.age),
                gender: data.gender,
                city: data.city,
                phone: data.phone,
                price: data.price,
                experience: data.experience,
                socialLinks: data.socialLinks,
                username: data.username,
                createdBy: 'admin',
            },
        });

        // Save photos if provided
        if (photos && photos.length > 0) {
            for (let i = 0; i < photos.length; i++) {
                await this.savePhoto(user.id, photos[i].filename, i === 0);
            }
        }

        return this.findOne(user.id);
    }

    async updateUser(id: number, data: any, photos?: Array<Express.Multer.File>) {
        const updateData: any = {};
        
        if (data.fullName) updateData.fullName = data.fullName;
        if (data.age) updateData.age = parseInt(data.age);
        if (data.gender) updateData.gender = data.gender;
        if (data.city) updateData.city = data.city;
        if (data.phone) updateData.phone = data.phone;
        if (data.price) updateData.price = data.price;
        if (data.experience) updateData.experience = data.experience;
        if (data.socialLinks !== undefined) updateData.socialLinks = data.socialLinks;
        if (data.username !== undefined) updateData.username = data.username;
        if (data.status) updateData.status = data.status;

        const user = await this.prisma.user.update({
            where: { id },
            data: updateData,
        });

        // Add new photos if provided
        if (photos && photos.length > 0) {
            const existingPhotos = await this.prisma.photo.findMany({
                where: { userId: id },
            });
            
            for (let i = 0; i < photos.length; i++) {
                await this.savePhoto(user.id, photos[i].filename, existingPhotos.length === 0 && i === 0);
            }
        }

        return this.findOne(user.id);
    }

    exportToCSV(users: any[]): string {
        if (users.length === 0) {
            return 'No data available';
        }

        // CSV Headers
        const headers = [
            'ID',
            'Full Name',
            'Age',
            'Gender',
            'City',
            'Phone',
            'Price',
            'Experience',
            'Username',
            'Social Links',
            'Status',
            'Created By',
            'Created At',
            'Photo Count'
        ];

        // CSV Rows
        const rows = users.map(user => [
            user.id,
            `"${user.fullName}"`,
            user.age,
            user.gender,
            `"${user.city}"`,
            user.phone,
            user.price,
            user.experience,
            user.username || '',
            `"${user.socialLinks || ''}"`,
            user.status,
            user.createdBy || 'telegram',
            new Date(user.createdAt).toISOString(),
            user.photos?.length || 0
        ]);

        // Combine headers and rows
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        return csvContent;
    }

    async getStats() {
        const [
            totalUsers,
            totalMale,
            totalFemale,
            activeUsers,
            pendingUsers,
            rejectedUsers,
            experienceStats,
            cityStats,
            ageDistribution,
            priceDistribution,
            recentUsers,
        ] = await Promise.all([
            // Total users
            this.prisma.user.count(),
            
            // Gender stats
            this.prisma.user.count({ where: { gender: Gender.MALE } }),
            this.prisma.user.count({ where: { gender: Gender.FEMALE } }),
            
            // Status stats
            this.prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
            this.prisma.user.count({ where: { status: UserStatus.HIDDEN } }),
            0, // No rejected status in schema
            
            // Experience level stats
            this.prisma.user.groupBy({
                by: ['experience'],
                _count: true,
            }),
            
            // Top cities
            this.prisma.user.groupBy({
                by: ['city'],
                _count: true,
                orderBy: { _count: { city: 'desc' } },
                take: 10,
            }),
            
            // Age distribution (grouped by ranges)
            this.prisma.user.findMany({
                select: { age: true },
            }),
            
            // Price distribution
            this.prisma.user.findMany({
                select: { price: true },
            }),
            
            // Recent registrations (last 30 days)
            this.prisma.user.findMany({
                where: {
                    createdAt: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    },
                },
                select: { createdAt: true },
                orderBy: { createdAt: 'asc' },
            }),
        ]);

        // Process age distribution into ranges
        const ageRanges = {
            '18-25': 0,
            '26-35': 0,
            '36-45': 0,
            '46-55': 0,
            '56+': 0,
        };
        
        ageDistribution.forEach(({ age }) => {
            if (age >= 18 && age <= 25) ageRanges['18-25']++;
            else if (age >= 26 && age <= 35) ageRanges['26-35']++;
            else if (age >= 36 && age <= 45) ageRanges['36-45']++;
            else if (age >= 46 && age <= 55) ageRanges['46-55']++;
            else if (age >= 56) ageRanges['56+']++;
        });

        // Process price distribution into ranges
        const priceRanges = {
            '0-500k': 0,
            '500k-1M': 0,
            '1M-2M': 0,
            '2M-5M': 0,
            '5M+': 0,
        };
        
        priceDistribution.forEach(({ price }) => {
            const priceNum = Number(price);
            if (priceNum < 500000) priceRanges['0-500k']++;
            else if (priceNum < 1000000) priceRanges['500k-1M']++;
            else if (priceNum < 2000000) priceRanges['1M-2M']++;
            else if (priceNum < 5000000) priceRanges['2M-5M']++;
            else priceRanges['5M+']++;
        });

        // Process recent registrations by day
        const registrationsByDay = {};
        recentUsers.forEach(({ createdAt }) => {
            const date = createdAt.toISOString().split('T')[0];
            registrationsByDay[date] = (registrationsByDay[date] || 0) + 1;
        });

        // Calculate average price
        const avgPrice = priceDistribution.length > 0
            ? priceDistribution.reduce((sum, { price }) => sum + Number(price), 0) / priceDistribution.length
            : 0;

        // Calculate average age
        const avgAge = ageDistribution.length > 0
            ? ageDistribution.reduce((sum, { age }) => sum + age, 0) / ageDistribution.length
            : 0;

        return {
            overview: {
                totalUsers,
                activeUsers,
                pendingUsers,
                rejectedUsers,
                avgAge: Math.round(avgAge),
                avgPrice: Math.round(avgPrice),
            },
            gender: {
                male: totalMale,
                female: totalFemale,
            },
            experience: experienceStats.map(stat => ({
                level: stat.experience,
                count: stat._count,
            })),
            cities: cityStats.map(stat => ({
                city: stat.city,
                count: stat._count,
            })),
            ageDistribution: Object.entries(ageRanges).map(([range, count]) => ({
                range,
                count,
            })),
            priceDistribution: Object.entries(priceRanges).map(([range, count]) => ({
                range,
                count,
            })),
            registrationsByDay: Object.entries(registrationsByDay).map(([date, count]) => ({
                date,
                count,
            })),
        };
    }
}
