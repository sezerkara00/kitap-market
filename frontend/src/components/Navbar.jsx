import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Badge } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import axios from 'axios';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();

  const fetchCartCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get('/api/cart/count', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setCartCount(response.data.count);
    } catch (error) {
      console.error('Sepet sayısı alınamadı:', error);
      // Hata durumunda sessizce devam et
    }
  };

  useEffect(() => {
    const checkUser = () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        
        // Admin değilse sepet sayısını getir
        if (userData.role !== 'admin') {
          fetchCartCount();
        }
      } else {
        setUser(null);
        setCartCount(0);
      }
    };

    checkUser();
    window.addEventListener('storage', checkUser);
    window.addEventListener('userLogin', checkUser);

    return () => {
      window.removeEventListener('storage', checkUser);
      window.removeEventListener('userLogin', checkUser);
    };
  }, []);

  const handleLogout = () => {
    // Token'ı ve kullanıcı bilgilerini temizle
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Axios header'ından token'ı kaldır
    delete axios.defaults.headers.common['Authorization'];
    
    // State'i temizle
    setUser(null);
    setCartCount(0);
    
    // Event'leri tetikle
    window.dispatchEvent(new Event('storage'));
    
    // Login sayfasına yönlendir
    navigate('/login');
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography 
          variant="h6" 
          component={Link} 
          to="/" 
          sx={{ 
            flexGrow: 1, 
            textDecoration: 'none', 
            color: 'inherit' 
          }}
        >
          Kitap Marketi
        </Typography>
        <Box>
          <Button color="inherit" component={Link} to="/">
            Ana Sayfa
          </Button>
          <Button color="inherit" component={Link} to="/books">
            Kitaplar
          </Button>
          {user ? (
            <>
              {user.role === 'admin' ? (
                <Button color="inherit" component={Link} to="/admin">
                  Admin Panel
                </Button>
              ) : (
                <>
                  <Button color="inherit" component={Link} to="/my-books">
                    <LibraryBooksIcon sx={{ mr: 1 }} />
                    Kitaplarım
                  </Button>
                  <Button color="inherit" component={Link} to="/cart">
                    <Badge badgeContent={cartCount} color="error">
                      <ShoppingCartIcon />
                    </Badge>
                  </Button>
                  <Button color="inherit" component={Link} to="/orders">
                    Siparişlerim
                  </Button>
                </>
              )}
              <Button color="inherit" onClick={handleLogout}>
                Çıkış Yap ({user.name})
              </Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={Link} to="/login">
                Giriş Yap
              </Button>
              <Button color="inherit" component={Link} to="/register">
                Kayıt Ol
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 