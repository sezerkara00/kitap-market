import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Grid,
  Divider,
  IconButton
} from '@mui/material';
import { PhotoCamera, Edit } from '@mui/icons-material';
import axios from 'axios';

const Profile = () => {
  const [profile, setProfile] = useState({
    username: '',
    name: '',
    email: '',
    balance: 0,
    avatar: null,
    book_count: 0,
    order_count: 0
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [openUsernameDialog, setOpenUsernameDialog] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchProfile();
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

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      handleImageUpload(file);
    }
  };

  const handleImageUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await axios.post('/api/user/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setProfile(prev => ({
        ...prev,
        avatar: response.data.avatar_url
      }));
      setSuccess('Profil resmi güncellendi');
    } catch (error) {
      setError('Profil resmi yüklenemedi');
    }
  };

  const handleUpdate = async () => {
    try {
      const response = await axios.put('/api/user/profile', {
        name: profile.name
      });
      
      setSuccess('Profil başarıyla güncellendi');
      setIsEditing(false);
      
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...user, ...response.data.user };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
    } catch (error) {
      setError(error.response?.data?.error || 'Güncelleme başarısız');
    }
  };

  const handleUsernameUpdate = async () => {
    try {
      const response = await axios.put('/api/user/profile', {
        username: newUsername
      });
      
      setSuccess('Kullanıcı adı başarıyla güncellendi');
      setOpenUsernameDialog(false);
      
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...user, ...response.data.user };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setProfile(prev => ({ ...prev, username: newUsername }));
      
    } catch (error) {
      setError(error.response?.data?.error || 'Kullanıcı adı güncellenemedi');
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Grid container spacing={4}>
          {/* Sol Taraf - Profil Resmi ve İstatistikler */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  src={profile.avatar}
                  sx={{ width: 150, height: 150, mb: 2 }}
                />
                <IconButton
                  sx={{
                    position: 'absolute',
                    bottom: 16,
                    right: 0,
                    backgroundColor: 'primary.main',
                    '&:hover': { backgroundColor: 'primary.dark' }
                  }}
                  component="label"
                >
                  <PhotoCamera sx={{ color: 'white' }} />
                  <input
                    hidden
                    accept="image/*"
                    type="file"
                    onChange={handleImageChange}
                  />
                </IconButton>
              </Box>

              <Typography variant="h6" gutterBottom>
                {profile.name}
              </Typography>
              <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                @{profile.username}
              </Typography>

              <Box sx={{ mt: 2, width: '100%' }}>
                <Typography variant="subtitle1" color="primary" gutterBottom>
                  Bakiye: {profile.balance?.toFixed(2)} TL
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Kitap Sayısı: {profile.book_count}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Sipariş Sayısı: {profile.order_count}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Sağ Taraf - Profil Bilgileri */}
          <Grid item xs={12} md={8}>
            <Box>
              <Typography variant="h5" gutterBottom>
                Profil Bilgileri
              </Typography>
              
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Kullanıcı Adı
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body1" sx={{ mr: 2 }}>
                    {profile.username}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Edit />}
                    onClick={() => setOpenUsernameDialog(true)}
                  >
                    Değiştir
                  </Button>
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              <TextField
                fullWidth
                label="E-posta"
                value={profile.email}
                disabled
                margin="normal"
              />
              
              <TextField
                fullWidth
                label="Ad Soyad"
                value={profile.name}
                onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                disabled={!isEditing}
                margin="normal"
              />

              <Box sx={{ mt: 3 }}>
                {!isEditing ? (
                  <Button 
                    variant="contained" 
                    onClick={() => setIsEditing(true)}
                    startIcon={<Edit />}
                  >
                    Profili Düzenle
                  </Button>
                ) : (
                  <>
                    <Button 
                      variant="contained" 
                      onClick={handleUpdate}
                      sx={{ mr: 1 }}
                    >
                      Kaydet
                    </Button>
                    <Button 
                      variant="outlined" 
                      onClick={() => {
                        setIsEditing(false);
                        fetchProfile();
                      }}
                    >
                      İptal
                    </Button>
                  </>
                )}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

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
          <Button onClick={() => setOpenUsernameDialog(false)}>
            İptal
          </Button>
          <Button onClick={handleUsernameUpdate} variant="contained">
            Güncelle
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile; 