import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Container, Box, Typography, Button, Paper, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, IconButton,
    Chip, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, MenuItem, Alert, CircularProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useTranslation } from 'react-i18next';
import api from '../api';
import AppBar from '../components/AppBar';

export default function AdminManagementPage() {
    const { t } = useTranslation();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState<any>(null);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        role: 'ADMIN',
    });
    const [error, setError] = useState('');

    const queryClient = useQueryClient();

    const { data: admins, isLoading } = useQuery({
        queryKey: ['admins'],
        queryFn: async () => {
            const res = await api.get('/admin');
            return res.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => api.post('/admin', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admins'] });
            handleCloseDialog();
        },
        onError: (err: any) => {
            setError(err.response?.data?.message || 'Failed to create admin');
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: any) => api.patch(`/admin/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admins'] });
            handleCloseDialog();
        },
        onError: (err: any) => {
            setError(err.response?.data?.message || 'Failed to update admin');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => api.delete(`/admin/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admins'] });
            setDeleteDialogOpen(false);
            setSelectedAdmin(null);
        },
        onError: (err: any) => {
            setError(err.response?.data?.message || 'Failed to delete admin');
        },
    });

    const handleOpenDialog = (admin?: any) => {
        if (admin) {
            setSelectedAdmin(admin);
            setFormData({
                email: admin.email,
                password: '',
                name: admin.name,
                role: admin.role,
            });
        } else {
            setSelectedAdmin(null);
            setFormData({
                email: '',
                password: '',
                name: '',
                role: 'ADMIN',
            });
        }
        setError('');
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedAdmin(null);
        setError('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const data: any = {
            email: formData.email,
            name: formData.name,
            role: formData.role,
        };

        if (formData.password) {
            data.password = formData.password;
        }

        if (selectedAdmin) {
            updateMutation.mutate({ id: selectedAdmin.id, data });
        } else {
            if (!formData.password) {
                setError('Password is required for new admin');
                return;
            }
            createMutation.mutate(data);
        }
    };

    const handleDelete = () => {
        if (selectedAdmin) {
            deleteMutation.mutate(selectedAdmin.id);
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            <AppBar />
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                            {t('adminManagement.title')}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            {t('adminManagement.subtitle', 'Manage dashboard users and permissions')}
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<PersonAddIcon />}
                        onClick={() => handleOpenDialog()}
                        size="large"
                    >
                        {t('adminManagement.addAdmin')}
                    </Button>
                </Box>

                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <TableContainer component={Paper} elevation={2}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell><strong>{t('common.name')}</strong></TableCell>
                                    <TableCell><strong>{t('common.email')}</strong></TableCell>
                                    <TableCell><strong>{t('adminManagement.role')}</strong></TableCell>
                                    <TableCell><strong>{t('adminManagement.status', 'Status')}</strong></TableCell>
                                    <TableCell><strong>{t('adminManagement.created', 'Created')}</strong></TableCell>
                                    <TableCell align="right"><strong>{t('adminManagement.actions', 'Actions')}</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {admins?.map((admin: any) => (
                                    <TableRow key={admin.id} hover>
                                        <TableCell>{admin.name}</TableCell>
                                        <TableCell>{admin.email}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={admin.role === 'SUPER_ADMIN' ? t('adminManagement.superAdmin') : t('adminManagement.admin')}
                                                color={admin.role === 'SUPER_ADMIN' ? 'secondary' : 'primary'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={admin.isActive ? t('adminManagement.active', 'Active') : t('adminManagement.inactive', 'Inactive')}
                                                color={admin.isActive ? 'success' : 'default'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {new Date(admin.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleOpenDialog(admin)}
                                                color="primary"
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    setSelectedAdmin(admin);
                                                    setDeleteDialogOpen(true);
                                                }}
                                                color="error"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {/* Add/Edit Dialog */}
                <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                    <form onSubmit={handleSubmit}>
                        <DialogTitle>
                            {selectedAdmin ? t('adminManagement.editAdmin', 'Edit Admin') : t('adminManagement.addNewAdmin', 'Add New Admin')}
                        </DialogTitle>
                        <DialogContent>
                            {error && (
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    {error}
                                </Alert>
                            )}

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                                <TextField
                                    required
                                    fullWidth
                                    label={t('common.name')}
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />

                                <TextField
                                    required
                                    fullWidth
                                    type="email"
                                    label={t('common.email')}
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />

                                <TextField
                                    required={!selectedAdmin}
                                    fullWidth
                                    type="password"
                                    label={selectedAdmin ? t('adminManagement.newPassword', 'New Password (leave empty to keep current)') : t('common.password')}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />

                                <TextField
                                    required
                                    select
                                    fullWidth
                                    label={t('adminManagement.role')}
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <MenuItem value="ADMIN">{t('adminManagement.admin')}</MenuItem>
                                    <MenuItem value="SUPER_ADMIN">{t('adminManagement.superAdmin')}</MenuItem>
                                </TextField>
                            </Box>
                        </DialogContent>
                        <DialogActions sx={{ px: 3, pb: 3 }}>
                            <Button onClick={handleCloseDialog}>{t('common.cancel')}</Button>
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={createMutation.isPending || updateMutation.isPending}
                            >
                                {selectedAdmin ? t('adminManagement.update', 'Update') : t('adminManagement.create', 'Create')}
                            </Button>
                        </DialogActions>
                    </form>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                    <DialogTitle>{t('adminManagement.confirmDelete', 'Confirm Delete')}</DialogTitle>
                    <DialogContent>
                        <Typography>
                            {t('adminManagement.deleteConfirmMessage', 'Are you sure you want to delete admin')} <strong>{selectedAdmin?.name}</strong>?
                            {t('adminManagement.deleteWarning', 'This action cannot be undone.')}
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeleteDialogOpen(false)}>{t('common.cancel')}</Button>
                        <Button
                            onClick={handleDelete}
                            color="error"
                            variant="contained"
                            disabled={deleteMutation.isPending}
                        >
                            {t('common.delete')}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </Box>
    );
}
