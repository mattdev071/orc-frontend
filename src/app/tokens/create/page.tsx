import AppLayout from '@/components/Layout/AppLayout';
import CreateTokenForm from '@/components/CreateTokenForm';
import { Box, Paper, Typography, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';

export default function CreateTokenPage() {
  return (
    <AppLayout>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Typography variant="h3" gutterBottom>
          Create ORC20 Token
        </Typography>
        
        <Typography variant="body1" paragraph>
          This page allows you to create a new ORC20 token on the Bitcoin blockchain using the ORC Protocol.
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, mb: 4 }}>
          <Box sx={{ flex: '1 1 auto' }}>
            <CreateTokenForm />
          </Box>
          
          <Box sx={{ flex: '0 0 350px' }}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                About ORC20 Tokens
              </Typography>
              
              <Typography variant="body2" paragraph>
                ORC20 tokens are fungible tokens built on the ORC Protocol, a layer 2 solution for Bitcoin.
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <InfoIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Token Name" 
                    secondary="Choose a descriptive name for your token that represents its purpose." 
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <InfoIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Symbol" 
                    secondary="A short identifier, typically 3-5 characters (e.g., BTC, ETH)." 
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <InfoIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Decimals" 
                    secondary="Number of decimal places your token supports. Bitcoin uses 8, Ethereum uses 18." 
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <InfoIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Total Supply" 
                    secondary="The total number of tokens that will ever exist." 
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <InfoIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Initial Holder" 
                    secondary="The Bitcoin address that will initially receive all tokens." 
                  />
                </ListItem>
              </List>
              
              <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
                Note: Creating a token will require a Bitcoin transaction and may incur network fees.
              </Typography>
            </Paper>
          </Box>
        </Box>
      </Box>
    </AppLayout>
  );
} 