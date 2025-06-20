document.addEventListener('DOMContentLoaded', () => {
    initializeCategoryPage();
});

function initializeCategoryPage() {
    checkLoginState();
    updateCartCount();
    setupHeaderInteractions();
    const category = getCategoryFromUrl();
    if (category) {
        updateSearchBarPlaceholder(category);
        loadCategoryProducts(category);  // Pass the category parameter
    } else {
        showToast('Invalid category', true);
    }
}

function loadCategoryProducts(category) {
    if (!category) {
        showToast('Invalid category', true);
        return;
    }

    // Safely update category title if element exists
    const categoryTitle = document.getElementById('category-title');
    if (categoryTitle) {
        categoryTitle.textContent = category;
    }
    
    fetch(`/api/products/category/${encodeURIComponent(category)}`)
        .then(response => response.json())
        .then(products => displayProducts(products))
        .catch(err => {
            console.error('Error loading category products:', err);
            showToast('Failed to load products', true);
        });
}

function updateSearchBarPlaceholder(category) {
    const searchBar = document.getElementById('search-bar');
    if (searchBar) {
        searchBar.placeholder = `Search in ${category}...`;
    }
}


function getCategoryFromUrl() {
    const path = window.location.pathname;
    const parts = path.split('/');
    
    const categoryEncoded = parts[parts.length - 1];

    let category = decodeURIComponent(categoryEncoded);
    
    category = category.replace(/%2F/g, '/').replace(/\+/g, ' ');
    
    return category;
}

function displayProducts(products) {
    const productContainer = document.querySelector('.product-container');
    productContainer.innerHTML = '';

    if (products.length === 0) {
        productContainer.innerHTML = '<p>No products found in this category.</p>';
        return;
    }

    products.forEach(product => {
        productContainer.innerHTML += `
            <div class="product-card" data-product-id="${product._id}">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="product-name">${product.name}</div>
                <div class="product-price">$${product.price.toFixed(2)}</div>
            </div>
        `;
    });

    // Add click handlers to product cards
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') return;
            showProductModal(card.dataset.productId);
        });
    });
}

// Product Modal Functions
let currentProductModal = null;

async function showProductModal(productId) {
    try {
        const response = await fetch(`/api/products/${productId}`);
        if (!response.ok) throw new Error('Failed to fetch product');
        const product = await response.json();

        const modalHTML = `
            <div class="product-modal" id="product-modal-${product._id}">
                <div class="modal-content">
                    <span class="close-modal">&times;</span>
                    <div class="modal-product-image">
                        <img src="${product.image}" alt="${product.name}">
                    </div>
                    <h3 class="modal-product-name">${product.name}</h3>
                    <div class="modal-product-price">$${product.price.toFixed(2)}</div>
                    
                    <div class="modal-form">
                        <div class="form-group">
                            <label for="quantity-${product._id}">Quantity:</label>
                            <input type="number" id="quantity-${product._id}" min="1" value="1" class="quantity-input">
                        </div>
                        
                        <div class="form-group">
                            <label for="special-instructions-${product._id}">Special Instructions:</label>
                            <textarea id="special-instructions-${product._id}" 
                                      placeholder="Color code, finish type, or other requirements"></textarea>
                        </div>
                        
                        <button class="add-to-cart-button" 
                                onclick="addToCartFromModal('${product._id}')">
                            Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        currentProductModal = document.getElementById(`product-modal-${product._id}`);

        // Add event listeners
        currentProductModal.querySelector('.close-modal').addEventListener('click', closeProductModal);
        currentProductModal.addEventListener('click', (e) => {
            if (e.target === currentProductModal) closeProductModal();
        });

    } catch (err) {
        console.error('Error showing product modal:', err);
        showToast('Failed to load product details', true);
    }
}

function closeProductModal() {
    if (currentProductModal) {
        currentProductModal.remove();
        currentProductModal = null;
    }
}

async function addToCartFromModal(productId) {
    const token = localStorage.getItem('token');
    if (!token || isTokenExpired(token)) {
        showToast('Please log in to add items to cart', true);
        window.location.href = '/login';
        return;
    }

    try {
        const quantity = parseInt(document.getElementById(`quantity-${productId}`).value);
        const specialInstructions = document.getElementById(`special-instructions-${productId}`).value;

        if (isNaN(quantity) || quantity < 1) {
            showToast('Please enter a valid quantity', true);
            return;
        }

        const response = await fetch('/api/cart/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                productId,
                quantity,
                specialInstructions: specialInstructions || null
            }),
        });

        if (!response.ok) throw new Error('Failed to add item to cart');
        
        const data = await response.json();
        showToast(data.message || 'Item added to cart');
        updateCartCount();
        closeProductModal();

    } catch (err) {
        console.error('Error adding to cart from modal:', err);
        showToast('Failed to add item: ' + err.message, true);
    }
}

// Utility Functions
function checkLoginState() {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const loginLink = document.getElementById('login-link');
    const userGreeting = document.getElementById('user-greeting');
    const usernameSpan = document.getElementById('username');

    if (token && username) {
        loginLink.style.display = 'none';
        userGreeting.style.display = 'inline';
        usernameSpan.textContent = username;
    } else {
        loginLink.style.display = 'inline';
        userGreeting.style.display = 'none';
    }
}

async function updateCartCount() {
    const token = localStorage.getItem('token');
    if (!token) {
        document.querySelector('.cart-btn span').textContent = '0';
        return;
    }

    try {
        const response = await fetch('/api/cart', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            if (response.status === 401) {
                // Token is invalid/expired
                localStorage.removeItem('token');
                document.querySelector('.cart-btn span').textContent = '0';
                return;
            }
            throw new Error('Failed to fetch cart count');
        }

        const data = await response.json();
        const cartCount = data.cart.reduce((total, item) => total + item.quantity, 0);
        document.querySelector('.cart-btn span').textContent = cartCount;
    } catch (err) {
        console.error('Error updating cart count:', err);
        document.querySelector('.cart-btn span').textContent = '0';
    }
}

function showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.className = `toast ${isError ? 'error' : ''}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
}

function setupHeaderInteractions() {
    setupLogoRedirect();
    setupSearchBar();
}

function setupLogoRedirect() {
    document.querySelector('.logo-img')?.addEventListener('click', () => {
        window.location.href = '/';
    });
}

function setupSearchBar() {
    const searchBar = document.querySelector('.search-bar');
    if (searchBar) {
        searchBar.addEventListener('input', handleSearch);
    }
}

async function handleSearch(event) {
    const query = event.target.value.trim();
    const category = getCategoryFromUrl();
    
    if (!query) {
        loadCategoryProducts(category);
        return;
    }

    try {
        const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}&category=${encodeURIComponent(category)}`);
        if (!response.ok) throw new Error('Failed to search products');
        
        const data = await response.json();
        displayProducts(data.products);
    } catch (err) {
        console.error('Error searching products:', err);
        showToast('Failed to search products', true);
    }
}

function isTokenExpired(token) {
    if (!token) return true;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return Date.now() > payload.exp * 1000;
    } catch (err) {
        console.error('Error decoding token:', err);
        return true;
    }
}