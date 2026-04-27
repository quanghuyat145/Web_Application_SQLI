const API_URL = 'http://localhost:5000';


function toggleForm() {
    const loginForm = document.querySelector('.login-form');
    const registerForm = document.querySelector('.register-form');
    
    loginForm.classList.toggle('active');
    registerForm.classList.toggle('active');
}


function togglePassword(inputId, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    const input = document.getElementById(inputId);
    console.log('Toggle password for:', inputId, 'Current type:', input.type);
    
    if (!input) return;

    if (input.type === 'password') {
        input.type = 'text';
        console.log('Changed to text');
    } else {
        input.type = 'password';
        console.log('Changed to password');
    }
}


function showMessage(message, type = 'info') {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    messageDiv.className = `message show ${type}`;
    
    setTimeout(() => {
        messageDiv.classList.remove('show');
    }, 3000);
}


document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Đăng nhập thành công!', 'success');
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', username);
            localStorage.setItem('is_admin', data.is_admin ? '1' : '0');
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 1500);
        } else {
            showMessage(data.message || 'Tên đăng nhập hoặc mật khẩu sai!', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Lỗi kết nối đến server', 'error');
    }
});


document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    
    
    if (username.length < 3) {
        showMessage('Tên đăng nhập phải có ít nhất 3 ký tự', 'error');
        return;
    }
    
    if (username.length > 20) {
        showMessage('Tên đăng nhập tối đa 20 ký tự', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('Mật khẩu phải có ít nhất 6 ký tự', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showMessage('Mật khẩu không trùng khớp!', 'error');
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessage('Email không hợp lệ!', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                email: email,
                password: password
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Đăng ký thành công! Vui lòng đăng nhập', 'success');
            document.getElementById('registerForm').reset();
            setTimeout(() => {
                toggleForm();
            }, 1500);
        } else {
            showMessage(data.message || 'Đăng ký thất bại', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Lỗi kết nối đến server', 'error');
    }
});


document.querySelectorAll('.social-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        showMessage('Tính năng này sẽ được phát triển sau', 'info');
    });
});

document.addEventListener('DOMContentLoaded', function() {
    ['loginPassword', 'regPassword', 'regConfirmPassword'].forEach(inputId => {
        const input = document.getElementById(inputId);
        if (!input) return;

        const parent = input.parentElement;
        if (!parent) return;

        parent.classList.add('password-group');
        if (!parent.querySelector(`.password-toggle[data-target="${inputId}"]`)) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'password-toggle';
            btn.dataset.target = inputId;
            btn.setAttribute('aria-label', 'Hien mat khau');
            btn.textContent = 'Hien';
            parent.appendChild(btn);
        }
    });

    const toggleButtons = document.querySelectorAll('.password-toggle');
    console.log('Found toggle buttons:', toggleButtons.length);
    
    toggleButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            console.log('Password toggle clicked');
            e.preventDefault();
            e.stopPropagation();
            
            const targetId = this.dataset.target;
            const input = targetId ? document.getElementById(targetId) : this.previousElementSibling;
            console.log('Input element:', input);
            
            if (input && input.type) {
                if (input.type === 'password') {
                    input.type = 'text';
                    this.textContent = 'An';
                    this.setAttribute('aria-label', 'An mat khau');
                    console.log('Changed to text');
                } else {
                    input.type = 'password';
                    this.textContent = 'Hien';
                    this.setAttribute('aria-label', 'Hien mat khau');
                    console.log('Changed to password');
                }
            }
        });
    });
});
