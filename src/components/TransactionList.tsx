'use client';

import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
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
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiUrl, getApiDataWithFallback } from '@/utils/api';

interface Transaction {
  tx_id: string;
  block_height: number;
  timestamp: number;
  type: string;
  from: string;
  to: string;
  value: string;
  token_id: string;
}

interface TransactionListResponse {
  success: boolean;
  data?: {
    transactions: Transaction[];
    pagination: {
      total: number;
      per_page: number;
      current_page: number;
      last_page: number;
    }
  };
  error?: string;
}

const TransactionList: React.FC = () => {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalTransactions, setTotalTransactions] = useState(0);

  const fetchTransactions = async (page: number, perPage: number) => {
    setLoading(true);
    try {
      const result = await getApiDataWithFallback(
        `transactions?page=${page + 1}&per_page=${perPage}`,
        'transactions.list'
      );
      
      if (result.success && result.data) {
        setTransactions(result.data.transactions);
        setTotalTransactions(result.data.pagination.total);
      } else {
        throw new Error(result.error || 'Failed to load transactions');
      }
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError(err.message || 'An error occurred while fetching transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(page, rowsPerPage);
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

  const shortenTxId = (txId: string) => {
    return `${txId.substring(0, 10)}...${txId.substring(txId.length - 6)}`;
  };

  const getTypeColor = (type: string): "success" | "warning" | "error" | "info" | "default" => {
    switch (type.toLowerCase()) {
      case 'token_transfer':
        return 'info';
      case 'token_mint':
        return 'success';
      case 'token_burn':
        return 'error';
      case 'nft_transfer':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading && transactions.length === 0) {
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
        <Typography variant="h4">ORC Transactions</Typography>
      </Box>

      <TableContainer component={Paper} elevation={3}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>Transaction ID</TableCell>
              <TableCell>Block</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>From</TableCell>
              <TableCell>To</TableCell>
              <TableCell>Value</TableCell>
              <TableCell>Token</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body1" sx={{ py: 2 }}>
                    No transactions found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((tx) => (
                <TableRow 
                  key={tx.tx_id} 
                  hover 
                  onClick={() => router.push(`/transactions/${tx.tx_id}`)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Link href={`/transactions/${tx.tx_id}`} onClick={(e) => e.stopPropagation()}>
                      {shortenTxId(tx.tx_id)}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/blocks/${tx.block_height}`} onClick={(e) => e.stopPropagation()}>
                      {tx.block_height.toLocaleString()}
                    </Link>
                  </TableCell>
                  <TableCell>{formatDate(tx.timestamp)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={tx.type.replace('_', ' ')}
                      color={getTypeColor(tx.type)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Link href={`/addresses/${tx.from}`} onClick={(e) => e.stopPropagation()}>
                      {shortenAddress(tx.from)}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/addresses/${tx.to}`} onClick={(e) => e.stopPropagation()}>
                      {shortenAddress(tx.to)}
                    </Link>
                  </TableCell>
                  <TableCell>{tx.value}</TableCell>
                  <TableCell>
                    <Link href={`/tokens/${tx.token_id}`} onClick={(e) => e.stopPropagation()}>
                      {shortenTxId(tx.token_id)}
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalTransactions}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Box>
  );
};

export default TransactionList; 