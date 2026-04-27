const API_URL = 'http://localhost:5000';

let appliedCoupon = {
    coupon_code: '',
    discount: 0,
    final_total: null
};


document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadCart();
    bindCheckoutLabControls();
    runReflectedXssLab();
    if (document.body.classList.contains('profile-page') || document.getElementById('profileTitle')) {
        loadMyProfile();
    }
    if (document.getElementById('productsGrid')) {
        loadProducts();
    }
});


function checkAuth() {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const isAdmin = localStorage.getItem('is_admin');
    
    if (!token) {
        window.location.href = 'index.html';
        return;
    }
    
    document.getElementById('username').textContent = `Xin chào, ${username}!`;
    
    
    if (isAdmin === '1' || isAdmin === true) {
        const adminLink = document.getElementById('adminLink');
        const sidebarAdminLink = document.getElementById('sidebarAdminLink');
        if (adminLink) adminLink.style.display = 'block';
        if (sidebarAdminLink) sidebarAdminLink.style.display = 'block';
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('leftSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (!sidebar || !overlay) return;
    sidebar.classList.toggle('open');
    overlay.classList.toggle('show');
}

function closeSidebar() {
    const sidebar = document.getElementById('leftSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (!sidebar || !overlay) return;
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
}


function showMessage(message, type = 'info') {
    const messageDiv = document.getElementById('message');
    if (!messageDiv) {
        alert(message);
        return;
    }
    messageDiv.textContent = message;
    messageDiv.className = `message show ${type}`;
    
    setTimeout(() => {
        messageDiv.classList.remove('show');
    }, 3000);
}


function openBasketModal() {
    window.location.href = 'cart.html';
}

function closeBasketModal() {
    const basketModal = document.getElementById('basketModal');
    if (basketModal) {
        basketModal.style.display = 'none';
    }
}

function updateBasketModal() {
    const cart = JSON.parse(localStorage.getItem('cart')) || {};
    const basketItemsBody = document.getElementById('basketItems');
    if (!basketItemsBody) return;
    
    const cartEntries = Object.entries(cart);
    if (cartEntries.length === 0) {
        basketItemsBody.innerHTML = '<tr id="emptyBasket"><td colspan="5" class="empty-message">Giỏ hàng của bạn đang trống</td></tr>';
        const basketTotalPrice = document.getElementById('basketTotalPrice');
        if (basketTotalPrice) {
            basketTotalPrice.textContent = '0 VNĐ';
        }
        return;
    }
    
    let html = '';
    let total = 0;
    
    cartEntries.forEach(([productId, item]) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        html += `
            <tr>
                <td>${item.name}</td>
                <td>${item.price.toLocaleString()} VNĐ</td>
                <td>
                    <input type="number" value="${item.quantity}" min="1" 
                        onchange="updateQuantity(${productId}, this.value)">
                </td>
                <td>${itemTotal.toLocaleString()} VNĐ</td>
                <td>
                    <button class="btn-remove" onclick="removeFromCart(${productId})">Xóa</button>
                </td>
            </tr>
        `;
    });
    
    basketItemsBody.innerHTML = html;
    const basketTotalPrice = document.getElementById('basketTotalPrice');
    if (basketTotalPrice) {
        basketTotalPrice.textContent = total.toLocaleString() + ' VNĐ';
    }
}

function renderProfile(profile) {
    if (!profile) return;

    const profileEmailInput = document.getElementById('profileEmailInput');
    const profileUsernameInput = document.getElementById('profileUsernameInput');
    const profileStatus = document.getElementById('profileStatus');
    const savedImage = localStorage.getItem('profile_image');

    if (profileEmailInput) profileEmailInput.value = profile.email || '';
    if (profileUsernameInput) profileUsernameInput.value = profile.username || '';
    if (profileStatus) profileStatus.textContent = `User ID: ${profile.id} | Role: ${profile.is_admin ? 'Admin' : 'User'}`;
    if (savedImage) setProfileImage(savedImage);

    const profileId = document.getElementById('profileId');
    const profileUsername = document.getElementById('profileUsername');
    const profileEmail = document.getElementById('profileEmail');
    const profileRole = document.getElementById('profileRole');
    const profileTitle = document.getElementById('profileTitle');
    const profileSubtitle = document.getElementById('profileSubtitle');
    const profileAvatar = document.getElementById('profileAvatar');
    const lookupInput = document.getElementById('profileLookupId');

    if (profileId) profileId.textContent = profile.id;
    if (profileUsername) profileUsername.textContent = profile.username;
    if (profileEmail) profileEmail.textContent = profile.email;
    if (profileRole) profileRole.textContent = profile.is_admin ? 'Admin' : 'User';
    if (profileTitle) profileTitle.textContent = profile.username;
    if (profileSubtitle) profileSubtitle.textContent = profile.email;
    if (profileAvatar) profileAvatar.textContent = (profile.username || '?').slice(0, 1).toUpperCase();
    if (lookupInput) lookupInput.value = profile.id;
}

function setProfileImage(src) {
    const image = document.getElementById('profileImage');
    const fallback = document.getElementById('profileAvatarFallback');
    if (!image) return;

    image.src = src;
    image.style.display = 'block';
    if (fallback) fallback.style.display = 'none';
}

function uploadProfilePicture() {
    const input = document.getElementById('profileImageFile');
    const status = document.getElementById('profileStatus');
    if (!input || !input.files || input.files.length === 0) {
        if (status) status.textContent = 'Choose an image file first.';
        return;
    }

    const file = input.files[0];
    if (file.size > 150 * 1024 && status) {
        status.textContent = 'File is larger than 150Kb, but this lab accepts it for testing.';
    }

    const reader = new FileReader();
    reader.onload = () => {
        localStorage.setItem('profile_image', reader.result);
        setProfileImage(reader.result);
        if (status) status.textContent = 'Picture loaded locally.';
    };
    reader.readAsDataURL(file);
}

function linkProfileImage() {
    const input = document.getElementById('profileImageUrl');
    const status = document.getElementById('profileStatus');
    const url = input ? input.value.trim() : '';
    if (!url) {
        if (status) status.textContent = 'Enter an image URL first.';
        return;
    }

    localStorage.setItem('profile_image', url);
    setProfileImage(url);
    if (status) status.textContent = 'Image URL linked.';
}

function setProfileUsername() {
    const input = document.getElementById('profileUsernameInput');
    const status = document.getElementById('profileStatus');
    const username = input ? input.value.trim() : '';
    if (!username) {
        if (status) status.textContent = 'Username cannot be empty.';
        return;
    }

    localStorage.setItem('username', username);
    const headerName = document.getElementById('username');
    if (headerName) headerName.textContent = `Xin chÃ o, ${username}!`;
    if (status) status.textContent = 'Username changed in localStorage for this lab.';
}

function changePasswordLab() {
    const currentInput = document.getElementById('currentPasswordInput');
    const newInput = document.getElementById('newPasswordInput');
    const repeatInput = document.getElementById('repeatPasswordInput');
    const status = document.getElementById('profileStatus');
    const token = localStorage.getItem('token');
    if (!currentInput || !newInput || !repeatInput || !token) return;

    const params = new URLSearchParams({
        current: currentInput.value,
        new: newInput.value,
        repeat: repeatInput.value
    });

    fetch(`${API_URL}/api/user/change-password?${params.toString()}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json().then(data => ({ ok: response.ok, status: response.status, data })))
    .then(result => {
        if (status) {
            status.textContent = `${result.status}: ${result.data.message || 'No message'}`;
        }
    })
    .catch(error => {
        if (status) status.textContent = error.message;
    });
}

function loadMyProfile() {
    const token = localStorage.getItem('token');
    if (!token || !document.getElementById('profileTitle')) return;

    fetch(`${API_URL}/api/profile/me`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.profile) {
            renderProfile(data.profile);
        } else {
            showMessage(data.message || 'Khong tai duoc profile', 'error');
        }
    })
    .catch(error => {
        console.error('Error loading profile:', error);
        showMessage('Loi tai profile', 'error');
    });
}

function lookupProfileById() {
    const input = document.getElementById('profileLookupId');
    const result = document.getElementById('profileLookupResult');
    const token = localStorage.getItem('token');
    if (!input || !result || !token) return;

    fetch(`${API_URL}/api/profile/${input.value}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        result.textContent = JSON.stringify(data, null, 2);
    })
    .catch(error => {
        result.textContent = error.message;
    });
}

function runReflectedXssLab() {
    const params = new URLSearchParams(window.location.search);
    const payload = params.get('xss');
    if (!payload) return;

    const labBox = document.createElement('div');
    labBox.style.position = 'fixed';
    labBox.style.left = '24px';
    labBox.style.right = '24px';
    labBox.style.top = '120px';
    labBox.style.zIndex = '9999';
    labBox.style.padding = '16px';
    labBox.style.background = '#fff3cd';
    labBox.style.border = '1px solid #ffec99';
    labBox.style.borderRadius = '6px';
    labBox.style.boxShadow = '0 10px 30px rgba(0,0,0,.15)';
    labBox.innerHTML = `<strong>Reflected XSS Lab:</strong> ${payload}`;
    document.body.appendChild(labBox);
}

function bindCheckoutLabControls() {
    const couponBtn = document.querySelector('.coupon-btn');
    if (!couponBtn) return;

    couponBtn.addEventListener('click', applyCoupon);
}

function applyCoupon() {
    const couponInput = document.getElementById('couponInput');
    const couponCode = couponInput ? couponInput.value.trim() : '';
    const total = calculateTotal();

    fetch(`${API_URL}/api/coupon/apply`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            coupon_code: couponCode,
            total: total,
            discount: 0
        })
    })
    .then(response => response.json())
    .then(data => {
        appliedCoupon = {
            coupon_code: data.coupon_code || couponCode,
            discount: Number(data.discount) || 0,
            final_total: Number(data.final_total)
        };
        updateCheckoutTotalDisplay();
        showMessage('Coupon da duoc ap dung', 'success');
    })
    .catch(error => {
        console.error('Error applying coupon:', error);
        showMessage('Loi ap dung coupon', 'error');
    });
}


