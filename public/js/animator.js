export function animatePacket(content, from, to) {
    return new Promise(resolve => {
        const lane = document.getElementById('communication-lane');
        if (!lane) {
            console.warn('Animation lane not found on this page.');
            return resolve();
        }
        const packet = document.createElement('div');
        packet.className = `packet ${from}-packet`;
        packet.innerHTML = content.replace(/</g, '&lt;').replace(/>/g, '&gt;'); // Sanitize HTML

        lane.appendChild(packet);

        requestAnimationFrame(() => {
            const laneRect = lane.getBoundingClientRect();
            const packetRect = packet.getBoundingClientRect();
            const targetX = to === 'server' 
                ? (laneRect.width / 2) - (packetRect.width / 2) + 20
                : -(laneRect.width / 2) + (packetRect.width / 2) - 20;

            packet.style.transform = `translateX(${targetX}px)`;
        });
        
        packet.addEventListener('transitionend', () => {
            packet.remove();
            resolve();
        }, { once: true });
    });
}