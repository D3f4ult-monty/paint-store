document.addEventListener('DOMContentLoaded', () => {
    // 1. Handle login state and UI
    const loginLink = document.getElementById('login-link');
    const userGreeting = document.getElementById('user-greeting');
    const usernameSpan = document.getElementById('username');

    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');

    if (token && username) {
        if (loginLink) loginLink.style.display = 'none';
        if (userGreeting) userGreeting.style.display = 'inline';
        if (usernameSpan) usernameSpan.textContent = username;
    }

    // 2. Registration Form Handling
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // 3. Login Form Handling
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // 4. Forgot Password Form Handling
    const forgotForm = document.getElementById('forgot-form');
    if (forgotForm) {
        forgotForm.addEventListener('submit', handleForgotPassword);
    }

    // 5. Reset Password Form Handling
    const resetForm = document.getElementById('reset-form');
    if (resetForm) {
        resetForm.addEventListener('submit', handleResetPassword);
    }
});

// Registration Handler
async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password }),
        });

        const data = await response.json();
        if (response.ok) {
            alert('Registration successful! Please log in.');
            window.location.href = '/login';
        } else {
            alert(data.message);
        }
    } catch (err) {
        console.error('Registration error:', err);
        alert('Registration failed. Please try again.');
    }
}

// Login Handler
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('username', data.username);
            window.location.href = '/';
        } else {
            alert(data.message);
        }
    } catch (err) {
        console.error('Login error:', err);
        alert('Login failed. Please try again.');
    }
}

// Forgot Password Handler
async function handleForgotPassword(e) {
    e.preventDefault();
    const email = document.getElementById('forgot-email').value;

    try {
        const response = await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });

        if (response.ok) {
            alert('Password reset email sent. Please check your inbox.');
            window.location.href = '/login';
        } else {
            const error = await response.json();
            alert(error.message || 'Failed to send reset email');
        }
    } catch (err) {
        console.error('Forgot password error:', err);
        alert('An error occurred. Please try again.');
    }
}

// Reset Password Handler
async function handleResetPassword(e) {
    e.preventDefault();
    const token = window.location.pathname.split('/').pop();
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (newPassword !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }

    try {
        const response = await fetch(`/api/auth/reset-password/${token}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: newPassword }),
        });

        if (response.ok) {
            alert('Password reset successfully! You can now login.');
            window.location.href = '/login';
        } else {
            const error = await response.json();
            alert(error.message || 'Failed to reset password');
        }
    } catch (err) {
        console.error('Reset password error:', err);
        alert('An error occurred. Please try again.');
    }
}
// Logout Handler
function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    window.location.href = '/';
}

// Add this to your DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', () => {
    // ... existing code ...
    
    // 6. Logout Handling
    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
    }
});