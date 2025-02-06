import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Tabs,
  Tab,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Input,
  FormControl,
  FormLabel,
  Autocomplete,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';

const AdminPanel = () => {
  const [tab, setTab] = useState(0);
  const [books, setBooks] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [editDialog, setEditDialog] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [addDialog, setAddDialog] = useState(false);
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    publisher_id: '',
    new_publisher: '',
    price: '',
    stock: '',
    category: '',
    description: '',
    image: null
  });
  const [publishers, setPublishers] = useState([]);
  const [newPublisher, setNewPublisher] = useState({ name: '', description: '' });
  const [openPublisherDialog, setOpenPublisherDialog] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        if (!token || !user || user.role !== 'admin') {
          throw new Error('Yetkisiz erişim');
        }

        // Token'ı header'a ekle
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Veriyi yükle
        fetchData();
      } catch (error) {
        console.error('Yetkilendirme hatası:', error.message);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
        navigate('/login');
      }
    };

    checkAuth();
  }, [navigate]);

  // Tab değişikliğinde veriyi yenile
  useEffect(() => {
    if (tab !== undefined) {
      fetchData();
    }
  }, [tab]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchPublishers();
  }, []);

  const fetchPublishers = async () => {
    try {
      const response = await axios.get('/api/publishers');
      setPublishers(response.data);
    } catch (error) {
      console.error('Yayınevleri yüklenemedi:', error);
    }
  };

  const fetchData = async () => {
    try {
      let response;
      switch (tab) {
        case 0:
          response = await axios.get('/api/admin/books');
          setBooks(response.data);
          break;
        case 1:
          response = await axios.get('/api/admin/users');
          setUsers(response.data);
          break;
        case 2:
          response = await axios.get('/api/admin/orders');
          setOrders(response.data);
          break;
        case 3:
          await fetchPublishers();
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Veri alınamadı:', error.response?.data || error.message);
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/login');
      }
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

  const handleDeleteBook = async (bookId) => {
    if (!window.confirm('Bu kitabı silmek istediğinizden emin misiniz?')) return;

    try {
      await axios.delete(`/api/books/${bookId}`);
      fetchData();
    } catch (error) {
      console.error('Kitap silinemedi:', error);
    }
  };

  const handleEditBook = (book) => {
    setSelectedBook(book);
    setEditDialog(true);
  };

  const handleSaveBook = async () => {
    try {
      await axios.put(
        `/api/books/${selectedBook.id}`,
        selectedBook
      );
      setEditDialog(false);
      fetchData();
    } catch (error) {
      console.error('Kitap güncellenemedi:', error);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(
        `/api/admin/orders/${orderId}`,
        { status: newStatus }
      );
      fetchData();
    } catch (error) {
      console.error('Sipariş durumu güncellenemedi:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const handleAddBook = async () => {
    try {
      const formData = new FormData();
      formData.append('title', newBook.title);
      formData.append('author', newBook.author);
      
      // Yayınevi bilgisini ekle
      if (newBook.publisher_id) {
        formData.append('publisher_id', newBook.publisher_id);
      } else if (newBook.new_publisher) {
        formData.append('new_publisher', newBook.new_publisher);
      }
      
      formData.append('price', newBook.price);
      formData.append('stock', newBook.stock);
      formData.append('category', newBook.category);
      formData.append('description', newBook.description);
      
      if (newBook.image) {
        formData.append('image', newBook.image);
      }

      const response = await axios.post('/api/books', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.status === 201) {
        alert('Kitap başarıyla eklendi');
        setAddDialog(false);
        setNewBook({
          title: '',
          author: '',
          publisher_id: '',
          new_publisher: '',
          price: '',
          stock: '',
          category: '',
          description: '',
          image: null
        });
        fetchData();
      }
    } catch (error) {
      console.error('Kitap eklenirken hata:', error);
      alert(error.response?.data?.error || 'Kitap eklenirken bir hata oluştu');
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setNewBook({ ...newBook, image: file });
    }
  };

  const handleAddPublisher = async () => {
    try {
      await axios.post('/api/publishers', newPublisher);
      fetchPublishers();
      setOpenPublisherDialog(false);
      setNewPublisher({ name: '', description: '' });
    } catch (error) {
      console.error('Yayınevi eklenemedi:', error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Admin Paneli
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)}>
          <Tab label="Kitaplar" />
          <Tab label="Kullanıcılar" />
          <Tab label="Siparişler" />
          <Tab label="Yayınevleri" />
        </Tabs>
      </Box>

      {tab === 0 && (
        <>
          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setAddDialog(true)}
            >
              Yeni Kitap Ekle
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Başlık</TableCell>
                  <TableCell>Yazar</TableCell>
                  <TableCell>Fiyat</TableCell>
                  <TableCell>Stok</TableCell>
                  <TableCell>Satıcı</TableCell>
                  <TableCell>Yayınevi</TableCell>
                  <TableCell>İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {books.map((book) => (
                  <TableRow key={book.id}>
                    <TableCell>{book.id}</TableCell>
                    <TableCell>{book.title}</TableCell>
                    <TableCell>{book.author}</TableCell>
                    <TableCell>{book.price} TL</TableCell>
                    <TableCell>{book.stock}</TableCell>
                    <TableCell>{book.seller?.name || 'Bilinmiyor'}</TableCell>
                    <TableCell>{book.publisher?.name || 'Belirtilmemiş'}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEditBook(book)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteBook(book.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Dialog open={addDialog} onClose={() => setAddDialog(false)}>
            <DialogTitle>Yeni Kitap Ekle</DialogTitle>
            <DialogContent>
              <TextField
                fullWidth
                label="Başlık"
                value={newBook.title}
                onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Yazar"
                value={newBook.author}
                onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                margin="normal"
                required
              />
              <Autocomplete
                fullWidth
                freeSolo
                options={publishers}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') return option;
                  return option?.name || '';
                }}
                value={publishers.find(p => p.id === newBook.publisher_id) || newBook.new_publisher || null}
                onChange={(event, newValue) => {
                  if (newValue && typeof newValue === 'object') {
                    // Var olan yayınevini seç
                    setNewBook({ 
                      ...newBook, 
                      publisher_id: newValue.id,
                      new_publisher: ''
                    });
                  } else if (typeof newValue === 'string') {
                    // Yeni yayınevi adı
                    setNewBook({
                      ...newBook,
                      publisher_id: '',
                      new_publisher: newValue
                    });
                  } else {
                    // Seçim temizlendi
                    setNewBook({
                      ...newBook,
                      publisher_id: '',
                      new_publisher: ''
                    });
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Yayınevi (seçin veya yeni girin)"
                    margin="normal"
                    required
                    error={!newBook.publisher_id && !newBook.new_publisher}
                    helperText={!newBook.publisher_id && !newBook.new_publisher ? "Yayınevi seçin veya yeni bir yayınevi girin" : ""}
                  />
                )}
              />
              <TextField
                fullWidth
                label="Fiyat"
                type="number"
                value={newBook.price}
                onChange={(e) => setNewBook({ ...newBook, price: e.target.value })}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Stok"
                type="number"
                value={newBook.stock}
                onChange={(e) => setNewBook({ ...newBook, stock: e.target.value })}
                margin="normal"
                required
              />
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
                    margin="normal"
                    fullWidth
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
              <TextField
                fullWidth
                label="Açıklama"
                multiline
                rows={4}
                value={newBook.description}
                onChange={(e) => setNewBook({ ...newBook, description: e.target.value })}
                margin="normal"
              />
              <FormControl fullWidth margin="normal">
                <FormLabel>Kitap Resmi</FormLabel>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </FormControl>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setAddDialog(false)}>İptal</Button>
              <Button 
                onClick={handleAddBook} 
                variant="contained"
                disabled={!newBook.title || !newBook.author || !newBook.price || !newBook.stock || (!newBook.publisher_id && !newBook.new_publisher)}
              >
                Ekle
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}

      {tab === 1 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Ad</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Kayıt Tarihi</TableCell>
                <TableCell>Kitap Sayısı</TableCell>
                <TableCell>Sipariş Sayısı</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString('tr-TR')}</TableCell>
                  <TableCell>{user.book_count}</TableCell>
                  <TableCell>{user.order_count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {tab === 2 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Sipariş ID</TableCell>
                <TableCell>Kullanıcı</TableCell>
                <TableCell>Tutar</TableCell>
                <TableCell>Durum</TableCell>
                <TableCell>Tarih</TableCell>
                <TableCell>İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.id}</TableCell>
                  <TableCell>{order.user.name}</TableCell>
                  <TableCell>{order.total_amount} TL</TableCell>
                  <TableCell>
                    <Chip
                      label={order.status === 'completed' ? 'Tamamlandı' : 
                             order.status === 'pending' ? 'Beklemede' : 'İptal Edildi'}
                      color={getStatusColor(order.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{new Date(order.created_at).toLocaleDateString('tr-TR')}</TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                      disabled={order.status === 'completed'}
                    >
                      Tamamla
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                      disabled={order.status === 'cancelled'}
                    >
                      İptal Et
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {tab === 3 && (
        <>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenPublisherDialog(true)}
            sx={{ mb: 2 }}
          >
            Yeni Yayınevi Ekle
          </Button>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Yayınevi Adı</TableCell>
                  <TableCell>Kitap Sayısı</TableCell>
                  <TableCell>Açıklama</TableCell>
                  <TableCell>İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {publishers.map((publisher) => (
                  <TableRow key={publisher.id}>
                    <TableCell>{publisher.name}</TableCell>
                    <TableCell>{publisher.book_count}</TableCell>
                    <TableCell>{publisher.description}</TableCell>
                    <TableCell>
                      {/* Düzenleme ve silme butonları */}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Dialog open={openPublisherDialog} onClose={() => setOpenPublisherDialog(false)}>
            <DialogTitle>Yeni Yayınevi Ekle</DialogTitle>
            <DialogContent>
              <TextField
                fullWidth
                label="Yayınevi Adı"
                value={newPublisher.name}
                onChange={(e) => setNewPublisher({ ...newPublisher, name: e.target.value })}
                sx={{ mt: 2 }}
              />
              <TextField
                fullWidth
                label="Açıklama"
                value={newPublisher.description}
                onChange={(e) => setNewPublisher({ ...newPublisher, description: e.target.value })}
                multiline
                rows={4}
                sx={{ mt: 2 }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenPublisherDialog(false)}>İptal</Button>
              <Button onClick={handleAddPublisher} variant="contained">
                Ekle
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}

      <Dialog open={editDialog} onClose={() => setEditDialog(false)}>
        <DialogTitle>Kitap Düzenle</DialogTitle>
        <DialogContent>
          {selectedBook && (
            <>
              <TextField
                fullWidth
                label="Başlık"
                value={selectedBook.title}
                onChange={(e) => setSelectedBook({ ...selectedBook, title: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Yazar"
                value={selectedBook.author}
                onChange={(e) => setSelectedBook({ ...selectedBook, author: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Fiyat"
                type="number"
                value={selectedBook.price}
                onChange={(e) => setSelectedBook({ ...selectedBook, price: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Stok"
                type="number"
                value={selectedBook.stock}
                onChange={(e) => setSelectedBook({ ...selectedBook, stock: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Kategori"
                value={selectedBook.category || ''}
                onChange={(e) => setSelectedBook({ ...selectedBook, category: e.target.value })}
                margin="normal"
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>İptal</Button>
          <Button onClick={handleSaveBook} variant="contained">
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminPanel; 