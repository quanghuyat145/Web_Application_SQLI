from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from urllib.request import urlopen
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


def decode_token():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        return None, (jsonify({'message': 'Khong tim thay token'}), 401)
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload, None
    except jwt.ExpiredSignatureError:
        return None, (jsonify({'message': 'Token het han'}), 401)
    except jwt.InvalidTokenError:
        return None, (jsonify({'message': 'Token khong hop le'}), 401)


def require_admin():
    payload, error = decode_token()
    if error:
        return None, error
    if not payload.get('is_admin', 0):
        return None, (jsonify({'message': 'Ban khong co quyen truy cap'}), 403)
    return payload, None


@app.route('/api/labs', methods=['GET'])
def labs():
    """List intentionally vulnerable labs for local pentest practice."""
    return jsonify({
        'warning': 'Training app only. Run on localhost/private lab network.',
        'labs': [
            {'owasp': 'A01 Broken Access Control', 'target': 'GET /api/profile/<user_id>, GET /api/orders/<order_id>'},
            {'owasp': 'A02 Cryptographic Failures', 'target': 'GET /api/debug/config leaks secret material'},
            {'owasp': 'A03 Injection', 'target': 'POST /api/login, GET /api/products/search?q=...'},
            {'owasp': 'A04 Insecure Design', 'target': 'POST /api/coupon/apply accepts negative/oversized discounts'},
            {'owasp': 'A05 Security Misconfiguration', 'target': 'Flask debug mode, CORS *, GET /api/debug/error'},
            {'owasp': 'A06 Vulnerable and Outdated Components', 'target': 'requirements.txt intentionally pinned to old lab deps'},
            {'owasp': 'A07 Identification and Authentication Failures', 'target': 'GET /api/user/change-password?current=...&new=...&repeat=...'},
            {'owasp': 'A08 Software and Data Integrity Failures', 'target': 'POST /api/orders trusts client prices and total_price'},
            {'owasp': 'A09 Security Logging and Monitoring Failures', 'target': 'Auth/admin actions are intentionally not audited'},
            {'owasp': 'A10 Server-Side Request Forgery', 'target': 'GET /api/fetch-url?url=...'}
        ]
    }), 200


@app.route('/api/register', methods=['POST'])
def register():
    """User registration"""
    try:
        data = request.get_json()
        
        if not data.get('username') or not data.get('email') or not data.get('password'):
            return jsonify({'message': 'Vui lÃ²ng Ä‘iá»n Ä‘áº§y Ä‘á»§ thÃ´ng tin'}), 400
        
        username = data.get('username').strip()
        email = data.get('email').strip()
        password = data.get('password')
        
        if len(username) < 3 or len(username) > 20:
            return jsonify({'message': 'TÃªn Ä‘Äƒng nháº­p pháº£i tá»« 3 Ä‘áº¿n 20 kÃ½ tá»±'}), 400
        
        if len(password) < 6:
            return jsonify({'message': 'Máº­t kháº©u pháº£i cÃ³ Ã­t nháº¥t 6 kÃ½ tá»±'}), 400
        
        if db.user_exists(username, email):
            return jsonify({'message': 'TÃªn Ä‘Äƒng nháº­p hoáº·c email Ä‘Ã£ tá»“n táº¡i'}), 409
        
        hashed_password = generate_password_hash(password)
        user_id = db.create_user(username, email, hashed_password)
        
        if user_id:
            return jsonify({
                'message': 'ÄÄƒng kÃ½ thÃ nh cÃ´ng',
                'user_id': user_id
            }), 201
        else:
            return jsonify({'message': 'Lá»—i táº¡o tÃ i khoáº£n'}), 500
            
    except Exception as e:
        return jsonify({'message': 'Lá»—i server'}), 500