function loadProducts() {
    fetch(`${API_URL}/api/products`)
        .then(response => response.json())
        .then(data => {
            displayProducts(ensureExtraProducts(data));
        })
        .catch(error => {
            console.error('Error loading products:', error);
            
            displayProducts(getSampleProducts());
        });
}

function ensureExtraProducts(products) {
    const list = Array.isArray(products) ? [...products] : [];
    const names = list.map(p => (p.name || '').toLowerCase());
    const hasMilkTea = names.includes('tra sua') || list.some(p => Number(p.price) === 32000);
    const hasPeachTea = names.includes('tra dao') || list.some(p => Number(p.price) === 27000);
    const maxId = list.reduce((max, p) => Math.max(max, Number(p.id) || 0), 0);
    let nextId = maxId + 1;

    const extras = [
        {
            name: 'Trà Sữa',
            description: 'Trà sữa thơm béo, topping trân châu dai ngon',
            price: 32000,
            icon: '🧋',
            image: getProductImageByName('Trà Sữa')
        },
        {
            name: 'Trà Đào',
            description: 'Trà đào thanh mát, hương đào tự nhiên',
            price: 27000,
            icon: '🍑',
            image: getProductImageByName('Trà Đào')
        }
    ];

    extras.forEach(item => {
        const duplicateLabProduct = (Number(item.price) === 32000 && hasMilkTea)
            || (Number(item.price) === 27000 && hasPeachTea);
        if (!duplicateLabProduct && !names.includes(item.name.toLowerCase())) {
            list.push({ id: nextId++, ...item });
        }
    });

    return list;
}


