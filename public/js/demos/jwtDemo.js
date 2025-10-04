import { animatePacket } from '../animator.js';

// --- Reusable Helper Functions ---
const delay = ms => new Promise(res => setTimeout(res, ms));

function createStepElement(textContent) {
    const pre = document.createElement('pre');
    pre.className = 'tutorial-step-pane hidden';
    pre.textContent = textContent;
    return pre;
}

async function showStep(element, parentPane) {
    parentPane.appendChild(element);
    await delay(100);
    element.classList.remove('hidden');
    element.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

export function initJwtDemo() {
    // --- DOM Elements ---
    const browserPane = document.getElementById('browser-pane');
    const serverPane = document.getElementById('server-pane');
    const loginBtn = document.getElementById('start-login-demo-btn');
    const profileBtn = document.getElementById('start-profile-demo-btn');
    const refreshBtn = document.getElementById('start-refresh-demo-btn');
    const localStorageStatus = document.getElementById('live-localstorage-status');
    const serverStatus = document.getElementById('live-server-status');

    let isDemoRunning = false;

    // --- State Management ---
    const updateUIState = () => {
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');

        profileBtn.disabled = !accessToken;
        refreshBtn.disabled = !refreshToken;
        
        if (accessToken) {
            loginBtn.textContent = "▶️ Re-Run Login Demo";
            localStorageStatus.textContent = `accessToken: ${accessToken.substring(0,20)}...\nrefreshToken: ${refreshToken.substring(0,20)}...`;
        } else {
            localStorageStatus.textContent = 'empty';
        }
    };
    
    const clearPanes = () => {
        browserPane.innerHTML = '<div class="pane-header"><img src="assets/browser.svg" alt="Browser Icon"> You on your Browser</div>';
        serverPane.innerHTML = '<div class="pane-header"><img src="assets/server.svg" alt="Server Icon"> Web Server</div>';
    };

    // --- DEMO 1: JWT LOGIN FLOW ---
    const runLoginDemo = async () => {
        if (isDemoRunning) return;
        isDemoRunning = true;
        
        // Full reset to ensure no state leakage
        await fetch('/logout', { method: 'POST' });
        localStorage.clear();
        serverStatus.textContent = '[]';
        updateUIState();
        clearPanes();

        loginBtn.disabled = true;
        profileBtn.disabled = true;
        refreshBtn.disabled = true;

        // Step 1: Login Request
        const step1Text = `(Step 1 & 2 are the same: You log in with username/password, server validates.)`;
        const step1El = createStepElement(step1Text);
        await showStep(step1El, browserPane);
        await delay(4500);

        // Step 2: Server creates the JWT
        const res = await fetch('/jwt/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'user', password: 'password123' })
        });
        const data = await res.json();
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);

        const step2Text = `(Step 3: The Server's Work - Creating the VIP Pass)\n\n[Server's Brain 🧠]\n- Credentials are valid. It's Alex.\n- Creates the JWT Header.\n- Creates the JWT Payload: { "userId": 1, "name": "Alex..." }\n- Takes its SECRET_KEY and creates the Signature.\n- Combines all three into one long string:\n  \`HEADER.PAYLOAD.SIGNATURE\`\n- **Crucially, the server stores NOTHING.** It just\n  creates the pass and hands it over.`;
        const step2El = createStepElement(step2Text);
        await showStep(step2El, serverPane);
        serverStatus.textContent = JSON.stringify(data.validRefreshTokens, null, 2);
        await delay(5000);

        // Step 3: Server responds with the token
        const step3Text = `(Step 4: The Response - Receiving Your VIP Pass)\n\n"Welcome, Alex! Here is your VIP Pass."\n(Sends HTTP Response with JSON: { "token": "..." })\n          <--------------------------------------|`;
        const step3El = createStepElement(step3Text);
        await showStep(step3El, serverPane);
        await animatePacket('HTTP 200 OK', 'server', 'client');
        await delay(4500);

        // Step 4: Browser stores the token
        const step4Text = `[Browser's Brain 🧠]\n- "Okay, I've received a 'token'."\n- "My instructions (from the JavaScript code) are\n  to store this in a safe place."\n- Saves the JWT string in Local Storage.`;
        const step4El = createStepElement(step4Text);
        await showStep(step4El, browserPane);
        
        isDemoRunning = false;
        loginBtn.disabled = false;
        updateUIState();
    };

    // --- DEMO 2: JWT PROFILE ACCESS FLOW ---
    const runProfileDemo = async () => {
        if (isDemoRunning) return;
        isDemoRunning = true;
        clearPanes();

        loginBtn.disabled = true;
        profileBtn.disabled = true;
        refreshBtn.disabled = true;
        
        const token = localStorage.getItem('accessToken');
        const step1Text = `(Step 1: The New Request - Visiting Your Profile)\n\n[Browser's Brain 🧠]\n- "User wants to go to /profile."\n- "My JavaScript code says: before making a\n  request, get the token from Local Storage."\n- "Aha! I have the VIP Pass. I must present it\n  properly."\n- "I'll create a special 'Authorization' header\n  and put the pass inside."\n\n"Hi, I'd like /profile. Authorization: Bearer\n ${token.substring(0, 25)}..."\n(Sends GET request with Authorization header)\n |\n |-------------------------------------->`;
        const step1El = createStepElement(step1Text);
        await showStep(step1El, browserPane);
        await animatePacket(`GET /profile`, 'client', 'server');
        await delay(4500);

        const step2Text = `(Step 2: The Server's Work - Validating the VIP Pass)\n\n[Server's Brain 🧠]\n- "Request has 'Authorization' header?" -> YES.\n- Extracts the token string.\n- Reads the Header and Payload from the token.\n- **It DOES NOT trust the payload yet!**\n- It re-creates the signature itself using the\n  received Header, Payload, and its own\n  SECRET_KEY.\n- Compares its new signature with the one on the\n  token. Do they match? -> YES.\n- "This VIP Pass is authentic... I can now\n  trust the information inside it."\n- "The pass says this is Alex. I'll get Alex's\n  profile."`;
        const step2El = createStepElement(step2Text);
        await showStep(step2El, serverPane);
        await delay(5000);

        const res = await fetch('/jwt/profile', { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        
        const step3Text = `(Step 3: The Response - Getting Your Page)\n\n"Here is your profile page, Alex."\n          <--------------------------------------|`;
        const step3El = createStepElement(step3Text);
        await showStep(step3El, serverPane);
        await animatePacket(`HTTP 200 OK`, 'server', 'client');
        
        isDemoRunning = false;
        loginBtn.disabled = false;
        updateUIState();
    };

    // --- DEMO 3: REFRESH TOKEN FLOW (BONUS) ---
    const runRefreshDemo = async () => {
        if (isDemoRunning) return;
        isDemoRunning = true;
        clearPanes();

        loginBtn.disabled = true;
        profileBtn.disabled = true;
        refreshBtn.disabled = true;
        
        const refreshToken = localStorage.getItem('refreshToken');
        const step1Text = `(Token Refresh Flow)\n\n[Browser's Brain 🧠]\n- The Access Token is expired or missing.\n- "I will use my long-lived Refresh Token to get a new one."\n\n"Hi, my VIP Pass expired. Here is my renewal ticket."\n(POST to /jwt/refresh with Refresh Token)\n |\n |-------------------------------------->`;
        const step1El = createStepElement(step1Text);
        await showStep(step1El, browserPane);
        await animatePacket('POST /refresh', 'client', 'server');
        await delay(4500);

        const res = await fetch('/jwt/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
        });
        
        if (res.ok) {
            const data = await res.json();
            localStorage.setItem('accessToken', data.accessToken);
            const step2Text = `[Server's Brain 🧠]\n- Verifies the Refresh Token is valid.\n- Issues a BRAND NEW, short-lived Access Token.\n\n"Here is your new VIP Pass."\n(Responds with a new Access Token)\n          <--------------------------------------|`;
            const step2El = createStepElement(step2Text);
            await showStep(step2El, serverPane);
            await animatePacket('HTTP 200 OK', 'server', 'client');
            const step3Text = `[Browser's Brain 🧠]\n- "Excellent! I have a new Access Token."\n- Stores the new token in Local Storage.\n- Can now re-try the profile request.\n\n*** Token Refreshed Successfully! ***`;
            const step3El = createStepElement(step3Text);
            await showStep(step3El, browserPane);
        } else {
             const step2El = createStepElement("Server says the Refresh Token is invalid or expired.\n\nYou must log in again.");
             await showStep(step2El, serverPane);
        }

        isDemoRunning = false;
        loginBtn.disabled = false;
        updateUIState();
    };

    // --- Initial Setup ---
    updateUIState();
    loginBtn.addEventListener('click', runLoginDemo);
    profileBtn.addEventListener('click', runProfileDemo);
    refreshBtn.addEventListener('click', runRefreshDemo);
}