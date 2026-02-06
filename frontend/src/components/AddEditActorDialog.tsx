import { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, MenuItem, Box, Typography, IconButton,
    Alert, CircularProgress, Stack, Chip, Grid, Divider,
    Autocomplete,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTranslation } from 'react-i18next';
import api from '../api';

interface City {
    id: number;
    name: string;
    nameEn?: string;
    nameRu?: string;
    region?: string;
}

interface ExistingPhoto {
	id: number;
	filePath: string;
	isMain: boolean;
}

interface AddEditActorDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    actor?: any;
}

export default function AddEditActorDialog({ open, onClose, onSuccess, actor }: AddEditActorDialogProps) {
    const { t, i18n } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [photos, setPhotos] = useState<File[]>([]);
    const [existingPhotos, setExistingPhotos] = useState<ExistingPhoto[]>([]);
    const [cities, setCities] = useState<City[]>([]);
    const [selectedCity, setSelectedCity] = useState<City | null>(null);
    const [formData, setFormData] = useState({
        fullName: '',
        age: '',
        gender: 'MALE',
        cityId: '',
        phone: '',
        price: '',
        experience: 'NO_EXP',
        socialLinks: '',
        username: '',
    });

    useEffect(() => {
        // Fetch cities
        const fetchCities = async () => {
            try {
                const response = await api.get('/cities');
                setCities(response.data);
            } catch (err) {
                console.error('Failed to fetch cities:', err);
            }
        };
        
        if (open) {
            fetchCities();
        }

        if (actor) {
            setFormData({
                fullName: actor.fullName || '',
                age: actor.age?.toString() || '',
                gender: actor.gender || 'MALE',
                cityId: actor.cityId?.toString() || '',
                phone: actor.phone || '',
                price: actor.price || '',
                experience: actor.experience || 'NO_EXP',
                socialLinks: actor.socialLinks || '',
                username: actor.username || '',
            });
            // Set selected city if actor has cityModel
            if (actor.cityModel) {
                setSelectedCity(actor.cityModel);
            } else if (actor.cityId && cities.length > 0) {
                const city = cities.find(c => c.id === actor.cityId);
                if (city) setSelectedCity(city);
            }
            // Existing photos for edit mode
            setExistingPhotos(actor.photos || []);
        } else {
            setFormData({
                fullName: '',
                age: '',
                gender: 'MALE',
                cityId: '',
                phone: '',
                price: '',
                experience: 'NO_EXP',
                socialLinks: '',
                username: '',
            });
            setSelectedCity(null);
            setPhotos([]);
            setExistingPhotos([]);
        }
        setError('');
    }, [actor, open, cities.length]);

    // Helper function to get city name based on current language
    const getCityName = (city: City) => {
        const currentLang = i18n.language;
        if (currentLang === 'ru' && city.nameRu) return city.nameRu;
        if (currentLang === 'en' && city.nameEn) return city.nameEn;
        return city.name; // Fallback to default name (Uzbek)
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setPhotos(Array.from(e.target.files));
        }
    };

    const handleRemovePhoto = (index: number) => {
        setPhotos(photos.filter((_, i) => i !== index));
    };

    const handleDeleteExistingPhoto = async (photoId: number) => {
        if (!actor) return;
        setLoading(true);
        setError('');
        try {
            await api.delete(`/users/${actor.id}/photos/${photoId}`);
            setExistingPhotos(prev => prev.filter(p => p.id !== photoId));
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete photo');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                data.append(key, value);
            });

            photos.forEach((photo) => {
                data.append('photos', photo);
            });

            if (actor) {
                await api.put(`/users/${actor.id}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            } else {
                await api.post('/users', data, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save actor');
        } finally {
            setLoading(false);
        }
    };

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
                    <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
                        {actor ? t('addEditActor.editProfile') : t('addEditActor.newProfile')}
                    </Typography>
                    <IconButton onClick={onClose} disabled={loading} sx={{ bgcolor: 'action.hover' }}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <form onSubmit={handleSubmit}>
                <DialogContent sx={{ p: 3 }}>
                    {error && (
                        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Stack spacing={3}>
                        {/* Section: Personal */}
                        <Box>
                            <Typography variant="overline" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: '0.1em' }}>
                                {t('addEditActor.personalProfile')}
                            </Typography>
                            <Divider sx={{ mt: 0.5, mb: 2.5 }} />
                            
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        required
                                        fullWidth
                                        size="small"
                                        label={t('addEditActor.fullName')}
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        disabled={loading}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        required
                                        fullWidth
                                        size="small"
                                        type="number"
                                        label={t('addEditActor.age')}
                                        name="age"
                                        value={formData.age}
                                        onChange={handleChange}
                                        disabled={loading}
                                        inputProps={{ min: 18, max: 100 }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        required
                                        select
                                        fullWidth
                                        size="small"
                                        label={t('addEditActor.gender')}
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                        disabled={loading}
                                    >
                                        <MenuItem value="MALE">{t('addEditActor.male')}</MenuItem>
                                        <MenuItem value="FEMALE">{t('addEditActor.female')}</MenuItem>
                                    </TextField>
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <Autocomplete
                                        options={cities}
                                        value={selectedCity}
                                        onChange={(_, newValue) => {
                                            setSelectedCity(newValue);
                                            setFormData({ ...formData, cityId: newValue?.id.toString() || '' });
                                        }}
                                        getOptionLabel={(option) => getCityName(option)}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                required
                                                size="small"
                                                label={t('addEditActor.primaryCity')}
                                                disabled={loading}
                                            />
                                        )}
                                        renderOption={(props, option) => (
                                            <li {...props} key={option.id}>
                                                <Box>
                                                    <Typography variant="body2">{getCityName(option)}</Typography>
                                                    {option.region && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            {option.region}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </li>
                                        )}
                                        disabled={loading}
                                    />
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Section: Contact */}
                        <Box>
                            <Typography variant="overline" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: '0.1em' }}>
                                {t('addEditActor.contactAvailability')}
                            </Typography>
                            <Divider sx={{ mt: 0.5, mb: 2.5 }} />
                            
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        required
                                        fullWidth
                                        size="small"
                                        label={t('addEditActor.phoneNumber')}
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        disabled={loading}
                                        placeholder="+998"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label={t('addEditActor.telegramHandle')}
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        disabled={loading}
                                        placeholder="username"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label={t('addEditActor.socialNotes')}
                                        name="socialLinks"
                                        value={formData.socialLinks}
                                        onChange={handleChange}
                                        disabled={loading}
                                        multiline
                                        rows={2}
                                    />
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Section: Professional */}
                        <Box>
                            <Typography variant="overline" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: '0.1em' }}>
                                {t('addEditActor.professionalPricing')}
                            </Typography>
                            <Divider sx={{ mt: 0.5, mb: 2.5 }} />
                            
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        required
                                        fullWidth
                                        size="small"
                                        type="number"
                                        label={t('addEditActor.ratePerVideo')}
                                        name="price"
                                        value={formData.price}
                                        onChange={handleChange}
                                        disabled={loading}
                                        inputProps={{ min: 0 }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        required
                                        select
                                        fullWidth
                                        size="small"
                                        label={t('addEditActor.expertiseLevel')}
                                        name="experience"
                                        value={formData.experience}
                                        onChange={handleChange}
                                        disabled={loading}
                                    >
                                        <MenuItem value="NO_EXP">{t('addEditActor.newFace')}</MenuItem>
                                        <MenuItem value="HAS_EXP">{t('addEditActor.experienced')}</MenuItem>
                                        <MenuItem value="PRO">{t('addEditActor.professional')}</MenuItem>
                                    </TextField>
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Section: Media */}
                        <Box>
                            <Typography variant="overline" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: '0.1em' }}>
                                {t('addEditActor.portfolioMedia')} {!actor && t('addEditActor.minRequired')}
                            </Typography>
                            <Divider sx={{ mt: 0.5, mb: 2.5 }} />
                            
                            {/* Existing photos (edit mode) */}
                            {actor && existingPhotos.length > 0 && (
                                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2, gap: 1 }}>
                                    {existingPhotos.map((photo) => (
                                        <Box
                                            key={photo.id}
                                            sx={{
                                                position: 'relative',
                                                width: 96,
                                                height: 120,
                                                borderRadius: 2,
                                                overflow: 'hidden',
                                                border: '1px solid',
                                                borderColor: 'divider',
                                            }}
                                        >
                                            <img
                                                src={`${import.meta.env.VITE_UPLOADS_URL}/${photo.filePath}`}
                                                alt="Actor"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDeleteExistingPhoto(photo.id)}
                                                sx={{
                                                    position: 'absolute',
                                                    top: 4,
                                                    right: 4,
                                                    bgcolor: 'rgba(0,0,0,0.6)',
                                                    color: 'common.white',
                                                    '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
                                                }}
                                                disabled={loading}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    ))}
                                </Stack>
                            )}

                            <Box 
                                sx={{ 
                                    p: 4, 
                                    border: '2px dashed', 
                                    borderColor: 'divider', 
                                    borderRadius: 3, 
                                    textAlign: 'center',
                                    bgcolor: 'grey.50',
                                    transition: 'all 0.2s',
                                    '&:hover': { bgcolor: 'action.hover', borderColor: 'primary.main' }
                                }}
                            >
                                <input
                                    type="file"
                                    hidden
                                    id="photo-upload"
                                    multiple
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                                <label htmlFor="photo-upload">
                                    <Stack spacing={1} alignItems="center" sx={{ cursor: 'pointer' }}>
                                        <CloudUploadIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{t('addEditActor.clickUpload')}</Typography>
                                        <Typography variant="caption" color="text.secondary">{t('addEditActor.fileTypes')}</Typography>
                                    </Stack>
                                </label>
                            </Box>

                            {photos.length > 0 && (
                                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 2, gap: 1 }}>
                                    {photos.map((photo, index) => (
                                        <Chip
                                            key={index}
                                            label={photo.name}
                                            onDelete={() => handleRemovePhoto(index)}
                                            deleteIcon={<DeleteIcon />}
                                            sx={{ fontWeight: 700, borderRadius: 1.5 }}
                                            color="primary"
                                            variant="outlined"
                                        />
                                    ))}
                                </Stack>
                            )}
                        </Box>
                    </Stack>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={onClose} disabled={loading}>
                        {t('common.cancel')}
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading || (!actor && photos.length === 0)}
                        startIcon={loading && <CircularProgress size={20} />}
                    >
                        {loading ? <CircularProgress size={24} /> : actor ? t('addEditActor.save') : t('addEditActor.add')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
