import {
  Card,
  CardMedia,
  Typography,
  Box,
  Chip,
  CardActionArea,
  useTheme,
  alpha,
  Stack,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { useTranslation } from 'react-i18next';

const BASE_URL = import.meta.env.VITE_UPLOADS_URL || 'http://localhost:3000/uploads';

interface UserCardProps {
  user: {
    id: number;
    fullName: string;
    age: number;
    gender: string;
    city: string;
    price: string;
    experience: string;
    photos: { filePath: string }[];
  };
  onClick: () => void;
}

export default function UserCard({ user, onClick }: UserCardProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  const getExperienceLabel = (exp: string) => {
    switch (exp) {
      case 'NO_EXP': return t('addEditActor.newFace');
      case 'HAS_EXP': return t('addEditActor.experienced');
      case 'PRO': return t('addEditActor.professional');
      default: return exp;
    }
  };

  return (
    <Card
      elevation={0}
      sx={{
        height: 400,
        position: 'relative',
        borderRadius: 3,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          borderColor: 'primary.light',
          '& .MuiCardMedia-root': {
            transform: 'scale(1.04)',
          },
          '& .overlay': {
            opacity: 0.9,
          },
        },
      }}
    >
      <CardActionArea
        onClick={onClick}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-end',
        }}
      >
        <CardMedia
          component="img"
          image={
            user.photos[0]
              ? `${BASE_URL}/${user.photos[0].filePath}`
              : 'https://via.placeholder.com/400x600?text=No+Photo'
          }
          alt={user.fullName}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.6s ease',
          }}
        />

        {/* Floating Badge */}
        <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 2 }}>
          <Chip
            label={getExperienceLabel(user.experience)}
            size="small"
            sx={{
              bgcolor: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(8px)',
              fontWeight: 800,
              color: 'white',
              fontSize: '0.65rem',
              height: 20,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              border: '1px solid rgba(255,255,255,0.2)'
            }}
          />
        </Box>

        {/* Gradient Overlay */}
        <Box
          className="overlay"
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '60%',
            background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
            transition: 'opacity 0.3s ease',
            zIndex: 1,
          }}
        />

        {/* Content */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 2,
            p: 3,
            width: '100%',
            color: 'white',
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.75, letterSpacing: '-0.01em' }}>
            {user.fullName}
          </Typography>

          <Stack direction="row" spacing={2} sx={{ mb: 2, opacity: 0.8 }}>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <CalendarMonthIcon sx={{ fontSize: 14 }} />
              <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                {user.age} Y.O
              </Typography>
            </Stack>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <LocationOnIcon sx={{ fontSize: 14 }} />
              <Typography variant="caption" noWrap sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                {user.city}
              </Typography>
            </Stack>
          </Stack>

          {/* Price */}
          <Box 
            sx={{ 
              display: 'inline-flex', 
              px: 1.5, 
              py: 0.5, 
              borderRadius: 1, 
              bgcolor: alpha(theme.palette.primary.main, 0.2),
              border: '1px solid',
              borderColor: alpha(theme.palette.primary.main, 0.3),
              backdropFilter: 'blur(4px)'
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.primary.light,
                fontWeight: 900,
                letterSpacing: '0.05em'
              }}
            >
              {parseFloat(user.price).toLocaleString()} UZS
            </Typography>
          </Box>
        </Box>
      </CardActionArea>
    </Card>
  );
}
