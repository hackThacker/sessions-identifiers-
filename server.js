// server.js - FINAL VERSION WITH UNIVERSAL LOGOUT

const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 4000;

// --- CONFIGURATION ---
const ACCESS_TOKEN_SECRET = 'a_very_strong_access_secret';
const REFRESH_TOKEN_SECRET = 'a_super_strong_refresh_secret';
const ACCESS_TOKEN_EXPIRATION = '15s';
const REFRESH_TOKEN_EXPIRATION = '7d';

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// --- FAKE "DATABASES" ---
const users = { 'user': { password: 'password123', name: 'Alex' } };
let sessionStore = {};
let validRefreshTokens = new Set();


// --- API ROUTES ---

// SESSION ROUTES
app.post('/session/login', (req, res) => {
    const { username, password } = req.body;
    if (users[username] && users[username].password === password) {
        const sessionId = `sid_${Date.now()}`;
        sessionStore[sessionId] = { username, name: users[username].name };
        res.cookie('sessionId', sessionId, { httpOnly: true });
        return res.json({ message: 'Session login successful!', sessionId, sessionStore });
    }
    return res.status(401).json({ message: 'Invalid credentials' });
});

app.get('/session/profile', (req, res) => {
    const { sessionId } = req.cookies;
    if (sessionId && sessionStore[sessionId]) {
        return res.json({ message: `Welcome ${sessionStore[sessionId].name} (from Session)` });
    }
    return res.status(401).json({ message: 'Unauthorized' });
});


// JWT ROUTES
app.post('/jwt/login', (req, res) => {
    const { username, password } = req.body;
    if (users[username] && users[username].password === password) {
        const userData = { username, name: users[username].name };
        const accessToken = jwt.sign(userData, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRATION });
        const refreshToken = jwt.sign(userData, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRATION });
        validRefreshTokens.add(refreshToken);
        return res.json({ accessToken, refreshToken, validRefreshTokens: Array.from(validRefreshTokens) });
    }
    return res.status(401).json({ message: 'Invalid credentials' });
});

app.get('/jwt/profile', (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    jwt.verify(token, ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Token is invalid or expired', error: err.name });
        return res.json({ message: `Welcome ${user.name} (from JWT)` });
    });
});

app.post('/jwt/refresh', (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken || !validRefreshTokens.has(refreshToken)) return res.sendStatus(403);
    jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        const accessToken = jwt.sign({ username: user.username, name: user.name }, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRATION });
        return res.json({ accessToken });
    });
});

// OAUTH ROUTES (Unchanged)
app.get('/oauth/generate-code', (req, res) => res.json({ code: `auth_code_${Date.now()}` }));
app.post('/oauth/exchange-token', (req, res) => {
    const { code } = req.body;
    if (code && code.startsWith('auth_code_')) return res.json({ accessToken: `at_${Date.now()}` });
    return res.status(400).json({ message: 'Invalid code' });
});
app.post('/oauth/get-user-photos', (req, res) => {
    const { accessToken } = req.body;
    if (accessToken && accessToken.startsWith('at_')) return res.json({ photos: ['photo1.jpg'] });
    return res.status(401).json({ message: 'Invalid Access Token' });
});


// *** NEW *** UNIVERSAL LOGOUT ROUTE
app.post('/logout', (req, res) => {
    // Clear session state
    sessionStore = {};
    res.clearCookie('sessionId');
    
    // Clear JWT state
    validRefreshTokens.clear();

    console.log("Server state cleared by universal logout.");
    res.status(200).json({ message: 'Server state cleared' });
});


// --- FINAL CATCH-ALL ---
app.use((req, res, next) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.listen(PORT, () => {
    console.log(`\n✅ Your Visual Authentication Guide is running!`);
    console.log(`🚀 Open your browser and go to: http://localhost:${PORT}`);
});