const express = require('express');
const fyersModel = require('fyers-api-v3').fyersModel;
const app = express();
require('dotenv').config();
const axios = require("axios");

const port = process.env.PORT || 8000; // Use environment variable for port

// Middleware to parse JSON requests
app.use(express.json());

// Initialize Fyers API
const fyers = new fyersModel({
    path: "./",
    enableLogging: false
});

// Set your App ID and Redirect URL
const APP_ID = process.env.APP_ID;
const SECRET_KEY = process.env.SECRET_KEY;
const REDIRECT_URL = process.env.REDIRECT_URL;

fyers.setAppId(APP_ID);
fyers.setRedirectUrl(REDIRECT_URL);

let accessToken; // Declare globally to use in multiple routes

// Step 3: Get Account Profile Information
app.get('/profile-info', (req, res) => {
    if (!accessToken) {
        return res.status(400).json({ message: "Access token is missing" });
    }

    fyers.get_profile().then((response) => {
        if (response.s === 'ok') {
            res.json(response);
        } else {
            res.status(400).json({ message: "Error fetching profile", error: response });
        }
    }).catch((err) => {
        res.status(500).json({ message: "Error fetching profile", error: err });
    });
});

// Step 2: Handle the callback and exchange auth code for access token
app.get('/', (req, res) => {
    const authCode = req.query.auth_code;

    if (!authCode) {
        return res.status(400).json({ message: "Auth code not found in callback" });
    }

    fyers.generate_access_token({
        client_id: APP_ID,
        secret_key: SECRET_KEY,
        auth_code: authCode
    }).then((response) => {
        if (response.s === 'ok') {
            accessToken = response.access_token; // Store the access token globally
            fyers.setAccessToken(accessToken);

            // Redirect to fetch profile after setting the token
            res.redirect('/profile-info');
        } else {
            res.status(400).json({ message: "Error generating access token", error: response });
        }
    }).catch(err => {
        res.status(500).json({ message: "Internal Server Error", error: err });
    });
});

// Step 1: Generate Auth Code URL and redirect to Fyers login
app.get('/profile', (req, res) => {
    const authUrl = fyers.generateAuthCode();
    res.redirect(authUrl); // Redirect to Fyers login
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});