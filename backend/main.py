from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os
from werkzeug.utils import secure_filename
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import timedelta
from google.oauth2 import id_token
from google.auth.transport import requests
from flask_mail import Mail, Message
import secrets
from functools import wraps
from sqlalchemy.sql import func

app = Flask(__name__)

# CORS ayarlarını basitleştir
CORS(app, 
     resources={r"/*": {"origins": "http://localhost:3000"}},
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

# Hata yakalama
@app.errorhandler(Exception)
def handle_error(error):
    print("Hata:", str(error))
    return jsonify({"error": str(error)}), 500

# OPTIONS isteklerini handle et
@app.route('/', defaults={'path': ''}, methods=['OPTIONS'])
@app.route('/<path:path>', methods=['OPTIONS'])
def handle_options(path):
    return '', 200

# Dosya yükleme ayarları
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///bookstore.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # max 16MB

# JWT konfigürasyonu
app.config['JWT_SECRET_KEY'] = 'your-secret-key'  # Güvenli bir key kullanın
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=1)
app.config['JWT_TOKEN_LOCATION'] = ['headers']
app.config['JWT_HEADER_NAME'] = 'Authorization'
app.config['JWT_HEADER_TYPE'] = 'Bearer'

jwt = JWTManager(app)

# Uploads klasörü kontrolü
if not os.path.exists(UPLOAD_FOLDER):
    try:
        os.makedirs(UPLOAD_FOLDER, mode=0o755)
        print(f"Uploads klasörü oluşturuldu: {UPLOAD_FOLDER}")
    except Exception as e:
        print(f"Uploads klasörü oluşturma hatası: {str(e)}")

# Klasör yetkilerini kontrol et
try:
    os.chmod(UPLOAD_FOLDER, 0o755)
    print("Uploads klasörü yetkileri güncellendi")
except Exception as e:
    print(f"Uploads klasörü yetki güncelleme hatası: {str(e)}")

db = SQLAlchemy(app)

# Mail ayarları - Yandex Mail için
app.config['MAIL_SERVER'] = 'smtp.yandex.com'
app.config['MAIL_PORT'] = 465
app.config['MAIL_USE_TLS'] = False
app.config['MAIL_USE_SSL'] = True
app.config['MAIL_USERNAME'] = 'your-new-email@yandex.com'  # Yandex mail adresiniz
app.config['MAIL_PASSWORD'] = 'your-yandex-password'       # Yandex şifreniz
mail = Mail(app)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Yayınevi modeli
class Publisher(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False, unique=True)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    books = db.relationship('Book', backref='publisher', lazy=True)

# Kitap modeli
class Book(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    author = db.Column(db.String(100), nullable=False)
    publisher_id = db.Column(db.Integer, db.ForeignKey('publisher.id'))  # Yayınevi ilişkisi
    price = db.Column(db.Float, nullable=False)
    stock = db.Column(db.Integer, nullable=False)
    image_url = db.Column(db.String(500))
    description = db.Column(db.Text)  # Kitap açıklaması
    category = db.Column(db.String(100))  # Kitap kategorisi
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    seller_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)  # Kitabı satan kullanıcı
    seller = db.relationship('User', backref='books')  # Kullanıcının kitapları

# Sepet modeli
class CartItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    book_id = db.Column(db.Integer, db.ForeignKey('book.id'), nullable=False)
    quantity = db.Column(db.Integer, default=1)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user = db.relationship('User', backref='cart_items')
    book = db.relationship('Book')

# Sipariş modeli
class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    total_amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(50), default='pending')  # pending, completed, cancelled
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user = db.relationship('User', backref='orders')
    items = db.relationship('OrderItem', backref='order')

class OrderItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=False)
    book_id = db.Column(db.Integer, db.ForeignKey('book.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)  # Sipariş anındaki fiyat
    book = db.relationship('Book')

# Kullanıcı modeli
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=True)
    name = db.Column(db.String(100))
    google_id = db.Column(db.String(100), unique=True, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    role = db.Column(db.String(20), default='user')
    balance = db.Column(db.Float, default=0.0)
    avatar = db.Column(db.String(200), nullable=True)  # Avatar kolonu ekle

    def __init__(self, **kwargs):
        super(User, self).__init__(**kwargs)
        if not self.username:  # Eğer username verilmemişse
            base = self.name.lower().replace(' ', '') if self.name else self.email.split('@')[0]
            username = base
            counter = 1
            while User.query.filter_by(username=username).first():
                username = f"{base}{counter}"
                counter += 1
            self.username = username

# JWT hata yönetimi
@jwt.invalid_token_loader
def invalid_token_callback(error):
    print("Invalid token:", error)
    return jsonify({
        "error": "Invalid token",
        "message": "Token geçersiz"
    }), 401

@jwt.unauthorized_loader
def unauthorized_callback(error):
    print("No token:", error)
    return jsonify({
        "error": "No token provided",
        "message": "Token bulunamadı"
    }), 401

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    print("Token expired")
    return jsonify({
        "error": "Token expired",
        "message": "Token süresi dolmuş"
    }), 401

# Admin yetkisi kontrolü için decorator
def admin_required():
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            try:
                current_user_id = get_jwt_identity()
                user = User.query.get(int(current_user_id))  # String'i int'e çevir
                
                if not user:
                    return jsonify({"error": "Kullanıcı bulunamadı"}), 404
                    
                if user.role != 'admin':
                    return jsonify({"error": "Bu işlem için admin yetkisi gerekli"}), 403
                    
                return fn(*args, **kwargs)
            except Exception as e:
                print("Admin yetki kontrolü hatası:", str(e))
                return jsonify({"error": "Yetkilendirme hatası"}), 401
                
        return decorator
    return wrapper

# Ana route
@app.route('/')
def home():
    return jsonify({"message": "Kitap Marketi API'sine Hoş Geldiniz"})

# Yayınevlerini listele
@app.route('/api/publishers', methods=['GET'])
def get_publishers():
    try:
        publishers = Publisher.query.all()
        print("Yayınevleri:", publishers)  # Backend'de veriyi kontrol et
        return jsonify([{
            'id': pub.id,
            'name': pub.name,
            'description': pub.description,
            'book_count': len(pub.books)
        } for pub in publishers])
    except Exception as e:
        print("Hata:", str(e))  # Hata varsa görelim
        return jsonify({"error": str(e)}), 500

# Yayınevi ekle (admin için)
@app.route('/api/publishers', methods=['POST'])
@jwt_required()
@admin_required()
def add_publisher():
    try:
        data = request.get_json()
        publisher = Publisher(
            name=data['name'],
            description=data.get('description', '')
        )
        db.session.add(publisher)
        db.session.commit()
        return jsonify({
            'id': publisher.id,
            'name': publisher.name,
            'description': publisher.description
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# Kitapları listele - image_url kontrolü ekle
@app.route('/api/books', methods=['GET'])
def get_books():
    try:
        books = Book.query.all()
        return jsonify([{
            'id': book.id,
            'title': book.title,
            'author': book.author,
            'price': book.price,
            'stock': book.stock,
            'image_url': f'http://localhost:5000/uploads/{book.image_url}' if book.image_url and os.path.exists(os.path.join(app.config['UPLOAD_FOLDER'], book.image_url)) else None,
            'description': book.description,
            'category': book.category
        } for book in books])
    except Exception as e:
        print("Kitap listeleme hatası:", str(e))
        return jsonify({"error": str(e)}), 500

# Kitap ekleme endpoint'i
@app.route('/api/books', methods=['POST'])
@jwt_required()
def add_book():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        # Form verilerini al
        title = request.form.get('title')
        author = request.form.get('author')
        publisher_id = request.form.get('publisher_id')
        new_publisher = request.form.get('new_publisher')  # Yeni eklenen
        price = float(request.form.get('price'))
        stock = int(request.form.get('stock'))
        category = request.form.get('category')
        description = request.form.get('description')

        # Zorunlu alanları kontrol et
        if not all([title, author, price, stock]):
            return jsonify({"error": "Eksik bilgi"}), 400

        # Yayınevi kontrolü
        if publisher_id:
            publisher = Publisher.query.get(publisher_id)
            if not publisher:
                return jsonify({"error": "Geçersiz yayınevi"}), 400
        elif new_publisher:
            # Yeni yayınevi oluştur
            publisher = Publisher(
                name=new_publisher,
                description=f"{new_publisher} yayınevi"
            )
            db.session.add(publisher)
            db.session.commit()
        else:
            return jsonify({"error": "Yayınevi bilgisi gerekli"}), 400

        # Yeni kitap oluştur
        book = Book(
            title=title,
            author=author,
            publisher_id=publisher.id,  # Yeni veya var olan yayınevi ID'si
            price=price,
            stock=stock,
            category=category,
            description=description,
            seller_id=user.id
        )

        # Dosya yükleme işlemi
        if 'image' in request.files:
            file = request.files['image']
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                unique_filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{filename}"
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], unique_filename))
                book.image_url = unique_filename

        db.session.add(book)
        db.session.commit()

        return jsonify({
            'id': book.id,
            'title': book.title,
            'author': book.author,
            'publisher': publisher.name,
            'price': book.price,
            'stock': book.stock,
            'category': book.category,
            'description': book.description,
            'image_url': f'http://localhost:5000/uploads/{book.image_url}' if book.image_url else None
        }), 201

    except Exception as e:
        db.session.rollback()
        print("Kitap ekleme hatası:", str(e))
        return jsonify({"error": str(e)}), 500

# Kitap silme endpoint'i
@app.route('/api/books/<int:id>', methods=['DELETE'])
def delete_book(id):
    try:
        book = Book.query.get_or_404(id)
        db.session.delete(book)
        db.session.commit()
        return jsonify({"message": "Kitap başarıyla silindi"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# Resim yükleme endpoint'i
@app.route('/api/upload', methods=['POST'])
def upload_file():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "Dosya bulunamadı"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "Dosya seçilmedi"}), 400
        
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            return jsonify({
                "message": "Dosya başarıyla yüklendi",
                "image_url": f"/uploads/{filename}"
            }), 200
        return jsonify({"error": "Geçersiz dosya tipi"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Yüklenen resimleri serve et
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# Resim servis etme endpoint'i
@app.route('/uploads/<path:filename>')
def serve_image(filename):
    try:
        # Dosyanın tam yolunu al
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        # Dosyanın varlığını kontrol et
        if not os.path.exists(file_path):
            print(f"Dosya bulunamadı: {file_path}")
            return '', 404

        # CORS header'larını ekle ve dosyayı gönder
        response = send_from_directory(
            app.config['UPLOAD_FOLDER'],
            filename,
            as_attachment=False
        )
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Cache-Control'] = 'public, max-age=31536000'
        return response
    except Exception as e:
        print(f"Resim servis hatası ({filename}): {str(e)}")
        return '', 404

def send_verification_email(user_email, token):
    try:
        verify_url = f"http://localhost:3000/verify-email/{token}"
        msg = Message(
            'Email Adresinizi Doğrulayın',
            sender=app.config['MAIL_USERNAME'],
            recipients=[user_email]
        )
        msg.body = f'''Merhaba,
        
Email adresinizi doğrulamak için aşağıdaki linke tıklayın:
{verify_url}

Bu linkin geçerlilik süresi 24 saattir.

Eğer bu kaydı siz yapmadıysanız, bu emaili görmezden gelebilirsiniz.

Saygılarımızla,
Kitap Marketi
'''
        print(f"Email gönderiliyor: {user_email}")  # Debug için
        mail.send(msg)
        print("Email başarıyla gönderildi")  # Debug için
        return True
    except Exception as e:
        print("Email gönderme hatası:", str(e))  # Hata detayı
        return False

# Otomatik kullanıcı adı oluşturma fonksiyonu
def generate_username(email, name=None):
    base = name.lower().replace(' ', '') if name else email.split('@')[0]
    username = base
    counter = 1
    
    while User.query.filter_by(username=username).first():
        username = f"{base}{counter}"
        counter += 1
    
    return username

# Register endpoint'ini güncelle
@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Email kontrolü
        if User.query.filter_by(email=data['email']).first():
            return jsonify({"error": "Bu email zaten kullanımda"}), 400
            
        # Otomatik kullanıcı adı oluştur
        base_username = data.get('name', '').lower().replace(' ', '') or data['email'].split('@')[0]
        username = base_username
        counter = 1
        
        # Benzersiz kullanıcı adı oluştur
        while User.query.filter_by(username=username).first():
            username = f"{base_username}{counter}"
            counter += 1
        
        # Yeni kullanıcı oluştur
        user = User(
            email=data['email'],
            username=username,
            name=data.get('name', ''),
            password=generate_password_hash(data['password']),
            balance=0.0
        )
        
        db.session.add(user)
        db.session.commit()
        
        # Token oluştur ve döndür
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            "message": "Kayıt başarılı",
            "token": access_token,  # Token'ı döndür
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "name": user.name,
                "role": user.role
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# Login endpoint'i
@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        user = User.query.filter_by(email=data['email']).first()
        
        if user and check_password_hash(user.password, data['password']):
            # Token oluştururken ID'yi string'e çevir
            access_token = create_access_token(identity=str(user.id))
            return jsonify({
                "token": access_token,
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "name": user.name,
                    "username": user.username,
                    "role": user.role
                }
            }), 200
        else:
            return jsonify({"error": "Geçersiz email veya şifre"}), 401
            
    except Exception as e:
        print("Login hatası:", str(e))
        return jsonify({"error": str(e)}), 500

# Google ile giriş
@app.route('/api/auth/google', methods=['POST'])
def google_auth():
    try:
        data = request.get_json()
        token = data['token']
        
        # Google token'ı doğrula
        idinfo = id_token.verify_oauth2_token(
            token, 
            requests.Request(), 
            "790404761945-jsoqpoadlcv6ilhrt63vgmi0eu6aq5si.apps.googleusercontent.com"
        )
        
        email = idinfo['email']
        name = idinfo['name']
        google_id = idinfo['sub']
        
        # Kullanıcıyı bul veya oluştur
        user = User.query.filter_by(email=email).first()
        if not user:
            user = User(
                email=email,
                name=name,
                google_id=google_id
            )
            db.session.add(user)
            db.session.commit()
            
        access_token = create_access_token(identity=user.id)
        return jsonify({
            "token": access_token,
            "user": {"id": user.id, "email": user.email, "name": user.name}
        })
        
    except Exception as e:
        print("Google auth error:", str(e))
        return jsonify({"error": str(e)}), 500

# Kullanıcı bilgilerini getir
@app.route('/api/auth/user', methods=['GET'])
@jwt_required()
def get_user():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        return jsonify({
            "id": user.id,
            "email": user.email,
            "name": user.name
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Kullanıcının kendi kitaplarını getir
@app.route('/api/my-books', methods=['GET'])
@jwt_required()
def get_my_books():
    try:
        user_id = get_jwt_identity()
        books = Book.query.filter_by(seller_id=user_id).all()
        return jsonify([{
            'id': book.id,
            'title': book.title,
            'author': book.author,
            'price': book.price,
            'stock': book.stock,
            'image_url': f'http://localhost:5000/uploads/{book.image_url}' if book.image_url else None,
            'description': book.description,
            'category': book.category
        } for book in books])
    except Exception as e:
        print("Kitaplar getirilirken hata:", str(e))
        return jsonify({"error": str(e)}), 500

# Sepete kitap ekle
@app.route('/api/cart', methods=['POST'])
@jwt_required()
def add_to_cart():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    # Kendi kitabını sepete ekleyemez
    book = Book.query.get_or_404(data['book_id'])
    if book.seller_id == user_id:
        return jsonify({"error": "Kendi kitabınızı sepete ekleyemezsiniz"}), 400
    
    cart_item = CartItem.query.filter_by(
        user_id=user_id, 
        book_id=data['book_id']
    ).first()
    
    if cart_item:
        cart_item.quantity += data.get('quantity', 1)
    else:
        cart_item = CartItem(
            user_id=user_id,
            book_id=data['book_id'],
            quantity=data.get('quantity', 1)
        )
        db.session.add(cart_item)
    
    db.session.commit()
    return jsonify({"message": "Kitap sepete eklendi"})

# Sepeti görüntüle
@app.route('/api/cart', methods=['GET'])
@jwt_required()
def view_cart():
    user_id = get_jwt_identity()
    cart_items = CartItem.query.filter_by(user_id=user_id).all()
    return jsonify([{
        'id': item.id,
        'book': {
            'id': item.book.id,
            'title': item.book.title,
            'price': item.book.price,
            'image_url': item.book.image_url
        },
        'quantity': item.quantity,
        'total': item.book.price * item.quantity
    } for item in cart_items])

# Siparişi tamamla
@app.route('/api/orders', methods=['POST'])
@jwt_required()
def create_order():
    try:
        user_id = get_jwt_identity()
        cart_items = CartItem.query.filter_by(user_id=user_id).all()
        
        if not cart_items:
            return jsonify({"error": "Sepetiniz boş"}), 400
            
        total_amount = 0
        order = Order(user_id=user_id, total_amount=0, status='completed')
        db.session.add(order)
        
        for item in cart_items:
            # Stok kontrolü
            if item.quantity > item.book.stock:
                db.session.rollback()
                return jsonify({"error": f"{item.book.title} için yeterli stok yok"}), 400
            
            # Sipariş detayı oluştur
            order_item = OrderItem(
                order_id=order.id,
                book_id=item.book_id,
                quantity=item.quantity,
                price=item.book.price
            )
            db.session.add(order_item)
            
            # Toplam tutarı güncelle
            total_amount += item.book.price * item.quantity
            
            # Stok güncelleme
            item.book.stock -= item.quantity
            
            # Satıcının bakiyesini güncelle
            seller = item.book.seller
            seller.balance = seller.balance + (item.book.price * item.quantity)
            
            # Sepetten kaldır
            db.session.delete(item)
        
        order.total_amount = total_amount
        db.session.commit()
        
        return jsonify({
            "message": "Sipariş başarıyla oluşturuldu",
            "order_id": order.id,
            "total_amount": total_amount
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# Siparişleri listele
@app.route('/api/orders', methods=['GET'])
@jwt_required()
def get_orders():
    user_id = get_jwt_identity()
    orders = Order.query.filter_by(user_id=user_id).all()
    return jsonify([{
        'id': order.id,
        'total_amount': order.total_amount,
        'status': order.status,
        'created_at': order.created_at,
        'items': [{
            'book_title': item.book.title,
            'quantity': item.quantity,
            'price': item.price
        } for item in order.items]
    } for order in orders])

# Sepetten ürün silme endpoint'i
@app.route('/api/cart/<int:item_id>', methods=['DELETE'])
@jwt_required()
def remove_from_cart(item_id):
    try:
        user_id = get_jwt_identity()
        cart_item = CartItem.query.filter_by(id=item_id, user_id=user_id).first()
        
        if not cart_item:
            return jsonify({"error": "Ürün bulunamadı"}), 404
            
        db.session.delete(cart_item)
        db.session.commit()
        return jsonify({"message": "Ürün sepetten silindi"})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# Sepet ürün miktarı güncelleme endpoint'i
@app.route('/api/cart/<int:item_id>', methods=['PUT'])
@jwt_required()
def update_cart_item(item_id):
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        cart_item = CartItem.query.filter_by(id=item_id, user_id=user_id).first()
        if not cart_item:
            return jsonify({"error": "Ürün bulunamadı"}), 404
            
        # Stok kontrolü
        if data['quantity'] > cart_item.book.stock:
            return jsonify({"error": "Yetersiz stok"}), 400
            
        cart_item.quantity = data['quantity']
        db.session.commit()
        
        return jsonify({
            "message": "Miktar güncellendi",
            "quantity": cart_item.quantity
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# Kitap detaylarını getir - image_url'yi tam URL olarak döndür
@app.route('/api/books/<int:id>', methods=['GET'])
def get_book(id):
    try:
        book = Book.query.get_or_404(id)
        return jsonify({
            'id': book.id,
            'title': book.title,
            'author': book.author,
            'price': book.price,
            'stock': book.stock,
            'image_url': f'http://localhost:5000/uploads/{book.image_url}' if book.image_url else None,
            'description': book.description,
            'category': book.category,
            'seller': {
                'id': book.seller_id,
                'name': book.seller.name
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Kitap güncelleme endpoint'i
@app.route('/api/books/<int:id>', methods=['PUT'])
@jwt_required()
def update_book(id):
    try:
        user_id = get_jwt_identity()
        book = Book.query.get_or_404(id)
        
        # Sadece kitabın sahibi güncelleyebilir
        if book.seller_id != user_id:
            return jsonify({"error": "Bu işlem için yetkiniz yok"}), 403
            
        data = request.get_json()
        
        book.title = data.get('title', book.title)
        book.author = data.get('author', book.author)
        book.price = data.get('price', book.price)
        book.stock = data.get('stock', book.stock)
        book.description = data.get('description', book.description)
        book.category = data.get('category', book.category)
        book.image_url = data.get('image_url', book.image_url)
        
        db.session.commit()
        return jsonify({"message": "Kitap başarıyla güncellendi"})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# Admin kitapları listele endpoint'i
@app.route('/api/admin/books', methods=['GET'])
@jwt_required()
@admin_required()
def admin_get_books():
    try:
        books = Book.query.all()
        return jsonify([{
            'id': book.id,
            'title': book.title,
            'author': book.author,
            'price': book.price,
            'stock': book.stock,
            'category': book.category,
            'seller': {
                'id': book.seller.id,
                'name': book.seller.name,
                'username': book.seller.username
            },
            'publisher': {
                'id': book.publisher.id if book.publisher else None,
                'name': book.publisher.name if book.publisher else None
            },
            'image_url': f'http://localhost:5000/uploads/{book.image_url}' if book.image_url else None
        } for book in books])
    except Exception as e:
        print("Admin kitap listeleme hatası:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/users', methods=['GET'])
@jwt_required()
@admin_required()
def admin_get_users():
    try:
        users = User.query.all()
        return jsonify([{
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'created_at': user.created_at,
            'book_count': len(user.books),
            'order_count': len(user.orders)
        } for user in users])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/orders', methods=['GET'])
@jwt_required()
@admin_required()
def admin_get_orders():
    try:
        orders = Order.query.all()
        return jsonify([{
            'id': order.id,
            'user': {
                'id': order.user.id,
                'name': order.user.name
            },
            'total_amount': order.total_amount,
            'status': order.status,
            'created_at': order.created_at
        } for order in orders])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/orders/<int:order_id>', methods=['PUT'])
@jwt_required()
@admin_required()
def admin_update_order(order_id):
    try:
        data = request.get_json()
        order = Order.query.get_or_404(order_id)
        order.status = data['status']
        db.session.commit()
        
        return jsonify({"message": "Sipariş durumu güncellendi"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/api/user/info', methods=['GET'])
@jwt_required()
def get_user_info():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        return jsonify({
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'username': user.username,
            'balance': user.balance,
            'book_count': len(user.books),
            'order_count': len(user.orders),
            'avatar': f'http://localhost:5000/uploads/{user.avatar}' if user.avatar else None
        })
    except Exception as e:
        print("Kullanıcı bilgileri getirme hatası:", str(e))
        return jsonify({"error": str(e)}), 500

# Profil güncelleme endpoint'i
@app.route('/api/user/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        data = request.get_json()
        
        if 'username' in data and data['username'] != user.username:
            if User.query.filter_by(username=data['username']).first():
                return jsonify({"error": "Bu kullanıcı adı zaten kullanımda"}), 400
            user.username = data['username']
            
        if 'name' in data:
            user.name = data['name']
            
        db.session.commit()
        
        return jsonify({
            "message": "Profil güncellendi",
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "name": user.name,
                "avatar": f'http://localhost:5000/uploads/{user.avatar}' if user.avatar else None
            }
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# Sepet sayısını getir
@app.route('/api/cart/count', methods=['GET'])
@jwt_required()
def get_cart_count():
    try:
        # String ID'yi int'e çevir
        user_id = int(get_jwt_identity())
        count = CartItem.query.filter_by(user_id=user_id).count()
        return jsonify({"count": count})
    except Exception as e:
        print("Sepet sayısı getirme hatası:", str(e))
        return jsonify({"error": str(e)}), 500

# JWT ile korunan endpoint'lerde ID'yi int'e çevirme
@jwt.user_identity_loader
def user_identity_lookup(user):
    return str(user)

@jwt.user_lookup_loader
def user_lookup_callback(_jwt_header, jwt_data):
    identity = jwt_data["sub"]
    try:
        # String ID'yi int'e çevir
        user_id = int(identity)
        return User.query.filter_by(id=user_id).one_or_none()
    except (ValueError, TypeError):
        return None

# Profil resmi yükleme endpoint'i
@app.route('/api/user/avatar', methods=['POST'])
@jwt_required()
def upload_avatar():
    try:
        if 'avatar' not in request.files:
            return jsonify({"error": "Dosya bulunamadı"}), 400
            
        file = request.files['avatar']
        if file.filename == '':
            return jsonify({"error": "Dosya seçilmedi"}), 400
            
        if not allowed_file(file.filename):
            return jsonify({"error": "Geçersiz dosya türü"}), 400

        # Güvenli dosya adı oluştur
        filename = secure_filename(file.filename)
        # Benzersiz dosya adı oluştur
        unique_filename = f"avatar_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{filename}"
        
        # Dosyayı kaydet
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(file_path)
        
        # Kullanıcının avatar'ını güncelle
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        # Eski avatar'ı sil (varsa)
        if user.avatar:
            old_avatar_path = os.path.join(app.config['UPLOAD_FOLDER'], os.path.basename(user.avatar))
            if os.path.exists(old_avatar_path):
                os.remove(old_avatar_path)
        
        # Yeni avatar URL'ini kaydet
        user.avatar = unique_filename
        db.session.commit()
        
        return jsonify({
            "message": "Profil resmi güncellendi",
            "avatar_url": f'http://localhost:5000/uploads/{unique_filename}'
        })
        
    except Exception as e:
        db.session.rollback()
        print("Avatar yükleme hatası:", str(e))
        return jsonify({"error": str(e)}), 500

# Yeni kitapları getir (son eklenenler)
@app.route('/api/books/new', methods=['GET'])
def get_new_books():
    try:
        books = Book.query.order_by(Book.created_at.desc()).limit(8).all()
        return jsonify([{
            'id': book.id,
            'title': book.title,
            'author': book.author,
            'price': book.price,
            'stock': book.stock,
            'image_url': f'http://localhost:5000/uploads/{book.image_url}' if book.image_url else None,
            'category': book.category,
            'rating': 4.5,  # Örnek değer
            'review_count': 128  # Örnek değer
        } for book in books])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Çok satan kitapları getir
@app.route('/api/books/trending', methods=['GET'])
def get_trending_books():
    try:
        # Örnek olarak rastgele 8 kitap döndürüyoruz
        books = Book.query.order_by(func.random()).limit(8).all()
        return jsonify([{
            'id': book.id,
            'title': book.title,
            'author': book.author,
            'price': book.price,
            'stock': book.stock,
            'image_url': f'http://localhost:5000/uploads/{book.image_url}' if book.image_url else None,
            'category': book.category,
            'rating': 4.5,  # Örnek değer
            'review_count': 128  # Örnek değer
        } for book in books])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# İndirimli kitapları getir
@app.route('/api/books/discounted', methods=['GET'])
def get_discounted_books():
    try:
        # Örnek olarak rastgele 8 kitap döndürüyoruz
        books = Book.query.order_by(func.random()).limit(8).all()
        return jsonify([{
            'id': book.id,
            'title': book.title,
            'author': book.author,
            'price': book.price * 0.8,  # Örnek indirim
            'original_price': book.price,
            'discount': 20,  # Örnek indirim yüzdesi
            'stock': book.stock,
            'image_url': f'http://localhost:5000/uploads/{book.image_url}' if book.image_url else None,
            'category': book.category,
            'rating': 4.5,  # Örnek değer
            'review_count': 128  # Örnek değer
        } for book in books])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Önceden tanımlanmış kategoriler
BOOK_CATEGORIES = [
    'Roman',
    'Öykü',
    'Şiir',
    'Tarih',
    'Bilim',
    'Felsefe',
    'Psikoloji',
    'Çocuk Kitapları',
    'Eğitim',
    'Kişisel Gelişim',
    'Sanat',
    'Biyografi',
    'Ekonomi',
    'Siyaset',
    'Din',
    'Bilim Kurgu',
    'Fantastik',
    'Polisiye',
    'Korku',
    'Mizah'
]

# Kategorileri getiren endpoint
@app.route('/api/categories', methods=['GET'])
def get_categories():
    return jsonify(BOOK_CATEGORIES)

if __name__ == '__main__':
    with app.app_context():
        # Veritabanını sil ve yeniden oluştur
        db.drop_all()
        db.create_all()
        
        # Admin kullanıcısı oluştur
        admin = User(
            email='admin@admin.com',
            username='admin',
            password=generate_password_hash('admin123'),
            name='Admin',
            role='admin',
            balance=0.0,
            avatar=None
        )
        db.session.add(admin)

        # Örnek yayınevleri ekle
        publishers = [
            Publisher(name='Can Yayınları', description='Can Yayınları açıklaması'),
            Publisher(name='Yapı Kredi Yayınları', description='YKY açıklaması'),
            Publisher(name='İletişim Yayınları', description='İletişim açıklaması'),
            Publisher(name='İş Bankası Kültür Yayınları', description='İş Bankası açıklaması'),
            Publisher(name='Doğan Kitap', description='Doğan Kitap açıklaması'),
            Publisher(name='Remzi Kitabevi', description='Remzi Kitabevi açıklaması'),
            Publisher(name='Alfa Yayınları', description='Alfa Yayınları açıklaması'),
            Publisher(name='Pegasus Yayınları', description='Pegasus Yayınları açıklaması')
        ]
        
        for publisher in publishers:
            db.session.add(publisher)

        db.session.commit()
        print("Admin kullanıcısı ve örnek yayınevleri oluşturuldu!")
        print("Veritabanı hazır!")
        
    app.run(debug=True)
