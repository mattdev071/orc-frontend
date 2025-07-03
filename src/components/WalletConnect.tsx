'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useWallet } from '@/contexts/WalletContext';
import { BitcoinWallet } from '@/utils/wallet';

interface WalletConnectProps {
  open: boolean;
  onClose: () => void;
}

const WalletConnect: React.FC<WalletConnectProps> = ({ open, onClose }) => {
  const { connect, state, getAvailableWallets } = useWallet();
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);

  const availableWallets = getAvailableWallets();

  const handleWalletConnect = async (wallet: BitcoinWallet) => {
    try {
      setConnectingWallet(wallet.name);
      await connect(wallet);
      onClose();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setConnectingWallet(null);
    }
  };

  const getWalletIcon = (walletName: string) => {
    const icons: { [key: string]: string } = {
      'Unisat': '/wallets/unisat.svg',
      'OKX': '/wallets/okx.svg',
    };
    return icons[walletName] || '/wallets/default.svg';
  };

  const getInstallUrl = (walletName: string) => {
    const urls: { [key: string]: string } = {
      'Unisat': 'https://unisat.io/',
      'OKX': 'https://www.okx.com/web3',
    };
    return urls[walletName];
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          minHeight: 400,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WalletIcon color="primary" />
          <Typography variant="h6">Connect Bitcoin Wallet</Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 0 }}>
        {state.error && (
          <Box sx={{ px: 3, mb: 2 }}>
            <Alert severity="error" onClose={() => {}}>
              {state.error}
            </Alert>
          </Box>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ px: 3, mb: 3 }}>
          Connect your Bitcoin wallet to interact with ORC Protocol tokens and NFTs.
        </Typography>

        {availableWallets.length > 0 ? (
          <List sx={{ px: 1 }}>
            {availableWallets.map((wallet) => (
              <ListItem key={wallet.name} sx={{ px: 2 }}>
                <ListItemButton
                  onClick={() => handleWalletConnect(wallet)}
                  disabled={connectingWallet === wallet.name || state.loading}
                  sx={{
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    mb: 1,
                    '&:hover': {
                      borderColor: 'primary.main',
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <ListItemIcon>
                    <Avatar 
                      src={getWalletIcon(wallet.name)}
                      sx={{ 
                        bgcolor: 'transparent',
                        width: 40,
                        height: 40,
                      }}
                    >
                      💼
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {wallet.name}
                        </Typography>
                        <Chip label="Detected" size="small" color="success" variant="outlined" />
                      </Box>
                    }
                    secondary="Bitcoin wallet extension detected"
                  />
                  {connectingWallet === wallet.name && (
                    <CircularProgress size={20} sx={{ ml: 1 }} />
                  )}
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        ) : (
          <Box sx={{ px: 3 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              No Bitcoin wallets detected. Please install a supported wallet extension.
            </Alert>

            <Typography variant="subtitle2" gutterBottom>
              Supported Wallets:
            </Typography>

            <List>
              {['Unisat', 'OKX'].map((walletName) => (
                <ListItem key={walletName} sx={{ px: 0 }}>
                  <ListItemButton
                    component="a"
                    href={getInstallUrl(walletName)}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      mb: 1,
                      '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <ListItemIcon>
                      <Avatar 
                        src={getWalletIcon(walletName)}
                        sx={{ 
                          bgcolor: 'transparent',
                          width: 40,
                          height: 40,
                        }}
                      >
                        💼
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1" fontWeight="medium">
                            {walletName}
                          </Typography>
                          <Chip label="Install" size="small" color="primary" variant="outlined" />
                        </Box>
                      }
                      secondary="Click to install wallet extension"
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        <Box sx={{ px: 3, mt: 3 }}>
          <Typography variant="caption" color="text.secondary">
            By connecting your wallet, you agree to our terms of service and privacy policy.
            Your wallet will be used to sign transactions and interact with the ORC Protocol.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WalletConnect;