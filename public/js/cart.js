document.addEventListener('DOMContentLoaded', () => {
    displayCartItems();
});

// Fetch and display cart items
async function displayCartItems() {
    const token = localStorage.getItem('token');
    const cartProducts = document.querySelector('.cart-products');
    const orderSummary = document.querySelector('.order-summary .summary-details');

    if (!token) {
        window.location.href = '/login';
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
            throw new Error('Failed to fetch cart items');
        }

        const data = await response.json();
        const cart = data.cart;

        // Clear existing content
        cartProducts.innerHTML = '<h2>Your Cart</h2>';
        orderSummary.innerHTML = '';

        if (cart.length === 0) {
            cartProducts.innerHTML += '<p>Your cart is empty.</p>';
            orderSummary.innerHTML = '<p>Subtotal: <span>$0.00</span></p>';
            return;
        }

        // Render cart items
        cart.forEach(item => {
            const product = item.productId;

            // Skip items with invalid or missing product details
            if (!product || !product.image || !product.name || !product.price) {
                console.warn('Skipping invalid cart item:', item);
                return;
            }

            // In the displayCartItems function, update the cartItemHTML template:
const cartItemHTML = `
<div class="cart-item">
    <img src="${product.image}" alt="${product.name}" class="cart-item-image">
    <div class="cart-item-details">
        <h3>${product.name}</h3>
        <p>Price: $${product.price.toFixed(2)}</p>
        <p>Quantity: ${item.quantity}</p>
        <button class="remove-button" onclick="removeFromCart('${product._id}')">Remove</button>
    </div>
</div>
`;
            cartProducts.innerHTML += cartItemHTML;
        });

        // Calculate and display order summary
        const subtotal = cart.reduce((total, item) => {
            const product = item.productId;
            if (product && product.price) {
                return total + (product.price * item.quantity);
            }
            return total;
        }, 0);

        const shipping = 5.00;
        const tax = subtotal * 0.1;
        const total = subtotal + shipping + tax;

        orderSummary.innerHTML = `
            <p>Subtotal: <span>$${subtotal.toFixed(2)}</span></p>
            <p>Shipping: <span>$${shipping.toFixed(2)}</span></p>
            <p>Tax: <span>$${tax.toFixed(2)}</span></p>
            <hr>
            <p class="total">Total: <span>$${total.toFixed(2)}</span></p>
        `;
    } catch (err) {
        console.error('Error fetching cart items:', err);
        cartProducts.innerHTML = '<p>Error loading cart items.</p>';
    }
}

// Remove a product from the cart
async function removeFromCart(productId) {
    const token = localStorage.getItem('token');

    if (!token) {
        alert('Please log in to remove items from your cart.');
        window.location.href = '/login';
        return;
    }

    try {
        const response = await fetch(`/api/cart/remove/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to remove item from cart');
        }

        const data = await response.json();
        alert(data.message);

        // Refresh the cart UI
        displayCartItems();

        // Update the cart count in the header
        updateCartCount();
    } catch (err) {
        console.error('Error removing item from cart:', err);
        alert('Failed to remove item from cart');
    }
}

// Update the cart count in the header
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

// Function to handle the Pesapal checkout process
async function checkout() {
    const token = localStorage.getItem('token');

    if (!token) {
        alert('Please log in to proceed to checkout.');
        window.location.href = '/login';
        return;
    }

    try {
        // Initiate the Pesapal Checkout process
        const response = await fetch('/api/cart/checkout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create Pesapal checkout session');
        }

        const { redirectUrl } = await response.json();

        // Redirect the user to the Pesapal payment page
        window.location.href = redirectUrl;
    } catch (err) {
        console.error('Error during checkout:', err);
        alert(`Checkout failed: ${err.message}`);
    }
}

// Setup logo redirect
function setupLogoRedirect() {
    const logo = document.querySelector('.logo-img');
    if (logo) {
        logo.addEventListener('click', () => {
            window.location.href = '/';
        });
    }
}

setupLogoRedirect();