@app.route('/api/login', methods=['POST'])
def login():
    """User login - intentionally vulnerable for auth and SQL injection labs."""
    try:
        data = request.get_json() or {}

        if not data.get('username') or not data.get('password'):
            return jsonify({'message': 'Vui long nhap username va password'}), 400

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
                    'message': 'Dang nhap thanh cong',
                    'token': token,
                    'username': user['username'],
                    'is_admin': user['is_admin']
                }), 200

            if "'" in username or "--" in username or "#" in username or "OR" in username.upper():
                token = jwt.encode({
                    'user_id': user['id'],
                    'username': user['username'],
                    'is_admin': user['is_admin'],
                    'exp': datetime.utcnow().timestamp() + 86400
                }, app.config['SECRET_KEY'], algorithm='HS256')

                return jsonify({
                    'message': 'Dang nhap thanh cong',
                    'token': token,
                    'username': user['username'],
                    'is_admin': user['is_admin']
                }), 200

        return jsonify({
            'message': 'Ten dang nhap hoac mat khau sai',
            'broken_auth_lab': 'Login failure leaks credential records without any token',
            'submitted_username': username,
            'submitted_password': password,
            'users': db.get_auth_debug_users()
        }), 401

    except Exception:
        return jsonify({'message': 'Loi server'}), 500


@app.route('/api/admin/users', methods=['GET'])
def get_all_users():
    """Get all users (admin only)"""
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        
        if not token:
            return jsonify({'message': 'KhÃ´ng tÃ¬m tháº¥y token'}), 401
        
        try:
            payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            is_admin = payload.get('is_admin', 0)
            
            if not is_admin:
                return jsonify({'message': 'Báº¡n khÃ´ng cÃ³ quyá»n truy cáº­p'}), 403
                
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token háº¿t háº¡n'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Token khÃ´ng há»£p lá»‡'}), 401
        
        
        filter_username = request.args.get('username')
        users = db.get_all_users(filter_username)
        return jsonify({'users': users}), 200
    except Exception as e:
        return jsonify({'message': 'Lá»—i server'}), 500


@app.route('/api/admin/users', methods=['POST'])
def create_user_admin():
    """Create new user (admin only)"""
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        
        if not token:
            return jsonify({'message': 'KhÃ´ng tÃ¬m tháº¥y token'}), 401
        
        try:
            payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            is_admin = payload.get('is_admin', 0)
            
            if not is_admin:
                return jsonify({'message': 'Báº¡n khÃ´ng cÃ³ quyá»n truy cáº­p'}), 403
                
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Token khÃ´ng há»£p lá»‡'}), 401
        
        data = request.get_json()
        
        if not data.get('username') or not data.get('email') or not data.get('password'):
            return jsonify({'message': 'Vui lÃ²ng Ä‘iá»n Ä‘áº§y Ä‘á»§ thÃ´ng tin'}), 400
        
        username = data.get('username').strip()
        email = data.get('email').strip()
        password = data.get('password')
        
        if len(username) < 3 or len(username) > 20:
            return jsonify({'message': 'TÃªn Ä‘Äƒng nháº­p pháº£i tá»« 3 Ä‘áº¿n 20 kÃ½ tá»±'}), 400
        
        if len(password) < 6:
            return jsonify({'message': 'Máº­t kháº©u pháº£i cÃ³ Ã­t nháº¥t 6 kÃ½ tá»±'}), 400
        
        if db.user_exists(username, email):
            return jsonify({'message': 'TÃªn Ä‘Äƒng nháº­p hoáº·c email Ä‘Ã£ tá»“n táº¡i'}), 409
        
        hashed_password = generate_password_hash(password)
        user_id = db.create_user(username, email, hashed_password, is_admin=0)
        
        if user_id:
            return jsonify({
                'message': 'Táº¡o user thÃ nh cÃ´ng',
                'user_id': user_id
            }), 201
        else:
            return jsonify({'message': 'Lá»—i táº¡o user'}), 500
            
    except Exception as e:
        return jsonify({'message': 'Lá»—i server'}), 500


@app.route('/api/products', methods=['GET'])
def get_products():
    """Get all products"""
    try:
        products = db.get_all_products()
        return jsonify(products), 200
    except Exception as e:
        return jsonify({'message': 'Lá»—i server'}), 500


@app.route('/api/admin/users/<user_id>', methods=['DELETE'])
def delete_user_admin(user_id):
    """Delete user (admin only) - user_id is intentionally not type checked."""
    try:
        _, error = require_admin()
        if error:
            return error

        if db.delete_user(user_id):
            return jsonify({'success': True, 'message': 'Xoa user thanh cong'}), 200
        return jsonify({'success': False, 'message': 'Khong the xoa user'}), 400
    except Exception:
        return jsonify({'message': 'Loi server'}), 500


