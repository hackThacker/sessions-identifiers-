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

export function initSessionDemo() {
    // --- DOM Elements ---
    const browserPane = document.getElementById('browser-pane');
    const serverPane = document.getElementById('server-pane');
    const loginBtn = document.getElementById('start-login-demo-btn');
    const profileBtn = document.getElementById('start-profile-demo-btn');
    const cookieStatus = document.getElementById('live-cookie-status');
    const serverStatus = document.getElementById('live-server-status');

    let isDemoRunning = false;
    
    const updateUIState = () => {
        const hasCookie = document.cookie.includes('sessionId');
        profileBtn.disabled = !hasCookie;
        if (hasCookie) loginBtn.textContent = "▶️ Re-Run Login Demo";
    };
    
    const clearPanes = () => {
        browserPane.innerHTML = '<div class="pane-header"><img src="assets/browser.svg" alt="Browser Icon"> You on your Browser</div>';
        serverPane.innerHTML = '<div class="pane-header"><img src="assets/server.svg" alt="Server Icon"> Web Server</div>';
    };

    const runLoginDemo = async () => {
        if (isDemoRunning) return;
        isDemoRunning = true;
        
        // Full reset on new demo run
        await fetch('/logout', { method: 'POST' });
        localStorage.clear();
        cookieStatus.textContent = 'Not logged in';
        serverStatus.textContent = '{}';
        clearPanes();

        loginBtn.disabled = true;
        profileBtn.disabled = true;

        // Step 1a
        const step1aText = `(Step 1: The Login - Proving Your Identity)\n\n"Hi, I'm 'user' and my password is 'password123'."\n(Sends POST request to /session/login)\n |\n |-------------------------------------->`;
        const step1aEl = createStepElement(step1aText);
        await showStep(step1aEl, browserPane);
        await animatePacket('POST /login', 'client', 'server');
        await delay(4500);

        // Step 1b
        const res = await fetch('/session/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'user', password: 'password123' })
        });
        const data = await res.json();
        
        const step1bText = `(Step 2: The Server's Work - Creating the Ticket)\n\n[Server's Brain 🧠]\n- Checks database: "Does 'user' exist?" -> YES.\n- "Okay, this person is legit. I need a ticket."\n- Generates ticket number: '${data.sessionId}'\n- Opens logbook (Session Store) and writes:\n  "Ticket #${data.sessionId.substring(0,10)}... -> Alex"\n- Attaches a 'Set-Cookie' instruction.`;
        const step1bEl = createStepElement(step1bText);
        await showStep(step1bEl, serverPane);
        serverStatus.textContent = JSON.stringify(data.sessionStore, null, 2);
        await delay(5000);

        // Step 1c
        const step1cText = `(Step 3: The Response - Receiving Your Ticket)\n\n"Welcome! Also, here's your ticket."\n(Sends HTTP Response with the header:\n Set-Cookie: sessionId=${data.sessionId.substring(0,10)}...)\n          <--------------------------------------|`;
        const step1cEl = createStepElement(step1cText);
        await showStep(step1cEl, serverPane);
        await animatePacket('HTTP 200 OK', 'server', 'client');
        await delay(4500);
        
        // Step 1d
        const step1dText = `[Browser's Brain 🧠]\n- "Oh, a 'Set-Cookie' instruction! I'll store this."\n- Saves the cookie in its special cookie jar.\n\n*** You are now "logged in." ***`;
        const step1dEl = createStepElement(step1dText);
        await showStep(step1dEl, browserPane);
        cookieStatus.textContent = `sessionId=${data.sessionId.substring(0, 15)}...`;
        
        isDemoRunning = false;
        loginBtn.disabled = false;
        updateUIState();
    };

    const runProfileDemo = async () => {
        if (isDemoRunning) return;
        isDemoRunning = true;
        clearPanes();

        loginBtn.disabled = true;
        profileBtn.disabled = true;

        // Step 2a
        const step2aText = `(Step 1: The New Request - Visiting Your Profile)\n\n[Browser's Brain 🧠]\n- "User wants to go to /session/profile."\n- "Checking my cookie jar... Aha! Found a ticket."\n\n"Hi, I'd like to see /profile. Here is my ticket."\n(Sends GET request with Cookie header)\n |\n |-------------------------------------->`;
        const step2aEl = createStepElement(step2aText);
        await showStep(step2aEl, browserPane);
        await animatePacket('GET /profile', 'client', 'server');
        await delay(4500);

        // Step 2b
        const step2bText = `(Step 2: Server Validating the Ticket)\n\n[Server's Brain 🧠]\n- "Request for /profile has arrived. Does it have a ticket?" -> YES.\n- "Let me check my logbook (Session Store)."\n- Finds the entry for the ticket.\n- "I know who this is! It's Alex."`;
        const step2bEl = createStepElement(step2bText);
        await showStep(step2bEl, serverPane);
        await delay(5000);
        
        // Step 2c
        const res = await fetch('/session/profile');
        const data = await res.json();
        const step2cText = `(Step 3: The Response - Getting Your Page)\n\n"${data.message}"\n(Sends HTTP Response with profile content)\n          <--------------------------------------|`;
        const step2cEl = createStepElement(step2cText);
        await showStep(step2cEl, serverPane);
        await animatePacket(`HTTP 200 OK`, 'server', 'client');

        isDemoRunning = false;
        loginBtn.disabled = false;
        updateUIState();
    };
    
    updateUIState();
    loginBtn.addEventListener('click', runLoginDemo);
    profileBtn.addEventListener('click', runProfileDemo);
}