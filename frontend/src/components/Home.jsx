import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Box,
  Paper,
  Chip,
  Rating,
  IconButton,
  Skeleton
} from '@mui/material';
import {
  ShoppingCart as CartIcon,
  ArrowForward as ArrowForwardIcon,
  NewReleases as NewReleasesIcon,
  TrendingUp as TrendingUpIcon,
  LocalOffer as LocalOfferIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axiosConfig';

const Home = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const response = await axios.get('/api/books/new');
      setBooks(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Kitaplar yüklenemedi:', error);
      setLoading(false);
    }
  };

  const handleAddToCart = async (bookId, e) => {
    e.stopPropagation();
    try {
      await axios.post('/api/cart/add', { book_id: bookId, quantity: 1 });
    } catch (error) {
      console.error('Sepete eklenemedi:', error);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Hero Banner */}
      <Paper 
        sx={{ 
          p: 6, 
          mb: 4, 
          background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
          color: 'white',
          textAlign: 'center',
          borderRadius: 2
        }}
      >
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Kitap Dünyasına Hoş Geldiniz
        </Typography>
        <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
          Binlerce kitap, uygun fiyatlar ve hızlı teslimat
        </Typography>
        <Button 
          variant="contained" 
          color="secondary" 
          size="large"
          onClick={() => navigate('/books')}
          sx={{ 
            px: 4, 
            py: 1.5,
            fontSize: '1.1rem',
            boxShadow: 3
          }}
        >
          Hemen Keşfet
        </Button>
      </Paper>

      {/* Kitap Listesi */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <NewReleasesIcon color="primary" />
            <Typography variant="h5" component="h2">
              Yeni Çıkan Kitaplar
            </Typography>
          </Box>
          <Button 
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate('/books')}
          >
            Tümünü Gör
          </Button>
        </Box>

        <Grid container spacing={3}>
          {loading ? (
            // Loading skeletons
            [...Array(8)].map((_, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Skeleton variant="rectangular" height={260} />
                <Skeleton />
                <Skeleton width="60%" />
              </Grid>
            ))
          ) : (
            // Actual book cards
            books.map((book) => (
              <Grid item xs={12} sm={6} md={3} key={book.id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: 6
                    }
                  }}
                  onClick={() => navigate(`/books/${book.id}`)}
                >
                  <CardMedia
                    component="img"
                    height="260"
                    image={book.image_url || '/placeholder.jpg'}
                    alt={book.title}
                    sx={{ objectFit: 'contain', p: 2 }}
                  />
                  <CardContent>
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        fontWeight: 'bold',
                        mb: 1,
                        height: '2.4em',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}
                    >
                      {book.title}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      {book.author}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                        {book.price} TL
                      </Typography>
                      <IconButton
                        color="primary"
                        onClick={(e) => handleAddToCart(book.id, e)}
                        disabled={book.stock <= 0}
                      >
                        <CartIcon />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </Paper>
    </Container>
  );
};

export default Home; 