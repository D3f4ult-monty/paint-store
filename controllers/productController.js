const Product = require('../models/Product.js');

// Get all products
const getProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get all categories
const getCategories = async (req, res) => {
    try {
        const categories = await Product.distinct('category');
        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get products by category
const getProductsByCategory = async (req, res) => {
    try {
        const category = req.params.category;
        const products = await Product.find({ category });
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get random products from each category
const getRandomProducts = async (req, res) => {
    try {
        const categories = await Product.distinct('category');
        const randomProducts = await Promise.all(
            categories.map(async (category) => {
                const productsInCategory = await Product.find({ category });
                const randomIndex = Math.floor(Math.random() * productsInCategory.length);
                return productsInCategory[randomIndex];
            })
        );
        res.json(randomProducts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    getProducts,
    getCategories,
    getProductsByCategory,
    getRandomProducts,
};