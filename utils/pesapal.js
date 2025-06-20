const axios = require('axios');
const crypto = require('crypto');

// Pesapal credentials
const PESAPAL_CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY;
const PESAPAL_CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET;
const PESAPAL_API_URL = process.env.PESAPAL_API_URL;

// Generate a unique transaction ID
function generateTransactionId() {
    return `TXN-${Date.now()}`;
}

// Generate OAuth signature
function generateOAuthSignature(params, method, url) {
    const baseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(params)}`;
    const signingKey = `${PESAPAL_CONSUMER_SECRET}&`;
    return crypto.createHmac('sha1', signingKey).update(baseString).digest('base64');
}

// Submit an order to Pesapal
async function submitOrder(orderDetails) {
    const { amount, description, callback_url, customer } = orderDetails;
    
    // 1. First get an access token
    const authResponse = await axios.post(
        `${PESAPAL_API_URL}/api/Auth/RequestToken`,
        {
            consumer_key: PESAPAL_CONSUMER_KEY,
            consumer_secret: PESAPAL_CONSUMER_SECRET
        },
        {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        }
    );

    const accessToken = authResponse.data.token;

    // 2. Prepare order data with PROPER IPN handling
    const orderData = {
        id: `TXN-${Date.now()}`,  // Unique transaction ID
        currency: "KES",
        amount: amount,
        description: description,
        callback_url: callback_url,
        notification_id: "3875aa92-a62d-4c89-8a6e-deb91f6e8e88",
        billing_address: {
            email_address: customer.email,
            phone_number: customer.phoneNumber || "254712345678", // Default if missing
            first_name: customer.firstName || "Customer",
            last_name: customer.lastName || "User"
        }
    };

    try {
        const response = await axios.post(
            `${PESAPAL_API_URL}/api/Transactions/SubmitOrderRequest`,
            orderData,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('Full Pesapal error:', error.response?.data || error.message);
        throw new Error('Failed to process payment');
    }
}

module.exports = { submitOrder };