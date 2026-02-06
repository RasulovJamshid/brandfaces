import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Container, Box, Paper, TextField, Button, Typography,
    Alert, CircularProgress, InputAdornment, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions, Link,
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import TelegramIcon from '@mui/icons-material/Telegram';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import MovieFilterIcon from '@mui/icons-material/MovieFilter';
import api from '../api';

export default function LoginPage() {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', res.data.access_token);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || t('login.loginFailed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)', // Deep Blue to Bright Blue
                py: 4,
            }}
        >
            <Container maxWidth="xs">
                <Paper
                    elevation={10}
                    sx={{
                        p: 4,
                        borderRadius: 3,
                        backdropFilter: 'blur(10px)',
                    }}
                >
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                        <Box
                            sx={{
                                width: 64,
                                height: 64,
                                borderRadius: '50%',
                                bgcolor: 'primary.main',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 2,
                            }}
                        >
                            <MovieFilterIcon sx={{ fontSize: 36, color: 'white' }} />
                        </Box>
                        <Typography component="h1" variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                            {t('login.title')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {t('login.subtitle')}
                        </Typography>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleLogin}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label={t('common.email')}
                            autoComplete="email"
                            autoFocus
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <EmailIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label={t('common.password')}
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockIcon color="action" />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={loading}
                            sx={{ mt: 3, mb: 2, py: 1.5 }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : t('login.signIn')}
                        </Button>

                        <Box sx={{ textAlign: 'center' }}>
                            <Link
                                component="button"
                                type="button"
                                variant="body2"
                                onClick={() => setForgotPasswordOpen(true)}
                                sx={{ cursor: 'pointer', textDecoration: 'none' }}
                            >
                                {t('login.forgotPassword')}
                            </Link>
                        </Box>
                    </Box>
                </Paper>

                {/* Forgot Password Dialog */}
                <Dialog
                    open={forgotPasswordOpen}
                    onClose={() => setForgotPasswordOpen(false)}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TelegramIcon color="primary" />
                        <Typography variant="h6">{t('login.resetPasswordTitle')}</Typography>
                    </DialogTitle>
                    <DialogContent>
                        <Alert severity="info" icon={<HelpOutlineIcon />} sx={{ mb: 2 }}>
                            {t('login.resetPasswordInfo')}
                        </Alert>

                        <Typography variant="body1" sx={{ mb: 2, fontWeight: 600 }}>
                            {t('login.howToReset')}
                        </Typography>

                        <Box component="ol" sx={{ pl: 2, '& li': { mb: 1.5 } }}>
                            <li>
                                <Typography variant="body2">
                                    <strong>{t('login.step1')}</strong>
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                                    {t('login.step1Details')}
                                </Typography>
                            </li>
                            <li>
                                <Typography variant="body2">
                                    <strong>{t('login.step2')}</strong>
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                                    {t('login.step2Details')}
                                </Typography>
                            </li>
                            <li>
                                <Typography variant="body2">
                                    <strong>{t('login.step3')}</strong>
                                </Typography>
                            </li>
                        </Box>

                        <Alert severity="warning" sx={{ mt: 3 }}>
                            <Typography variant="body2">
                                <strong>{t('login.noTelegramWarning')}</strong>
                                <br />
                                {t('login.contactAdmin')}
                            </Typography>
                        </Alert>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 3 }}>
                        <Button onClick={() => setForgotPasswordOpen(false)} variant="contained">
                            {t('login.gotIt')}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </Box>
    );
}
