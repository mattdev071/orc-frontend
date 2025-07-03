import AppLayout from '@/components/Layout/AppLayout';
import CreateNFTForm from '@/components/CreateNFTForm';
import { Box, Paper, Typography, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';

export default function CreateNFTPage() {
  return (
    <AppLayout>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Typography variant="h3" gutterBottom>
          Create ORC721 NFT
        </Typography>
        
        <Typography variant="body1" paragraph>
          This page allows you to create a new ORC721 NFT (Non-Fungible Token) on the Bitcoin blockchain using the ORC Protocol.
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, mb: 4 }}>
          <Box sx={{ flex: '1 1 auto' }}>
            <CreateNFTForm />
          </Box>
          
          <Box sx={{ flex: '0 0 350px' }}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                About ORC721 NFTs
              </Typography>
              
              <Typography variant="body2" paragraph>
                ORC721 NFTs are non-fungible tokens built on the ORC Protocol, allowing for unique digital assets on Bitcoin.
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <InfoIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Collection Name" 
                    secondary="The name of your NFT collection or project." 
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <InfoIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Symbol" 
                    secondary="A short identifier for your NFT collection (e.g., BAYC, PUNK)." 
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <InfoIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Media Type" 
                    secondary="The type of media your NFT represents (image, video, audio, or 3D model)." 
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <InfoIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Description" 
                    secondary="A detailed description of your NFT collection." 
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <InfoIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Image URL" 
                    secondary="Link to the image or media file for your NFT." 
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <InfoIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Traits" 
                    secondary="JSON format of attributes that define the properties of your NFT." 
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <InfoIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Initial Owner" 
                    secondary="The Bitcoin address that will initially own this NFT." 
                  />
                </ListItem>
              </List>
              
              <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
                Note: Creating an NFT will require a Bitcoin transaction and may incur network fees.
              </Typography>
            </Paper>
          </Box>
        </Box>
      </Box>
    </AppLayout>
  );
} 