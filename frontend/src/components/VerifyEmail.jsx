import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Paper, Typography, CircularProgress } from '@mui/material';
import axios from 'axios';

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/auth/verify-email/${token}`);
        
        // Başarılı doğrulama durumunda kullanıcıyı giriş yap
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        window.dispatchEvent(new Event('userLogin'));
        
        setStatus('success');
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } catch (error) {
        setStatus('error');
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        {status === 'verifying' && (
          <>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography>
              Email adresiniz doğrulanıyor...
            </Typography>
          </>
        )}
        
        {status === 'success' && (
          <Typography color="success.main">
            Email adresiniz başarıyla doğrulandı! Ana sayfaya yönlendiriliyorsunuz...
          </Typography>
        )}
        
        {status === 'error' && (
          <Typography color="error">
            Doğrulama başarısız oldu. Link geçersiz veya süresi dolmuş olabilir.
          </Typography>
        )}
      </Paper>
    </Container>
  );
};

export default VerifyEmail; 