import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Button, 
  Box, 
  Rating, 
  Chip,
  Breadcrumbs,
  Link,
  Divider,
  Skeleton,
  Alert,
  Snackbar,
  IconButton,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  ShoppingCart as CartIcon,
  NavigateNext as NavigateNextIcon,
  Warning as WarningIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Favorite as FavoriteIcon,
  Star as StarIcon
} from '@mui/icons-material';
import axios from '../utils/axiosConfig';
import { createSlug } from '../utils/helpers';

const BookDetail = () => {
  const { id, title } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [reviews, setReviews] = useState([]);
  const [userReview, setUserReview] = useState({ rating: 0, comment: '' });
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [openReviewDialog, setOpenReviewDialog] = useState(false);

  useEffect(() => {
    const fetchBookDetails = async () => {
      try {
        setLoading(true);
        console.log('Fetching book details for ID:', id);
        
        const response = await axios.get(`/api/books/${id}`);
        console.log('Book details response:', response);

        if (response.data) {
          setBook(response.data);
          
          // URL'deki title ile kitap başlığı uyuşmuyorsa yönlendir
          const slug = createSlug(response.data.title);
          if (slug !== title) {
            navigate(`/book/${slug}/${id}`, { replace: true });
          }
        } else {
          setError('Kitap bulunamadı');
        }
      } catch (error) {
        console.error('Error fetching book details:', error);
        setError('Kitap yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBookDetails();
    }
  }, [id, title, navigate]);

  // Yorumları getir
  const fetchReviews = async () => {
    try {
      const response = await axios.get(`/api/books/${id}/reviews`);
      setReviews(response.data);
    } catch (error) {
      console.error('Yorumlar yüklenemedi:', error);
    }
  };

  // İstek listesi durumunu kontrol et
  const checkWishlist = async () => {
    try {
      const response = await axios.get('/api/wishlist');
      setIsInWishlist(response.data.some(item => item.book.id === parseInt(id)));
    } catch (error) {
      console.error('İstek listesi kontrolü başarısız:', error);
    }
  };

  useEffect(() => {
    fetchReviews();
    checkWishlist();
  }, [id]);

  // İstek listesine ekle/çıkar
  const handleWishlist = async () => {
    try {
      await axios.post(`/api/wishlist/${id}`);
      setIsInWishlist(!isInWishlist);
      setSnackbar({
        open: true,
        message: isInWishlist ? 'Kitap istek listesinden çıkarıldı' : 'Kitap istek listesine eklendi',
        severity: 'success'
      });
    } catch (error) {
      console.error('İstek listesi işlemi başarısız:', error);
      setSnackbar({
        open: true,
        message: 'Bir hata oluştu',
        severity: 'error'
      });
    }
  };

  // Yorum ekle/güncelle
  const handleReviewSubmit = async () => {
    try {
      await axios.post(`/api/books/${id}/reviews`, userReview);
      setOpenReviewDialog(false);
      fetchReviews();
      setSnackbar({
        open: true,
        message: 'Yorumunuz kaydedildi',
        severity: 'success'
      });
    } catch (error) {
      console.error('Yorum eklenemedi:', error);
      setSnackbar({
        open: true,
        message: 'Yorum eklenirken bir hata oluştu',
        severity: 'error'
      });
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/" color="inherit">
          Ana Sayfa
        </Link>
        <Link component={RouterLink} to="/books" color="inherit">
          Kitaplar
        </Link>
        <Typography color="text.primary">{book?.title}</Typography>
      </Breadcrumbs>

      {loading && (
        <Grid container spacing={4}>
          <Grid item xs={12} md={5}>
            <Skeleton variant="rectangular" height={500} />
          </Grid>
          <Grid item xs={12} md={7}>
            <Skeleton variant="text" height={60} />
            <Skeleton variant="text" height={30} />
            <Skeleton variant="text" height={30} />
          </Grid>
        </Grid>
      )}

      {error && (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <WarningIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {error}
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/books')}
            sx={{ mt: 2 }}
          >
            Kitaplara Dön
          </Button>
        </Paper>
      )}

      {!loading && !error && book && (
        <>
          <Paper sx={{ p: 3, position: 'relative' }}>
            <Grid container spacing={4}>
              {/* Sol taraf - Kitap resmi ve istek listesi butonu */}
              <Grid item xs={12} md={4}>
                <Box sx={{ position: 'relative' }}>
                  <img
                    src={book.image_url || '/placeholder.jpg'}
                    alt={book.title}
                    style={{
                      width: '100%',
                      height: 'auto',
                      maxHeight: '400px',
                      objectFit: 'contain'
                    }}
                  />
                  <IconButton 
                    onClick={handleWishlist}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      bgcolor: 'background.paper',
                      '&:hover': { bgcolor: 'background.paper' }
                    }}
                  >
                    {isInWishlist ? (
                      <FavoriteIcon color="error" />
                    ) : (
                      <FavoriteBorderIcon />
                    )}
                  </IconButton>
                </Box>
              </Grid>

              {/* Sağ taraf - Kitap detayları */}
              <Grid item xs={12} md={8}>
                <Typography variant="h4" gutterBottom>
                  {book.title}
                </Typography>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {book.author}
                </Typography>

                <Box sx={{ my: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Yayınevi: {book.publisher?.name || 'Belirtilmemiş'}
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    Kategori: {book.category}
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 2 }}>
                    {book.description}
                  </Typography>
                </Box>

                <Box sx={{ 
                  mt: 3, 
                  p: 2, 
                  bgcolor: 'background.default',
                  borderRadius: 1
                }}>
                  <Typography variant="h5" color="primary" gutterBottom>
                    {book.price} TL
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Stok Durumu: {book.stock > 0 ? `${book.stock} adet` : 'Tükendi'}
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<CartIcon />}
                    onClick={() => {
                      const token = localStorage.getItem('token');
                      if (!token) {
                        setSnackbar({
                          open: true,
                          message: 'Lütfen önce giriş yapın',
                          severity: 'warning'
                        });
                        setTimeout(() => navigate('/login'), 1500);
                      } else {
                        axios.post('/api/cart', {
                          book_id: parseInt(id),
                          quantity: 1
                        })
                        .then(response => {
                          if (response.data) {
                            setSnackbar({
                              open: true,
                              message: 'Kitap sepete eklendi',
                              severity: 'success'
                            });
                            setTimeout(() => navigate('/cart'), 1500);
                          }
                        })
                        .catch(error => {
                          console.error('Sepete eklenemedi:', error);
                          const errorMessage = error.response?.data?.message || 'Kitap sepete eklenirken bir hata oluştu';
                          setSnackbar({
                            open: true,
                            message: errorMessage,
                            severity: 'error'
                          });
                        });
                      }
                    }}
                    disabled={book.stock <= 0}
                    sx={{ mt: 1 }}
                    fullWidth
                  >
                    Sepete Ekle
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Yorumlar Bölümü */}
          <Paper sx={{ mt: 4, p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Yorumlar ({reviews.length})
              </Typography>
              <Button 
                variant="contained"
                onClick={() => setOpenReviewDialog(true)}
              >
                Yorum Yap
              </Button>
            </Box>

            {reviews.length === 0 ? (
              <Typography variant="body1" color="text.secondary" align="center">
                Bu kitap için henüz yorum yapılmamış. İlk yorumu siz yapın!
              </Typography>
            ) : (
              reviews.map((review) => (
                <Paper key={review.id} sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar src={review.user.avatar} />
                    <Box sx={{ ml: 2 }}>
                      <Typography variant="subtitle1">
                        {review.user.username}
                      </Typography>
                      <Rating value={review.rating} readOnly size="small" />
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                      {new Date(review.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    {review.comment}
                  </Typography>
                </Paper>
              ))
            )}
          </Paper>
        </>
      )}

      {/* Dialog'lar ve Snackbar */}
      <Dialog open={openReviewDialog} onClose={() => setOpenReviewDialog(false)}>
        <DialogTitle>Yorum Yap</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2, mt: 1 }}>
            <Typography>Puanınız</Typography>
            <Rating
              value={userReview.rating}
              onChange={(event, newValue) => {
                setUserReview(prev => ({ ...prev, rating: newValue }));
              }}
            />
          </Box>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Yorumunuz"
            value={userReview.comment}
            onChange={(e) => setUserReview(prev => ({ ...prev, comment: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReviewDialog(false)}>İptal</Button>
          <Button 
            onClick={handleReviewSubmit}
            variant="contained"
            disabled={!userReview.rating || !userReview.comment}
          >
            Gönder
          </Button>
        </DialogActions>
      </Dialog>

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

export default BookDetail; 