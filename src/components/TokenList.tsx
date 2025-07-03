'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  TablePagination,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import axios from 'axios';
import { apiUrl, getApiDataWithFallback } from '@/utils/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Token {
  id: string;
  name: string;
  symbol: string;
  total_supply: string;
  decimals: number;
  creator: string;
  created_at: number;
  status: string;
}

interface TokenListResponse {
  success: boolean;
  data?: {
    tokens: Token[];
    pagination: {
      total: number;
      per_page: number;
      current_page: number;
      last_page: number;
    }
  };
  error?: string;
}

const TokenList: React.FC = () => {
  const router = useRouter();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalTokens, setTotalTokens] = useState(0);

  const fetchTokens = async (page: number, perPage: number) => {
    setLoading(true);
    try {
      const result = await getApiDataWithFallback(
        `tokens?page=${page + 1}&per_page=${perPage}`,
        'tokens.list'
      );
      
      if (result.success && result.data) {
        setTokens(result.data.tokens);
        setTotalTokens(result.data.pagination.total);
      } else {
        throw new Error(result.error || 'Failed to load tokens');
      }
    } catch (err: any) {
      console.error('Error fetching tokens:', err);
      setError(err.message || 'An error occurred while fetching tokens');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens(page, rowsPerPage);
  }, [page, rowsPerPage]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const shortenAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  if (loading && tokens.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">ORC20 Tokens</Typography>
      </Box>

      <TableContainer component={Paper} elevation={3}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Symbol</TableCell>
              <TableCell>Total Supply</TableCell>
              <TableCell>Creator</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tokens.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body1" sx={{ py: 2 }}>
                    No tokens found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              tokens.map((token) => (
                <TableRow 
                  key={token.id} 
                  hover 
                  onClick={() => router.push(`/tokens/${token.id}`)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell component="th" scope="row">
                    <Typography variant="body1">{token.name}</Typography>
                  </TableCell>
                  <TableCell>{token.symbol}</TableCell>
                  <TableCell>{parseFloat(token.total_supply).toLocaleString()}</TableCell>
                  <TableCell>
                    <Link href={`/addresses/${token.creator}`} onClick={(e) => e.stopPropagation()}>
                      {shortenAddress(token.creator)}
                    </Link>
                  </TableCell>
                  <TableCell>{formatDate(token.created_at)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={token.status}
                      color={token.status === 'active' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalTokens}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Box>
  );
};

export default TokenList; 