function getSampleProducts() {
    return [
        {
            id: 1,
            name: 'Nước Cam Tươi',
            description: 'Nước cam 100% tự nhiên, không đường',
            price: 25000,
            icon: '🧡',
            image: getProductImageByName('Nước Cam Tươi')
        },
        {
            id: 2,
            name: 'Trà Xanh',
            description: 'Trà xanh nguyên chất, tốt cho sức khỏe',
            price: 20000,
            icon: '💚',
            image: getProductImageByName('Trà Xanh')
        },
        {
            id: 3,
            name: 'Cà Phê Đen',
            description: 'Cà phê đen đậm đà, hương vị tuyệt vời',
            price: 30000,
            icon: '🤎',
            image: getProductImageByName('Cà Phê Đen')
        },
        {
            id: 4,
            name: 'Nước Dâu Tây',
            description: 'Sinh tố dâu tây mềm mịn',
            price: 35000,
            icon: '❤️',
            image: getProductImageByName('Nước Dâu Tây')
        },
        {
            id: 5,
            name: 'Nước Coco',
            description: 'Nước dừa tươi mát, bổ dưỡng',
            price: 28000,
            icon: '🤍',
            image: getProductImageByName('Nước Coco')
        },
        {
            id: 6,
            name: 'Lemonade',
            description: 'Lemonade tươi mát, hương lemon tự nhiên',
            price: 22000,
            icon: '💛',
            image: getProductImageByName('Lemonade')
        },
        {
            id: 7,
            name: 'Trà Sữa',
            description: 'Trà sữa thơm béo, topping trân châu dai ngon',
            price: 32000,
            icon: '🧋',
            image: getProductImageByName('Trà Sữa')
        },
        {
            id: 8,
            name: 'Trà Đào',
            description: 'Trà đào thanh mát, hương đào tự nhiên',
            price: 27000,
            icon: '🍑',
            image: getProductImageByName('Trà Đào')
        }
    ];
}

