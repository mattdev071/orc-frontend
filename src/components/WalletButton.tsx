'use client';

import React, { useState } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  ContentCopy as CopyIcon,
  ExitToApp as DisconnectIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { useWallet } from '@/contexts/WalletContext';
import { formatAddress, formatBalance } from '@/utils/wallet';
import WalletConnect from './WalletConnect';

const WalletButton: React.FC = () => {
  const { state, disconnect, refreshBalance } = useWallet();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (state.connected) {
      setAnchorEl(event.currentTarget);
    } else {
      setShowConnectDialog(true);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      handleClose();
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  const handleCopyAddress = async () => {
    if (state.address) {
      try {
        await navigator.clipboard.writeText(state.address);
        // You could add a toast notification here
        console.log('Address copied to clipboard');
      } catch (error) {
        console.error('Failed to copy address:', error);
      }
    }
    handleClose();
  };

  const handleRefreshBalance = async () => {
    setRefreshing(true);
    try {
      await refreshBalance();
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getNetworkColor = (network: string | null) => {
    switch (network) {
      case 'mainnet':
        return 'success';
      case 'testnet':
        return 'warning';
      case 'regtest':
        return 'info';
      default:
        return 'default';
    }
  };

  if (state.loading) {
    return (
      <Button
        variant="outlined"
        disabled
        startIcon={<CircularProgress size={16} />}
        sx={{ minWidth: 140 }}
      >
        Connecting...
      </Button>
    );
  }

  if (!state.connected) {
    return (
      <>
        <Button
          variant="contained"
          startIcon={<WalletIcon />}
          onClick={handleClick}
          sx={{ minWidth: 140 }}
        >
          Connect Wallet
        </Button>
        <WalletConnect
          open={showConnectDialog}
          onClose={() => setShowConnectDialog(false)}
        />
      </>
    );
  }

  return (
    <>
      <Button
        variant="outlined"
        onClick={handleClick}
        endIcon={<ExpandMoreIcon />}
        sx={{
          minWidth: 200,
          justifyContent: 'space-between',
          textTransform: 'none',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WalletIcon fontSize="small" />
          <Box sx={{ textAlign: 'left' }}>
            <Typography variant="body2" fontWeight="medium">
              {formatAddress(state.address!)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatBalance(state.balance)} BTC
            </Typography>
          </Box>
        </Box>
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={
          {
            sx: {
              minWidth: 280,
              mt: 1,
            },
          }
        }
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* Wallet Info Header */}
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="subtitle2" fontWeight="bold">
              {state.wallet?.name}
            </Typography>
            <Chip
              label={state.network}
              size="small"
              color={getNetworkColor(state.network) as any}
              variant="outlined"
            />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {formatAddress(state.address!, 12)}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2" fontWeight="medium">
              Balance: {formatBalance(state.balance)} BTC
            </Typography>
            <Tooltip title="Refresh balance">
              <IconButton
                size="small"
                onClick={handleRefreshBalance}
                disabled={refreshing}
              >
                {refreshing ? (
                  <CircularProgress size={16} />
                ) : (
                  <RefreshIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Menu Items */}
        <MenuItem onClick={handleCopyAddress}>
          <ListItemIcon>
            <CopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Copy Address" />
        </MenuItem>

        <Divider />

        <MenuItem onClick={handleDisconnect} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DisconnectIcon fontSize="small" sx={{ color: 'error.main' }} />
          </ListItemIcon>
          <ListItemText primary="Disconnect" />
        </MenuItem>
      </Menu>
    </>
  );
};

export default WalletButton;