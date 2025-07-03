'use client';

import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  Card,
  CardContent,
  CardHeader,
  LinearProgress,
  Alert,
  AlertTitle,
  Button
} from '@mui/material';
import axios from 'axios';
import { API_BASE_URL, apiUrl, getApiDataWithFallback } from '@/utils/api';
import { useWallet } from '@/contexts/WalletContext';



interface ProtocolStats {
  total_tokens: number;
  total_nfts: number;
  total_collections: number;
  total_transactions: number;
  total_addresses: number;
}

const Dashboard: React.FC = () => {

  const [protocolStats, setProtocolStats] = useState<ProtocolStats>({
    total_tokens: 0,
    total_nfts: 0,
    total_collections: 0,
    total_transactions: 0,
    total_addresses: 0
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProtocolStats = async () => {
      try {
        // Fetch real statistics with fallback to mock data
        const tokensRes = await getApiDataWithFallback('tokens?per_page=1', 'tokens.list');
        const nftsRes = await getApiDataWithFallback('nfts?per_page=1', 'nfts.list');
        
        // Use try/catch for transactions since the endpoint might not be implemented yet
        let txsTotal = 0;
        try {
          const txsRes = await getApiDataWithFallback('transactions?per_page=1', 'transactions.list');
          txsTotal = txsRes.data?.pagination?.total || 0;
        } catch (txErr) {
          console.warn('Transactions API not available yet, using 0 as fallback');
        }
        
        // Fetch collections count
        let collectionsTotal = 0;
        try {
          const collectionsRes = await getApiDataWithFallback('collections?per_page=1', 'collections.list');
          collectionsTotal = collectionsRes.data?.pagination?.total || 0;
        } catch (collectionsErr) {
          console.warn('Collections API not available yet, using 0 as fallback');
        }
        
        // For addresses, we'll need to implement a proper endpoint in the backend
        // For now, we'll calculate it based on available data
        let uniqueAddresses = 0;
        try {
          // This is a temporary solution - ideally we need a dedicated endpoint
          const tokensResponse = await getApiDataWithFallback('tokens', 'tokens.list');
          const tokens = tokensResponse.data?.tokens || [];
          const addressSet = new Set();
          tokens.forEach((token: any) => {
            if (token.creator) addressSet.add(token.creator);
            if (token.holders) {
              token.holders.forEach((holder: any) => {
                if (holder.address) addressSet.add(holder.address);
              });
            }
          });
          uniqueAddresses = addressSet.size;
        } catch (addressErr) {
          console.warn('Unable to calculate unique addresses, using 0 as fallback');
        }

        setProtocolStats({
          total_tokens: tokensRes.data?.pagination?.total || 0,
          total_nfts: nftsRes.data?.pagination?.total || 0,
          total_collections: collectionsTotal,
          total_transactions: txsTotal,
          total_addresses: uniqueAddresses
        });
        setLoading(false);
      } catch (statsErr) {
        console.error('Error fetching statistics:', statsErr);
        // Keep using current stats if there's an error
        setLoading(false);
      }
    };

    // Initial fetch of protocol stats
    fetchProtocolStats();
    
    // Set up polling for protocol stats every 10 seconds
    const statsInterval = setInterval(fetchProtocolStats, 10000);
    
    // Clean up on component unmount
    return () => {
      clearInterval(statsInterval);
    };
  }, []);

  if (loading) {
    return <LinearProgress />;
  }

  if (error) {
    return (
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography color="error" variant="h6">{error}</Typography>
      </Box>
    );
  }

  const { state, getAvailableWallets, connect } = useWallet();

  const handleWalletAction = () => {
    if (!state.connected) {
      const availableWallets = getAvailableWallets();
      if (availableWallets.length > 0) {
        connect(availableWallets[0]); // Connect to first available wallet
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          ORC Protocol Dashboard
        </Typography>
        <Button 
           variant="contained" 
           onClick={handleWalletAction}
           sx={{ minWidth: 200 }}
           disabled={state.loading}
         >
           {state.loading ? 'Connecting...' : state.connected ? `${state.address?.slice(0, 6)}...${state.address?.slice(-4)}` : 'Connect Wallet'}
         </Button>
      </Box>
      

      {/* Protocol Stats */}
      <Typography variant="h5" gutterBottom>
        Protocol Statistics
      </Typography>
      
      {(protocolStats.total_tokens === 0 && 
        protocolStats.total_nfts === 0 && 
        protocolStats.total_transactions === 0) ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          <AlertTitle>No Data Available</AlertTitle>
          No tokens, NFTs or transactions have been indexed yet. Start the indexer and wait for it to process some blocks to see data here.
        </Alert>
      ) : null}
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 1.5rem)', md: '1 1 calc(33.33% - 2rem)' } }}>
          <Card elevation={2}>
            <CardHeader title="Tokens" />
            <CardContent>
              <Typography variant="h3" align="center" sx={{ mb: 1 }}>
                {protocolStats.total_tokens.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                Total ORC20 tokens indexed
              </Typography>
            </CardContent>
          </Card>
        </Box>
        
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 1.5rem)', md: '1 1 calc(33.33% - 2rem)' } }}>
          <Card elevation={2}>
            <CardHeader title="NFTs" />
            <CardContent>
              <Typography variant="h3" align="center" sx={{ mb: 1 }}>
                {protocolStats.total_nfts.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                Total ORC721 NFTs indexed
              </Typography>
            </CardContent>
          </Card>
        </Box>
        
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 1.5rem)', md: '1 1 calc(33.33% - 2rem)' } }}>
          <Card elevation={2}>
            <CardHeader title="Collections" />
            <CardContent>
              <Typography variant="h3" align="center" sx={{ mb: 1 }}>
                {protocolStats.total_collections.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                Total NFT collections
              </Typography>
            </CardContent>
          </Card>
        </Box>
        
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 1.5rem)', md: '1 1 calc(50% - 1.5rem)' } }}>
          <Card elevation={2}>
            <CardHeader title="Transactions" />
            <CardContent>
              <Typography variant="h3" align="center" sx={{ mb: 1 }}>
                {protocolStats.total_transactions.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                Total ORC transactions
              </Typography>
            </CardContent>
          </Card>
        </Box>
        
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 1.5rem)', md: '1 1 calc(50% - 1.5rem)' } }}>
          <Card elevation={2}>
            <CardHeader title="Addresses" />
            <CardContent>
              <Typography variant="h3" align="center" sx={{ mb: 1 }}>
                {protocolStats.total_addresses.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                Total unique addresses
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;