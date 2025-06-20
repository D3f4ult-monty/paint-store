const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Get all products
router.get('/products', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Default to page 1
        const limit = 10; // Number of products per page
        const skip = (page - 1) * limit; // Calculate the number of products to skip

        const products = await Product.find().skip(skip).limit(limit); // Fetch products for the current page
        const totalProducts = await Product.countDocuments(); // Total number of products

        res.json({
            products,
            totalPages: Math.ceil(totalProducts / limit), // Total number of pages
            currentPage: page
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get products by category
router.get('/products/category/:category', async (req, res) => {
    try {
        const category = req.params.category;
        const products = await Product.find({ category });
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get random products
router.get('/products/random', async (req, res) => {
    try {
        const products = await Product.aggregate([{ $sample: { size: 5 } }]); // Get 5 random products
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/products/search', async (req, res) => {
    try {
        const query = req.query.q?.trim(); // Search query
        const selectedProductId = req.query.selectedProductId; // ID of the selected product
        const page = parseInt(req.query.page) || 1; // Pagination page
        const limit = 15; // Number of products per page
        const skip = (page - 1) * limit; // Calculate the number of products to skip

        if (!query) {
            return res.status(400).json({ message: 'Invalid search query' });
        }

        // Escape special characters in the query for regex
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Fetch matching products with pagination
        const products = await Product.find(
            { name: { $regex: escapedQuery, $options: 'i' } }, // Case-insensitive search
            { _id: 1, name: 1, price: 1, image: 1 } // Include necessary fields
        )
            .skip(skip)
            .limit(limit);

        // Get the total number of matching products
        const totalProducts = await Product.countDocuments({ name: { $regex: escapedQuery, $options: 'i' } });

        // If a selected product ID is provided, move it to the top of the list
        if (selectedProductId) {
            const selectedProductIndex = products.findIndex(p => p._id.toString() === selectedProductId);
            if (selectedProductIndex !== -1) {
                const selectedProduct = products.splice(selectedProductIndex, 1)[0]; // Remove the selected product from its current position
                products.unshift(selectedProduct); // Add it to the beginning of the list
            }
        }

        res.json({
            products,
            totalProducts,
            totalPages: Math.ceil(totalProducts / limit),
            currentPage: page,
        });
    } catch (err) {
        console.error('Error searching products:', err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

router.get('/products/category/:category', async (req, res) => {
    try {
        const category = req.params.category;
        console.log('Fetching products for category:', category); // Log the category

        // Perform a case-insensitive search for the category
        const products = await Product.find({ category: { $regex: new RegExp(`^${category}$`, 'i') } });
        console.log('Fetched products:', products); // Log the fetched products

        if (products.length === 0) {
            console.log('No products found for category:', category);
        }

        res.json(products);
    } catch (err) {
        console.error('Error fetching products by category:', err);
        res.status(500).json({ message: err.message });
    }
});

// Get a single product by ID
router.get('/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;