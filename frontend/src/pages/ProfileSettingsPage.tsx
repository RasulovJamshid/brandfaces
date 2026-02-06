import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Container, Box, Typography, Paper, Button, TextField,
    Alert, Divider, Chip, IconButton, Tooltip, Avatar, Stack, Grid,
} from '@mui/material';
import TelegramIcon from '@mui/icons-material/Telegram';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { useTranslation } from 'react-i18next';
import api from '../api';
import AppBar from '../components/AppBar';

export default function ProfileSettingsPage() {
    const { t } = useTranslation();
    const [verificationCode, setVerificationCode] = useState('');
    const [codeExpiry, setCodeExpiry] = useState<Date | null>(null);
    const [copied, setCopied] = useState(false);
    const queryClient = useQueryClient();

    // Get current admin info (you'll need to add this endpoint or get from token)
    const { data: adminData } = useQuery({
        queryKey: ['currentAdmin'],
        queryFn: async () => {
            // Decode JWT to get admin ID or add a /auth/me endpoint
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Not authenticated');
            
            // For now, get from admin list (you should add /auth/me endpoint)
            const res = await api.get('/admin');
            return res.data[0]; // Temporary - should be current user
        },
    });

    const generateCodeMutation = useMutation({
        mutationFn: () => api.post('/auth/generate-verification-code', { adminId: adminData?.id }),
        onSuccess: (res) => {
            setVerificationCode(res.data.code);
            setCodeExpiry(new Date(Date.now() + 10 * 60 * 1000)); // 10 minutes
        },
    });

    const unlinkMutation = useMutation({
        mutationFn: () => api.post('/auth/unlink-telegram', { adminId: adminData?.id }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['currentAdmin'] });
            setVerificationCode('');
            setCodeExpiry(null);
        },
    });

    const handleCopyCode = () => {
        navigator.clipboard.writeText(verificationCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Countdown timer
    useEffect(() => {
        if (!codeExpiry) return;

        const interval = setInterval(() => {
            if (new Date() >= codeExpiry) {
                setVerificationCode('');
                setCodeExpiry(null);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [codeExpiry]);

    const getTimeRemaining = () => {
        if (!codeExpiry) return '';
        const diff = Math.max(0, Math.floor((codeExpiry.getTime() - Date.now()) / 1000));
        const minutes = Math.floor(diff / 60);
        const seconds = diff % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            <AppBar />
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
                    {t('profileSettings.title')}
                </Typography>

                {/* Profile Information Section */}
                <Paper sx={{ p: 4, mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
                        <Avatar
                            sx={{
                                width: 80,
                                height: 80,
                                bgcolor: 'primary.main',
                                fontSize: '2rem',
                                fontWeight: 700,
                            }}
                        >
                            {adminData?.name?.charAt(0).toUpperCase() || 'A'}
                        </Avatar>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                                {adminData?.name || t('common.loading', 'Loading...')}
                            </Typography>
                            <Chip
                                label={adminData?.role || 'ADMIN'}
                                size="small"
                                color={adminData?.role === 'SUPER_ADMIN' ? 'error' : 'primary'}
                                icon={<AdminPanelSettingsIcon />}
                                sx={{ fontWeight: 600 }}
                            />
                        </Box>
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Stack spacing={2}>
                                <Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                        <EmailIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                                            {t('profileSettings.email', 'Email')}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {adminData?.email || '-'}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                        <PersonIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                                            {t('profileSettings.status', 'Status')}
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label={adminData?.isActive ? t('profileSettings.active', 'Active') : t('profileSettings.inactive', 'Inactive')}
                                        size="small"
                                        color={adminData?.isActive ? 'success' : 'default'}
                                        sx={{ fontWeight: 600 }}
                                    />
                                </Box>
                            </Stack>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Stack spacing={2}>
                                <Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                        <CalendarTodayIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                                            {t('profileSettings.createdAt', 'Created At')}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {adminData?.createdAt ? new Date(adminData.createdAt).toLocaleDateString() : '-'}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                        <TelegramIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                                            {t('profileSettings.telegramLinked', 'Telegram Linked')}
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label={adminData?.telegramId ? t('common.yes', 'Yes') : t('common.no', 'No')}
                                        size="small"
                                        color={adminData?.telegramId ? 'success' : 'default'}
                                        sx={{ fontWeight: 600 }}
                                    />
                                </Box>
                            </Stack>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Telegram Integration Section */}
                <Paper sx={{ p: 4, mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                        <TelegramIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 600 }}>
                                {t('profileSettings.telegramIntegration')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {t('profileSettings.telegramSubtitle')}
                            </Typography>
                        </Box>
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    {adminData?.telegramId ? (
                        // Already Linked
                        <Box>
                            <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 3 }}>
                                <Typography variant="body2">
                                    <strong>{t('profileSettings.linkedSuccess')}</strong>
                                    <br />
                                    {t('profileSettings.linkedMessage')}
                                </Typography>
                            </Alert>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                <Typography variant="body1" color="text.secondary">
                                    {t('profileSettings.telegramId')}:
                                </Typography>
                                <Chip label={adminData.telegramId} color="primary" />
                            </Box>

                            {adminData.telegramUsername && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                    <Typography variant="body1" color="text.secondary">
                                        {t('profileSettings.username')}:
                                    </Typography>
                                    <Chip label={`@${adminData.telegramUsername}`} variant="outlined" />
                                </Box>
                            )}

                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<LinkOffIcon />}
                                onClick={() => unlinkMutation.mutate()}
                                disabled={unlinkMutation.isPending}
                            >
                                {t('profileSettings.unlinkAccount')}
                            </Button>
                        </Box>
                    ) : (
                        // Not Linked
                        <Box>
                            <Alert severity="info" sx={{ mb: 3 }}>
                                <Typography variant="body2">
                                    <strong>{t('profileSettings.linkInfo')}</strong>
                                    <br />
                                    {t('profileSettings.oneTimeSetup')}
                                </Typography>
                            </Alert>

                            {!verificationCode ? (
                                <Box>
                                    <Typography variant="body1" sx={{ mb: 2 }}>
                                        {t('profileSettings.clickToGenerate', 'Click the button below to generate a verification code:')}
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        startIcon={<LinkIcon />}
                                        onClick={() => generateCodeMutation.mutate()}
                                        disabled={generateCodeMutation.isPending}
                                        size="large"
                                    >
                                        {generateCodeMutation.isPending ? t('profileSettings.generating') : t('profileSettings.generateCode')}
                                    </Button>
                                </Box>
                            ) : (
                                <Box>
                                    <Alert severity="warning" sx={{ mb: 3 }}>
                                        <Typography variant="body2">
                                            {t('profileSettings.codeExpires')} <strong>{getTimeRemaining()}</strong>
                                        </Typography>
                                    </Alert>

                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                                            {t('profileSettings.verificationCode')}
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                            <TextField
                                                value={verificationCode}
                                                InputProps={{
                                                    readOnly: true,
                                                    sx: {
                                                        fontSize: '1.5rem',
                                                        fontWeight: 700,
                                                        letterSpacing: '0.2em',
                                                        fontFamily: 'monospace',
                                                    },
                                                }}
                                                fullWidth
                                            />
                                            <Tooltip title={copied ? t('profileSettings.copied') : t('profileSettings.copyCode')}>
                                                <IconButton onClick={handleCopyCode} color="primary">
                                                    <ContentCopyIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title={t('profileSettings.generateNew')}>
                                                <IconButton
                                                    onClick={() => generateCodeMutation.mutate()}
                                                    disabled={generateCodeMutation.isPending}
                                                >
                                                    <RefreshIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </Box>

                                    <Divider sx={{ my: 3 }} />

                                    <Typography variant="body1" sx={{ mb: 2, fontWeight: 600 }}>
                                        {t('profileSettings.nextSteps')}
                                    </Typography>
                                    <Box component="ol" sx={{ pl: 2, '& li': { mb: 1 } }}>
                                        <li>
                                            <Typography variant="body2">
                                                {t('profileSettings.botStep1')}
                                            </Typography>
                                        </li>
                                        <li>
                                            <Typography variant="body2">
                                                {t('profileSettings.botStep2')}
                                            </Typography>
                                        </li>
                                        <li>
                                            <Typography variant="body2">
                                                {t('profileSettings.botStep3', { code: verificationCode })}
                                            </Typography>
                                        </li>
                                        <li>
                                            <Typography variant="body2">
                                                {t('profileSettings.botStep4')}
                                            </Typography>
                                        </li>
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    )}
                </Paper>

                {/* How to Reset Password Section */}
                <Paper sx={{ p: 4 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        {t('profileSettings.howToResetTitle')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {t('profileSettings.howToResetSubtitle')}
                    </Typography>
                    <Box component="ol" sx={{ pl: 2, '& li': { mb: 1 } }}>
                        <li>
                            <Typography variant="body2">
                                {t('profileSettings.resetStep1')}
                            </Typography>
                        </li>
                        <li>
                            <Typography variant="body2">
                                {t('profileSettings.resetStep2')}
                            </Typography>
                        </li>
                        <li>
                            <Typography variant="body2">
                                {t('profileSettings.resetStep3')}
                            </Typography>
                        </li>
                        <li>
                            <Typography variant="body2">
                                {t('profileSettings.resetStep4')}
                            </Typography>
                        </li>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
}
