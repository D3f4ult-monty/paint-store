const mongoose = require('mongoose');
const Product = require('../models/Product');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Error connecting to MongoDB:', err));

// Read all JSON files
const decorativePaints = JSON.parse(fs.readFileSync('./seed/decorative-paints.json', 'utf-8'));
const automotivePaints = JSON.parse(fs.readFileSync('./seed/automotive-paints.json', 'utf-8'));
const industrialPaints = JSON.parse(fs.readFileSync('./seed/industrial-paints.json', 'utf-8'));
const adhesives = JSON.parse(fs.readFileSync('./seed/adhesives.json', 'utf-8'));
const intermediateProducts = JSON.parse(fs.readFileSync('./seed/intermediate-products.json', 'utf-8'));
const roadMarkingPaints = JSON.parse(fs.readFileSync('./seed/roadMarking-paints.json', 'utf-8'));
const thinners = JSON.parse(fs.readFileSync('./seed/thinners.json', 'utf-8'));

// Combine all products
const allProducts = [...decorativePaints, ...automotivePaints, ...
industrialPaints,...adhesives,...intermediateProducts,...roadMarkingPaints,...thinners];

// Insert all products into the database
const insertAllProducts = async () => {
    try {
        await Product.deleteMany({}); // Clear existing data
        await Product.insertMany(allProducts);
        console.log('All products inserted successfully');
    } catch (err) {
        console.error('Error inserting products:', err);
    } finally {
        mongoose.connection.close();
    }
};

insertAllProducts();