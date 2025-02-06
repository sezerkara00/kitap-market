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
  TextField
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/cart', {
        headers: { Authorization: `Bearer ${token}` }
      });
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
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/cart/${itemId}`, 
        { quantity: newQuantity },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      fetchCart();
    } catch (error) {
      console.error('Miktar güncellenemedi:', error);
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/cart/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCart();
    } catch (error) {
      console.error('Ürün sepetten silinemedi:', error);
    }
  };

  const handleCheckout = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/orders', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate('/orders');
    } catch (error) {
      console.error('Sipariş oluşturulamadı:', error);
      alert('Sipariş oluşturulurken bir hata oluştu');
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
            variant="contained" 
            color="primary" 
            sx={{ mt: 2 }}
            onClick={() => navigate('/books')}
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
        Sepetim
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Ürün</TableCell>
              <TableCell align="right">Fiyat</TableCell>
              <TableCell align="center">Adet</TableCell>
              <TableCell align="right">Toplam</TableCell>
              <TableCell align="center">İşlem</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cartItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Card sx={{ width: 60, height: 80, flexShrink: 0 }}>
                      <CardMedia
                        component="img"
                        height="80"
                        image={item.book.image_url || '/placeholder.png'}
                        alt={item.book.title}
                      />
                    </Card>
                    <Typography>{item.book.title}</Typography>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  {item.book.price.toFixed(2)} TL
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconButton 
                      size="small"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <RemoveIcon />
                    </IconButton>
                    <TextField
                      size="small"
                      value={item.quantity}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (!isNaN(value)) {
                          updateQuantity(item.id, value);
                        }
                      }}
                      sx={{ width: 60, mx: 1 }}
                      inputProps={{ style: { textAlign: 'center' } }}
                    />
                    <IconButton 
                      size="small"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <AddIcon />
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  {(item.book.price * item.quantity).toFixed(2)} TL
                </TableCell>
                <TableCell align="center">
                  <IconButton 
                    color="error"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={3} align="right">
                <Typography variant="h6">Toplam:</Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="h6">
                  {calculateTotal().toFixed(2)} TL
                </Typography>
              </TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={handleCheckout}
        >
          Siparişi Tamamla
        </Button>
      </Box>
    </Container>
  );
};

export default Cart; 