function getProductImageByName(productName) {
    const normalized = (productName || '').toLowerCase();
    const map = {
        'nước cam tươi': 'orange',
        'trà xanh': 'tea',
        'cà phê đen': 'coffee',
        'nước dâu tây': 'strawberry',
        'nước coco': 'coco',
        'lemonade': 'lemonade',
        'trà sữa': 'milktea',
        'trà đào': 'peachtea'
    };
    return map[normalized] ? `image/${map[normalized]}.png` : '';
}

function getImageCandidates(src) {
    if (!src) return [];
    const dotIndex = src.lastIndexOf('.');
    if (dotIndex === -1) return [src];
    const base = src.slice(0, dotIndex);
    return [`.png`, `.jpg`, `.jpeg`, `.webp`].map(ext => `${base}${ext}`);
}

function handleProductImageError(img) {
    const candidatesRaw = img.dataset.candidates || '';
    const candidates = candidatesRaw ? candidatesRaw.split('|') : [];
    const currentIndex = Number(img.dataset.index || 0) + 1;
    if (currentIndex < candidates.length) {
        img.dataset.index = String(currentIndex);
        img.src = candidates[currentIndex];
        return;
    }
    const fallback = img.nextElementSibling;
    img.style.display = 'none';
    if (fallback) fallback.style.display = 'flex';
}


