# Kitap Market Projesi

Online kitap alışveriş platformu. Kullanıcılar kitap satabilir, satın alabilir ve yönetebilir.

## Özellikler

### Kullanıcı İşlemleri
- Kayıt olma ve giriş yapma
- Google ile giriş yapma
- Profil yönetimi
- Bakiye yönetimi

### Kitap İşlemleri
- Kitap listeleme ve arama
- Kitap ekleme, düzenleme ve silme
- Yayınevi seçimi veya yeni yayınevi ekleme
- Kitap resmi yükleme

### Alışveriş İşlemleri
- Sepete ekleme
- Sipariş oluşturma
- Sipariş geçmişi görüntüleme

### Admin Paneli
- Tüm kitapları yönetme
- Kullanıcıları yönetme
- Siparişleri yönetme
- Yayınevlerini yönetme

## Kurulum

### Backend Kurulum
\\\ash
# Backend klasörüne git
cd backend

# Gerekli paketleri yükle
pip install -r requirements.txt

# Uygulamayı başlat
python main.py
\\\

### Frontend Kurulum
\\\ash
# Frontend klasörüne git
cd frontend

# Bağımlılıkları yükle
npm install

# Uygulamayı başlat
npm start
\\\

## Kullanım

### Admin Hesabı
- Email: admin@admin.com
- Şifre: admin123

### Normal Kullanıcı
1. Kayıt ol veya giriş yap
2. Kitapları görüntüle ve sepete ekle
3. Siparişi tamamla
4. Sipariş geçmişini görüntüle

### Satıcı Olarak
1. 'Kitaplarım' sayfasına git
2. 'Yeni Kitap Ekle' butonuna tıkla
3. Kitap bilgilerini gir ve kaydet

## Teknolojiler

### Backend
- Python
- Flask
- SQLAlchemy
- JWT Authentication
- SQLite veritabanı

### Frontend
- React
- Material-UI (MUI)
- Axios
- React Router
- Google OAuth