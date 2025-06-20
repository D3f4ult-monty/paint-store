// Global variables
let currentSearchQuery = '';
let currentPage = 1;
let currentProductModal = null;

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

function initializeApp() {
    // Clear invalid token first
    const token = localStorage.getItem('token');
    if (token && isTokenExpired(token)) {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
    }
    
    checkLoginState();
    fetchProducts();
    updateCartCount();
    setupSearchBar();
    setupHamburgerMenu();
    setupCategoryClicks();
    setupProfileDropdown();
    checkTokenExpiration();
    setupLogoRedirect();

    const mobileMenuButton = document.getElementById('mobile-menu-button');
    if (mobileMenuButton) {
        mobileMenuButton.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('sidebar').classList.toggle('active');
        });
    }
    
    // Adjust body padding for bottom nav
    document.body.style.paddingBottom = '70px';
}

// ======================
// Authentication Functions
// ======================
function checkLoginState() {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const loginLink = document.getElementById('login-link');
    const userGreeting = document.getElementById('user-greeting');
    const usernameSpan = document.getElementById('username');
    const dropdownMenu = document.getElementById('dropdown-menu');

    if (token && username && !isTokenExpired(token)) {
        loginLink.style.display = 'none';
        userGreeting.style.display = 'inline';
        usernameSpan.textContent = username;
        if (dropdownMenu) dropdownMenu.style.display = 'none';
    } else {
        // Clear invalid/expired auth data
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
        
        loginLink.style.display = 'inline';
        userGreeting.style.display = 'none';
    }
}

function isTokenExpired(token) {
    if (!token) return true;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expirationTime = payload.exp * 1000; // Convert to milliseconds
        const currentTime = Date.now();
        return currentTime > expirationTime;
    } catch (err) {
        console.error('Error decoding token:', err);
        return true;
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    window.location.href = '/';
}

function checkTokenExpiration() {
    const token = localStorage.getItem('token');
    if (isTokenExpired(token)) {
        showToast('Your session has expired. Please log in again.', true);
    }
}

// ======================
// Product Display Functions
// ======================
async function fetchProducts(page = 1) {
    try {
        const response = await fetch(`/api/products?page=${page}`);
        const data = await response.json();
        displayProducts(data.products);
        updatePaginationControls(data.totalPages, data.currentPage);
    } catch (err) {
        console.error('Error fetching products:', err);
        showToast('Failed to load products', true);
    }
}

function displayProducts(products) {
    const productContainer = document.querySelector('.product-container');
    productContainer.innerHTML = '';

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

// ======================
// Product Modal Functions
// ======================
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

        // Add modal event listeners
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

// ======================
// Cart Functions
// ======================
async function updateCartCount() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch('/api/cart', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) throw new Error('Failed to fetch cart count');
        const data = await response.json();
        const cartCount = data.cart.reduce((total, item) => total + item.quantity, 0);
        document.querySelector('.cart-btn span').textContent = cartCount;
    } catch (err) {
        console.error('Error updating cart count:', err);
    }
}

// ======================
// Search Functions
// ======================
async function handleSearch(event) {
    const query = event.target.value.trim();
    currentSearchQuery = query;
    const searchResultsDiv = document.getElementById('search-results');

    if (query.length === 0) {
        searchResultsDiv.style.display = 'none';
        return;
    }

    try {
        const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error(`Server returned ${response.status}: ${response.statusText}`);

        const data = await response.json();
        searchResultsDiv.innerHTML = '';

        if (data.products.length > 0) {
            data.products.forEach(product => {
                const resultItem = document.createElement('div');
                resultItem.textContent = product.name;
                resultItem.addEventListener('click', () => {
                    updateProductList(query, product._id);
                    searchResultsDiv.style.display = 'none';
                });
                searchResultsDiv.appendChild(resultItem);
            });
            searchResultsDiv.style.display = 'block';
        } else {
            searchResultsDiv.style.display = 'none';
        }
    } catch (err) {
        console.error('Error fetching search results:', err);
        searchResultsDiv.style.display = 'none';
    }
}

