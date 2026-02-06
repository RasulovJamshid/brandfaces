import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CitiesService {
    constructor(private prisma: PrismaService) {}

    /**
     * Get all active cities, ordered by sortOrder
     */
    async findAll(includeInactive = false) {
        return this.prisma.city.findMany({
            where: includeInactive ? {} : { isActive: true },
            orderBy: [
                { sortOrder: 'asc' },
                { name: 'asc' },
            ],
            select: {
                id: true,
                name: true,
                nameEn: true,
                nameRu: true,
                region: true,
                country: true,
                isActive: true,
            },
        });
    }

    /**
     * Get city by ID
     */
    async findOne(id: number) {
        return this.prisma.city.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { users: true },
                },
            },
        });
    }

    /**
     * Search cities by name (supports English and Russian)
     */
    async search(query: string) {
        return this.prisma.city.findMany({
            where: {
                AND: [
                    { isActive: true },
                    {
                        OR: [
                            { name: { contains: query, mode: 'insensitive' } },
                            { nameEn: { contains: query, mode: 'insensitive' } },
                            { nameRu: { contains: query, mode: 'insensitive' } },
                        ],
                    },
                ],
            },
            orderBy: { sortOrder: 'asc' },
            take: 20,
        });
    }

    /**
     * Get cities with user counts (for statistics)
     */
    async getCitiesWithUserCounts() {
        const cities = await this.prisma.city.findMany({
            where: { isActive: true },
            include: {
                _count: {
                    select: { users: true },
                },
            },
            orderBy: {
                users: {
                    _count: 'desc',
                },
            },
            take: 20,
        });

        return cities.map(city => ({
            id: city.id,
            name: city.name,
            nameRu: city.nameRu,
            userCount: city._count.users,
        }));
    }

    /**
     * Create a new city (admin only)
     */
    async create(data: {
        name: string;
        nameEn?: string;
        nameRu?: string;
        region?: string;
        country?: string;
        sortOrder?: number;
    }) {
        return this.prisma.city.create({
            data: {
                name: data.name,
                nameEn: data.nameEn,
                nameRu: data.nameRu,
                region: data.region,
                country: data.country || 'Uzbekistan',
                sortOrder: data.sortOrder || 0,
            },
        });
    }

    /**
     * Update city (admin only)
     */
    async update(id: number, data: {
        name?: string;
        nameEn?: string;
        nameRu?: string;
        region?: string;
        country?: string;
        isActive?: boolean;
        sortOrder?: number;
    }) {
        try {
            return await this.prisma.city.update({
                where: { id },
                data,
            });
        } catch (error) {
            if (error.code === 'P2025') {
                throw new Error(`City with ID ${id} not found`);
            }
            throw error;
        }
    }

    /**
     * Soft delete city (set isActive to false)
     */
    async deactivate(id: number) {
        return this.prisma.city.update({
            where: { id },
            data: { isActive: false },
        });
    }

    /**
     * Get city by name (case-insensitive)
     */
    async findByName(name: string) {
        return this.prisma.city.findFirst({
            where: {
                OR: [
                    { name: { equals: name, mode: 'insensitive' } },
                    { nameEn: { equals: name, mode: 'insensitive' } },
                    { nameRu: { equals: name, mode: 'insensitive' } },
                ],
            },
        });
    }
}
