(function () {
    const user = window.AgriSessionStore.getUser();
    if (!user?.accessToken) { window.location.replace('/login.html'); return; }
    const form = document.getElementById('token-form');
    if (!form) return;
    const message = document.getElementById('token-message');
    const land = document.getElementById('land-area');
    const quantity = document.getElementById('produce-quantity');
    const newId = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
    let requestId = newId();
    let maxKgPerAcre = 2100;
    document.getElementById('farmer-name').textContent = user.name;
    document.getElementById('farmer-address').textContent = user.district || 'Address not available';
    const history = document.createElement('section');
    form.after(history);
    function error(err) { message.textContent = err.message; message.className = 'form-message error'; }
    async function refresh() {
        const data = await window.AgriApiClient.get('v1/tokens');
        maxKgPerAcre = data.maxKgPerAcre;
        document.getElementById('issued-count').textContent = data.issuedCount;
        document.getElementById('next-number').textContent = 'Assigned on reservation';
        history.replaceChildren();
        const heading = document.createElement('h3'); heading.textContent = 'Your saved tokens'; history.append(heading);
        data.tokens.forEach(token => { const row = document.createElement('p'); row.textContent = `${token.number} — ${token.quantity} kg · ${token.landArea} acres`; history.append(row); });
    }
    function updateLimit() {
        const max = Number(land.value) * maxKgPerAcre;
        quantity.max = max > 0 ? String(max) : '';
        document.getElementById('quantity-limit').textContent = max > 0 ? `Maximum allowed: ${max.toLocaleString()} kg (21 quintals per acre).` : 'Maximum allowed: 21 quintals per acre.';
    }
    land.addEventListener('input', () => { requestId = newId(); updateLimit(); });
    quantity.addEventListener('input', () => { requestId = newId(); });
    form.addEventListener('submit', async event => {
        event.preventDefault(); updateLimit(); if (!form.reportValidity()) return;
        const button = form.querySelector('[type="submit"]'); button.disabled = true;
        try {
            const token = await window.AgriApiClient.post('v1/tokens', { landArea: Number(land.value), quantity: Number(quantity.value), requestId });
            requestId = newId();
            document.getElementById('token-number').textContent = token.number;
            document.getElementById('token-summary').textContent = `${token.farmerName}, your token is reserved for ${token.quantity} kg of produce from ${token.landArea} acres.`;
            document.getElementById('token-result').hidden = false;
            message.textContent = 'Token saved to your account. This student portal does not issue official procurement authorizations.';
            message.className = 'form-message success';
            await refresh();
        } catch (err) { error(err); } finally { button.disabled = false; }
    });
    document.getElementById('print-token').addEventListener('click', () => window.print());
    refresh().catch(error);
})();
