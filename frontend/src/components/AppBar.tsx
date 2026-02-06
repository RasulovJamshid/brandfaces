import {
  AppBar as MuiAppBar,
  Toolbar,
  Typography,
  Box,
  Tabs,
  Tab,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Drawer,
  List,
  ListItemButton,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LogoutIcon from '@mui/icons-material/Logout';
import MovieFilterIcon from '@mui/icons-material/MovieFilter';
import PeopleIcon from '@mui/icons-material/People';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import MenuIcon from '@mui/icons-material/Menu';
import BarChartIcon from '@mui/icons-material/BarChart';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import TuneIcon from '@mui/icons-material/Tune';
import LanguageSwitcher from './LanguageSwitcher';

export default function AppBar() {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfileSettings = () => {
    navigate('/profile-settings');
    handleMenuClose();
  };

  const currentTab = 
    location.pathname === '/admin-management' ? 1 :
    location.pathname === '/cities' ? 2 :
    location.pathname === '/stats' ? 3 :
    location.pathname === '/system-settings' ? 4 : 0;

  return (
    <>
    <MuiAppBar position="sticky" elevation={2} sx={{ top: 0, zIndex: 1100 }}>
      <Toolbar>
        {isMobile && (
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setDrawerOpen(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: { xs: 'auto', md: 4 } }}>
          <MovieFilterIcon sx={{ fontSize: 32 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {t('login.title')}
          </Typography>
        </Box>
        
        {!isMobile && (
          <Tabs
            value={currentTab}
            textColor="inherit"
            indicatorColor="secondary"
            sx={{ flexGrow: 1 }}
          >
            <Tab
              icon={<PeopleIcon />}
              iconPosition="start"
              label={t('navigation.dashboard')}
              onClick={() => navigate('/dashboard')}
            />
            <Tab
              icon={<AdminPanelSettingsIcon />}
              iconPosition="start"
              label={t('navigation.adminManagement')}
              onClick={() => navigate('/admin-management')}
            />
            <Tab
              icon={<LocationCityIcon />}
              iconPosition="start"
              label={t('navigation.cities', 'Cities')}
              onClick={() => navigate('/cities')}
            />
            <Tab
              icon={<BarChartIcon />}
              iconPosition="start"
              label={t('navigation.stats')}
              onClick={() => navigate('/stats')}
            />
            <Tab
              icon={<TuneIcon />}
              iconPosition="start"
              label={t('navigation.systemSettings', 'System')}
              onClick={() => navigate('/system-settings')}
            />
          </Tabs>
        )}

        <Box sx={{ flexGrow: isMobile ? 0 : 1 }} />

        <LanguageSwitcher />

        <IconButton
          color="inherit"
          onClick={handleMenuOpen}
          sx={{ ml: 2 }}
        >
          <AccountCircleIcon sx={{ fontSize: 32 }} />
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem onClick={handleProfileSettings}>
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t('navigation.profileSettings')}</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t('common.logout')}</ListItemText>
          </MenuItem>
        </Menu>
      </Toolbar>
    </MuiAppBar>

    {/* Mobile Drawer */}
    <Drawer
      anchor="left"
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
    >
      <Box sx={{ width: 250, pt: 2 }}>
        <Box sx={{ px: 2, pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MovieFilterIcon color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {t('login.title')}
            </Typography>
          </Box>
        </Box>
        <Divider />
        <List>
          <ListItemButton
            selected={location.pathname === '/dashboard'}
            onClick={() => {
              navigate('/dashboard');
              setDrawerOpen(false);
            }}
          >
            <ListItemIcon>
              <PeopleIcon />
            </ListItemIcon>
            <ListItemText primary={t('navigation.dashboard')} />
          </ListItemButton>
          <ListItemButton
            selected={location.pathname === '/admin-management'}
            onClick={() => {
              navigate('/admin-management');
              setDrawerOpen(false);
            }}
          >
            <ListItemIcon>
              <AdminPanelSettingsIcon />
            </ListItemIcon>
            <ListItemText primary={t('navigation.adminManagement')} />
          </ListItemButton>
          <ListItemButton
            selected={location.pathname === '/cities'}
            onClick={() => {
              navigate('/cities');
              setDrawerOpen(false);
            }}
          >
            <ListItemIcon>
              <LocationCityIcon />
            </ListItemIcon>
            <ListItemText primary={t('navigation.cities', 'Cities')} />
          </ListItemButton>
          <ListItemButton
            selected={location.pathname === '/stats'}
            onClick={() => {
              navigate('/stats');
              setDrawerOpen(false);
            }}
          >
            <ListItemIcon>
              <BarChartIcon />
            </ListItemIcon>
            <ListItemText primary={t('navigation.stats')} />
          </ListItemButton>
          <ListItemButton
            selected={location.pathname === '/system-settings'}
            onClick={() => {
              navigate('/system-settings');
              setDrawerOpen(false);
            }}
          >
            <ListItemIcon>
              <TuneIcon />
            </ListItemIcon>
            <ListItemText primary={t('navigation.systemSettings', 'System')} />
          </ListItemButton>
        </List>
        <Divider />
        <List>
          <ListItemButton
            onClick={() => {
              navigate('/profile-settings');
              setDrawerOpen(false);
            }}
          >
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary={t('navigation.profileSettings')} />
          </ListItemButton>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary={t('common.logout')} />
          </ListItemButton>
        </List>
      </Box>
    </Drawer>
    </>
  );
}
