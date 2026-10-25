(function () {
    const storedUser = sessionStorage.getItem('agriUser');
    if (!storedUser) {
        window.location.replace('/login.html');
        return;
    }

    let user;
    try {
        user = JSON.parse(storedUser);
    } catch {
        sessionStorage.removeItem('agriUser');
        window.location.replace('/login.html');
        return;
    }

    const form = document.getElementById('token-form');
    if (!form) return;

    document.getElementById('farmer-name').textContent = user.name || 'Farmer';
    document.getElementById('farmer-address').textContent = user.district || 'Address not available';
    const issuedCount = document.getElementById('issued-count');
    const nextNumber = document.getElementById('next-number');
    const landAreaInput = document.getElementById('land-area');
    const quantityInput = document.getElementById('produce-quantity');
    const quantityLimit = document.getElementById('quantity-limit');
    const result = document.getElementById('token-result');
    const tokenNumber = document.getElementById('token-number');
    const summary = document.getElementById('token-summary');
    const message = document.getElementById('token-message');
    const today = new Date();
    const dateKey = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0')
    ].join('-');
    const storageKey = `agri-solution-tokens-${dateKey}`;
    const tokens = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const pad = (value) => String(value).padStart(3, '0');
    const MAX_QUINTALS_PER_ACRE = 21;
    const KG_PER_QUINTAL = 100;

    function updateQuantityLimit() {
        const landArea = Number(landAreaInput.value);
        const maxQuantity = landArea > 0 ? landArea * MAX_QUINTALS_PER_ACRE * KG_PER_QUINTAL : 0;
        quantityInput.max = maxQuantity > 0 ? String(maxQuantity) : '';
        quantityLimit.textContent = maxQuantity > 0
            ? `Maximum allowed: ${maxQuantity.toLocaleString()} kg (21 quintals per acre).`
            : 'Maximum allowed: 21 quintals per acre.';

        if (maxQuantity > 0 && Number(quantityInput.value) > maxQuantity) {
            quantityInput.setCustomValidity(`Quantity cannot exceed ${maxQuantity.toLocaleString()} kg for this land area.`);
            message.textContent = `Quantity cannot exceed ${maxQuantity.toLocaleString()} kg for ${landArea} acres.`;
            message.className = 'form-message error';
        } else {
            quantityInput.setCustomValidity('');
            if (message.classList.contains('error')) {
                message.textContent = '';
                message.className = 'form-message';
            }
        }
    }

    updateQueue();
    landAreaInput.addEventListener('input', updateQuantityLimit);
    quantityInput.addEventListener('input', updateQuantityLimit);

    function updateQueue() {
        issuedCount.textContent = tokens.length;
        nextNumber.textContent = pad(tokens.length + 1);
    }

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        message.textContent = '';
        message.className = 'form-message';
        updateQuantityLimit();
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const data = new FormData(form);
        const sequence = tokens.length + 1;
        const token = {
            number: `AG-${dateKey.replaceAll('-', '')}-${pad(sequence)}`,
            farmerName: user.name || 'Farmer',
            address: user.district || 'Address not available',
            landArea: data.get('landArea'),
            quantity: data.get('quantity')
        };
        tokens.push(token);
        localStorage.setItem(storageKey, JSON.stringify(tokens));
        tokenNumber.textContent = token.number;
        summary.textContent = `${token.farmerName}, your token is reserved for ${token.quantity} kg of produce from ${token.landArea} acres.`;
        result.hidden = false;
        updateQueue();
        result.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    document.getElementById('print-token').addEventListener('click', () => window.print());
})();
