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
  FormControlLabel,
  Switch,
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
  decimals?: string;
  totalSupply?: string;
  initialHolder?: string;
  privateKey?: string;
  description?: string;
  website?: string;
  imageUrl?: string;
}

const CreateTokenForm: React.FC = () => {
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
    decimals: '18',
    totalSupply: '',
    initialHolder: '',
    privateKey: '',
    description: '',
    website: '',
    imageUrl: '',
    mintable: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = e.target;
    setFormValues({
      ...formValues,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear error when field is edited
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors({
        ...formErrors,
        [name]: undefined
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    let isValid = true;

    if (!formValues.name.trim()) {
      errors.name = 'Token name is required';
      isValid = false;
    }

    if (!formValues.symbol.trim()) {
      errors.symbol = 'Token symbol is required';
      isValid = false;
    } else if (formValues.symbol.length > 10) {
      errors.symbol = 'Symbol should be 10 characters or less';
      isValid = false;
    }

    const decimals = parseInt(formValues.decimals);
    if (isNaN(decimals) || decimals < 0 || decimals > 18) {
      errors.decimals = 'Decimals must be between 0 and 18';
      isValid = false;
    }

    const totalSupply = parseInt(formValues.totalSupply);
    if (isNaN(totalSupply) || totalSupply <= 0) {
      errors.totalSupply = 'Total supply must be a positive number';
      isValid = false;
    }

    if (!formValues.initialHolder.trim()) {
      errors.initialHolder = 'Initial holder address is required';
      isValid = false;
    } else if (!/^[13mn2][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(formValues.initialHolder)) {
      errors.initialHolder = 'Please enter a valid Bitcoin address';
      isValid = false;
    }

    if (formValues.website && !/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(formValues.website)) {
      errors.website = 'Please enter a valid URL';
      isValid = false;
    }

    if (formValues.imageUrl && !/^(https?:\/\/)([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(formValues.imageUrl)) {
      errors.imageUrl = 'Please enter a valid URL';
      isValid = false;
    }

    if (!formValues.privateKey.trim()) {
      errors.privateKey = 'Private key is required';
      isValid = false;
    } else if (!/^[5KL9c][1-9A-HJ-NP-Za-km-z]{50,51}$/.test(formValues.privateKey) && !/^[a-fA-F0-9]{64}$/.test(formValues.privateKey)) {
      errors.privateKey = 'Please enter a valid private key (WIF format or 64-character hex)';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  // Fetch UTXOs when wallet is connected
  const fetchUtxos = async () => {
    if (!walletState.address) {
      console.log('No wallet address available');
      return;
    }
    console.log('Fetching UTXOs for wallet address:', walletState.address);
    setFetchingUtxos(true);
    try {
      const fetchedUtxos = await fetchUtxosFromAPI(walletState.address);
      console.log("fetchedUtxos count:", fetchedUtxos.length);
      console.log("fetchedUtxos details:", fetchedUtxos);
      setUtxos(fetchedUtxos);
      
      // Auto-select the first UTXO with sufficient value (at least 1000 sats)
      const suitableUtxo = fetchedUtxos.find(utxo => utxo.value >= 1000);
      console.log("suitableUtxo");
       console.log(suitableUtxo);
      if (suitableUtxo) {
        setSelectedUtxo(suitableUtxo);
      }
      
      // Fetch current fee rate
      const currentFeeRate = await estimateFeeRate();
      console.log("currentFeeRate");
       console.log(currentFeeRate);
      setFeeRate(currentFeeRate);
    } catch (err) {
      console.error('Error fetching UTXOs:', err);
      setError('Failed to fetch UTXOs. Please try again.');
    } finally {
      setFetchingUtxos(false);
    }
  };

  // Auto-fetch UTXOs when wallet connects and set initial holder address
  React.useEffect(() => {
    if (walletState.connected && walletState.address) {
      console.log('Wallet connected, setting initial holder address:', walletState.address);
      setFormValues(prev => ({
        ...prev,
        initialHolder: walletState.address || ''
      }));
      fetchUtxos();
    }
  }, [walletState.connected, walletState.address]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('=== TOKEN CREATION PROCESS STARTED ===');
    console.log('Form values:', formValues);

    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }
    console.log('Form validation passed');

    if (!walletState.connected) {
      console.log('Wallet not connected');
      setError('Please connect your wallet first.');
      return;
    }
    console.log('Wallet connected:', walletState.address);

    if (!selectedUtxo) {
      console.log('No UTXO selected');
      setError('Please select a UTXO for the transaction.');
      return;
    }
    console.log('Selected UTXO:', selectedUtxo);

    setLoading(true);
    setError(null);
    console.log('Starting token creation API call...');

    // Add UTXO validation before proceeding
    console.log('Step 1: Validating UTXO...');
    try {
      const utxoValidationResponse = await fetch(`https://mempool.space/testnet4/api/tx/${selectedUtxo.txid}/outspend/${selectedUtxo.vout}`);
      if (utxoValidationResponse.ok) {
        const utxoStatus = await utxoValidationResponse.json();
        console.log('UTXO validation response:', utxoStatus);
        if (utxoStatus.spent) {
          setError(`Selected UTXO has already been spent. Please refresh UTXOs and select a different one.`);
          setLoading(false);
          return;
        }
      } else if (utxoValidationResponse.status === 404) {
        setError(`Selected UTXO does not exist. Please refresh UTXOs and select a different one.`);
        setLoading(false);
        return;
      }
      console.log('UTXO validation passed - UTXO is unspent');
    } catch (utxoError) {
      console.warn('UTXO validation failed, proceeding anyway:', utxoError);
    }

    try {
      console.log('Step 1: Verifying wallet access...');
      let privateKey = '';
      try {
        // Sign a test message to verify wallet access
        await walletState.wallet?.signMessage('test', walletState.address!);
        console.log('Wallet access verified successfully');
      } catch (err) {
        console.warn('Cannot access private key directly from wallet:', err);
      }

      console.log('Step 2: Preparing API request payload...');
      const payload = {
        name: formValues.name,
        symbol: formValues.symbol,
        decimals: parseInt(formValues.decimals),
        supply: formValues.totalSupply,
        initial_holder: formValues.initialHolder,
        description: formValues.description || undefined,
        website: formValues.website || undefined,
        image: formValues.imageUrl || undefined,
        mintable: formValues.mintable,
        utxo_txid: selectedUtxo.txid,
        utxo_vout: selectedUtxo.vout,
        utxo_amount: selectedUtxo.value,
        fee_rate: feeRate,
        broadcast_transaction: true,
        private_key: formValues.privateKey,
      };
      console.log('API payload:', payload);

      console.log('Step 3: Making API call to create token...');
      // Make API call to create token with wallet integration
      const response = await axios.post(apiUrl('tokens'), payload);
      
       console.log('Step 4: API response received');
       console.log('Response data:', response.data);
      if (response.data.success) {
        console.log('=== TOKEN CREATION COMPLETED SUCCESSFULLY ===');
        console.log('Transaction ID:', response.data.data.txid);
        setSuccess(true);
        setTimeout(() => {
          router.push('/tokens');
        }, 2000);
      } else {
        console.error('API call failed:', response.data);
        throw new Error(response.data.error || 'Failed to create token');
      }
    } catch (err: any) {
      console.error('=== TOKEN CREATION FAILED ===');
      console.error('Error details:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error message:', err.message);

      let errorMessage = err.response?.data?.error || err.message || 'Failed to create token. Please try again.';

      // Handle specific Bitcoin errors
      if (errorMessage.includes('bad-txns-inputs-missingorspent')) {
        errorMessage = 'The selected UTXO has already been spent or does not exist. Please refresh UTXOs and try again with a different UTXO.';
        // Auto-refresh UTXOs when this error occurs
        setTimeout(() => {
          fetchUtxos();
        }, 1000);
      } else if (errorMessage.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds in the selected UTXO. Please select a UTXO with more value.';
      } else if (errorMessage.includes('fee too low')) {
        errorMessage = 'Transaction fee is too low. Try increasing the fee rate.';
      }

      setError(errorMessage);
    } finally {
      console.log('Token creation process finished, setting loading to false');
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Create New ORC20 Token
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
              You need to connect a Bitcoin wallet to create tokens on the ORC Protocol.
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
            <Typography variant="h6" gutterBottom>
              Basic Information
            </Typography>
            
            <TextField
              fullWidth
              required
              label="Token Name"
              name="name"
              value={formValues.name}
              onChange={handleChange}
              helperText={formErrors.name || "The full name of your token (e.g., 'Bitcoin')"}
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
                helperText={formErrors.symbol || "Short identifier for your token (e.g., 'BTC')"}
                error={!!formErrors.symbol}
              />
              
              <TextField
                fullWidth
                required
                type="number"
                label="Decimals"
                name="decimals"
                value={formValues.decimals}
                onChange={handleChange}
                helperText={formErrors.decimals || "Number of decimal places (default: 18)"}
                inputProps={{ min: 0, max: 18 }}
                error={!!formErrors.decimals}
              />
            </Box>
            
            <TextField
              fullWidth
              required
              type="number"
              label="Total Supply"
              name="totalSupply"
              value={formValues.totalSupply}
              onChange={handleChange}
              helperText={formErrors.totalSupply || "The total number of tokens to create"}
              inputProps={{ min: 1 }}
              error={!!formErrors.totalSupply}
            />
            
            <TextField
              fullWidth
              required
              label="Initial Holder Address"
              name="initialHolder"
              value={formValues.initialHolder}
              onChange={handleChange}
              helperText={formErrors.initialHolder || (walletState.connected ? "Automatically set to your connected wallet address" : "Bitcoin address that will initially own all tokens")}
              error={!!formErrors.initialHolder}
              disabled={walletState.connected}
              InputProps={{
                style: {
                  backgroundColor: walletState.connected ? '#f5f5f5' : 'inherit'
                }
              }}
            />
            
            <TextField
              fullWidth
              required
              type="password"
              label="Private Key"
              name="privateKey"
              value={formValues.privateKey}
              onChange={handleChange}
              helperText={formErrors.privateKey || "Private key for signing the transaction (WIF format or 64-character hex)"}
              error={!!formErrors.privateKey}
              placeholder="Enter your private key..."
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={formValues.mintable}
                  onChange={handleChange}
                  name="mintable"
                  color="primary"
                />
              }
              label="Mintable (allows creating additional tokens later)"
            />
            
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Additional Information (Optional)
            </Typography>
            
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              name="description"
              value={formValues.description}
              onChange={handleChange}
              helperText="A brief description of your token and its purpose"
            />
            
            <TextField
              fullWidth
              label="Website"
              name="website"
              value={formValues.website}
              onChange={handleChange}
              helperText={formErrors.website || "Your project's website URL"}
              error={!!formErrors.website}
            />
            
            <TextField
              fullWidth
              label="Image URL"
              name="imageUrl"
              value={formValues.imageUrl}
              onChange={handleChange}
              helperText={formErrors.imageUrl || "URL for your token's logo or image"}
              error={!!formErrors.imageUrl}
            />
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="outlined" 
                sx={{ mr: 2 }}
                onClick={() => router.push('/tokens')}
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
                {loading ? 'Creating...' : 'Create Token'}
              </Button>
              
              {!walletState.connected && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Connect your wallet to create tokens
                </Typography>
              )}
              
              {walletState.connected && !selectedUtxo && (
                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                  No suitable UTXO available for transaction
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
          Token created successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CreateTokenForm;