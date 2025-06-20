const express = require('express');
const router = express.Router();
const { submitOrder, checkPaymentStatus } = require('../utils/pesapal');

// Checkout route
router.post('/checkout', async (req, res) => {
    const { amount, description, customer } = req.body;

    try {
        const orderDetails = {
            amount,
            description,
            callback_url: 'https://yourwebsite.com/payment-callback', // Callback URL for Pesapal
            customer,
        };

        const pesapalResponse = await submitOrder(orderDetails);
        res.json({ redirectUrl: pesapalResponse.redirect_url }); // Redirect user to Pesapal payment page
    } catch (error) {
        res.status(500).json({ message: 'Payment processing failed', error: error.message });
    }
});

// Payment callback route
router.get('/payment-callback', async (req, res) => {
    const { pesapal_merchant_reference, pesapal_transaction_tracking_id } = req.query;

    try {
        const paymentStatus = await checkPaymentStatus(pesapal_merchant_reference);
        if (paymentStatus.status === 'COMPLETED') {
            // Payment was successful
            res.redirect('/checkout-success'); // Redirect to success page
        } else {
            // Payment failed or is pending
            res.redirect('/checkout-failed'); // Redirect to failure page
        }
    } catch (error) {
        res.status(500).json({ message: 'Error checking payment status', error: error.message });
    }
});

module.exports = router;