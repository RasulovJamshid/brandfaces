import { Box, Typography, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';
import SearchOffIcon from '@mui/icons-material/SearchOff';

interface EmptyStateProps {
  onClearFilters: () => void;
}

export default function EmptyState({ onClearFilters }: EmptyStateProps) {
  const { t } = useTranslation();
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 2,
      }}
    >
      <SearchOffIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
      <Typography variant="h5" gutterBottom color="text.secondary">
        {t('dashboard.noResults')}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {t('dashboard.noResultsMessage')}
      </Typography>
      <Button variant="contained" onClick={onClearFilters}>
        {t('dashboard.clearFilters')}
      </Button>
    </Box>
  );
}
