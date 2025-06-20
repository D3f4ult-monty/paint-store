const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const productRoutes = require('./routes/productRoutes');
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');
const authMiddleware = require('./middleware/authMiddleware');
const cartRoutes = require('./routes/cartRoutes');
const pesapalRoutes = require('./routes/pesapalRoutes'); // Import Pesapal routes
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Error connecting to MongoDB:', err));

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Use product routes
app.use('/api', productRoutes);

// Use cart routes
app.use('/api', cartRoutes);

// Use authentication routes
app.use('/api/auth', authRoutes);

// Use Pesapal routes
app.use('/api/pesapal', pesapalRoutes);

// Serve HTML files from the "views" folder
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'paint-store.html'));
});

app.get('/cart', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'cart.html'));
});

app.get('/checkout-success', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'checkout-success.html'));
});

app.get('/checkout-failed', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'checkout-failed.html'));
});

app.get('/category/:category', (req, res) => {
    const category = decodeURIComponent(req.params.category);
    res.sendFile(path.join(__dirname, 'views', 'category-products.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'register.html'));
});

app.get('/test-category', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'test-category.html'));
});

app.get('/forgot-password', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'forgot-password.html'));
});

app.get('/reset-password/:token', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'reset-password.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});