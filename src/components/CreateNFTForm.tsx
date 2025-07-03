'use client';

import React, { useState } from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  TextField, 
  Button, 
  Alert,
  Snackbar,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Chip
} from '@mui/material';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { apiUrl } from '@/utils/api';
import { useWallet } from '@/contexts/WalletContext';
import { fetchUtxosFromAPI, estimateFeeRate, UTXO } from '@/utils/wallet';
import WalletConnect from './WalletConnect';

interface FormErrors {
  name?: string;
  symbol?: string;
  description?: string;
  initialOwner?: string;
  imageUrl?: string;
  traits?: string;
  website?: string;
}

const CreateNFTForm: React.FC = () => {
  const router = useRouter();
  const { state: walletState } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [utxos, setUtxos] = useState<UTXO[]>([]);
  const [selectedUtxo, setSelectedUtxo] = useState<UTXO | null>(null);
  const [feeRate, setFeeRate] = useState<number>(10);
  const [fetchingUtxos, setFetchingUtxos] = useState(false);
  const [showWalletConnect, setShowWalletConnect] = useState(false);
  
  const [formValues, setFormValues] = useState({
    name: '',
    symbol: '',
    description: '',
    initialOwner: '',
    imageUrl: '',
    mediaType: 'image',
    traits: '',
    website: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name) {
      setFormValues({
        ...formValues,
        [name]: value
      });
      
      // Clear error for this field when user edits it
      if (formErrors[name as keyof FormErrors]) {
        setFormErrors({
          ...formErrors,
          [name]: undefined
        });
      }
    }
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    if (name) {
      setFormValues({
        ...formValues,
        [name]: value
      });
      
      // Clear error for this field when user edits it
      if (formErrors[name as keyof FormErrors]) {
        setFormErrors({
          ...formErrors,
          [name]: undefined
        });
      }
    }
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    let isValid = true;

    // Validate name
    if (!formValues.name.trim()) {
      errors.name = 'Collection name is required';
      isValid = false;
    } else if (formValues.name.length > 50) {
      errors.name = 'Collection name must be less than 50 characters';
      isValid = false;
    }

    // Validate symbol
    if (!formValues.symbol.trim()) {
      errors.symbol = 'Symbol is required';
      isValid = false;
    } else if (formValues.symbol.length > 10) {
      errors.symbol = 'Symbol must be 10 characters or less';
      isValid = false;
    } else if (!/^[A-Z0-9]+$/.test(formValues.symbol)) {
      errors.symbol = 'Symbol must contain only uppercase letters and numbers';
      isValid = false;
    }

    // Validate image URL
    if (!formValues.imageUrl.trim()) {
      errors.imageUrl = 'Image URL is required';
      isValid = false;
    } else if (!/^(https?:\/\/)/.test(formValues.imageUrl)) {
      errors.imageUrl = 'Must be a valid URL starting with http:// or https://';
      isValid = false;
    }

    // Validate traits format if provided
    if (formValues.traits.trim()) {
      try {
        JSON.parse(formValues.traits);
      } catch (e) {
        errors.traits = 'Traits must be in valid JSON format';
        isValid = false;
      }
    }

    // Validate Bitcoin address format
    if (!formValues.initialOwner.trim()) {
      errors.initialOwner = 'Initial owner address is required';
      isValid = false;
    } else if (!/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/.test(formValues.initialOwner)) {
      errors.initialOwner = 'Must be a valid Bitcoin address';
      isValid = false;
    }

    // Validate website URL if provided
    if (formValues.website.trim() && !/^https?:\/\/.+/.test(formValues.website)) {
      errors.website = 'Website must be a valid URL starting with http:// or https://';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  // Fetch UTXOs when wallet is connected
  const fetchUtxos = async () => {
    if (!walletState.connected || !walletState.address) {
      return;
    }

    setFetchingUtxos(true);
    try {
      const fetchedUtxos = await fetchUtxosFromAPI(walletState.address);
      setUtxos(fetchedUtxos);
      
      // Auto-select the first UTXO with sufficient value (at least 1000 sats)
      const suitableUtxo = fetchedUtxos.find(utxo => utxo.value >= 1000);
      if (suitableUtxo) {
        setSelectedUtxo(suitableUtxo);
      }
      
      // Fetch current fee rate
      const currentFeeRate = await estimateFeeRate();
      setFeeRate(currentFeeRate);
    } catch (err) {
      console.error('Error fetching UTXOs:', err);
      setError('Failed to fetch UTXOs. Please try again.');
    } finally {
      setFetchingUtxos(false);
    }
  };

  // Auto-fetch UTXOs when wallet connects
  React.useEffect(() => {
    if (walletState.connected && walletState.address) {
      fetchUtxos();
    }
  }, [walletState.connected, walletState.address]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!walletState.connected) {
      setError('Please connect your wallet first.');
      return;
    }

    if (!selectedUtxo) {
      setError('Please select a UTXO for the transaction.');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      // Parse traits if provided
      let traitsObject = {};
      if (formValues.traits) {
        try {
          traitsObject = JSON.parse(formValues.traits);
        } catch (e) {
          throw new Error('Invalid JSON format for traits');
        }
      }
      
      // Make API call to create NFT collection with wallet integration
      const requestPayload = {
        name: formValues.name,
        symbol: formValues.symbol,
        description: formValues.description || undefined,
        initial_owner: formValues.initialOwner,
        image_url: formValues.imageUrl || undefined,
        media_type: formValues.mediaType,
        traits: Object.keys(traitsObject).length > 0 ? traitsObject : undefined,
        website: formValues.website || undefined,
        // Bitcoin-specific fields
        utxo_txid: selectedUtxo.txid,
        utxo_vout: selectedUtxo.vout,
        utxo_amount: selectedUtxo.value,
        fee_rate: feeRate,
        broadcast_transaction: false // We'll handle signing separately
      };
      
      // Remove undefined values to clean up the payload
      Object.keys(requestPayload).forEach(key => {
        if (requestPayload[key as keyof typeof requestPayload] === undefined) {
          delete requestPayload[key as keyof typeof requestPayload];
        }
      });
      
      const response = await axios.post(apiUrl('nfts'), requestPayload);
      
      if (response.data.success) {
        // If the API returns deploy_params, we need to sign the transaction
        if (response.data.deploy_params) {
          try {
            // Sign the PSBT using the wallet
            const signedPsbt = await walletState.wallet?.signPsbt(response.data.deploy_params.psbt);
            
            // Broadcast the signed transaction
            const broadcastResponse = await axios.post(apiUrl('transactions/broadcast'), {
              signed_psbt: signedPsbt
            });
            
            if (broadcastResponse.data.success) {
              setSuccess(true);
              setTimeout(() => {
                router.push('/nfts');
              }, 2000);
            } else {
              throw new Error('Failed to broadcast transaction');
            }
          } catch (signError) {
            console.error('Error signing transaction:', signError);
            setError('Failed to sign transaction. Please try again.');
          }
        } else {
          setSuccess(true);
          setTimeout(() => {
            router.push('/nfts');
          }, 2000);
        }
      } else {
        throw new Error(response.data.error || 'Failed to create NFT');
      }
    } catch (err: any) {
      console.error('Error creating NFT collection:', err);
      let errorMessage = 'Failed to create NFT collection. Please try again.';
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        if (err.message.includes('Network Error')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Create New ORC721 NFT Collection
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Create a new NFT collection on the ORC Protocol. Once created, you can mint individual NFTs within this collection.
      </Typography>
      
      <Paper elevation={3} sx={{ p: 4, mt: 2, maxWidth: 800, mx: 'auto' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {/* Wallet Connection Section */}
        {!walletState.connected ? (
          <Box sx={{ mb: 4, p: 3, border: '2px dashed #ccc', borderRadius: 2, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Connect Your Wallet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              You need to connect a Bitcoin wallet to create NFTs on the ORC Protocol.
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => setShowWalletConnect(true)}
              sx={{ mt: 1 }}
            >
              Connect Wallet
            </Button>
            <WalletConnect
              open={showWalletConnect}
              onClose={() => setShowWalletConnect(false)}
            />
          </Box>
        ) : (
          <Box sx={{ mb: 4, p: 3, bgcolor: 'success.light', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Wallet Connected
            </Typography>
            <Typography variant="body2">
              Address: {walletState.address}
            </Typography>
            <Typography variant="body2">
              Network: {walletState.network}
            </Typography>
            <Typography variant="body2">
              Balance: {(walletState.balance / 100000000).toFixed(8)} BTC
            </Typography>
          </Box>
        )}
        
        {/* UTXO Selection Section */}
        {walletState.connected && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Transaction Settings
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Button 
                variant="outlined" 
                onClick={fetchUtxos}
                disabled={fetchingUtxos}
                size="small"
              >
                {fetchingUtxos ? <CircularProgress size={20} /> : 'Refresh UTXOs'}
              </Button>
              <Typography variant="body2" color="text.secondary">
                {utxos.length} UTXOs available
              </Typography>
            </Box>
            
            {utxos.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Selected UTXO:
                </Typography>
                {selectedUtxo ? (
                  <Chip 
                    label={`${selectedUtxo.txid.slice(0, 8)}...${selectedUtxo.txid.slice(-8)} (${selectedUtxo.value} sats)`}
                    color="primary"
                    variant="outlined"
                  />
                ) : (
                  <Typography variant="body2" color="error">
                    No suitable UTXO found (need at least 1000 sats)
                  </Typography>
                )}
              </Box>
            )}
            
            <TextField
              label="Fee Rate (sat/vB)"
              type="number"
              value={feeRate}
              onChange={(e) => setFeeRate(parseInt(e.target.value) || 10)}
              size="small"
              sx={{ width: 200 }}
              helperText="Current network fee rate"
            />
          </Box>
        )}
        
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              fullWidth
              required
              label="NFT Collection Name"
              name="name"
              value={formValues.name}
              onChange={handleChange}
              helperText={formErrors.name || "The name of your NFT collection"}
              error={!!formErrors.name}
            />
            
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 3 }}>
              <TextField
                fullWidth
                required
                label="Symbol"
                name="symbol"
                value={formValues.symbol}
                onChange={handleChange}
                helperText={formErrors.symbol || "Short identifier for your NFT collection"}
                error={!!formErrors.symbol}
              />
              
              <FormControl fullWidth required>
                <InputLabel id="media-type-label">Media Type</InputLabel>
                <Select
                  labelId="media-type-label"
                  id="mediaType"
                  name="mediaType"
                  value={formValues.mediaType}
                  label="Media Type"
                  onChange={handleSelectChange}
                >
                  <MenuItem value="image">Image</MenuItem>
                  <MenuItem value="video">Video</MenuItem>
                  <MenuItem value="audio">Audio</MenuItem>
                  <MenuItem value="3d">3D Model</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              name="description"
              value={formValues.description}
              onChange={handleChange}
              helperText="Description of your NFT collection (optional)"
            />
            
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 3 }}>
              <TextField
                fullWidth
                required
                label="Image URL"
                name="imageUrl"
                value={formValues.imageUrl}
                onChange={handleChange}
                helperText={formErrors.imageUrl || "URL to the NFT collection image or media file"}
                error={!!formErrors.imageUrl}
              />
              
              <TextField
                 fullWidth
                 label="Website URL"
                 name="website"
                 value={formValues.website}
                 onChange={handleChange}
                 helperText={formErrors.website || "Optional website URL for your collection"}
                 error={!!formErrors.website}
                 placeholder="https://example.com"
               />
            </Box>
            
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Collection Metadata (JSON)"
              name="traits"
              value={formValues.traits}
              onChange={handleChange}
              helperText={formErrors.traits || 'Optional JSON metadata for the collection, e.g., {"category": "art", "theme": "abstract"}'}
              error={!!formErrors.traits}
              placeholder='{"category": "art", "theme": "nature"}'
            />
            
            <TextField
              fullWidth
              required
              label="Initial Owner Address"
              name="initialOwner"
              value={formValues.initialOwner}
              onChange={handleChange}
              helperText={formErrors.initialOwner || "Bitcoin address that will initially own the NFT"}
              error={!!formErrors.initialOwner}
            />
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', flexDirection: 'column', alignItems: 'flex-end' }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button 
                  variant="outlined" 
                  onClick={() => router.push('/nfts')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                  disabled={loading || !walletState.connected || !selectedUtxo}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {loading ? 'Creating Collection...' : 'Create NFT Collection'}
                </Button>
              </Box>
              
              {!walletState.connected && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Connect your wallet to create NFT collections
                </Typography>
              )}
              
              {walletState.connected && !selectedUtxo && (
                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                  No suitable UTXO available for transaction (minimum 1000 sats required)
                </Typography>
              )}
            </Box>
          </Box>
        </form>
      </Paper>
      
      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          NFT collection created successfully! Redirecting to collections page...
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CreateNFTForm;