@app.route('/api/products/search', methods=['GET'])
def search_products():
    """Product search - SQL injection lab."""
    q = request.args.get('q', '')
    return jsonify({'products': db.search_products(q)}), 200


@app.route('/api/products/<product_id>/reviews', methods=['GET'])
def get_product_reviews(product_id):
    """Review list - product_id is intentionally injectable."""
    reviews, average_rating = db.get_reviews(product_id)
    return jsonify({'reviews': reviews, 'average_rating': average_rating}), 200


@app.route('/api/products/<product_id>/reviews', methods=['POST'])
def create_product_review(product_id):
    """Create review - stored XSS lab through comment."""
    payload, error = decode_token()
    if error:
        return error

    data = request.get_json() or {}
    comment = data.get('comment', '')
    rating = int(data.get('rating', 5))
    review_id = db.create_review(product_id, payload.get('user_id'), comment, rating)
    if review_id:
        return jsonify({'message': 'Them binh luan thanh cong', 'review_id': review_id}), 201
    return jsonify({'message': 'Loi tao binh luan'}), 500


@app.route('/api/feedback', methods=['GET'])
def get_feedback():
    """Feedback list - intentionally returns stored HTML."""
    return jsonify({'feedbacks': db.get_feedbacks()}), 200


@app.route('/api/feedback', methods=['POST'])
def create_feedback():
    """Create feedback - stored XSS lab."""
    data = request.get_json() or {}
    author = data.get('author', 'anonymous')
    comment = data.get('comment', '')
    rating = int(data.get('rating', 5))
    feedback_id = db.create_feedback(author, comment, rating)
    if feedback_id:
        return jsonify({'message': 'Gui feedback thanh cong', 'feedback_id': feedback_id}), 201
    return jsonify({'message': 'Loi gui feedback'}), 500


@app.route('/api/orders', methods=['POST'])
def create_order():
    """Create order - intentionally trusts client-side prices, discount and final total."""
    payload, error = decode_token()
    if error:
        return error

    data = request.get_json() or {}
    items = data.get('items', {})
    client_subtotal = float(data.get('client_subtotal', data.get('total_price', 0)))
    discount = float(data.get('discount', 0))
    final_total = float(data.get('final_total', data.get('total_price', client_subtotal - discount)))
    coupon_code = data.get('coupon_code', '')
    total_price = final_total
    order_id = db.create_order(payload.get('user_id'), items, total_price)
    if order_id:
        return jsonify({
            'success': True,
            'message': 'Orders created successfully',
            'order_id': order_id,
            'coupon_code': coupon_code,
            'client_subtotal': client_subtotal,
            'discount': discount,
            'charged_total': total_price,
            'note': 'Lab vulnerable: High-level logic vulnerability'
        }), 201
    return jsonify({'success': False, 'message': 'Loi tao don hang'}), 500


@app.route('/api/orders/history', methods=['GET'])
def order_history():
    """Order history - uses user_id from token but query layer remains injectable."""
    payload, error = decode_token()
    if error:
        return error

    orders = db.get_user_orders(payload.get('user_id'))
    for order in orders:
        details = db.get_order_details(order['id'])
        order['items'] = details['items'] if details else []
    return jsonify({'orders': orders}), 200


@app.route('/api/orders/<order_id>', methods=['GET'])
def get_order_by_id(order_id):
    """Broken access control lab: any logged-in user can read any order by ID."""
    _, error = decode_token()
    if error:
        return error

    order = db.get_order_details(order_id)
    if not order:
        return jsonify({'message': 'Khong tim thay don hang'}), 404
    return jsonify({'order': order}), 200


@app.route('/api/profile/<user_id>', methods=['GET'])
def profile(user_id):
    """IDOR lab: any logged-in user can read another profile by numeric ID."""
    _, error = decode_token()
    if error:
        return error

    user = db.get_public_profile(user_id)
    if not user:
        return jsonify({'message': 'Khong tim thay user'}), 404
    return jsonify({'profile': user}), 200


@app.route('/api/profile/me', methods=['GET'])
def my_profile():
    """Get current user's profile."""
    payload, error = decode_token()
    if error:
        return error

    user = db.get_public_profile(payload.get('user_id'))
    if not user:
        return jsonify({'message': 'Khong tim thay user'}), 404
    return jsonify({'profile': user}), 200


