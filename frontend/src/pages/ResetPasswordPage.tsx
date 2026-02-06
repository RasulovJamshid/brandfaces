import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Box, Container, Paper, Typography, TextField, Button,
    Alert, CircularProgress, InputAdornment, IconButton,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LockResetIcon from '@mui/icons-material/LockReset';
import api from '../api';

export default function ResetPasswordPage() {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [tokenValid, setTokenValid] = useState(false);
    const [email, setEmail] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: '',
    });

    useEffect(() => {
        if (!token) {
            setError(t('resetPassword.invalidLink'));
            setLoading(false);
            return;
        }

        // Verify token
        api.get(`/auth/verify-reset-token?token=${token}`)
            .then((res) => {
                if (res.data.valid) {
                    setTokenValid(true);
                    setEmail(res.data.email);
                } else {
                    setError(t('resetPassword.expiredLink'));
                }
            })
            .catch(() => {
                setError(t('resetPassword.expiredLink'));
            })
            .finally(() => {
                setLoading(false);
            });
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.newPassword.length < 6) {
            setError(t('resetPassword.passwordTooShort'));
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setError(t('resetPassword.passwordMismatch'));
            return;
        }

        setSubmitting(true);

        try {
            await api.post('/auth/reset-password', {
                token,
                newPassword: formData.newPassword,
            });

            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || t('resetPassword.resetFailed'));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)',
                }}
            >
                <CircularProgress sx={{ color: 'white' }} />
            </Box>
        );
    }

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)',
                py: 4,
            }}
        >
            <Container maxWidth="sm">
                <Paper
                    elevation={10}
                    sx={{
                        p: 4,
                        borderRadius: 4,
                        textAlign: 'center',
                    }}
                >
                    <Box sx={{ mb: 3 }}>
                        <LockResetIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                            {t('resetPassword.title')}
                        </Typography>
                        {tokenValid && email && (
                            <Typography variant="body2" color="text.secondary">
                                {t('resetPassword.subtitle', { email })}
                            </Typography>
                        )}
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    {success ? (
                        <Alert severity="success" sx={{ mb: 3 }}>
                            {t('resetPassword.success')}
                        </Alert>
                    ) : tokenValid ? (
                        <form onSubmit={handleSubmit}>
                            <TextField
                                fullWidth
                                type={showPassword ? 'text' : 'password'}
                                label={t('resetPassword.newPassword')}
                                value={formData.newPassword}
                                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                required
                                disabled={submitting}
                                sx={{ mb: 2 }}
                                InputProps={{
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

                            <TextField
                                fullWidth
                                type={showConfirmPassword ? 'text' : 'password'}
                                label={t('resetPassword.confirmPassword')}
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                required
                                disabled={submitting}
                                sx={{ mb: 3 }}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                edge="end"
                                            >
                                                {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                size="large"
                                disabled={submitting}
                                sx={{ mb: 2 }}
                            >
                                {submitting ? <CircularProgress size={24} /> : t('resetPassword.resetButton')}
                            </Button>

                            <Button
                                variant="text"
                                fullWidth
                                onClick={() => navigate('/login')}
                                disabled={submitting}
                            >
                                {t('resetPassword.backToLogin')}
                            </Button>
                        </form>
                    ) : (
                        <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            onClick={() => navigate('/login')}
                        >
                            {t('resetPassword.goToLogin')}
                        </Button>
                    )}
                </Paper>
            </Container>
        </Box>
    );
}