function displayProducts(products) {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;
    productsGrid.innerHTML = '';
    
    products.forEach(product => {
        const imgSrc = product.image || getProductImageByName(product.name);
        const candidates = getImageCandidates(imgSrc);
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="product-image">
                <img
                    src="${candidates[0] || ''}"
                    alt="${product.name}"
                    class="product-image-file"
                    data-candidates="${candidates.join('|')}"
                    data-index="0"
                    onerror="handleProductImageError(this)"
                    ${candidates.length ? '' : 'style="display:none;"'}
                >
                <div class="product-image-fallback" ${candidates.length ? 'style="display:none;"' : ''}>${product.icon || '🥤'}</div>
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-footer">
                    <span class="product-price">${product.price.toLocaleString()} VNĐ</span>
                    <div class="product-buttons">
                        <button class="btn-add-cart" onclick="addToCart(${product.id}, '${product.name}', ${product.price})">
                            Thêm
                        </button>
                        <button class="btn-review" onclick="openReviewModal(${product.id}, '${product.name}')">
                            💬
                        </button>
                    </div>
                </div>
            </div>
        `;
        productsGrid.appendChild(productCard);
    });
}


function addToCart(productId, productName, price) {
    let cart = JSON.parse(localStorage.getItem('cart')) || {};
    
    if (cart[productId]) {
        cart[productId].quantity += 1;
    } else {
        cart[productId] = {
            name: productName,
            price: price,
            quantity: 1
        };
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    loadCart();
    showMessage(`Đã thêm ${productName} vào giỏ hàng`, 'success');
}


function loadCart() {
    const cart = JSON.parse(localStorage.getItem('cart')) || {};
    const cartItemsTable = document.getElementById('cartItems');
    const totalPriceSpan = document.getElementById('totalPrice');
    const checkoutBtn = document.getElementById('cartCheckoutBtn');
    
    if (cartItemsTable) {
        cartItemsTable.innerHTML = '';
    }
    
    let totalPrice = 0;
    let isEmpty = true;
    let cartCount = 0;
    
    for (const [productId, item] of Object.entries(cart)) {
        isEmpty = false;
        cartCount += item.quantity;
        const itemTotal = item.price * item.quantity;
        totalPrice += itemTotal;
        
        if (cartItemsTable) {
            const isCheckoutPage = document.body.classList.contains('cart-order-page');
            if (isCheckoutPage) {
                const itemRow = document.createElement('tr');
                itemRow.className = 'order-item-row';
                itemRow.innerHTML = `
                    <td class="order-item-name">${item.name}</td>
                    <td class="order-item-price">${item.price.toLocaleString()}đ</td>
                    <td>
                        <div class="order-qty">
                            <button class="qty-btn" onclick="updateQuantity(${productId}, ${item.quantity - 1})">-</button>
                            <span>${item.quantity}</span>
                            <button class="qty-btn" onclick="updateQuantity(${productId}, ${item.quantity + 1})">+</button>
                        </div>
                    </td>
                    <td>
                        <button class="order-remove-btn" onclick="removeFromCart(${productId})">Remove</button>
                    </td>
                `;
                cartItemsTable.appendChild(itemRow);
            } else {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.name}</td>
                    <td>${item.price.toLocaleString()} VNĐ</td>
                    <td>
                        <input type="number" min="1" value="${item.quantity}" class="quantity-input" 
                            onchange="updateQuantity(${productId}, this.value)">
                    </td>
                    <td>${itemTotal.toLocaleString()} VNĐ</td>
                    <td>
                        <button class="btn-remove" onclick="removeFromCart(${productId})">Xóa</button>
                    </td>
                `;
                cartItemsTable.appendChild(row);
            }
        }
    }
    
    
    const cartCountSpan = document.getElementById('cartCount');
    if (cartCountSpan) {
        cartCountSpan.textContent = cartCount > 0 ? cartCount : '0';
    }
    
    if (cartItemsTable) {
        if (isEmpty) {
            if (document.body.classList.contains('cart-order-page')) {
                cartItemsTable.innerHTML = '<tr><td colspan="4" class="empty-message checkout-empty">Giỏ hàng trống</td></tr>';
            } else {
                cartItemsTable.innerHTML = '<tr><td colspan="5" class="empty-message">Giỏ hàng của bạn đang trống</td></tr>';
            }
        }
    }
    
    if (totalPriceSpan) {
        totalPriceSpan.textContent = document.body.classList.contains('cart-order-page')
            ? `${totalPrice.toLocaleString()}đ`
            : `${totalPrice.toLocaleString()} VNĐ`;
    }
    if (checkoutBtn) {
        checkoutBtn.disabled = isEmpty;
    }
    updateBasketModal();
}