@app.route('/api/coupon/apply', methods=['POST'])
def apply_coupon():
    """Business logic lab: client controls discount value."""
    data = request.get_json() or {}
    total = float(data.get('total', 0))
    coupon_code = data.get('coupon_code', data.get('coupon', ''))
    discount = float(data.get('discount', 0))
    if discount == 0:
        discount = {
            'SALE10': total * 0.1,
            'FREESHIP': 15000,
            'FREE100': total
        }.get(coupon_code.upper(), 0)
    return jsonify({
        'coupon_code': coupon_code,
        'original_total': total,
        'discount': discount,
        'final_total': total - discount,
        'note': 'Lab vulnerable: discount from request is not bounded'
    }), 200


@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    """Authentication weakness lab: predictable reset token."""
    data = request.get_json() or {}
    username = data.get('username', '')
    token = data.get('token', '')
    new_password = data.get('new_password', '')

    if token != f'{username}-reset':
        return jsonify({'message': 'Token reset khong hop le'}), 400
    if len(new_password) < 1:
        return jsonify({'message': 'Mat khau moi khong hop le'}), 400
    if db.update_password_by_username(username, generate_password_hash(new_password)):
        return jsonify({'message': 'Doi mat khau thanh cong bang token du doan duoc'}), 200
    return jsonify({'message': 'Khong tim thay user'}), 404


@app.route('/api/auth/debug-users', methods=['GET'])
def debug_users_without_auth():
    """Broken auth lab: credentials are exposed without any token."""
    return jsonify({
        'warning': 'Broken authentication lab: no token required',
        'users': db.get_auth_debug_users()
    }), 200


@app.route('/api/user/change-password', methods=['GET'])
@app.route('/rest/user/change-password', methods=['GET'])
def change_password_get_lab():
    """Broken auth lab: password change over GET; username mode needs no token."""
    username = request.args.get('username')
    current_password = request.args.get('current')
    new_password = request.args.get('new', '')
    repeat_password = request.args.get('repeat', '')

    if not new_password or not repeat_password:
        return jsonify({'message': 'Missing new or repeat password'}), 400
    if new_password != repeat_password:
        return jsonify({'message': 'New password and repeat password do not match'}), 400

    if username:
        user = db.get_user_by_username(username)
    else:
        payload, error = decode_token()
        if error:
            return error
        user = db.get_user_with_password_by_id(payload.get('user_id'))

    if not user:
        return jsonify({'message': 'Khong tim thay user'}), 404

    if current_password is not None and not check_password_hash(user['password'], current_password):
        return jsonify({'message': 'Current password is not correct'}), 401

    if db.update_password_by_user_id(user['id'], generate_password_hash(new_password)):
        return jsonify({
            'message': 'Password changed',
            'broken_auth_lab': 'No token is required when username is supplied and current is omitted.',
            'username': user['username']
        }), 200
    return jsonify({'message': 'Could not update password'}), 500


@app.route('/api/debug/config', methods=['GET'])
def debug_config():
    """Sensitive data exposure lab."""
    return jsonify({
        'secret_key': app.config['SECRET_KEY'],
        'database_url': DATABASE_URL,
        'debug': app.debug,
        'cors': '*'
    }), 200


@app.route('/api/debug/error', methods=['GET'])
def debug_error():
    """Security misconfiguration lab."""
    raise RuntimeError('Intentional debug error for OWASP A05 lab')


@app.route('/api/fetch-url', methods=['GET'])
def fetch_url():
    """SSRF lab. Keep this app bound to localhost/private lab networks only."""
    url = request.args.get('url', '')
    if not url:
        return jsonify({'message': 'Missing url'}), 400
    try:
        with urlopen(url, timeout=3) as response:
            body = response.read(500).decode('utf-8', errors='replace')
            return jsonify({'url': url, 'status': response.status, 'preview': body}), 200
    except Exception as e:
        return jsonify({'url': url, 'error': str(e)}), 500


if __name__ == '__main__':
    db.init_db()
    db.add_sample_products()
    db.ensure_lab_products()
    app.run(debug=True, host='127.0.0.1', port=5000, use_reloader=False)

