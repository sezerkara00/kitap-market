import React, { useState } from 'react';
import { 
  Container, 
  Paper, 
  TextField, 
  Button, 
  Typography, 
  Box 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axiosConfig';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler eşleşmiyor');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('/api/auth/register', {
        name: formData.name,
        username: formData.username,
        email: formData.email,
        password: formData.password
      });

      console.log('Register response:', response);

      if (response.status === 201) {
        navigate('/login', { 
          state: { message: 'Kayıt başarılı! Lütfen giriş yapın.' } 
        });
      }
    } catch (error) {
      console.error('Kayıt hatası:', error);
      setError(error.response?.data?.message || 'Kayıt sırasında bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" align="center" gutterBottom>
          Kayıt Ol
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Ad Soyad"
            name="name"
            value={formData.name}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Kullanıcı Adı"
            name="username"
            value={formData.username}
            onChange={handleChange}
            margin="normal"
            required
            helperText="Benzersiz bir kullanıcı adı seçin"
          />
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Şifre"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Şifre Tekrar"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            margin="normal"
            required
          />
          <Button
            fullWidth
            variant="contained"
            color="primary"
            type="submit"
            sx={{ mt: 2 }}
            disabled={loading}
          >
            {loading ? 'Kayıt işlemi devam ediyor...' : 'Kayıt Ol'}
          </Button>
        </form>

        {error && (
          <Typography variant="body2" color="error" sx={{ mt: 2, textAlign: 'center' }}>
            {error}
          </Typography>
        )}

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2">
            Zaten hesabınız var mı?{' '}
            <Button color="primary" onClick={() => navigate('/login')}>
              Giriş Yap
            </Button>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register; 