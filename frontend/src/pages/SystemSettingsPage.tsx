import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
    Container, Box, Typography, Button, TextField,
    Alert, Card, CardContent, Paper,
    IconButton, Tooltip, Chip, Stack, Grid, alpha,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import KeyIcon from '@mui/icons-material/Key';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useTranslation } from 'react-i18next';
import api from '../api';
import AppBar from '../components/AppBar';

export default function SystemSettingsPage() {
    const { t } = useTranslation();
    const [botToken, setBotToken] = useState('');
    const [copied, setCopied] = useState(false);

    const resetPendingMutation = useMutation({
        mutationFn: () => api.post('/bot/reset-pending-updates'),
    });

    const updateTokenMutation = useMutation({
        mutationFn: () => api.post('/bot/update-token', { token: botToken }),
        onSuccess: () => {
            setBotToken('');
        },
    });

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            <AppBar />
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.025em' }}>
                        {t('systemSettings.title', 'System Settings')}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        {t('systemSettings.subtitle', 'Configure Telegram bot and system parameters')}
                    </Typography>
                </Box>

                <Grid container spacing={3} alignItems="stretch">
                    {/* Bot Token Settings */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Card elevation={0} sx={{ height: '100%', display: 'flex', flexDirection: 'column', border: '1px solid', borderColor: 'divider' }}>
                            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                    <Box sx={{
                                        p: 1.5,
                                        borderRadius: 2,
                                        bgcolor: (theme) => alpha(theme.palette.warning.main, 0.1),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <KeyIcon sx={{ fontSize: 28, color: 'warning.main' }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                            {t('systemSettings.botTokenTitle', 'Bot Token')}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {t('systemSettings.botTokenSubtitle', 'Update Telegram bot token')}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }} icon={false}>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {t('systemSettings.tokenInfo', 'The bot will be reinitialized with the new token automatically')}
                                    </Typography>
                                </Alert>

                                <Box sx={{ flexGrow: 1 }}>
                                    <TextField
                                        fullWidth
                                        label={t('systemSettings.newToken', 'New Bot Token')}
                                        value={botToken}
                                        onChange={(e) => setBotToken(e.target.value)}
                                        placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                                        size="medium"
                                        type="password"
                                        sx={{ mb: 1 }}
                                        helperText={t('systemSettings.tokenHelp', 'Get from @BotFather on Telegram')}
                                        InputProps={{ sx: { borderRadius: 2 } }}
                                    />
                                </Box>

                                <Button
                                    variant="contained"
                                    color="warning"
                                    onClick={() => updateTokenMutation.mutate()}
                                    disabled={!botToken || updateTokenMutation.isPending}
                                    fullWidth
                                    sx={{ mt: 3, py: 1.2, fontWeight: 700 }}
                                >
                                    {t('systemSettings.updateToken', 'Update Token')}
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Reset Pending Updates */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Card elevation={0} sx={{ height: '100%', display: 'flex', flexDirection: 'column', border: '1px solid', borderColor: 'divider' }}>
                            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                    <Box sx={{
                                        p: 1.5,
                                        borderRadius: 2,
                                        bgcolor: (theme) => alpha(theme.palette.error.main, 0.1),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <DeleteSweepIcon sx={{ fontSize: 28, color: 'error.main' }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                            {t('systemSettings.pendingTitle', 'Pending Updates')}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {t('systemSettings.pendingSubtitle', 'Clear pending bot updates')}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                                        {t('systemSettings.pendingDescription', 'Use this to clear old pending updates from Telegram. Useful when switching between polling and webhook modes.')}
                                    </Typography>

                                    <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }} icon={false}>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                            {t('systemSettings.pendingInfo', 'This will drop all pending updates that haven\'t been processed yet')}
                                        </Typography>
                                    </Alert>
                                </Box>

                                <Button
                                    variant="contained"
                                    color="error"
                                    startIcon={<DeleteSweepIcon />}
                                    onClick={() => resetPendingMutation.mutate()}
                                    disabled={resetPendingMutation.isPending}
                                    fullWidth
                                    sx={{ mt: 3, py: 1.2, fontWeight: 700 }}
                                >
                                    {t('systemSettings.resetPending', 'Reset Pending Updates')}
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* System Information */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Card elevation={0} sx={{ height: '100%', display: 'flex', flexDirection: 'column', border: '1px solid', borderColor: 'divider' }}>
                            <CardContent sx={{ flexGrow: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                    <Box sx={{
                                        p: 1.5,
                                        borderRadius: 2,
                                        bgcolor: (theme) => alpha(theme.palette.info.main, 0.1),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <RefreshIcon sx={{ fontSize: 28, color: 'info.main' }} />
                                    </Box>
                                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                        {t('systemSettings.systemInfo', 'System Information')}
                                    </Typography>
                                </Box>

                                <Stack spacing={2.5}>
                                    <Box>
                                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            {t('systemSettings.apiUrl', 'API URL')}
                                        </Typography>
                                        <Paper elevation={0} sx={{
                                            mt: 1,
                                            p: 1.5,
                                            bgcolor: 'action.hover',
                                            borderRadius: 2,
                                            border: '1px dashed',
                                            borderColor: 'divider',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                        }}>
                                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                                                {import.meta.env.VITE_API_URL || 'http://localhost:3000'}
                                            </Typography>
                                            <Tooltip title={copied ? t('common.copied', 'Copied!') : t('common.copy', 'Copy')}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleCopy(import.meta.env.VITE_API_URL || 'http://localhost:3000')}
                                                    sx={{ ml: 1 }}
                                                >
                                                    {copied ? <CheckCircleIcon fontSize="small" color="success" /> : <ContentCopyIcon fontSize="small" />}
                                                </IconButton>
                                            </Tooltip>
                                        </Paper>
                                    </Box>

                                    <Box sx={{ display: 'flex', gap: 4 }}>
                                        <Box>
                                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                {t('systemSettings.environment', 'Environment')}
                                            </Typography>
                                            <Box sx={{ mt: 1 }}>
                                                <Chip
                                                    label={import.meta.env.MODE.toUpperCase()}
                                                    size="small"
                                                    sx={{
                                                        fontWeight: 800,
                                                        borderRadius: 1.5,
                                                        bgcolor: (theme) => import.meta.env.MODE === 'production' ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.warning.main, 0.1),
                                                        color: import.meta.env.MODE === 'production' ? 'success.main' : 'warning.main'
                                                    }}
                                                />
                                            </Box>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                {t('systemSettings.version', 'Version')}
                                            </Typography>
                                            <Box sx={{ mt: 1 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>1.0.0</Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}
