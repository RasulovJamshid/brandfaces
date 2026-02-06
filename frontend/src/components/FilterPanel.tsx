import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  MenuItem,
  Button,
  Paper,
  Typography,
  Chip,
  Stack,
  Collapse,
  IconButton,
  Grid,
  Autocomplete,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import api from '../api';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

interface FilterPanelProps {
  filters: {
    gender: string;
    city: string;
    ageMin: string;
    ageMax: string;
    priceMin: string;
    priceMax: string;
    experience: string;
    search: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  onApply: () => void;
}

interface City {
  id: number;
  name: string;
  nameEn?: string;
  nameRu?: string;
  region?: string;
}

export default function FilterPanel({ filters, onChange, onClear, onApply }: FilterPanelProps) {
  const { t, i18n } = useTranslation();
  const [expanded, setExpanded] = useState(true);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const activeFiltersCount = Object.values(filters).filter((v) => v !== '').length;

  // Fetch cities
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await api.get('/cities');
        setCities(response.data);
      } catch (err) {
        console.error('Failed to fetch cities:', err);
      }
    };
    fetchCities();
  }, []);

  // Sync selectedCity with filters.city
  useEffect(() => {
    if (filters.city && cities.length > 0) {
      const city = cities.find(c => c.name === filters.city || c.nameEn === filters.city || c.nameRu === filters.city);
      setSelectedCity(city || null);
    } else {
      setSelectedCity(null);
    }
  }, [filters.city, cities]);

  // Helper function to get city name based on current language
  const getCityName = (city: City) => {
    const currentLang = i18n.language;
    if (currentLang === 'ru' && city.nameRu) return city.nameRu;
    if (currentLang === 'en' && city.nameEn) return city.nameEn;
    return city.name; // Fallback to default name (Uzbek)
  };

  return (
    <Paper elevation={2} sx={{ mb: 4, overflow: 'hidden' }}>
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          px: 3,
          py: 2,
          cursor: 'pointer',
          borderBottom: expanded ? '1px solid' : 'none',
          borderColor: 'divider',
          transition: 'all 0.2s',
          '&:hover': { bgcolor: 'action.hover' }
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <FilterListIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t('common.filter')}
          </Typography>
          {activeFiltersCount > 0 && (
            <Chip 
              label={activeFiltersCount} 
              size="small" 
              color="primary" 
              sx={{ height: 20, fontSize: '0.7rem', fontWeight: 800 }} 
            />
          )}
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          {activeFiltersCount > 0 && (
            <Button
              size="small"
              startIcon={<RestartAltIcon />}
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              sx={{ color: 'text.secondary', fontWeight: 600 }}
            >
              {t('common.clear')}
            </Button>
          )}
          <IconButton size="small">
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Stack>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {/* Search */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                size="small"
                label={t('dashboard.filters.searchByName')}
                name="search"
                value={filters.search}
                onChange={onChange}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.disabled', fontSize: 20 }} />,
                }}
              />
            </Grid>

            {/* Row 1: Categorical Filters */}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                select
                fullWidth
                size="small"
                label={t('dashboard.filters.gender')}
                name="gender"
                value={filters.gender}
                onChange={onChange}
              >
                <MenuItem value="">{t('common.filter')}</MenuItem>
                <MenuItem value="MALE">{t('dashboard.filters.male')}</MenuItem>
                <MenuItem value="FEMALE">{t('dashboard.filters.female')}</MenuItem>
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                select
                fullWidth
                size="small"
                label={t('dashboard.filters.experience')}
                name="experience"
                value={filters.experience}
                onChange={onChange}
              >
                <MenuItem value="">{t('common.filter')}</MenuItem>
                <MenuItem value="NO_EXP">{t('dashboard.filters.noExperience')}</MenuItem>
                <MenuItem value="HAS_EXP">{t('dashboard.filters.hasExperience')}</MenuItem>
                <MenuItem value="PRO">{t('dashboard.filters.professional')}</MenuItem>
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 12, md: 4 }}>
              <Autocomplete
                options={cities}
                value={selectedCity}
                onChange={(_, newValue) => {
                  setSelectedCity(newValue);
                  // Trigger onChange with synthetic event
                  const syntheticEvent = {
                    target: {
                      name: 'city',
                      value: newValue ? getCityName(newValue) : '',
                    },
                  } as React.ChangeEvent<HTMLInputElement>;
                  onChange(syntheticEvent);
                }}
                getOptionLabel={(option) => getCityName(option)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    label={t('dashboard.filters.city')}
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
              />
            </Grid>

            {/* Row 2: Ranges */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="overline" sx={{ display: 'block', color: 'text.secondary', mb: 1, fontWeight: 800 }}>
                {t('dashboard.filters.ageRange')}
              </Typography>
              <Stack direction="row" spacing={2}>
                <TextField
                  fullWidth
                  size="small"
                  label={t('dashboard.filters.ageMin')}
                  name="ageMin"
                  type="number"
                  value={filters.ageMin}
                  onChange={onChange}
                />
                <TextField
                  fullWidth
                  size="small"
                  label={t('dashboard.filters.ageMax')}
                  name="ageMax"
                  type="number"
                  value={filters.ageMax}
                  onChange={onChange}
                />
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="overline" sx={{ display: 'block', color: 'text.secondary', mb: 1, fontWeight: 800 }}>
                {t('dashboard.filters.priceRange')}
              </Typography>
              <Stack direction="row" spacing={2}>
                <TextField
                  fullWidth
                  size="small"
                  label={t('dashboard.filters.priceMin')}
                  name="priceMin"
                  type="number"
                  value={filters.priceMin}
                  onChange={onChange}
                />
                <TextField
                  fullWidth
                  size="small"
                  label={t('dashboard.filters.priceMax')}
                  name="priceMax"
                  type="number"
                  value={filters.priceMax}
                  onChange={onChange}
                />
              </Stack>
            </Grid>

            {/* Apply Button */}
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Button
                  variant="contained"
                  onClick={onApply}
                  sx={{ px: 4, py: 1 }}
                >
                  {t('common.apply')}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Collapse>
    </Paper>
  );
}
