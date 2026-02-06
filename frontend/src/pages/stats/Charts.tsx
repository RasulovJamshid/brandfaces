import { Paper, Typography, Box } from '@mui/material';
import { PieChart } from '@mui/x-charts/PieChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';
import { useTranslation } from 'react-i18next';

interface ChartWrapperProps {
    title: string;
    children: React.ReactNode;
    height?: number;
}

const ChartWrapper = ({ title, children, height = 300 }: ChartWrapperProps) => (
    <Paper elevation={1} sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            {title}
        </Typography>
        <Box sx={{ flexGrow: 1, width: '100%', height }}>
            {children}
        </Box>
    </Paper>
);

export function GenderDistribution({ data }: { data: any[] }) {
    const { t } = useTranslation();
    return (
        <ChartWrapper title={t('stats.genderDistribution')}>
            <PieChart
                series={[{
                    data: data.map((item, index) => ({ id: index, value: item.value, label: item.name })),
                    innerRadius: 60,
                    paddingAngle: 5,
                    cornerRadius: 5,
                }]}
            />
        </ChartWrapper>
    );
}

export function ExperienceDistribution({ data }: { data: any[] }) {
    const { t } = useTranslation();
    return (
        <ChartWrapper title={t('stats.experienceDistribution')}>
            <BarChart
                xAxis={[{ scaleType: 'band', data: data.map(item => item.name) }]}
                series={[{ data: data.map(item => item.value) }]}
                borderRadius={8}
            />
        </ChartWrapper>
    );
}

export function AgeDistribution({ data }: { data: any[] }) {
    const { t } = useTranslation();
    return (
        <ChartWrapper title={t('stats.ageDistribution')}>
            <BarChart
                xAxis={[{ scaleType: 'band', data: data.map((item: any) => item.range) }]}
                series={[{ data: data.map((item: any) => item.count), color: '#82ca9d' }]}
                borderRadius={8}
            />
        </ChartWrapper>
    );
}

export function PriceDistribution({ data }: { data: any[] }) {
    const { t } = useTranslation();
    return (
        <ChartWrapper title={t('stats.priceDistribution')}>
            <BarChart
                xAxis={[{ scaleType: 'band', data: data.map((item: any) => item.range) }]}
                series={[{ data: data.map((item: any) => item.count), color: '#ffc658' }]}
                borderRadius={8}
            />
        </ChartWrapper>
    );
}

export function RegistrationsTrend({ data }: { data: any[] }) {
    const { t } = useTranslation();
    return (
        <ChartWrapper title={`${t('stats.registrationsTrend')} (${t('stats.last30Days')})`}>
            <LineChart
                xAxis={[{ scaleType: 'point', data: data.map((item: any) => item.date) }]}
                series={[{
                    data: data.map((item: any) => item.count),
                    area: true,
                    showMark: false,
                    label: t('stats.registrations')
                }]}
            />
        </ChartWrapper>
    );
}

export function TopCities({ data }: { data: any[] }) {
    const { t } = useTranslation();
    return (
        <ChartWrapper title={t('stats.topCities')} height={400}>
            <BarChart
                layout="horizontal"
                yAxis={[{ scaleType: 'band', data: data.map((item: any) => item.city) }]}
                series={[{ data: data.map((item: any) => item.count) }]}
                borderRadius={8}
            />
        </ChartWrapper>
    );
}