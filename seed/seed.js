const mongoose = require('mongoose');
const Product = require('../models/product');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Error connecting to MongoDB:', err));

// Function to read JSON files
const readJsonFile = (filePath) => {
    try {
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        console.error(`Error reading file ${filePath}:`, err);
        return [];
    }
};

// Path to the seed data folder
const seedDataPath = path.join(__dirname, 'seed-data');

// Read all JSON files in the seed-data folder
const decorativePaints = readJsonFile(path.join(seedDataPath, 'decorative-paints.json'));
const automotivePaints = readJsonFile(path.join(seedDataPath, 'automotive-paints.json'));
const industrialPaints = readJsonFile(path.join(seedDataPath, 'industrial-paints.json'));
const roadMarkingPaints = readJsonFile(path.join(seedDataPath, 'road-marking-paints.json'));
const thinners = readJsonFile(path.join(seedDataPath, 'thinners.json'));
const adhesives = readJsonFile(path.join(seedDataPath, 'adhesives.json'));

// Combine all products
const allProducts = [
    ...decorativePaints,
    ...automotivePaints,
    ...industrialPaints,
    ...roadMarkingPaints,
    ...thinners,
    ...adhesives
];

// Insert all products into the database
const insertAllProducts = async () => {
    try {
        // Clear existing data
        await Product.deleteMany({});
        console.log('Existing products deleted');

        // Log products with missing or empty image fields
        allProducts.forEach((product, index) => {
            if (!product.image || product.image.trim() === '') {
                console.error(`Product at index ${index} is missing an image:`, product);
            }
        });

        // Insert new products
        await Product.insertMany(allProducts);
        console.log('All products inserted successfully');
    } catch (err) {
        console.error('Error inserting products:', err);
    } finally {
        mongoose.connection.close();
    }
};

// Run the script
insertAllProducts();