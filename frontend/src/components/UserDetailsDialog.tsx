import { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Typography, Box, IconButton, Chip, Divider,
    Alert, Stack, Grid,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import TelegramIcon from '@mui/icons-material/Telegram';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditIcon from '@mui/icons-material/Edit';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { useTranslation } from 'react-i18next';
import api from '../api';

const BASE_URL = import.meta.env.VITE_UPLOADS_URL || 'http://localhost:3000/uploads';

interface User {
    id: number;
    fullName: string;
    age: number;
    gender: string;
    city: string;
    phone: string;
    price: string;
    experience: string;
    socialLinks: string;
    telegramId: string;
    username: string;
    photos: { filePath: string; isMain: boolean }[];
    status: string;
    createdAt: string;
}

interface UserDetailsDialogProps {
    open: boolean;
    onClose: () => void;
    user: User | null;
    onStatusChange: () => void;
    onEdit?: (user: User) => void;
}

export default function UserDetailsDialog({ open, onClose, user, onStatusChange, onEdit }: UserDetailsDialogProps) {
    const { t } = useTranslation();
    const [photoIndex, setPhotoIndex] = useState(0);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [loading, setLoading] = useState(false);

    if (!user) return null;

    const handleNextPhoto = () => {
        if (user.photos.length > 0)
            setPhotoIndex((prev) => (prev + 1) % user.photos.length);
    };

    const handlePrevPhoto = () => {
        if (user.photos.length > 0)
            setPhotoIndex((prev) => (prev - 1 + user.photos.length) % user.photos.length);
    };

    const toggleStatus = async () => {
        const newStatus = user.status === 'ACTIVE' ? 'HIDDEN' : 'ACTIVE';
        setLoading(true);
        try {
            await api.patch(`/users/${user.id}/status`, { status: newStatus });
            onStatusChange();
            onClose();
        } catch (e) {
            alert('Error updating status');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        setLoading(true);
        try {
            await api.patch(`/users/${user.id}`);
            onStatusChange();
            onClose();
        } catch (e) {
            alert('Error deleting user');
        } finally {
            setLoading(false);
            setDeleteConfirm(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const getExperienceLabel = (exp: string) => {
        switch (exp) {
            case 'NO_EXP': return t('addEditActor.newFace');
            case 'HAS_EXP': return t('addEditActor.experienced');
            case 'PRO': return t('addEditActor.professional');
            default: return exp;
        }
    };

    const currentPhoto = user.photos[photoIndex]?.filePath;

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="md" 
            fullWidth 
            PaperProps={{ 
                sx: { 
                    borderRadius: 4,
                    backgroundImage: 'none',
                } 
            }}
        >
            <DialogTitle sx={{ p: 3, pb: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>{user.fullName}</Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                            <Chip
                                label={user.status}
                                size="small"
                                sx={{ 
                                    fontWeight: 700,
                                    bgcolor: user.status === 'ACTIVE' ? 'success.light' : 'action.selected',
                                    color: user.status === 'ACTIVE' ? 'success.main' : 'text.secondary'
                                }}
                            />
                            <Chip
                                label={getExperienceLabel(user.experience)}
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ fontWeight: 700 }}
                            />
                        </Stack>
                    </Box>
                    <IconButton onClick={onClose} sx={{ bgcolor: 'action.hover' }}><CloseIcon /></IconButton>
                </Box>
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
                <Grid container spacing={4}>
                    {/* Photo Gallery */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box 
                            position="relative" 
                            display="flex" 
                            alignItems="center" 
                            justifyContent="center" 
                            height="450px" 
                            bgcolor="grey.50" 
                            borderRadius={3} 
                            overflow="hidden"
                            border="1px solid"
                            borderColor="divider"
                        >
                            {currentPhoto ? (
                                <img
                                    src={`${BASE_URL}/${currentPhoto}`}
                                    alt="User"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                <Typography color="text.disabled" variant="body2" sx={{ fontWeight: 600 }}>{t('userDetails.noMediaAvailable')}</Typography>
                            )}
                            {user.photos.length > 1 && (
                                <>
                                    <IconButton 
                                        onClick={handlePrevPhoto} 
                                        sx={{ 
                                            position: 'absolute', 
                                            left: 12, 
                                            bgcolor: 'rgba(255,255,255,0.8)', 
                                            backdropFilter: 'blur(4px)',
                                            '&:hover': { bgcolor: 'white' } 
                                        }}
                                    >
                                        <ArrowBackIosIcon sx={{ fontSize: 18, ml: 0.5 }} />
                                    </IconButton>
                                    <IconButton 
                                        onClick={handleNextPhoto} 
                                        sx={{ 
                                            position: 'absolute', 
                                            right: 12, 
                                            bgcolor: 'rgba(255,255,255,0.8)', 
                                            backdropFilter: 'blur(4px)',
                                            '&:hover': { bgcolor: 'white' } 
                                        }}
                                    >
                                        <ArrowForwardIosIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                    <Box 
                                        sx={{ 
                                            position: 'absolute', 
                                            bottom: 16, 
                                            bgcolor: 'rgba(0,0,0,0.7)', 
                                            backdropFilter: 'blur(4px)',
                                            color: 'white', 
                                            px: 1.5, 
                                            py: 0.5, 
                                            borderRadius: 1.5 
                                        }}
                                    >
                                        <Typography variant="caption" sx={{ fontWeight: 800 }}>{photoIndex + 1} / {user.photos.length}</Typography>
                                    </Box>
                                </>
                            )}
                        </Box>
                    </Grid>

                    {/* Details */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Stack spacing={3}>
                            <Box>
                                <Typography variant="overline" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: '0.1em' }}>{t('userDetails.personalInfo')}</Typography>
                                <Divider sx={{ mt: 0.5, mb: 2 }} />
                                <Stack spacing={1.5}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>{t('userDetails.age')}</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{user.age} {t('userDetails.years')}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>{t('userDetails.gender')}</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{user.gender === 'MALE' ? t('addEditActor.male') : t('addEditActor.female')}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>{t('userDetails.location')}</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{user.city}</Typography>
                                    </Box>
                                </Stack>
                            </Box>

                            <Box>
                                <Typography variant="overline" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: '0.1em' }}>{t('userDetails.contactSocial')}</Typography>
                                <Divider sx={{ mt: 0.5, mb: 2 }} />
                                <Stack spacing={1.5}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>{t('userDetails.phone')}</Typography>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{user.phone}</Typography>
                                            <IconButton size="small" onClick={() => copyToClipboard(user.phone)} sx={{ bgcolor: 'action.hover' }}>
                                                <ContentCopyIcon sx={{ fontSize: 14 }} />
                                            </IconButton>
                                        </Stack>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>{t('userDetails.telegram')}</Typography>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>@{user.username || 'N/A'}</Typography>
                                            {user.username && (
                                                <IconButton size="small" onClick={() => copyToClipboard(`@${user.username}`)} sx={{ bgcolor: 'action.hover' }}>
                                                    <ContentCopyIcon sx={{ fontSize: 14 }} />
                                                </IconButton>
                                            )}
                                        </Stack>
                                    </Box>
                                </Stack>
                            </Box>

                            <Box sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 2, border: '1px solid', borderColor: 'primary.main', position: 'relative', overflow: 'hidden' }}>
                                <Box sx={{ position: 'relative', zIndex: 1 }}>
                                    <Typography variant="overline" sx={{ fontWeight: 800, color: 'primary.dark', opacity: 0.8 }}>{t('userDetails.ratePerVideo')}</Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 900, color: 'primary.dark', mt: 0.5 }}>
                                        {parseFloat(user.price).toLocaleString()} <Typography component="span" variant="caption" sx={{ fontWeight: 700 }}>UZS</Typography>
                                    </Typography>
                                </Box>
                                <Box sx={{ position: 'absolute', right: -10, bottom: -10, opacity: 0.1, transform: 'rotate(-15deg)' }}>
                                    <AttachMoneyIcon sx={{ fontSize: 80, color: 'primary.dark' }} />
                                </Box>
                            </Box>

                            {user.socialLinks && (
                                <Box>
                                    <Typography variant="overline" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: '0.1em' }}>{t('userDetails.notes')}</Typography>
                                    <Divider sx={{ mt: 0.5, mb: 1.5 }} />
                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'text.secondary', lineHeight: 1.6 }}>{user.socialLinks}</Typography>
                                </Box>
                            )}
                        </Stack>
                    </Grid>
                </Grid>

                {deleteConfirm && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        <Typography variant="body2" fontWeight={500}>{t('userDetails.deleteConfirm')}</Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            <Button size="small" variant="contained" color="error" onClick={handleDelete} disabled={loading}>
                                {t('userDetails.yesDelete')}
                            </Button>
                            <Button size="small" variant="outlined" onClick={() => setDeleteConfirm(false)} disabled={loading}>
                                {t('common.cancel')}
                            </Button>
                        </Box>
                    </Alert>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button
                    variant="outlined"
                    startIcon={<TelegramIcon />}
                    href={user.username ? `https://t.me/${user.username}` : `tg://user?id=${user.telegramId}`}
                    target="_blank"
                    disabled={loading}
                >
                    {t('userDetails.contactTelegram')}
                </Button>
                <Box sx={{ flexGrow: 1 }} />
                {onEdit && (
                    <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<EditIcon />}
                        onClick={() => onEdit(user)}
                        disabled={loading}
                    >
                        {t('common.edit')}
                    </Button>
                )}
                <Button
                    variant="outlined"
                    color={user.status === 'ACTIVE' ? 'warning' : 'success'}
                    startIcon={user.status === 'ACTIVE' ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    onClick={toggleStatus}
                    disabled={loading}
                >
                    {user.status === 'ACTIVE' ? t('userDetails.hide') : t('userDetails.activate')}
                </Button>
                <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => setDeleteConfirm(true)}
                    disabled={loading || deleteConfirm}
                >
                    {t('common.delete')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
