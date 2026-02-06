import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { 
    Container, Box, Typography, Button, Pagination,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Avatar, Chip, IconButton, ToggleButtonGroup, ToggleButton, useMediaQuery, useTheme,
    Stack, alpha
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import GridViewIcon from '@mui/icons-material/GridView';
import TableRowsIcon from '@mui/icons-material/TableRows';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import api from '../api';
import AppBar from '../components/AppBar';
import FilterPanel from '../components/FilterPanel';
import UserCard from '../components/UserCard';
import UserDetailsDialog from '../components/UserDetailsDialog';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import AddEditActorDialog from '../components/AddEditActorDialog';

export default function DashboardPage() {
    const { t } = useTranslation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState('');
    const [filters, setFilters] = useState({
        gender: '',
        city: '',
        ageMin: '',
        ageMax: '',
        priceMin: '',
        priceMax: '',
        experience: '',
        search: '',
    });

    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [addActorDialogOpen, setAddActorDialogOpen] = useState(false);
    const [editingActor, setEditingActor] = useState<any>(null);

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['users', filters, page],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('limit', '12');
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });
            const res = await api.get(`/users?${params.toString()}`);
            return res.data;
        },
    });

    const users = data?.data || [];
    const pagination = data?.pagination;

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setFilters(prev => ({ ...prev, search: searchInput }));
            setPage(1);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchInput]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        
        if (name === 'search') {
            setSearchInput(value);
        } else {
            setFilters({ ...filters, [name]: value });
            setPage(1);
        }
    };

    const handleClearFilters = () => {
        setSearchInput('');
        setFilters({
            gender: '',
            city: '',
            ageMin: '',
            ageMax: '',
            priceMin: '',
            priceMax: '',
            experience: '',
            search: '',
        });
        setPage(1);
    };

    const handleExport = () => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, value);
        });
        
        const url = `${import.meta.env.VITE_API_URL}/users/export?${params.toString()}`;
        window.open(url, '_blank');
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            <AppBar />
            <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3, md: 4 } }}>
                <Stack 
                    direction={{ xs: 'column', md: 'row' }} 
                    justifyContent="space-between" 
                    alignItems={{ xs: 'stretch', md: 'center' }}
                    spacing={3}
                    sx={{ mb: 4 }}
                >
                    <Box>
                        <Typography variant={isMobile ? 'h4' : 'h3'} sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
                            {t('dashboard.title')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mt: 0.5 }}>
                            {pagination ? t('dashboard.profilesAvailable', { count: pagination.total }) : t('common.loading')}
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={2} sx={{ flexShrink: 0 }}>
                        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 0.5, borderRadius: 2 }}>
                            <ToggleButtonGroup
                                value={viewMode}
                                exclusive
                                onChange={(_, newMode) => newMode && setViewMode(newMode)}
                                size="small"
                                sx={{ '& .MuiToggleButton-root': { border: 'none', px: 2 } }}
                            >
                                <ToggleButton value="grid">
                                    <GridViewIcon fontSize="small" />
                                </ToggleButton>
                                <ToggleButton value="table">
                                    <TableRowsIcon fontSize="small" />
                                </ToggleButton>
                            </ToggleButtonGroup>
                        </Paper>
                        <Button
                            variant="outlined"
                            startIcon={<FileDownloadIcon />}
                            onClick={handleExport}
                            sx={{ borderRadius: 2, fontWeight: 700 }}
                        >
                            {!isMobile && t('dashboard.exportCSV')}
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<PersonAddIcon />}
                            onClick={() => {
                                setEditingActor(null);
                                setAddActorDialogOpen(true);
                            }}
                            sx={{ borderRadius: 2, fontWeight: 700, px: 3 }}
                        >
                            {t('dashboard.addActor')}
                        </Button>
                    </Stack>
                </Stack>

                <FilterPanel
                    filters={{ ...filters, search: searchInput }}
                    onChange={handleChange}
                    onClear={handleClearFilters}
                    onApply={() => refetch()}
                />

                {isLoading ? (
                    <LoadingSkeleton />
                ) : users.length === 0 ? (
                    <EmptyState onClearFilters={handleClearFilters} />
                ) : (
                    <>
                        {viewMode === 'grid' ? (
                            <Box sx={{ 
                                display: 'grid', 
                                gridTemplateColumns: {
                                    xs: '1fr',
                                    sm: 'repeat(2, 1fr)',
                                    md: 'repeat(3, 1fr)',
                                    lg: 'repeat(4, 1fr)'
                                },
                                gap: { xs: 2, sm: 2.5, md: 3 }
                            }}>
                                {users.map((user: any) => (
                                    <UserCard
                                        key={user.id}
                                        user={user}
                                        onClick={() => setSelectedUser(user)}
                                    />
                                ))}
                            </Box>
                        ) : (
                            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                                <Table stickyHeader size="medium">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: 'text.secondary' }}>
                                                {t('actorDetails.fullName')}
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: 'text.secondary' }}>
                                                {t('actorDetails.age')}
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: 'text.secondary' }}>
                                                {t('actorDetails.gender')}
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: 'text.secondary' }}>
                                                {t('actorDetails.city')}
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: 'text.secondary' }}>
                                                {t('actorDetails.price')}
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: 'text.secondary' }}>
                                                {t('actorDetails.experience')}
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: 'text.secondary' }}>
                                                {t('common.edit')}
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {users.map((user: any) => (
                                            <TableRow 
                                                key={user.id} 
                                                hover 
                                                sx={{ 
                                                    cursor: 'pointer',
                                                    '&:last-child td': { border: 0 }
                                                }}
                                            >
                                                <TableCell onClick={() => setSelectedUser(user)} sx={{ py: 1.5 }}>
                                                    <Stack direction="row" spacing={2} alignItems="center">
                                                        <Avatar 
                                                            src={user.photos?.[0]?.filePath ? `${import.meta.env.VITE_UPLOADS_URL}/${user.photos[0].filePath}` : undefined} 
                                                            alt={user.fullName}
                                                            sx={{ width: 40, height: 40, border: '1px solid', borderColor: 'divider' }}
                                                        />
                                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                            {user.fullName}
                                                        </Typography>
                                                    </Stack>
                                                </TableCell>
                                                <TableCell onClick={() => setSelectedUser(user)}>{user.age}</TableCell>
                                                <TableCell onClick={() => setSelectedUser(user)}>
                                                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                                        {user.gender.toLowerCase()}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell onClick={() => setSelectedUser(user)}>{user.city}</TableCell>
                                                <TableCell onClick={() => setSelectedUser(user)}>
                                                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                                        {parseFloat(user.price).toLocaleString()}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell onClick={() => setSelectedUser(user)}>
                                                    <Chip 
                                                        label={
                                                            user.experience === 'NO_EXP' ? t('dashboard.filters.noExperience') :
                                                            user.experience === 'HAS_EXP' ? t('dashboard.filters.hasExperience') :
                                                            t('dashboard.filters.professional')
                                                        }
                                                        size="small"
                                                        sx={{ 
                                                            fontWeight: 700, 
                                                            borderRadius: 1.5,
                                                            bgcolor: (theme) => 
                                                                user.experience === 'PRO' ? alpha(theme.palette.success.main, 0.1) :
                                                                user.experience === 'HAS_EXP' ? alpha(theme.palette.primary.main, 0.1) : 
                                                                alpha(theme.palette.grey[500], 0.1),
                                                            color: (theme) =>
                                                                user.experience === 'PRO' ? theme.palette.success.main :
                                                                user.experience === 'HAS_EXP' ? theme.palette.primary.main : 
                                                                theme.palette.text.secondary
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => {
                                                                setEditingActor(user);
                                                                setAddActorDialogOpen(true);
                                                            }}
                                                            sx={{ color: 'text.secondary' }}
                                                        >
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => setSelectedUser(user)}
                                                            sx={{ color: 'text.secondary' }}
                                                        >
                                                            <VisibilityIcon fontSize="small" />
                                                        </IconButton>
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}

                        {pagination && pagination.totalPages > 1 && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: { xs: 3, md: 4 } }}>
                                <Pagination
                                    count={pagination.totalPages}
                                    page={page}
                                    onChange={(_, value) => {
                                        setPage(value);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    color="primary"
                                    size={isMobile ? 'small' : 'large'}
                                    showFirstButton={!isMobile}
                                    showLastButton={!isMobile}
                                    siblingCount={isMobile ? 0 : 1}
                                />
                            </Box>
                        )}
                    </>
                )}

                <UserDetailsDialog
                    open={!!selectedUser}
                    user={selectedUser}
                    onClose={() => setSelectedUser(null)}
                    onStatusChange={refetch}
                    onEdit={(user) => {
                        setEditingActor(user);
                        setSelectedUser(null);
                        setAddActorDialogOpen(true);
                    }}
                />

                <AddEditActorDialog
                    open={addActorDialogOpen}
                    onClose={() => {
                        setAddActorDialogOpen(false);
                        setEditingActor(null);
                    }}
                    onSuccess={() => {
                        refetch();
                    }}
                    actor={editingActor}
                />
            </Container>
        </Box>
    );
}