function updateCheckoutTotalDisplay(totalOverride) {
    const totalPriceSpan = document.getElementById('totalPrice');
    if (!totalPriceSpan) return;

    const subtotal = typeof totalOverride === 'number' ? totalOverride : calculateTotal();
    const finalTotal = appliedCoupon.final_total !== null ? appliedCoupon.final_total : subtotal;
    totalPriceSpan.textContent = document.body.classList.contains('cart-order-page')
        ? `${finalTotal.toLocaleString()}d`
        : `${finalTotal.toLocaleString()} VND`;
}


function updateQuantity(productId, quantity) {
    const cart = JSON.parse(localStorage.getItem('cart')) || {};
    
    if (quantity <= 0) {
        removeFromCart(productId);
    } else {
        cart[productId].quantity = parseInt(quantity);
        localStorage.setItem('cart', JSON.stringify(cart));
        loadCart();
    }
}


function removeFromCart(productId) {
    const cart = JSON.parse(localStorage.getItem('cart')) || {};
    delete cart[productId];
    localStorage.setItem('cart', JSON.stringify(cart));
    loadCart();
    showMessage('Đã xóa sản phẩm khỏi giỏ hàng', 'success');
}


function checkout() {
    const cart = JSON.parse(localStorage.getItem('cart')) || {};
    
    if (Object.keys(cart).length === 0) {
        showMessage('Giỏ hàng của bạn đang trống', 'error');
        return;
    }
    
    const token = localStorage.getItem('token');
    const subtotal = calculateTotal();
    const discount = Number(appliedCoupon.discount) || 0;
    const finalTotal = appliedCoupon.final_total !== null ? Number(appliedCoupon.final_total) : subtotal - discount;
    
    
    fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            items: cart,
            coupon_code: appliedCoupon.coupon_code,
            client_subtotal: subtotal,
            discount: discount,
            final_total: finalTotal,
            total_price: finalTotal
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showMessage('Đặt hàng thành công! Cảm ơn bạn đã mua sắm', 'success');
            localStorage.removeItem('cart');
            loadCart();
            closeBasketModal();
        } else {
            showMessage(data.message || 'Lỗi khi đặt hàng', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showMessage('Lỗi kết nối đến server', 'error');
    });
}


function calculateTotal() {
    const cart = JSON.parse(localStorage.getItem('cart')) || {};
    let total = 0;
    
    for (const item of Object.values(cart)) {
        total += item.price * item.quantity;
    }
    
    return total;
}


function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('cart');
    window.location.href = 'index.html';
}


document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href !== '#') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeSidebar();
    }
});


function loadAdminPanel() {
    const token = localStorage.getItem('token');
    const isAdmin = localStorage.getItem('is_admin');
    
    if (isAdmin !== '1' && isAdmin !== true) {
        showMessage('Bạn không có quyền truy cập chức năng này', 'error');
        return;
    }
    
    
    document.getElementById('admin').style.display = 'block';
    
    
    loadUsers();
    
    
    document.getElementById('addUserForm').onsubmit = handleAddUser;
}

function loadUsers() {
    const token = localStorage.getItem('token');
    
    fetch(`${API_URL}/api/admin/users`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (response.status === 403) {
            showMessage('Bạn không có quyền quản lý người dùng', 'error');
            return [];
        }
        return response.json();
    })
    .then(data => {
        if (data && data.users) {
            displayUsers(data.users);
        }
    })
    .catch(error => {
        console.error('Error loading users:', error);
        showMessage('Lỗi tải danh sách người dùng', 'error');
    });
}

