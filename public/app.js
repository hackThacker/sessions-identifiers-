// app.js - The Authentication Masterclass Frontend

const API_BASE_URL = 'http://localhost:4000';

// --- DOM Elements ---
const sessionLoginBtn = document.getElementById('session-login-btn');
const jwtLoginBtn = document.getElementById('jwt-login-btn');
const getProfileBtn = document.getElementById('get-profile-btn');
const logoutBtn = document.getElementById('logout-btn');
const logDisplay = document.getElementById('log-display');
const authStatus = document.getElementById('auth-status');
const accessTokenDisplay = document.getElementById('access-token-display');
const refreshTokenDisplay = document.getElementById('refresh-token-display');

// --- State Management ---
const state = {
    accessToken: null,
    refreshToken: null
};

// --- Logging Utility ---
const log = (message, type = 'step') => {
    const timestamp = new Date().toLocaleTimeString();
    logDisplay.innerHTML += `<span class="log-${type}">[${timestamp}] ${message}\n</span>`;
    logDisplay.scrollTop = logDisplay.scrollHeight;
};

// --- UI Update Functions ---
const updateUI = () => {
    state.accessToken = localStorage.getItem('accessToken');
    state.refreshToken = localStorage.getItem('refreshToken');

    accessTokenDisplay.textContent = state.accessToken || 'empty';
    refreshTokenDisplay.textContent = state.refreshToken || 'empty';

    if (state.accessToken || document.cookie.includes('sessionId')) {
        authStatus.textContent = 'Logged In';
        authStatus.classList.add('logged-in');
    } else {
        authStatus.textContent = 'Logged Out';
        authStatus.classList.remove('logged-in');
    }
};

// --- API Call Functions ---

// 1. SESSION LOGIN
sessionLoginBtn.addEventListener('click', async () => {
    await logout(); // Clear previous state
    log('▶️ Initiating Session Login...');
    const username = document.getElementById('session-username').value;
    const password = document.getElementById('session-password').value;
    
    try {
        const res = await fetch(`${API_BASE_URL}/login-session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        log(`✅ SUCCESS: Server responded with message: "${data.message}"`, 'success');
        log(`Browser has received a 'Set-Cookie' header and stored the session cookie securely.`, 'info');
    } catch (error) {
        log(`❌ ERROR: ${error.message}`, 'error');
    }
    updateUI();
});

// 2. JWT LOGIN
jwtLoginBtn.addEventListener('click', async () => {
    await logout();
    log('▶️ Initiating JWT Login...');
    const username = document.getElementById('jwt-username').value;
    const password = document.getElementById('jwt-password').value;
    
    try {
        const res = await fetch(`${API_BASE_URL}/login-jwt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        log('✅ SUCCESS: Received tokens from server.', 'success');
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        log('Access Token and Refresh Token stored in Local Storage.', 'info');
        log('Access Token (decoded payload):', 'data');
        log(JSON.stringify(JSON.parse(atob(data.accessToken.split('.')[1])), null, 2), 'data');

    } catch (error) {
        log(`❌ ERROR: ${error.message}`, 'error');
    }
    updateUI();
});

// 3. GET PROTECTED PROFILE
getProfileBtn.addEventListener('click', async () => {
    log('▶️ Attempting to access protected /profile route...');
    
    // First, try with the current access token
    const res = await makeProtectedRequest();

    // If the token was expired (403), try to refresh it
    if (res.status === 403) {
        log('Access Token expired or invalid. Attempting to refresh...', 'info');
        const refreshSuccess = await refreshToken();
        if (refreshSuccess) {
            log('Token refreshed successfully. Retrying protected request...', 'success');
            await makeProtectedRequest(); // Retry the request with the new token
        }
    }
});

async function makeProtectedRequest() {
    updateUI(); // Make sure state is fresh
    try {
        const res = await fetch(`${API_BASE_URL}/profile`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${state.accessToken}`
            },
        });
        const data = await res.json();
        if (!res.ok) {
            log(`❌ FAILED: Server responded with ${res.status}. Message: "${data.message}"`, 'error');
            if(data.error) log(`Reason: ${data.error}`, 'error');
        } else {
            log(`✅ SUCCESS: Accessed profile! Server says: "${data.message}"`, 'success');
        }
        return res; // Return the full response for status checking
    } catch (error) {
        log(`❌ NETWORK ERROR: ${error.message}`, 'error');
    }
}

async function refreshToken() {
    log('▶️ Sending Refresh Token to the server...');
    const res = await fetch(`${API_BASE_URL}/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: state.refreshToken }),
    });

    const data = await res.json();
    if (!res.ok) {
        log(`❌ REFRESH FAILED: ${data.message}`, 'error');
        return false;
    }

    localStorage.setItem('accessToken', data.accessToken);
    log('New Access Token received and stored.', 'info');
    updateUI();
    return true;
}

// 4. LOGOUT
logoutBtn.addEventListener('click', logout);

async function logout() {
    log('▶️ Logging out...');
    await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: state.refreshToken }) // Send RT to invalidate it
    });
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    log('Cleared all tokens from Local Storage and sent logout request to server.', 'info');
    updateUI();
}

// --- Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    updateUI();
    log('Masterclass UI loaded. Please choose a login method.');
});