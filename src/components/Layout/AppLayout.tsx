'use client';

import React from 'react';
import { 
  AppBar, 
  Box, 
  Container, 
  Drawer, 
  IconButton, 
  List, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Toolbar, 
  Typography,
  useMediaQuery,
  useTheme,
  Fab,
  Tooltip
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import TokenIcon from '@mui/icons-material/LocalAtm';
import NFTIcon from '@mui/icons-material/Collections';

import AddIcon from '@mui/icons-material/Add';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import WalletButton from '@/components/WalletButton';

const menuItems = [
  { text: 'Dashboard', href: '/', icon: <HomeIcon /> },
  { text: 'Tokens', href: '/tokens', icon: <TokenIcon /> },
  { text: 'NFTs', href: '/nfts', icon: <NFTIcon /> },
];

const drawerWidth = 240;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Function to handle navigation
  const handleNavigation = (href: string) => {
    router.push(href);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  // Function to determine if we should show the FAB
  const shouldShowCreateButton = () => {
    return pathname === '/tokens' || pathname === '/nfts';
  };

  // Function to handle create button click
  const handleCreateClick = () => {
    if (pathname === '/tokens') {
      router.push('/tokens/create');
    } else if (pathname === '/nfts') {
      router.push('/nfts/create');
    }
  };

  const drawer = (
    <Box sx={{ mt: 2 }}>
      <List>
        {menuItems.map((item) => (
          <ListItemButton 
            key={item.text}
            selected={pathname === item.href}
            onClick={() => handleNavigation(item.href)}
            sx={{
              '&.Mui-selected': {
                backgroundColor: 'rgba(85, 108, 214, 0.08)',
                borderRight: '3px solid #556cd6',
                '&:hover': {
                  backgroundColor: 'rgba(85, 108, 214, 0.12)',
                },
              },
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)'
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            ORC Protocol Explorer
          </Typography>
          <WalletButton />
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        {isMobile && (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile
            }}
            sx={{
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
          >
            {drawer}
          </Drawer>
        )}
        
        {/* Desktop drawer */}
        {!isMobile && (
          <Drawer
            variant="permanent"
            sx={{
              '& .MuiDrawer-paper': { 
                boxSizing: 'border-box', 
                width: drawerWidth,
                borderRight: '1px solid rgba(0, 0, 0, 0.08)',
              },
            }}
            open
          >
            <Toolbar /> {/* This creates space for the AppBar */}
            {drawer}
          </Drawer>
        )}
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          backgroundColor: 'background.default',
          minHeight: '100vh',
          position: 'relative',
        }}
      >
        <Toolbar /> {/* This creates space for the AppBar */}
        <Container maxWidth="xl">
          {children}
        </Container>

        {/* Floating action button for create actions */}
        {shouldShowCreateButton() && (
          <Tooltip title={`Create ${pathname === '/tokens' ? 'Token' : 'NFT'}`}>
            <Fab
              color="primary"
              aria-label="add"
              sx={{ position: 'fixed', bottom: 24, right: 24 }}
              onClick={handleCreateClick}
            >
              <AddIcon />
            </Fab>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
}