import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
    Container, Box, Typography, CircularProgress, useTheme, useMediaQuery, Grid, Stack
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CakeIcon from '@mui/icons-material/Cake';
import api from '../api';
import AppBar from '../components/AppBar';
import StatCard from './stats/StatCard';
import {
    GenderDistribution,
    ExperienceDistribution,
    AgeDistribution,
    PriceDistribution,
    RegistrationsTrend,
    TopCities
} from './stats/Charts';

interface StatsData {
    overview: {
        totalUsers: number;
        activeUsers: number;
        pendingUsers: number;
        rejectedUsers: number;
        avgAge: number;
        avgPrice: number;
    };
    gender: {
        male: number;
        female: number;
    };
    experience: Array<{ level: string; count: number }>;
    cities: Array<{ city: string; count: number }>;
    ageDistribution: Array<{ range: string; count: number }>;
    priceDistribution: Array<{ range: string; count: number }>;
    registrationsByDay: Array<{ date: string; count: number }>;
}

export default function StatsPage() {
    const { t } = useTranslation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const { data: stats, isLoading } = useQuery<StatsData>({
        queryKey: ['stats'],
        queryFn: async () => {
            const res = await api.get('/users/stats');
            return res.data;
        },
    });

    if (isLoading) {
        return (
            <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
                <AppBar />
                <Container maxWidth="xl" sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                    <CircularProgress size={60} />
                </Container>
            </Box>
        );
    }

    if (!stats) return null;

    const genderData = [
        { name: t('dashboard.filters.male'), value: stats.gender.male },
        { name: t('dashboard.filters.female'), value: stats.gender.female },
    ];

    const experienceData = stats.experience.map(item => ({
        name: item.level === 'NO_EXP' ? t('dashboard.filters.noExperience') :
              item.level === 'HAS_EXP' ? t('dashboard.filters.hasExperience') :
              t('dashboard.filters.professional'),
        value: item.count,
    }));

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            <AppBar />
            <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3, md: 4 } }}>
                <Typography variant={isMobile ? 'h5' : 'h4'} sx={{ fontWeight: 700, mb: 4 }}>
                    {t('stats.title')}
                </Typography>

                <Stack spacing={4}>
                    {/* Overview Cards */}
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <StatCard
                                title={t('stats.totalUsers')}
                                value={stats.overview.totalUsers}
                                icon={<PeopleIcon />}
                                color="primary"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <StatCard
                                title={t('stats.activeUsers')}
                                value={stats.overview.activeUsers}
                                icon={<CheckCircleIcon />}
                                color="success"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <StatCard
                                title={t('stats.avgAge')}
                                value={stats.overview.avgAge}
                                icon={<CakeIcon />}
                                color="info"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <StatCard
                                title={t('stats.avgPrice')}
                                value={`${(stats.overview.avgPrice / 1000).toFixed(0)}k`}
                                icon={<AttachMoneyIcon />}
                                color="warning"
                            />
                        </Grid>
                    </Grid>

                    {/* Charts Grid */}
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <GenderDistribution data={genderData} />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <ExperienceDistribution data={experienceData} />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <AgeDistribution data={stats.ageDistribution} />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <PriceDistribution data={stats.priceDistribution} />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <RegistrationsTrend data={stats.registrationsByDay} />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TopCities data={stats.cities} />
                        </Grid>
                    </Grid>
                </Stack>
            </Container>
        </Box>
    );
}
