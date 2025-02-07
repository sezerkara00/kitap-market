import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Avatar,
  Grid,
  Divider,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Card,
  CardMedia,
  CardContent,
  Rating,
  Link
} from '@mui/material';
import { PhotoCamera, Edit, Delete } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import axios from '../utils/axiosConfig';

const Profile = () => {
  const [tab, setTab] = useState(0);
  const [profile, setProfile] = useState({
    username: '',
    name: '',
    email: '',
    balance: 0,
    avatar: null
  });
  const [wishlist, setWishlist] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openUsernameDialog, setOpenUsernameDialog] = useState(false);
  const [newUsername, setNewUsername] = useState('');

  useEffect(() => {
    fetchProfile();
    fetchWishlist();
    fetchReviews();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/api/user/info');
      setProfile(response.data);
      setNewUsername(response.data.username);
    } catch (error) {
      setError('Profil bilgileri alınamadı');
    }
  };

  const fetchWishlist = async () => {
    try {
      const response = await axios.get('/api/wishlist');
      setWishlist(response.data);
    } catch (error) {
      console.error('İstek listesi alınamadı:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await axios.get('/api/user/reviews');
      setReviews(response.data);
    } catch (error) {
      console.error('Yorumlar alınamadı:', error);
    }
  };

  const handleRemoveFromWishlist = async (bookId) => {
    try {
      await axios.post(`/api/wishlist/${bookId}`);
      fetchWishlist();
      setSuccess('Kitap istek listesinden kaldırıldı');
    } catch (error) {
      setError('İşlem başarısız oldu');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await axios.delete(`/api/reviews/${reviewId}`);
      fetchReviews();
      setSuccess('Yorum silindi');
    } catch (error) {
      setError('Yorum silinemedi');
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const response = await axios.put('/api/user/profile', {
        name: profile.name
      });
      setSuccess('Profil güncellendi');
      setEditing(false);
      
      // Local storage'ı güncelle
      const user = JSON.parse(localStorage.getItem('user'));
      localStorage.setItem('user', JSON.stringify({ ...user, name: profile.name }));
    } catch (error) {
      setError('Profil güncellenemedi');
    }
  };

  const handleUpdateUsername = async () => {
    try {
      const response = await axios.put('/api/user/profile', {
        username: newUsername
      });
      setSuccess('Kullanıcı adı güncellendi');
      setOpenUsernameDialog(false);
      setProfile(prev => ({ ...prev, username: newUsername }));
      
      // Local storage'ı güncelle
      const user = JSON.parse(localStorage.getItem('user'));
      localStorage.setItem('user', JSON.stringify({ ...user, username: newUsername }));
    } catch (error) {
      setError('Kullanıcı adı güncellenemedi');
    }
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('avatar', file);

      try {
        const response = await axios.post('/api/user/avatar', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        // Profil state'ini güncelle
        setProfile(prev => ({ 
          ...prev, 
          avatar: response.data.avatar_url 
        }));
        
        // Local storage'ı güncelle
        const user = JSON.parse(localStorage.getItem('user'));
        localStorage.setItem('user', JSON.stringify({ 
          ...user, 
          avatar: response.data.avatar_url 
        }));
        
        setSuccess('Profil fotoğrafı güncellendi');
      } catch (error) {
        console.error('Avatar yükleme hatası:', error);
        setError('Profil fotoğrafı yüklenemedi');
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Grid container spacing={4}>
          {/* Sol taraf - Avatar ve temel bilgiler */}
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <Avatar
                  src={profile.avatar ? `http://localhost:5000${profile.avatar}` : null}
                  sx={{ width: 150, height: 150, mb: 2 }}
                />
                <IconButton
                  component="label"
                  sx={{
                    position: 'absolute',
                    bottom: 16,
                    right: -8,
                    backgroundColor: 'primary.main',
                    '&:hover': { backgroundColor: 'primary.dark' }
                  }}
                >
                  <input
                    hidden
                    accept="image/*"
                    type="file"
                    onChange={handleAvatarChange}
                  />
                  <PhotoCamera sx={{ color: 'white' }} />
                </IconButton>
              </Box>
              <Typography variant="h6" gutterBottom>
                {profile.name}
              </Typography>
              <Typography color="textSecondary" gutterBottom>
                @{profile.username}
              </Typography>
              <Typography variant="body1" sx={{ mt: 2 }}>
                Bakiye: {profile.balance?.toFixed(2)} TL
              </Typography>
            </Box>
          </Grid>

          {/* Sağ taraf - Tabs ve içerikler */}
          <Grid item xs={12} md={8}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)}>
                <Tab label="Profil Bilgileri" />
                <Tab label="İstek Listesi" />
                <Tab label="Yorumlarım" />
              </Tabs>
            </Box>

            {tab === 0 && (
              <Box>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Profil Bilgileri
                  </Typography>
                  <TextField
                    fullWidth
                    label="E-posta"
                    value={profile.email}
                    disabled
                    margin="normal"
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TextField
                      fullWidth
                      label="Kullanıcı Adı"
                      value={profile.username}
                      disabled
                      margin="normal"
                    />
                    <Button
                      startIcon={<Edit />}
                      onClick={() => setOpenUsernameDialog(true)}
                      sx={{ ml: 1 }}
                    >
                      Değiştir
                    </Button>
                  </Box>
                  <TextField
                    fullWidth
                    label="Ad Soyad"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    disabled={!editing}
                    margin="normal"
                  />
                </Box>

                <Box sx={{ mt: 3 }}>
                  {!editing ? (
                    <Button
                      variant="contained"
                      onClick={() => setEditing(true)}
                      startIcon={<Edit />}
                    >
                      Profili Düzenle
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="contained"
                        onClick={handleUpdateProfile}
                        sx={{ mr: 1 }}
                      >
                        Kaydet
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setEditing(false);
                          fetchProfile();
                        }}
                      >
                        İptal
                      </Button>
                    </>
                  )}
                </Box>
              </Box>
            )}

            {tab === 1 && (
              <Grid container spacing={2}>
                {wishlist.map((item) => (
                  <Grid item xs={12} sm={6} key={item.id}>
                    <Card sx={{ display: 'flex', height: '100%' }}>
                      <CardMedia
                        component="img"
                        sx={{ width: 100, objectFit: 'cover' }}
                        image={item.book.image_url ? `http://localhost:5000${item.book.image_url}` : '/placeholder.jpg'}
                        alt={item.book.title}
                      />
                      <CardContent sx={{ flex: 1, position: 'relative' }}>
                        <IconButton
                          size="small"
                          sx={{ position: 'absolute', top: 8, right: 8 }}
                          onClick={() => handleRemoveFromWishlist(item.book.id)}
                        >
                          <Delete />
                        </IconButton>
                        <Link
                          component={RouterLink}
                          to={`/book/${item.book.id}`}
                          color="inherit"
                          underline="hover"
                        >
                          <Typography variant="subtitle1" noWrap>
                            {item.book.title}
                          </Typography>
                        </Link>
                        <Typography variant="body2" color="text.secondary">
                          {item.book.author}
                        </Typography>
                        <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                          {item.book.price} TL
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
                {wishlist.length === 0 && (
                  <Box sx={{ p: 2, width: '100%', textAlign: 'center' }}>
                    <Typography color="text.secondary">
                      İstek listenizde henüz kitap yok
                    </Typography>
                  </Box>
                )}
              </Grid>
            )}

            {tab === 2 && (
              <Box>
                {reviews.map((review) => (
                  <Paper key={review.id} sx={{ p: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Box sx={{ flex: 1 }}>
                        <Link
                          component={RouterLink}
                          to={`/book/${review.book.id}`}
                          color="inherit"
                          underline="hover"
                        >
                          <Typography variant="subtitle1">
                            {review.book.title}
                          </Typography>
                        </Link>
                        <Rating value={review.rating} readOnly size="small" />
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteReview(review.id)}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                    <Typography variant="body1">
                      {review.comment}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(review.created_at).toLocaleDateString()}
                    </Typography>
                  </Paper>
                ))}
                {reviews.length === 0 && (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography color="text.secondary">
                      Henüz yorum yapmamışsınız
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Kullanıcı adı değiştirme dialog'u */}
      <Dialog open={openUsernameDialog} onClose={() => setOpenUsernameDialog(false)}>
        <DialogTitle>Kullanıcı Adını Değiştir</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Yeni Kullanıcı Adı"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUsernameDialog(false)}>İptal</Button>
          <Button onClick={handleUpdateUsername} variant="contained">
            Güncelle
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile; 