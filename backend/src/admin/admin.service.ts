import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
    constructor(private prisma: PrismaService) {}

    async create(createAdminDto: CreateAdminDto) {
        const existing = await this.prisma.admin.findUnique({
            where: { email: createAdminDto.email },
        });

        if (existing) {
            throw new ConflictException('Admin with this email already exists');
        }

        const hashedPassword = await bcrypt.hash(createAdminDto.password, 10);

        return this.prisma.admin.create({
            data: {
                ...createAdminDto,
                password: hashedPassword,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                createdAt: true,
            },
        });
    }

    async findAll() {
        return this.prisma.admin.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: number) {
        const admin = await this.prisma.admin.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!admin) {
            throw new NotFoundException('Admin not found');
        }

        return admin;
    }

    async update(id: number, updateAdminDto: UpdateAdminDto) {
        const admin = await this.prisma.admin.findUnique({ where: { id } });

        if (!admin) {
            throw new NotFoundException('Admin not found');
        }

        const data: any = { ...updateAdminDto };

        if (updateAdminDto.password) {
            data.password = await bcrypt.hash(updateAdminDto.password, 10);
        }

        return this.prisma.admin.update({
            where: { id },
            data,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }

    async remove(id: number) {
        const admin = await this.prisma.admin.findUnique({ where: { id } });

        if (!admin) {
            throw new NotFoundException('Admin not found');
        }

        return this.prisma.admin.delete({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
            },
        });
    }

    async logActivity(adminId: number, action: string, entityType: string, entityId?: number, details?: any) {
        return this.prisma.activityLog.create({
            data: {
                adminId,
                action,
                entityType,
                entityId,
                details: details ? JSON.stringify(details) : null,
            },
        });
    }

    async getActivityLogs(limit = 50) {
        return this.prisma.activityLog.findMany({
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                admin: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
    }

    async getStatistics() {
        const [totalActors, activeActors, hiddenActors, totalAdmins, recentActors] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.user.count({ where: { status: 'ACTIVE' } }),
            this.prisma.user.count({ where: { status: 'HIDDEN' } }),
            this.prisma.admin.count({ where: { isActive: true } }),
            this.prisma.user.count({
                where: {
                    createdAt: {
                        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
                    },
                },
            }),
        ]);

        return {
            totalActors,
            activeActors,
            hiddenActors,
            totalAdmins,
            recentActors,
        };
    }
}