function displayUsers(users) {
    const usersTableBody = document.querySelector('.users-table tbody');
    usersTableBody.innerHTML = '';
    
    if (users.length === 0) {
        usersTableBody.innerHTML = '<tr><td colspan="5" class="empty-message">Không có người dùng nào</td></tr>';
        return;
    }
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>${user.is_admin === 1 ? 'Có' : 'Không'}</td>
            <td>
                <button class="btn-delete" onclick="deleteUser(${user.id}, '${user.username}')">Xóa</button>
            </td>
        `;
        usersTableBody.appendChild(row);
    });
}

function handleAddUser(e) {
    e.preventDefault();
    
    const username = document.getElementById('newUsername').value.trim();
    const email = document.getElementById('newEmail').value.trim();
    const password = document.getElementById('newPassword').value.trim();
    const token = localStorage.getItem('token');
    
    
    if (!username || !email || !password) {
        showMessage('Vui lòng điền đầy đủ thông tin', 'error');
        return;
    }
    
    if (username.length > 20) {
        showMessage('Tên đăng nhập không được vượt quá 20 ký tự', 'error');
        return;
    }
    
    if (!email.includes('@')) {
        showMessage('Email không hợp lệ', 'error');
        return;
    }
    
    
    fetch(`${API_URL}/api/admin/users`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            username: username,
            email: email,
            password: password
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showMessage('Thêm người dùng thành công', 'success');
            document.getElementById('addUserForm').reset();
            loadUsers();
        } else {
            showMessage(data.message || 'Lỗi khi thêm người dùng', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showMessage('Lỗi kết nối đến server', 'error');
    });
}

function deleteUser(userId, username) {
    if (!confirm(`Bạn có chắc chắn muốn xóa người dùng "${username}"?`)) {
        return;
    }
    
    const token = localStorage.getItem('token');
    
    fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showMessage('Xóa người dùng thành công', 'success');
            loadUsers();
        } else {
            showMessage(data.message || 'Lỗi khi xóa người dùng', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showMessage('Lỗi kết nối đến server', 'error');
    });
}


let currentProductId = null;

function openReviewModal(productId, productName) {
    currentProductId = productId;
    document.getElementById('reviewModal').style.display = 'block';
    document.getElementById('productName').textContent = productName;
    loadProductReviews(productId);
}

function closeReviewModal() {
    document.getElementById('reviewModal').style.display = 'none';
    currentProductId = null;
}

function loadProductReviews(productId) {
    fetch(`${API_URL}/api/products/${productId}/reviews`)
        .then(response => response.json())
        .then(data => {
            displayReviews(data.reviews, data.average_rating);
        })
        .catch(error => {
            console.error('Error loading reviews:', error);
            showMessage('Lỗi tải bình luận', 'error');
        });
}

function displayReviews(reviews, ratingInfo) {
    const avgDisplay = document.getElementById('avgRatingDisplay');
    const reviewsList = document.getElementById('reviewsList');
    
    
    if (ratingInfo.count > 0) {
        avgDisplay.textContent = `⭐ ${ratingInfo.average} / 5 (${ratingInfo.count} đánh giá)`;
    } else {
        avgDisplay.textContent = 'Chưa có đánh giá';
    }
    
    
    reviewsList.innerHTML = '';
    
    if (reviews.length === 0) {
        reviewsList.innerHTML = '<p style="text-align: center; color: #999;">Chưa có bình luận nào</p>';
        return;
    }
    
    reviews.forEach(review => {
        const reviewDiv = document.createElement('div');
        reviewDiv.className = 'review-item';
        reviewDiv.innerHTML = `
            <div class="review-author">${review.username}</div>
            <div class="review-rating">${'⭐'.repeat(review.rating)} (${review.rating}/5)</div>
            <div class="review-text">${review.comment}</div>
            <div class="review-meta">${new Date(review.created_at).toLocaleDateString('vi-VN')}</div>
        `;
        reviewsList.appendChild(reviewDiv);
    });
}

function submitReview(e) {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
        showMessage('Vui lòng đăng nhập để bình luận', 'error');
        return;
    }
    
    const comment = document.getElementById('reviewComment').value.trim();
    const rating = parseInt(document.getElementById('reviewRating').value);
    
    if (!comment) {
        showMessage('Bình luận không được trống', 'error');
        return;
    }
    
    fetch(`${API_URL}/api/products/${currentProductId}/reviews`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            comment: comment,
            rating: rating
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message.includes('thành công')) {
            showMessage('Cảm ơn bạn đã bình luận', 'success');
            document.getElementById('reviewForm').reset();
            loadProductReviews(currentProductId);
        } else {
            showMessage(data.message || 'Lỗi gửi bình luận', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showMessage('Lỗi kết nối', 'error');
    });
}


function loadAllFeedback() {
    fetch(`${API_URL}/api/feedback`)
        .then(response => response.json())
        .then(data => {
            displayFeedback(data.feedbacks);
        })
        .catch(error => {
            console.error('Error loading feedback:', error);
        });
}

function displayFeedback(feedbacks) {
    const feedbacksList = document.getElementById('feedbacksList');
    feedbacksList.innerHTML = '';
    
    if (feedbacks.length === 0) {
        feedbacksList.innerHTML = '<p style="text-align: center; color: #999;">Chưa có phản hồi nào</p>';
        return;
    }
    
    feedbacks.slice(0, 5).forEach(feedback => {
        const feedbackDiv = document.createElement('div');
        feedbackDiv.className = 'feedback-item';
        feedbackDiv.innerHTML = `
            <div class="feedback-author">${feedback.author}</div>
            <div class="feedback-rating">${'⭐'.repeat(feedback.rating)}</div>
            <div class="feedback-comment">${feedback.comment}</div>
            <div class="feedback-date">${new Date(feedback.created_at).toLocaleDateString('vi-VN')}</div>
        `;
        feedbacksList.appendChild(feedbackDiv);
    });
}


document.getElementById('feedbackForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const author = document.getElementById('feedbackAuthor').value.trim() || 'anonymous';
    const comment = document.getElementById('feedbackComment').value.trim();
    const rating = parseInt(document.getElementById('feedbackRating').value);
    
    if (!comment) {
        showMessage('Bình luận không được trống', 'error');
        return;
    }
    
    fetch(`${API_URL}/api/feedback`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            author: author,
            comment: comment,
            rating: rating
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.feedback_id) {
            showMessage('Cảm ơn bạn đã gửi feedback', 'success');
            document.getElementById('feedbackForm').reset();
            document.getElementById('ratingValue').textContent = '5';
            loadAllFeedback();
        } else {
            showMessage(data.message || 'Lỗi gửi feedback', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showMessage('Lỗi kết nối', 'error');
    });
});


function loadOrderHistory() {
    const token = localStorage.getItem('token');
    if (!token) {
        showMessage('Vui lòng đăng nhập', 'error');
        return;
    }
    
    document.getElementById('orderHistory').style.display = 'block';
    
    fetch(`${API_URL}/api/orders/history`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        displayOrderHistory(data.orders);
    })
    .catch(error => {
        console.error('Error loading order history:', error);
        showMessage('Lỗi tải lịch sử đặt hàng', 'error');
    });
}

function displayOrderHistory(orders) {
    const ordersList = document.getElementById('ordersList');
    ordersList.innerHTML = '';
    
    if (orders.length === 0) {
        ordersList.innerHTML = '<p style="text-align: center; color: #999;">Chưa có đơn hàng nào</p>';
        return;
    }
    
    orders.forEach(order => {
        const orderDiv = document.createElement('div');
        orderDiv.className = 'order-card';
        
        let itemsHTML = '';
        order.items.forEach(item => {
            itemsHTML += `
                <div class="order-item">
                    <span>${item.product_name} x${item.quantity}</span>
                    <span>${item.price.toLocaleString()} đ</span>
                </div>
            `;
        });
        
        orderDiv.innerHTML = `
            <div class="order-header">
                <span class="order-id">Đơn hàng #${order.id}</span>
                <span class="order-status ${order.status}">${order.status === 'pending' ? 'Đang xử lý' : 'Hoàn thành'}</span>
            </div>
            <div class="order-items">
                ${itemsHTML}
            </div>
            <div class="order-footer">
                <strong>Tổng: ${order.total_price.toLocaleString()} đ</strong><br>
                <small>${new Date(order.created_at).toLocaleDateString('vi-VN')}</small>
            </div>
        `;
        ordersList.appendChild(orderDiv);
    });
}