async function updateProductList(query, selectedProductId, page = 1) {
    try {
        const searchQuery = query || currentSearchQuery;
        if (!searchQuery) {
            fetchProducts(page);
            return;
        }

        const response = await fetch(`/api/products/search?q=${encodeURIComponent(searchQuery)}&selectedProductId=${selectedProductId}&page=${page}`);
        if (!response.ok) throw new Error(`Server returned ${response.status}: ${response.statusText}`);

        const data = await response.json();
        const searchResultsHeading = document.getElementById('search-results-heading');
        
        if (searchResultsHeading) {
            searchResultsHeading.textContent = `Search Results For "${searchQuery}"`;
            searchResultsHeading.style.display = 'block';
        }

        displayProducts(data.products);
        updatePaginationControls(data.totalPages, data.currentPage, searchQuery, selectedProductId);
        
    } catch (err) {
        console.error('Error updating product list:', err);
    }
}

function updatePaginationControls(totalPages, currentPage, query, selectedProductId) {
    const paginationDiv = document.getElementById('pagination');
    if (!paginationDiv) return;

    if (query) currentSearchQuery = query;
    paginationDiv.innerHTML = '';

    // Don't show pagination if there's only 1 page
    if (totalPages <= 1) return;

    // Previous arrow
    if (currentPage > 1) {
        const prevLink = document.createElement('a');
        prevLink.href = '#';
        prevLink.innerHTML = '&laquo;';
        prevLink.addEventListener('click', (e) => {
            e.preventDefault();
            updateProductList(currentSearchQuery, selectedProductId, currentPage - 1);
        });
        paginationDiv.appendChild(prevLink);
    }

    // Always show first page
    if (currentPage > 3) {
        const firstPage = createPageLink(1, currentPage, currentSearchQuery, selectedProductId);
        paginationDiv.appendChild(firstPage);
        
        if (currentPage > 4) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            paginationDiv.appendChild(ellipsis);
        }
    }

    // Show pages around current page
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
        const pageLink = createPageLink(i, currentPage, currentSearchQuery, selectedProductId);
        paginationDiv.appendChild(pageLink);
    }

    // Always show last page if needed
    if (currentPage < totalPages - 2) {
        if (currentPage < totalPages - 3) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            paginationDiv.appendChild(ellipsis);
        }
        
        const lastPage = createPageLink(totalPages, currentPage, currentSearchQuery, selectedProductId);
        paginationDiv.appendChild(lastPage);
    }

    // Next arrow
    if (currentPage < totalPages) {
        const nextLink = document.createElement('a');
        nextLink.href = '#';
        nextLink.innerHTML = '&raquo;';
        nextLink.addEventListener('click', (e) => {
            e.preventDefault();
            updateProductList(currentSearchQuery, selectedProductId, currentPage + 1);
        });
        paginationDiv.appendChild(nextLink);
    }
}

function createPageLink(pageNumber, currentPage, query, selectedProductId) {
    const pageLink = document.createElement('a');
    pageLink.href = '#';
    pageLink.textContent = pageNumber;
    if (pageNumber === currentPage) pageLink.classList.add('active');
    
    pageLink.addEventListener('click', (e) => {
        e.preventDefault();
        updateProductList(query, selectedProductId, pageNumber);
    });
    
    return pageLink;
}

// ======================
// UI Setup Functions
// ======================
function setupSearchBar() {
    const searchBar = document.querySelector('.search-bar');
    const searchResultsDiv = document.getElementById('search-results');

    if (searchBar) {
        searchBar.addEventListener('input', handleSearch);
    }

    document.addEventListener('click', (e) => {
        if (e.target !== searchBar && !searchResultsDiv.contains(e.target)) {
            searchResultsDiv.style.display = 'none';
        }
    });
}

function setupHamburgerMenu() {
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const sidebar = document.getElementById('sidebar');
    const closeBtn = document.getElementById('close-btn');

    hamburgerMenu?.addEventListener('click', () => sidebar.classList.toggle('active'));
    closeBtn?.addEventListener('click', () => sidebar.classList.remove('active'));
}

function setupCategoryClicks() {
    document.querySelectorAll('.categories-list a').forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const category = link.getAttribute('data-category');
            window.location.href = `/category/${encodeURIComponent(category)}`;
        });
    });
}

function setupProfileDropdown() {
    const profileDiv = document.querySelector('.profile');
    const dropdownMenu = document.getElementById('dropdown-menu');
    const logoutLink = document.getElementById('logout-link');

    if (profileDiv) {
        profileDiv.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
        });

        logoutLink?.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }

    document.addEventListener('click', (e) => {
        if (!profileDiv?.contains(e.target)) {
            dropdownMenu.style.display = 'none';
        }
    });
}

function setupLogoRedirect() {
    document.querySelector('.logo-img')?.addEventListener('click', () => {
        window.location.href = '/';
    });
}

// ======================
// Utility Functions
// ======================
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