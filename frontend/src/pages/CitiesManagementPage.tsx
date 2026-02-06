import { useState, useEffect } from 'react';
import {
    Container, Box, Typography, Button, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Switch, FormControlLabel,
    Alert, CircularProgress, Chip, Stack, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTranslation } from 'react-i18next';
import api from '../api';
import AppBar from '../components/AppBar';

interface City {
    id: number;
    name: string;
    nameEn?: string;
    nameRu?: string;
    region?: string;
    country: string;
    isActive: boolean;
    sortOrder: number;
    _count?: {
        users: number;
    };
}

export default function CitiesManagementPage() {
    const { t } = useTranslation();
    const [cities, setCities] = useState<City[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingCity, setEditingCity] = useState<City | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        nameEn: '',
        nameRu: '',
        region: '',
        country: 'Uzbekistan',
        isActive: true,
        sortOrder: 0,
    });

    useEffect(() => {
        fetchCities();
    }, []);

    const fetchCities = async () => {
        try {
            setLoading(true);
            const response = await api.get('/cities?includeInactive=true');
            setCities(response.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load cities');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (city?: City) => {
        if (city) {
            setEditingCity(city);
            setFormData({
                name: city.name,
                nameEn: city.nameEn || '',
                nameRu: city.nameRu || '',
                region: city.region || '',
                country: city.country,
                isActive: city.isActive,
                sortOrder: city.sortOrder,
            });
        } else {
            setEditingCity(null);
            setFormData({
                name: '',
                nameEn: '',
                nameRu: '',
                region: '',
                country: 'Uzbekistan',
                isActive: true,
                sortOrder: 0,
            });
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingCity(null);
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            if (editingCity) {
                await api.put(`/cities/${editingCity.id}`, formData);
            } else {
                await api.post('/cities', formData);
            }
            await fetchCities();
            handleCloseDialog();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save city');
        }
    };

    const handleToggleActive = async (city: City) => {
        try {
            if (city.isActive) {
                await api.put(`/cities/${city.id}/deactivate`);
            } else {
                await api.put(`/cities/${city.id}`, { isActive: true });
            }
            await fetchCities();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update city');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <>
            <AppBar />
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h4" fontWeight={800}>
                        {t('cities.title', 'Cities Management')}
                    </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                    sx={{ borderRadius: 2, fontWeight: 700 }}
                >
                    {t('cities.addCity', 'Add City')}
                </Button>
            </Stack>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'grey.50' }}>
                            <TableCell sx={{ fontWeight: 700 }}>
                                {t('cities.name', 'Name')}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>
                                {t('cities.nameEn', 'English Name')}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>
                                {t('cities.nameRu', 'Russian Name')}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>
                                {t('cities.region', 'Region')}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>
                                {t('cities.users', 'Users')}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>
                                {t('cities.status', 'Status')}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>
                                {t('cities.sortOrder', 'Order')}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>
                                {t('cities.actions', 'Actions')}
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {cities.map((city) => (
                            <TableRow key={city.id} hover>
                                <TableCell>{city.name}</TableCell>
                                <TableCell>{city.nameEn || '-'}</TableCell>
                                <TableCell>{city.nameRu || '-'}</TableCell>
                                <TableCell>{city.region || '-'}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={city._count?.users || 0}
                                        size="small"
                                        color={city._count?.users ? 'primary' : 'default'}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={city.isActive ? t('cities.active', 'Active') : t('cities.inactive', 'Inactive')}
                                        size="small"
                                        color={city.isActive ? 'success' : 'default'}
                                    />
                                </TableCell>
                                <TableCell>{city.sortOrder}</TableCell>
                                <TableCell align="right">
                                    <Tooltip title={t('cities.edit', 'Edit')}>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleOpenDialog(city)}
                                            color="primary"
                                        >
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title={city.isActive ? t('cities.deactivate', 'Deactivate') : t('cities.activate', 'Activate')}>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleToggleActive(city)}
                                            color={city.isActive ? 'warning' : 'success'}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Add/Edit Dialog */}
            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <form onSubmit={handleSubmit}>
                    <DialogTitle>
                        {editingCity ? t('cities.editCity', 'Edit City') : t('cities.addCity', 'Add City')}
                    </DialogTitle>
                    <DialogContent>
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            {error && <Alert severity="error">{error}</Alert>}
                            
                            <TextField
                                required
                                fullWidth
                                label={t('cities.name', 'Name')}
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                helperText={t('cities.nameHelp', 'Primary display name')}
                            />
                            
                            <TextField
                                fullWidth
                                label={t('cities.nameEn', 'English Name')}
                                name="nameEn"
                                value={formData.nameEn}
                                onChange={handleChange}
                            />
                            
                            <TextField
                                fullWidth
                                label={t('cities.nameRu', 'Russian Name')}
                                name="nameRu"
                                value={formData.nameRu}
                                onChange={handleChange}
                            />
                            
                            <TextField
                                fullWidth
                                label={t('cities.region', 'Region')}
                                name="region"
                                value={formData.region}
                                onChange={handleChange}
                                helperText={t('cities.regionHelp', 'Oblast or region name')}
                            />
                            
                            <TextField
                                fullWidth
                                label={t('cities.country', 'Country')}
                                name="country"
                                value={formData.country}
                                onChange={handleChange}
                            />
                            
                            <TextField
                                fullWidth
                                type="number"
                                label={t('cities.sortOrder', 'Sort Order')}
                                name="sortOrder"
                                value={formData.sortOrder}
                                onChange={handleChange}
                                helperText={t('cities.sortOrderHelp', 'Lower numbers appear first')}
                                inputProps={{ min: 0 }}
                            />
                            
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.isActive}
                                        onChange={handleChange}
                                        name="isActive"
                                    />
                                }
                                label={t('cities.isActive', 'Active')}
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>
                            {t('common.cancel', 'Cancel')}
                        </Button>
                        <Button type="submit" variant="contained">
                            {t('common.save', 'Save')}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
            </Container>
        </>
    );
}
