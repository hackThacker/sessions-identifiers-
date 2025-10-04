import { initSessionDemo } from './demos/sessionDemo.js';
import { initJwtDemo } from './demos/jwtDemo.js';
import { initOauthDemo } from './demos/oauthDemo.js';

const routes = {
    '#home': 'js/views/home.html',
    '#session': 'js/views/session.html',
    '#jwt': 'js/views/jwt.html',
    '#oauth': 'js/views/oauth.html'
};

const initFunctions = {
    '#session': initSessionDemo,
    '#jwt': initJwtDemo,
    '#oauth': initOauthDemo
};

// This function will clean up state when navigating away from a demo
async function handleRouteChange(previousHash) {
    // If we are leaving a demo page, perform a full logout to prevent state leakage
    if (previousHash === '#session' || previousHash === '#jwt') {
        console.log(`Leaving ${previousHash}, clearing all server and client state.`);
        // Clear client state
        localStorage.clear();
        // Clear server state
        await fetch('/logout', { method: 'POST' });
    }
}

let currentHash = window.location.hash || '#home';

function setActiveLink(hash) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === hash);
    });
}

async function router() {
    const newHash = window.location.hash || '#home';
    
    // Call cleanup function before loading the new page
    await handleRouteChange(currentHash);
    currentHash = newHash;

    const path = routes[newHash];
    const app = document.getElementById('app');

    if (!path) {
        app.innerHTML = '<h1>404 - Page Not Found</h1>';
        return;
    }

    try {
        const response = await fetch(path);
        if (!response.ok) throw new Error('Page not found');
        const html = await response.text();
        app.innerHTML = html;

        setActiveLink(newHash);

        if (initFunctions[newHash]) {
            initFunctions[newHash]();
        }
    } catch (error) {
        app.innerHTML = '<h1>Error loading page.</h1>';
        console.error('Router Error:', error);
    }
}

window.addEventListener('hashchange', router);
window.addEventListener('load', router);