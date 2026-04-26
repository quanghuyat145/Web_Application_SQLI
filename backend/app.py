from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import jwt
import os
from dotenv import load_dotenv
from database import Database

load_dotenv()

app = Flask(__name__)
CORS(app)


app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-change-this')
DATABASE_URL = os.getenv('DATABASE_URL', 'mysql+pymysql://root:@localhost/shop_drink')


db = Database(DATABASE_URL)



@app.route('/api/register', methods=['POST'])
def register():
    """User registration"""
    try:
        data = request.get_json()
        
        if not data.get('username') or not data.get('email') or not data.get('password'):
            return jsonify({'message': 'Vui lòng điền đầy đủ thông tin'}), 400
        
        username = data.get('username').strip()
        email = data.get('email').strip()
        password = data.get('password')
        
        if len(username) < 3 or len(username) > 20:
            return jsonify({'message': 'Tên đăng nhập phải từ 3 đến 20 ký tự'}), 400
        
        if len(password) < 6:
            return jsonify({'message': 'Mật khẩu phải có ít nhất 6 ký tự'}), 400
        
        if db.user_exists(username, email):
            return jsonify({'message': 'Tên đăng nhập hoặc email đã tồn tại'}), 409
        
        hashed_password = generate_password_hash(password)
        user_id = db.create_user(username, email, hashed_password)
        
        if user_id:
            return jsonify({
                'message': 'Đăng ký thành công',
                'user_id': user_id
            }), 201
        else:
            return jsonify({'message': 'Lỗi tạo tài khoản'}), 500
            
    except Exception as e:
        return jsonify({'message': 'Lỗi server'}), 500


@app.route('/api/login', methods=['POST'])
def login():
    """User login - WITH SQL INJECTION VULNERABILITY"""
    try:
        data = request.get_json()
        
        if not data.get('username') or not data.get('password'):
            return jsonify({'message': 'Vui lòng nhập tên đăng nhập và mật khẩu'}), 400
        
        username = data.get('username')  
        password = data.get('password')
        
        
        user = db.get_user_by_username(username)
        
        if user:
            
            
            if check_password_hash(user['password'], password):
                token = jwt.encode({
                    'user_id': user['id'],
                    'username': user['username'],
                    'is_admin': user['is_admin'],
                    'exp': datetime.utcnow().timestamp() + 86400
                }, app.config['SECRET_KEY'], algorithm='HS256')
                
                return jsonify({
                    'message': 'Đăng nhập thành công',
                    'token': token,
                    'username': user['username'],
                    'is_admin': user['is_admin']
                }), 200
            else:
                
                
                if "'" in username or "--" in username or "#" in username or "OR" in username.upper():
                    token = jwt.encode({
                        'user_id': user['id'],
                        'username': user['username'],
                        'is_admin': user['is_admin'],
                        'exp': datetime.utcnow().timestamp() + 86400
                    }, app.config['SECRET_KEY'], algorithm='HS256')
                    
                    return jsonify({
                        'message': 'Đăng nhập thành công',
                        'token': token,
                        'username': user['username'],
                        'is_admin': user['is_admin']
                    }), 200
        
        return jsonify({'message': 'Tên đăng nhập hoặc mật khẩu sai'}), 401
        
    except Exception as e:
        return jsonify({'message': 'Lỗi server'}), 500




@app.route('/api/admin/users', methods=['GET'])
def get_all_users():
    """Get all users (admin only)"""
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        
        if not token:
            return jsonify({'message': 'Không tìm thấy token'}), 401
        
        try:
            payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            is_admin = payload.get('is_admin', 0)
            
            if not is_admin:
                return jsonify({'message': 'Bạn không có quyền truy cập'}), 403
                
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token hết hạn'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Token không hợp lệ'}), 401
        
        
        filter_username = request.args.get('username')
        users = db.get_all_users(filter_username)
        return jsonify({'users': users}), 200
    except Exception as e:
        return jsonify({'message': 'Lỗi server'}), 500


@app.route('/api/admin/users', methods=['POST'])
def create_user_admin():
    """Create new user (admin only)"""
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        
        if not token:
            return jsonify({'message': 'Không tìm thấy token'}), 401
        
        try:
            payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            is_admin = payload.get('is_admin', 0)
            
            if not is_admin:
                return jsonify({'message': 'Bạn không có quyền truy cập'}), 403
                
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Token không hợp lệ'}), 401
        
        data = request.get_json()
        
        if not data.get('username') or not data.get('email') or not data.get('password'):
            return jsonify({'message': 'Vui lòng điền đầy đủ thông tin'}), 400
        
        username = data.get('username').strip()
        email = data.get('email').strip()
        password = data.get('password')
        
        if len(username) < 3 or len(username) > 20:
            return jsonify({'message': 'Tên đăng nhập phải từ 3 đến 20 ký tự'}), 400
        
        if len(password) < 6:
            return jsonify({'message': 'Mật khẩu phải có ít nhất 6 ký tự'}), 400
        
        if db.user_exists(username, email):
            return jsonify({'message': 'Tên đăng nhập hoặc email đã tồn tại'}), 409
        
        hashed_password = generate_password_hash(password)
        user_id = db.create_user(username, email, hashed_password, is_admin=0)
        
        if user_id:
            return jsonify({
                'message': 'Tạo user thành công',
                'user_id': user_id
            }), 201
        else:
            return jsonify({'message': 'Lỗi tạo user'}), 500
            
    except Exception as e:
        return jsonify({'message': 'Lỗi server'}), 500


@app.route('/api/products', methods=['GET'])
def get_products():
    """Get all products"""
    try:
        products = db.get_all_products()
        return jsonify(products), 200
    except Exception as e:
        return jsonify({'message': 'Lỗi server'}), 500


if __name__ == '__main__':
    db.init_db()
    db.add_sample_products()
    app.run(debug=True, host='0.0.0.0', port=5000)