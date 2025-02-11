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
  Breadcrumbs,
  Link,
  Paper,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  FormControlLabel,
  Divider,
  Rating,
  Chip,
  IconButton,
  useTheme,
  useMediaQuery,
  TextField,
  InputAdornment,
  Skeleton
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  ShoppingCart as CartIcon,
  NavigateNext as NavigateNextIcon
} from '@mui/icons-material';
import axios from '../utils/axiosConfig';
import { useNavigate } from 'react-router-dom';
import { createSlug } from '../utils/helpers';

const BookList = () => {
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    categories: [],
    priceRange: [0, 1000],
    inStock: false
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  useEffect(() => {
    fetchBooks();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Kategoriler yüklenemedi:', error);
    }
  };

  const fetchBooks = async () => {
    try {
      const response = await axios.get('/api/books');
      setBooks(response.data);
      setFilteredBooks(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Kitaplar yüklenemedi:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCategories.length === 0) {
      setFilteredBooks(books);
    } else {
      const filtered = books.filter(book => 
        selectedCategories.some(category => 
          book.category?.toLowerCase().includes(category.toLowerCase())
        )
      );
      setFilteredBooks(filtered);
    }
  }, [selectedCategories, books]);

  const handleAddToCart = async (bookId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.post('/api/cart', {
        book_id: parseInt(bookId),
        quantity: 1
      });

      if (response.data) {
        console.log('Kitap sepete eklendi');
      }
    } catch (error) {
      console.error('Sepete eklenemedi:', error);
      
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  const FilterSection = () => (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Kategoriler
      </Typography>
      <List>
        {categories.map((category) => (
          <ListItem key={category} dense>
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectedCategories.includes(category)}
                  onChange={(e) => {
                    const newCategories = e.target.checked
                      ? [...selectedCategories, category]
                      : selectedCategories.filter(c => c !== category);
                    setSelectedCategories(newCategories);
                  }}
                />
              }
              label={category}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 2 }}>
      {/* Breadcrumb */}
      <Breadcrumbs 
        separator={<NavigateNextIcon fontSize="small" />} 
        sx={{ mb: 2 }}
      >
        <Link href="/" color="inherit">Ana Sayfa</Link>
        <Typography color="text.primary">Kitaplar</Typography>
      </Breadcrumbs>

      {/* Üst Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Kitap, yazar veya yayınevi ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              startIcon={<FilterIcon />}
              onClick={() => setDrawerOpen(true)}
              variant="outlined"
            >
              Filtrele
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Ana İçerik */}
      <Grid container spacing={3}>
        {/* Sol Kenar - Filtreler */}
        {!isMobile && (
          <Grid item xs={12} md={3}>
            <FilterSection />
          </Grid>
        )}

        {/* Kitap Listesi */}
        <Grid item xs={12} md={!isMobile ? 9 : 12}>
          <Grid container spacing={2}>
            {loading ? (
              // Loading durumu
              [...Array(8)].map((_, index) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                  <Skeleton variant="rectangular" height={400} />
                </Grid>
              ))
            ) : filteredBooks.length === 0 ? (
              // Sonuç bulunamadı
              <Grid item xs={12}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography>
                    Seçilen kategorilerde kitap bulunamadı.
                  </Typography>
                </Paper>
              </Grid>
            ) : (
              // Kitap kartları
              filteredBooks.map((book) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={book.id}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      cursor: 'pointer',
                      '&:hover': {
                        boxShadow: 6
                      }
                    }}
                    onClick={() => {
                      console.log('Navigating to book:', book.id);
                      const slug = createSlug(book.title);
                      navigate(`/book/${slug}/${book.id}`);
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="260"
                      image={book.image_url || '/placeholder.jpg'}
                      alt={book.title}
                      sx={{ objectFit: 'contain', p: 2 }}
                    />
                    <CardContent sx={{ flexGrow: 1, pt: 1 }}>
                      <Typography 
                        variant="subtitle1" 
                        component="div"
                        sx={{ 
                          fontWeight: 'bold',
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
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Rating value={4.5} precision={0.5} size="small" readOnly />
                        <Typography variant="caption" sx={{ ml: 1 }}>
                          (128)
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                          {book.price} TL
                        </Typography>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<CartIcon />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(book.id);
                          }}
                          disabled={book.stock <= 0}
                        >
                          Sepete Ekle
                        </Button>
                      </Box>
                      {book.stock <= 0 && (
                        <Chip
                          label="Tükendi"
                          color="error"
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        </Grid>
      </Grid>

      {/* Mobil Filtre Drawer'ı */}
      <Drawer
        anchor="left"
        open={drawerOpen && isMobile}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 250, p: 2 }}>
          <FilterSection />
        </Box>
      </Drawer>
    </Container>
  );
};

export default BookList; 