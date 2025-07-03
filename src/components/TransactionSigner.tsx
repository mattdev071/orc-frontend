'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useWallet } from '@/contexts/WalletContext';
import { formatAddress } from '@/utils/wallet';

interface TransactionData {
  type: 'ORC20_DEPLOY' | 'ORC20_TRANSFER' | 'ORC721_DEPLOY' | 'ORC721_TRANSFER';
  data: any;
  fee: number;
  recipient?: string;
  amount?: string;
  tokenId?: string;
}

interface TransactionSignerProps {
  open: boolean;
  onClose: () => void;
  transaction: TransactionData | null;
  onSign: (signature: string) => Promise<void>;
}

const TransactionSigner: React.FC<TransactionSignerProps> = ({
  open,
  onClose,
  transaction,
  onSign,
}) => {
  const { state, signMessage, signPsbt } = useWallet();
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSign = async () => {
    if (!transaction || !state.connected || !state.address) {
      setError('Wallet not connected');
      return;
    }

    try {
      setSigning(true);
      setError(null);

      // Create message to sign based on transaction type
      const message = createSigningMessage(transaction);
      
      // Sign the message
      const signature = await signMessage(message);
      
      // Call the onSign callback
      await onSign(signature);
      
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign transaction';
      setError(errorMessage);
    } finally {
      setSigning(false);
    }
  };

  const createSigningMessage = (tx: TransactionData): string => {
    const timestamp = Date.now();
    const nonce = Math.random().toString(36).substring(7);
    
    return JSON.stringify({
      type: tx.type,
      data: tx.data,
      timestamp,
      nonce,
      address: state.address,
    });
  };

  const getTransactionTitle = (type: string): string => {
    switch (type) {
      case 'ORC20_DEPLOY':
        return 'Deploy ORC20 Token';
      case 'ORC20_TRANSFER':
        return 'Transfer ORC20 Token';
      case 'ORC721_DEPLOY':
        return 'Deploy ORC721 NFT';
      case 'ORC721_TRANSFER':
        return 'Transfer ORC721 NFT';
      default:
        return 'Sign Transaction';
    }
  };

  const getTransactionDetails = (tx: TransactionData) => {
    const details = [];
    
    if (tx.recipient) {
      details.push({ label: 'Recipient', value: formatAddress(tx.recipient) });
    }
    
    if (tx.amount) {
      details.push({ label: 'Amount', value: tx.amount });
    }
    
    if (tx.tokenId) {
      details.push({ label: 'Token ID', value: tx.tokenId });
    }
    
    details.push({ label: 'Network Fee', value: `${tx.fee} sats` });
    
    return details;
  };

  if (!transaction) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SecurityIcon color="primary" />
          <Typography variant="h6">
            {getTransactionTitle(transaction.type)}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 3 }}>
          <Typography variant="body2">
            You are about to sign a transaction. Please review the details carefully before proceeding.
          </Typography>
        </Alert>

        {/* Transaction Details */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Transaction Details
          </Typography>
          
          <Box sx={{ 
            border: '1px solid', 
            borderColor: 'divider', 
            borderRadius: 1, 
            p: 2,
            bgcolor: 'background.paper'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Chip 
                label={transaction.type.replace('_', ' ')} 
                color="primary" 
                variant="outlined" 
                size="small" 
              />
            </Box>
            
            <List dense sx={{ py: 0 }}>
              {getTransactionDetails(transaction).map((detail, index) => (
                <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          {detail.label}:
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {detail.value}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Wallet Info */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Signing with
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {state.wallet?.name} - {formatAddress(state.address!)}
            </Typography>
            <Chip 
              label={state.network} 
              size="small" 
              color={state.network === 'mainnet' ? 'success' : 'warning'}
              variant="outlined"
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={onClose} 
          variant="outlined"
          disabled={signing}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSign}
          variant="contained"
          disabled={signing || !state.connected}
          startIcon={signing ? <CircularProgress size={16} /> : <SecurityIcon />}
        >
          {signing ? 'Signing...' : 'Sign Transaction'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TransactionSigner;