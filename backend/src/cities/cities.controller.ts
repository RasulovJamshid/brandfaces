import {
    Controller,
    Get,
    Post,
    Put,
    Param,
    Body,
    Query,
    ParseIntPipe,
} from '@nestjs/common';
import { CitiesService } from './cities.service';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';
// TODO: Add authentication when auth module is available
// import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('cities')
export class CitiesController {
    constructor(private readonly citiesService: CitiesService) {}

    /**
     * Get all active cities (public endpoint)
     * GET /cities
     */
    @Get()
    async findAll(@Query('includeInactive') includeInactive?: string) {
        return this.citiesService.findAll(includeInactive === 'true');
    }

    /**
     * Search cities by name (public endpoint)
     * GET /cities/search?q=Moscow
     */
    @Get('search')
    async search(@Query('q') query: string) {
        if (!query || query.trim().length < 2) {
            return [];
        }
        return this.citiesService.search(query.trim());
    }

    /**
     * Get cities with user counts (public endpoint)
     * GET /cities/stats
     */
    @Get('stats')
    async getStats() {
        return this.citiesService.getCitiesWithUserCounts();
    }

    /**
     * Get city by ID (public endpoint)
     * GET /cities/:id
     */
    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        return this.citiesService.findOne(id);
    }

    /**
     * Create new city (admin only)
     * POST /cities
     * TODO: Add @UseGuards(JwtAuthGuard) when auth is available
     */
    @Post()
    async create(@Body() createCityDto: CreateCityDto) {
        return this.citiesService.create(createCityDto);
    }

    /**
     * Update city (admin only)
     * PUT /cities/:id
     * TODO: Add @UseGuards(JwtAuthGuard) when auth is available
     */
    @Put(':id')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateCityDto: UpdateCityDto,
    ) {
        try {
            return await this.citiesService.update(id, updateCityDto);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Deactivate city (admin only)
     * PUT /cities/:id/deactivate
     * TODO: Add @UseGuards(JwtAuthGuard) when auth is available
     */
    @Put(':id/deactivate')
    async deactivate(@Param('id', ParseIntPipe) id: number) {
        return this.citiesService.deactivate(id);
    }
}
