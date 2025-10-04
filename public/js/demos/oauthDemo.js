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

// --- Main OAuth2 Demo Logic ---
export function initOauthDemo() {
    // --- DOM Elements ---
    const userPane = document.getElementById('user-pane');
    const clientAppPane = document.getElementById('client-app-pane');
    const authServerPane = document.getElementById('auth-server-pane');
    const startBtn = document.getElementById('start-oauth-demo-btn');
    const consentModal = document.getElementById('consent-modal');
    const allowBtn = document.getElementById('consent-allow-btn');
    const denyBtn = document.getElementById('consent-deny-btn');

    let isDemoRunning = false;

    const clearPanes = () => {
        userPane.innerHTML = '<div class="pane-header"><img src="assets/browser.svg" alt="Browser Icon"> You 🧑‍💻 (Resource Owner)</div>';
        clientAppPane.innerHTML = '<div class="pane-header"><img src="assets/server.svg" alt="Server Icon"> Our App 🏢 (Client)</div>';
        authServerPane.innerHTML = '<div class="pane-header auth-server-header"><img src="assets/server.svg" alt="Server Icon"> PhotoService 🛡️ (Auth Server)</div>';
    };

    // *** THIS IS THE CORRECTED LOGIC FOR THE MODAL ***
    const waitForConsent = () => {
        consentModal.classList.remove('hidden');
        
        return new Promise(resolve => {
            const onAllow = () => {
                cleanup();
                resolve(true);
            };
            const onDeny = () => {
                cleanup();
                resolve(false);
            };
            const cleanup = () => {
                consentModal.classList.add('hidden');
                allowBtn.removeEventListener('click', onAllow);
                denyBtn.removeEventListener('click', onDeny);
            };

            allowBtn.addEventListener('click', onAllow, { once: true });
            denyBtn.addEventListener('click', onDeny, { once: true });
        });
    };

    const runOauthDemo = async () => {
        if (isDemoRunning) return;
        isDemoRunning = true;
        
        clearPanes();
        startBtn.disabled = true;

        // --- Step 1: The Request for Permission ---
        const step1aText = `(Step 1: The Request for Permission)\n\nYou click "Import from PhotoService"\n |\n |-------------------------------------->`;
        const step1aEl = createStepElement(step1aText);
        await showStep(step1aEl, userPane);
        await delay(4500);
        
        const step1bText = `[Our App's Brain 🧠]\n- "User wants PhotoService. I need to ask\n  for permission."\n- It crafts a special URL to redirect the user.\n- This URL includes my App ID and the\n  permissions I want (e.g., 'read_photos').`;
        const step1bEl = createStepElement(step1bText);
        await showStep(step1bEl, clientAppPane);
        await delay(4500);
        
        const step1cText = `"Okay user, please go to this PhotoService address\nto give me permission."\n(Sends a Redirect instruction to your browser)\n          <--------------------------------------|`;
        const step1cEl = createStepElement(step1cText);
        await showStep(step1cEl, clientAppPane);
        await delay(4500);

        // --- Step 2: Granting Permission ---
        const step2aText = `(Step 2: Granting Permission on the Trusted Site)\n\nYour browser is redirected to photoservice.com.\n\n"Hi PhotoService, Our App sent me. They want to read my photos."\n |\n |-------------------------------------------------------------------->`;
        const step2aEl = createStepElement(step2aText);
        await showStep(step2aEl, userPane);
        await delay(4500);

        const step2bText = `[PhotoService Brain 🧠]\n- "I see Our App is asking for permission.\n  First, who are YOU?"\n- Shows you the standard PhotoService login page.\n- <--- (Asks for your password)\n- ----> (You enter password *safely*)\n- <--- (Shows consent screen: "Allow Our App to..?")`;
        const step2bEl = createStepElement(step2bText);
        await showStep(step2bEl, authServerPane);
        
        const consentGiven = await waitForConsent();
        if (!consentGiven) {
            const deniedText = `You denied permission. The OAuth2 flow has been cancelled.`;
            const deniedEl = createStepElement(deniedText);
            await showStep(deniedEl, userPane);
            isDemoRunning = false;
            startBtn.disabled = false;
            startBtn.textContent = "▶️ Re-Run OAuth2 Demo";
            return;
        }
        
        const step2fText = `You click "Allow"\n |\n |-------------------------------------------------------------------->`;
        const step2fEl = createStepElement(step2fText);
        await showStep(step2fEl, userPane);
        await delay(4500);

        // --- Step 3: The Temporary Code ---
        const resCode = await fetch('/oauth/generate-code');
        const dataCode = await resCode.json();

        const step3aText = `[PhotoService Brain 🧠]\n- "The user has consented!"\n- "I will NOT give the valuable Access Token to\n  the user's browser where it could be stolen."\n- "Instead, I'll generate a secure, temporary,\n  one-time-use Authorization Code."`;
        const step3aEl = createStepElement(step3aText);
        await showStep(step3aEl, authServerPane);
        await delay(4500);
        
        const step3bText = `"Okay browser, go back to Our App's special return address. Here is a code: '${dataCode.code}'"\n(Sends a Redirect back to Our App)\n          <--------------------------------------------------------------------|`;
        const step3bEl = createStepElement(step3bText);
        await showStep(step3bEl, authServerPane);
        await delay(4500);

        // --- Step 4: The Secure Backend Exchange ---
        const step4aText = `(Step 4: The Secure Backend Exchange)\n\nYour browser arrives back at Our App with the code.\n |\n |-------------------------------------->`;
        const step4aEl = createStepElement(step4aText);
        await showStep(step4aEl, userPane);
        await delay(4500);
        
        const step4bText = `Our App's server sees the code.\n\n"Hi PhotoService, it's me, Our App. A user just gave me '${dataCode.code}'. Please exchange it for the real key (Access Token). Here are my secret credentials to prove I am the real app."\n(Server-to-Server API call)\n                                        |\n |-------------------------------------->`;
        const step4bEl = createStepElement(step4bText);
        await showStep(step4bEl, clientAppPane);
        await delay(4500);
        
        const resToken = await fetch('/oauth/exchange-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: dataCode.code })
        });
        const dataToken = await resToken.json();

        const step4cText = `[PhotoService Brain 🧠]\n- "Let me check this code... Yes, it's valid."\n- "Let me check Our App's credentials... Yes, they match."\n- "Everything is secure. I will now issue the Access Token."`;
        const step4cEl = createStepElement(step4cText);
        await showStep(step4cEl, authServerPane);
        await delay(4500);
        
        const step4dText = `"Here is the Access Token. Use it to access the user's photos."\n(Sends Access Token to Our App's server)\n          <--------------------------------------|`;
        const step4dEl = createStepElement(step4dText);
        await showStep(step4dEl, authServerPane);
        await delay(4500);

        const finalStepText = `*** Success! ***\nOur App's server now has the Access Token and can securely fetch your data from PhotoService on your behalf. You never shared your password with Our App.`;
        const finalTextEl = createStepElement(finalStepText);
        await showStep(finalTextEl, clientAppPane);

        isDemoRunning = false;
        startBtn.disabled = false;
        startBtn.textContent = "▶️ Re-Run OAuth2 Demo";
    };

    startBtn.addEventListener('click', runOauthDemo);
}