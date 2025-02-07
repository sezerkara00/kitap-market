import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Box,
  IconButton,
  Card,
  CardMedia,
  TextField,
  Grid,
  Link,
  Divider,
  Snackbar,
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import axios from '../utils/axiosConfig';
import { useNavigate } from 'react-router-dom';
import { Link as RouterLink } from 'react-router-dom';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await axios.get('/api/cart');
      setCartItems(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Sepet alınamadı:', error);
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    try {
      await axios.put(`/api/cart/${itemId}`, { 
        quantity: newQuantity 
      });
      fetchCart();
    } catch (error) {
      console.error('Miktar güncellenemedi:', error);
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      await axios.delete(`/api/cart/${itemId}`);
      fetchCart();
    } catch (error) {
      console.error('Ürün sepetten silinemedi:', error);
    }
  };

  const handleCheckout = async () => {
    try {
      await axios.post('/api/orders');
      navigate('/orders');
    } catch (error) {
      console.error('Sipariş oluşturulamadı:', error);
      setSnackbar({
        open: true,
        message: 'Sipariş oluşturulurken bir hata oluştu',
        severity: 'error'
      });
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.book.price * item.quantity), 0);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography>Yükleniyor...</Typography>
      </Container>
    );
  }

  if (cartItems.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6">Sepetiniz boş</Typography>
          <Button 
            component={RouterLink} 
            to="/books" 
            variant="contained" 
            sx={{ mt: 2 }}
          >
            Alışverişe Başla
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Sepetim ({cartItems.length} ürün)
      </Typography>

      {cartItems.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Sepetiniz boş
          </Typography>
          <Button 
            component={RouterLink} 
            to="/books" 
            variant="contained" 
            sx={{ mt: 2 }}
          >
            Alışverişe Başla
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2 }}>
              {cartItems.map((item) => (
                <Box 
                  key={item.id} 
                  sx={{ 
                    display: 'flex', 
                    mb: 2,
                    p: 2,
                    borderRadius: 1,
                    bgcolor: 'background.default'
                  }}
                >
                  <Box 
                    component="img"
                    src={item.book.image_url ? `http://localhost:5000${item.book.image_url}` : '/placeholder.jpg'}
                    alt={item.book.title}
                    sx={{ 
                      width: 100, 
                      height: 140, 
                      objectFit: 'cover',
                      borderRadius: 1,
                      mr: 2 
                    }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Link
                        component={RouterLink}
                        to={`/book/${item.book.id}`}
                        color="inherit"
                        underline="hover"
                      >
                        <Typography variant="h6">
                          {item.book.title}
                        </Typography>
                      </Link>
                      <IconButton 
                        onClick={() => removeFromCart(item.id)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {item.book.author}
                    </Typography>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mt: 2 
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton 
                          size="small"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <RemoveIcon />
                        </IconButton>
                        <Typography sx={{ mx: 2 }}>
                          {item.quantity}
                        </Typography>
                        <IconButton 
                          size="small"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <AddIcon />
                        </IconButton>
                      </Box>
                      <Typography variant="h6" color="primary">
                        {(item.book.price * item.quantity).toFixed(2)} TL
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Paper>
          </Grid>

          {/* Sağ taraftaki özet kartı */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, position: 'sticky', top: 20 }}>
              <Typography variant="h6" gutterBottom>
                Sipariş Özeti
              </Typography>
              <Box sx={{ my: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Ürünler Toplamı</Typography>
                  <Typography>{calculateTotal().toFixed(2)} TL</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Kargo</Typography>
                  <Typography>Ücretsiz</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6">Toplam</Typography>
                  <Typography variant="h6" color="primary">
                    {calculateTotal().toFixed(2)} TL
                  </Typography>
                </Box>
              </Box>
              <Button 
                variant="contained" 
                fullWidth 
                onClick={handleCheckout}
                disabled={loading}
              >
                {loading ? 'İşleniyor...' : 'Ödemeye Geç'}
              </Button>
            </Paper>
          </Grid>
        </Grid>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Cart; 