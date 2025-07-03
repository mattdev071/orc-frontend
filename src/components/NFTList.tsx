'use client';

import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Card,
  CardMedia,
  CardContent,
  CardActionArea,
  Pagination,
  CircularProgress,
  Alert,
  Chip,
  Stack
} from '@mui/material';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { apiUrl } from '@/utils/api';

interface ORC721NFT {
  nft_id: string;
  collection_id: string;
  name: string;
  description?: string;
  owner: string;
  image_url?: string;
  status: string;
}

interface NFTListResponse {
  nfts: ORC721NFT[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
  };
}

const NFTList: React.FC = () => {
  const router = useRouter();
  const [nfts, setNFTs] = useState<ORC721NFT[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  useEffect(() => {
    fetchNFTs(page);
  }, [page]);

  const fetchNFTs = async (page: number) => {
    try {
      setLoading(true);
      const response = await axios.get(apiUrl(`nfts?page=${page}&per_page=12`));
      
      if (response.data.success) {
        const data: NFTListResponse = response.data.data;
        setNFTs(data.nfts);
        
        // Calculate total pages
        const total = data.pagination.total;
        const perPage = data.pagination.per_page;
        setTotalPages(Math.ceil(total / perPage));
      } else {
        setError('Failed to fetch NFTs');
      }
    } catch (err) {
      console.error('Error fetching NFTs:', err);
      setError('Failed to load NFTs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleNFTClick = (nftId: string) => {
    router.push(`/nfts/${nftId}`);
  };

  const getStatusChipColor = (status: string): "success" | "error" | "default" => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'locked':
        return 'error';
      default:
        return 'default';
    }
  };

  // Default image for NFTs without an image URL
  const defaultImage = 'https://via.placeholder.com/300x300?text=No+Image';

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        ORC721 NFTs
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : nfts.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          No NFTs found
        </Alert>
      ) : (
        <>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', mx: -1.5 }}>
            {nfts.map((nft) => (
              <Box 
                key={nft.nft_id}
                sx={{ 
                  width: { 
                    xs: '100%', 
                    sm: '50%', 
                    md: '33.333%', 
                    lg: '25%' 
                  }, 
                  p: 1.5 
                }}
              >
                <Card 
                  elevation={3}
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'scale(1.02)',
                    }
                  }}
                >
                  <CardActionArea onClick={() => handleNFTClick(nft.nft_id)}>
                    <CardMedia
                      component="img"
                      height="200"
                      image={nft.image_url || defaultImage}
                      alt={nft.name}
                      sx={{ objectFit: 'cover' }}
                    />
                    <CardContent>
                      <Typography variant="h6" noWrap>
                        {nft.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        Collection: {nft.collection_id}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        <Chip 
                          label={nft.status} 
                          size="small"
                          color={getStatusChipColor(nft.status)}
                        />
                      </Stack>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Box>
            ))}
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination 
              count={totalPages} 
              page={page} 
              onChange={handlePageChange}
              color="primary"
              size="large"
            />
          </Box>
        </>
      )}
    </Box>
  );
};

export default NFTList; 