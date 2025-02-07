import React, { useState } from 'react';
import { 
  Container, 
  Paper, 
  TextField, 
  Button, 
  Typography, 
  Box,
  Alert,
  Divider
} from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import axios from '../utils/axiosConfig';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
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

    try {
      const response = await axios.post('/api/auth/login', {
        email: formData.email,
        password: formData.password
      });

      console.log('Login response:', response);

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Login event'ini tetikle
        window.dispatchEvent(new Event('userLogin'));
        
        // Ana sayfaya yönlendir
        navigate('/');
      }
    } catch (error) {
      console.error('Giriş hatası:', error);
      setError(error.response?.data?.message || 'Giriş yapılırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      console.log('Google response:', credentialResponse);

      const response = await axios.post('http://localhost:5000/api/auth/google', {
        token: credentialResponse.credential
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });

      console.log('Backend response:', response.data);

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Login event'ini tetikle
      window.dispatchEvent(new Event('userLogin'));
      
      navigate('/');
    } catch (error) {
      console.error('Google login error:', error);
      alert('Google ile giriş yapılırken bir hata oluştu');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" align="center" gutterBottom>
          Giriş Yap
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
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
          <Button
            fullWidth
            variant="contained"
            color="primary"
            type="submit"
            sx={{ mt: 2 }}
          >
            Giriş Yap
          </Button>
        </form>

        <Box sx={{ my: 2 }}>
          <Divider>veya</Divider>
        </Box>

        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => {
            alert('Google ile giriş başarısız');
          }}
        />

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2">
            Hesabınız yok mu?{' '}
            <Button color="primary" onClick={() => navigate('/register')}>
              Kayıt Ol
            </Button>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login; 