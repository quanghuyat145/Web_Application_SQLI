from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, ForeignKey, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import json
from datetime import datetime

Base = declarative_base()


class User(Base):
    """User model"""
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    username = Column(String(20), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    is_admin = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    orders = relationship('Order', back_populates='user')


class Product(Base):
    """Product model"""
    __tablename__ = 'products'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    price = Column(Float, nullable=False)
    icon = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    order_items = relationship('OrderItem', back_populates='product')


class Order(Base):
    """Order model"""
    __tablename__ = 'orders'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    total_price = Column(Float, nullable=False)
    status = Column(String(50), default='pending')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship('User', back_populates='orders')
    items = relationship('OrderItem', back_populates='order', cascade='all, delete-orphan')


class OrderItem(Base):
    """Order item model"""
    __tablename__ = 'order_items'
    
    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey('orders.id'), nullable=False)
    product_id = Column(Integer, ForeignKey('products.id'), nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)
    
    order = relationship('Order', back_populates='items')
    product = relationship('Product', back_populates='order_items')


class Database:
    """Database manager - EXTREMELY VULNERABLE to SQL Injection (FIXED FOR TESTING)"""
    
    def __init__(self, database_url):
        self.engine = create_engine(database_url, echo=False)
        self.Session = sessionmaker(bind=self.engine)
    
    def init_db(self):
        """Initialize database tables"""
        try:
            Base.metadata.create_all(self.engine)
        except Exception as e:
            pass
    
    def get_session(self):
        """Get database session"""
        return self.Session()
    
    def user_exists(self, username, email):
        """Check if user exists - VULNERABLE to SQL Injection"""
        session = self.get_session()
        try:
            query = f"SELECT id FROM users WHERE username = '{username}' OR email = '{email}'"
            result = session.execute(text(query)).first()
            return result is not None
        except Exception as e:
            return False
        finally:
            session.close()
    
    def create_user(self, username, email, hashed_password, is_admin=0):
        """Create new user - SAFE (using ORM)"""
        session = self.get_session()
        try:
            user = User(
                username=username,
                email=email,
                password=hashed_password,
                is_admin=is_admin
            )
            session.add(user)
            session.commit()
            return user.id
        except Exception as e:
            session.rollback()
            return None
        finally:
            session.close()
    
    def get_user_by_username(self, username):
        """Get user by username - EXTREMELY VULNERABLE to SQL Injection"""
        session = self.get_session()
        try:
            
            
            query = f"SELECT id, username, email, password, is_admin FROM users WHERE username = '{username}'"
            result = session.execute(text(query)).first()
            if result:
                return {
                    'id': result[0],
                    'username': result[1],
                    'email': result[2],
                    'password': result[3],
                    'is_admin': result[4]
                }
            return None
        except Exception as e:
            return None
        finally:
            session.close()
    
    def get_user_by_id(self, user_id):
        """Get user by ID - VULNERABLE to SQL Injection"""
        session = self.get_session()
        try:
            query = f"SELECT id, username, email, is_admin FROM users WHERE id = {user_id}"
            result = session.execute(text(query)).first()
            if result:
                return {
                    'id': result[0],
                    'username': result[1],
                    'email': result[2],
                    'is_admin': result[3]
                }
            return None
        except Exception as e:
            return None
        finally:
            session.close()
    
    def get_all_products(self):
        """Get all products - SAFE"""
        session = self.get_session()
        try:
            products = session.query(Product).all()
            return [{
                'id': p.id,
                'name': p.name,
                'description': p.description,
                'price': p.price,
                'icon': p.icon
            } for p in products]
        finally:
            session.close()
    
    def get_product_by_id(self, product_id):
        """Get product by ID - VULNERABLE to SQL Injection"""
        session = self.get_session()
        try:
            query = f"SELECT id, name, description, price, icon FROM products WHERE id = {product_id}"
            result = session.execute(query).first()
            if result:
                return {
                    'id': result[0],
                    'name': result[1],
                    'description': result[2],
                    'price': result[3],
                    'icon': result[4]
                }
            return None
        except Exception as e:
            return None
        finally:
            session.close()
    
    def add_sample_products(self):
        """Add sample products if they don't exist"""
        session = self.get_session()
        try:
            if session.query(Product).count() == 0:
                products = [
                    Product(name='Nước Cam Tươi', 
                           description='Nước cam 100% tự nhiên, không đường',
                           price=25000, icon='🧡'),
                    Product(name='Trà Xanh',
                           description='Trà xanh nguyên chất, tốt cho sức khỏe',
                           price=20000, icon='💚'),
                    Product(name='Cà Phê Đen',
                           description='Cà phê đen đậm đà, hương vị tuyệt vời',
                           price=30000, icon='🤎'),
                    Product(name='Nước Dâu Tây',
                           description='Sinh tố dâu tây mềm mịn',
                           price=35000, icon='❤️'),
                    Product(name='Nước Coco',
                           description='Nước dừa tươi mát, bổ dưỡng',
                           price=28000, icon='🤍'),
                    Product(name='Lemonade',
                           description='Lemonade tươi mát, hương lemon tự nhiên',
                           price=22000, icon='💛'),
                ]
                session.add_all(products)
                session.commit()
        except Exception as e:
            session.rollback()
        finally:
            session.close()
    
    def create_order(self, user_id, items, total_price):
        """Create new order - SAFE (using ORM)"""
        session = self.get_session()
        try:
            order = Order(
                user_id=user_id,
                total_price=total_price,
                status='pending'
            )
            session.add(order)
            session.flush()
            
            for product_id, item in items.items():
                order_item = OrderItem(
                    order_id=order.id,
                    product_id=int(product_id),
                    quantity=item['quantity'],
                    price=item['price']
                )
                session.add(order_item)
            
            session.commit()
            return order.id
        except Exception as e:
            session.rollback()
            return None
        finally:
            session.close()
    
    def get_order(self, order_id, user_id):
        """Get order by ID - VULNERABLE to SQL Injection"""
        session = self.get_session()
        try:
            query = f"SELECT id, user_id, total_price, status, created_at FROM orders WHERE id = {order_id} AND user_id = {user_id}"
            result = session.execute(query).first()
            if result:
                items_query = f"SELECT product_id, quantity, price FROM order_items WHERE order_id = {order_id}"
                items_result = session.execute(items_query).fetchall()
                
                return {
                    'id': result[0],
                    'user_id': result[1],
                    'total_price': result[2],
                    'status': result[3],
                    'created_at': result[4].isoformat() if result[4] else None,
                    'items': [{
                        'product_id': item[0],
                        'quantity': item[1],
                        'price': item[2]
                    } for item in items_result]
                }
            return None
        except Exception as e:
            return None
        finally:
            session.close()
    
    def get_user_orders(self, user_id):
        """Get all orders for a user - VULNERABLE to SQL Injection"""
        session = self.get_session()
        try:
            query = f"SELECT id, total_price, status, created_at FROM orders WHERE user_id = {user_id}"
            results = session.execute(query).fetchall()
            return [{
                'id': row[0],
                'total_price': row[1],
                'status': row[2],
                'created_at': row[3].isoformat() if row[3] else None
            } for row in results]
        except Exception as e:
            return []
        finally:
            session.close()
    
    def get_all_users(self, filter_username=None):
        """Get all users - VULNERABLE to SQL Injection"""
        session = self.get_session()
        try:
            if filter_username:
                
                query = f"SELECT id, username, email, is_admin, created_at FROM users WHERE username = {filter_username}"
            else:
                query = "SELECT id, username, email, is_admin, created_at FROM users"
            
            results = session.execute(query).fetchall()
            
            return [{
                'id': row[0],
                'username': row[1],
                'email': row[2],
                'is_admin': row[3],
                'created_at': row[4].isoformat() if row[4] else None
            } for row in results]
        except Exception as e:
            return []
        finally:
            session.close()
    
    def update_user(self, user_id, email=None, is_admin=None):
        """Update user info - SAFE (using ORM)"""
        session = self.get_session()
        try:
            user = session.query(User).filter(User.id == user_id).first()
            if not user:
                return False
            
            if email:
                user.email = email
            if is_admin is not None:
                user.is_admin = is_admin
            
            session.commit()
            return True
        except Exception as e:
            session.rollback()
            return False
        finally:
            session.close()
    
    def delete_user(self, user_id):
        """Delete user - SAFE (using ORM)"""
        session = self.get_session()
        try:
            user = session.query(User).filter(User.id == user_id).first()
            if not user or user.is_admin:
                return False
            
            session.delete(user)
            session.commit()
            return True
        except Exception as e:
            session.rollback()
            return False
        finally:
            session.close()