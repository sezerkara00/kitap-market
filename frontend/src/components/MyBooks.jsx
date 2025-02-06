import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  FormLabel,
  Input,
  IconButton,
  Box,
  Paper,
  Chip,
  Tooltip,
  Fab,
  useTheme,
  useMediaQuery,
  Alert,
  Select,
  MenuItem,
  InputLabel,
  Autocomplete,
  FormHelperText
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import axios from '../utils/axiosConfig';

const MyBooks = () => {
  const [books, setBooks] = useState([]);
  const [userInfo, setUserInfo] = useState({ balance: 0 });
  const [openDialog, setOpenDialog] = useState(false);
  const [editBook, setEditBook] = useState(null);
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    price: '',
    stock: '',
    category: '',
    description: '',
    image: null,
    publisher_id: '',
    new_publisher: ''
  });
  const [error, setError] = useState('');
  const [publishers, setPublishers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    fetchMyBooks();
    fetchUserInfo();
    fetchPublishers();
    fetchCategories();
  }, []);

  const fetchMyBooks = async () => {
    try {
      const response = await axios.get('/api/my-books');
      setBooks(response.data);
    } catch (error) {
      console.error('Kitaplar yüklenemedi:', error);
    }
  };

  const fetchUserInfo = async () => {
    try {
      const response = await axios.get('/api/user/info');
      setUserInfo(response.data);
    } catch (error) {
      console.error('Kullanıcı bilgileri alınamadı:', error);
    }
  };

  const fetchPublishers = async () => {
    try {
      const response = await axios.get('/api/publishers');
      console.log('Yayınevleri:', response.data);
      setPublishers(response.data);
    } catch (error) {
      console.error('Yayınevleri yüklenemedi:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Kategoriler yüklenemedi:', error);
    }
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('title', newBook.title);
      formData.append('author', newBook.author);
      formData.append('price', newBook.price);
      formData.append('stock', newBook.stock);
      formData.append('description', newBook.description);
      formData.append('category', newBook.category);
      
      // Yayınevi bilgisini ekle
      if (newBook.publisher_id) {
        formData.append('publisher_id', newBook.publisher_id);
      } else if (newBook.new_publisher) {
        formData.append('new_publisher', newBook.new_publisher);
      }

      if (newBook.image) {
        formData.append('image', newBook.image);
      }

      const response = await axios.post('/api/books', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setBooks([...books, response.data]);
      setNewBook({
        title: '',
        author: '',
        price: '',
        stock: '',
        description: '',
        category: '',
        image: null,
        publisher_id: '',
        new_publisher: ''
      });
      setOpenDialog(false);
      
    } catch (error) {
      console.error('Kitap eklenemedi:', error);
      setError(error.response?.data?.error || 'Kitap eklenirken bir hata oluştu');
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setNewBook({ ...newBook, image: file });
    }
  };

  const handleDeleteBook = async (bookId) => {
    if (window.confirm('Bu kitabı silmek istediğinizden emin misiniz?')) {
      try {
        await axios.delete(`/api/books/${bookId}`);
        fetchMyBooks();
      } catch (error) {
        console.error('Kitap silinemedi:', error);
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header Bölümü */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          mb: 4, 
          background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
          color: 'white'
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          gap: 2
        }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Kitaplarım
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip 
              label={`Bakiye: ${userInfo.balance?.toFixed(2)} TL`}
              color="secondary"
              sx={{ 
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                color: '#1976d2',
                fontWeight: 'bold'
              }}
            />
            <Tooltip title="Yeni Kitap Ekle">
              <Fab 
                color="secondary" 
                size="medium"
                onClick={() => setOpenDialog(true)}
              >
                <AddIcon />
              </Fab>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* Kitap Listesi */}
      <Grid container spacing={3}>
        {books.map((book) => (
          <Grid item xs={12} sm={6} md={4} key={book.id}>
            <Card 
              elevation={3}
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
            >
              <Box sx={{ position: 'relative' }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={book.image_url || '/placeholder.jpg'}
                  alt={book.title}
                  sx={{ 
                    objectFit: 'cover',
                    bgcolor: 'grey.100'
                  }}
                />
                <Box 
                  sx={{ 
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    display: 'flex',
                    gap: 1
                  }}
                >
                  <Tooltip title="Düzenle">
                    <IconButton 
                      size="small"
                      sx={{ 
                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                        '&:hover': { bgcolor: 'white' }
                      }}
                      onClick={() => setEditBook(book)}
                    >
                      <EditIcon color="primary" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Sil">
                    <IconButton 
                      size="small"
                      sx={{ 
                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                        '&:hover': { bgcolor: 'white' }
                      }}
                      onClick={() => handleDeleteBook(book.id)}
                    >
                      <DeleteIcon color="error" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" gutterBottom noWrap>
                  {book.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {book.author}
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip 
                    label={`${book.price} TL`}
                    color="primary"
                    size="small"
                  />
                  <Chip 
                    label={`Stok: ${book.stock}`}
                    color={book.stock > 0 ? 'success' : 'error'}
                    size="small"
                    variant="outlined"
                  />
                </Box>
                {book.category && (
                  <Chip
                    label={book.category}
                    size="small"
                    sx={{ mt: 1 }}
                    variant="outlined"
                  />
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Yeni Kitap Ekleme Dialog'u */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        fullScreen={isMobile}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          bgcolor: 'primary.main', 
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          Yeni Kitap Ekle
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Grid container spacing={2}>
            {/* Başlık */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Başlık"
                value={newBook.title}
                onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                required
                error={!newBook.title}
                helperText={!newBook.title && "Başlık zorunludur"}
              />
            </Grid>

            {/* Yazar */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Yazar"
                value={newBook.author}
                onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                required
                error={!newBook.author}
                helperText={!newBook.author && "Yazar zorunludur"}
              />
            </Grid>

            {/* Fiyat */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Fiyat"
                type="number"
                value={newBook.price}
                onChange={(e) => setNewBook({ ...newBook, price: e.target.value })}
                required
                error={!newBook.price}
                helperText={!newBook.price && "Fiyat zorunludur"}
                InputProps={{
                  endAdornment: <Typography>TL</Typography>
                }}
              />
            </Grid>

            {/* Stok */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Stok"
                type="number"
                value={newBook.stock}
                onChange={(e) => setNewBook({ ...newBook, stock: e.target.value })}
                required
                error={!newBook.stock}
                helperText={!newBook.stock && "Stok zorunludur"}
              />
            </Grid>

            {/* Yayınevi Seçimi/Ekleme */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Autocomplete
                  value={publishers.find(p => p.id === newBook.publisher_id) || null}
                  onChange={(event, newValue) => {
                    if (newValue) {
                      // Var olan yayınevini seç
                      setNewBook({ ...newBook, publisher_id: newValue.id });
                    }
                  }}
                  options={publishers}
                  getOptionLabel={(option) => option.name}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Yayınevi"
                      required
                      error={!newBook.publisher_id && !newBook.new_publisher}
                      helperText={!newBook.publisher_id && !newBook.new_publisher && "Yayınevi seçin veya yeni ekleyin"}
                    />
                  )}
                  freeSolo
                  onInputChange={(event, newInputValue) => {
                    if (!publishers.find(p => p.name === newInputValue)) {
                      // Yeni yayınevi adı girildiyse
                      setNewBook({ 
                        ...newBook, 
                        publisher_id: null,
                        new_publisher: newInputValue 
                      });
                    }
                  }}
                />
              </FormControl>
            </Grid>

            {/* Kategoriler */}
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={categories}
                value={selectedCategories}
                onChange={(event, newValue) => {
                  setSelectedCategories(newValue);
                  setNewBook({ ...newBook, category: newValue.join(', ') });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    label="Kategoriler"
                    placeholder="Kategori seçin"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option}
                      {...getTagProps({ index })}
                      color="primary"
                      variant="outlined"
                    />
                  ))
                }
              />
            </Grid>

            {/* Açıklama */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Açıklama"
                multiline
                rows={4}
                value={newBook.description}
                onChange={(e) => setNewBook({ ...newBook, description: e.target.value })}
              />
            </Grid>

            {/* Kitap Resmi */}
            <Grid item xs={12}>
              <Button
                component="label"
                variant="outlined"
                startIcon={<PhotoCamera />}
                sx={{ width: '100%', height: '100px' }}
              >
                Kitap Resmi Seç
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </Button>
              {newBook.image && (
                <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                  Seçilen dosya: {newBook.image.name}
                </Typography>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenDialog(false)}>
            İptal
          </Button>
          <Button 
            onClick={handleAddBook} 
            variant="contained"
            disabled={!newBook.title || !newBook.author || !newBook.price || !newBook.stock || !newBook.publisher_id}
          >
            Ekle
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MyBooks; 