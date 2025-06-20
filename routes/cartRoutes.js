const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Cart = require('../models/Cart');
const mongoose = require('mongoose');
const { submitOrder } = require('../utils/pesapal'); // Import Pesapal Get cart items
const User = require('../models/User'); 

router.get('/cart', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;

        // Find the user's cart and populate product details
        const cart = await Cart.findOne({ userId }).populate('items.productId');

        // Return an empty cart if none exists
        if (!cart) {
            return res.json({
                message: 'Cart is empty',
                cart: [],
            });
        }

        res.json({
            message: 'Cart items fetched successfully',
            cart: cart.items,
        });
    } catch (err) {
        console.error('Error fetching cart items:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Add item to cart
router.post('/cart/add', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const { productId, quantity, specialInstructions } = req.body;

        // Validate input (keep your existing validations)
        
        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }

        // Check if product already exists in cart
        const existingItem = cart.items.find(item => 
            item.productId.toString() === productId
        );

        if (existingItem) {
            existingItem.quantity += quantity;
            if (specialInstructions) {
                existingItem.specialInstructions = specialInstructions;
            }
        } else {
            cart.items.push({ productId, quantity, specialInstructions });
        }

        await cart.save();
        res.json({ message: 'Item added to cart successfully', cart });
        
    } catch (err) {
        console.error('Error adding item to cart:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Remove item from cart
router.delete('/cart/remove/:productId', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const productId = req.params.productId;

        // Find the user's cart
        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Remove the item from the cart
        cart.items = cart.items.filter(item => item.productId.toString() !== productId);

        await cart.save();

        res.json({ message: 'Item removed from cart successfully', cart });
    } catch (err) {
        console.error('Error removing item from cart:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Create a Pesapal Checkout Session
router.post('/cart/checkout', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;

        // Fetch the user's cart with populated product details
        const cart = await Cart.findOne({ userId }).populate('items.productId');

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: 'Your cart is empty' });
        }

        // Calculate the total amount and prepare item descriptions with colors
        const totalAmount = cart.items.reduce((total, item) => {
            return total + item.productId.price * item.quantity;
        }, 0);

        // Create detailed description including colors
        const itemDescriptions = cart.items.map(item => 
            `${item.productId.name} (Color: ${item.color}) x ${item.quantity}`
        ).join(', ');

        const description = `Purchase from QuickMart: ${itemDescriptions}`;

        // Fetch user details
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prepare order details for Pesapal
        const orderDetails = {
            amount: totalAmount,
            description: description, // Now includes color information
            callback_url: `${process.env.FRONTEND_URL}/payment-callback`,
            customer: {
                firstName: user.username || 'Customer',
                lastName: 'User',
                email: user.email || 'customer@example.com',
                phoneNumber: '0712345678',
            },
            // Include line items if Pesapal supports them
            line_items: cart.items.map(item => ({
                itemName: `${item.productId.name} (Color: ${item.color})`,
                quantity: item.quantity,
                unitPrice: item.productId.price,
                subtotal: item.productId.price * item.quantity,
            }))
        };

        // Submit the order to Pesapal
        const pesapalResponse = await submitOrder(orderDetails);

        // Return the Pesapal redirect URL to the frontend
        res.json({ redirectUrl: pesapalResponse.redirect_url });
    } catch (err) {
        console.error('Error creating Pesapal session:', err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

module.exports = router;