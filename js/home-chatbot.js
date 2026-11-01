(() => {
    const widget = document.querySelector('[data-home-chatbot]');
    if (!widget) return;

    const panel = widget.querySelector('[data-chatbot-panel]');
    const toggle = widget.querySelector('[data-chatbot-toggle]');
    const closeButton = widget.querySelector('[data-chatbot-close]');
    const messagesElement = widget.querySelector('[data-chatbot-messages]');
    const form = widget.querySelector('[data-chatbot-form]');
    const input = widget.querySelector('[data-chatbot-input]');
    const sendButton = widget.querySelector('[data-chatbot-send]');
    const conversation = [];

    function setOpen(isOpen) {
        panel.hidden = !isOpen;
        panel.setAttribute('aria-hidden', String(!isOpen));
        toggle.setAttribute('aria-expanded', String(isOpen));
        if (isOpen) input.focus();
    }

    function appendMessage(text, role, isError = false) {
        const message = document.createElement('p');
        message.className = `home-chatbot-bubble home-chatbot-bubble-${role}`;
        if (isError) message.classList.add('home-chatbot-bubble-error');
        message.textContent = text;
        messagesElement.append(message);
        messagesElement.scrollTop = messagesElement.scrollHeight;
        return message;
    }

    function setBusy(isBusy) {
        input.disabled = isBusy;
        sendButton.disabled = isBusy;
        form.setAttribute('aria-busy', String(isBusy));
    }

    toggle.addEventListener('click', () => setOpen(panel.hidden));
    closeButton.addEventListener('click', () => {
        setOpen(false);
        toggle.focus();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !panel.hidden) {
            setOpen(false);
            toggle.focus();
        }
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const text = input.value.trim();
        if (!text || sendButton.disabled) return;

        conversation.push({ role: 'user', text });
        appendMessage(text, 'user');
        input.value = '';
        setBusy(true);
        const pending = appendMessage('Thinking...', 'assistant');

        try {
            const response = await fetch('/api/v1/chatbot/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    language: document.documentElement.lang === 'hi' ? 'hi' : 'en',
                    messages: conversation.slice(-10)
                })
            });
            let result;
            try {
                result = await response.json();
            } catch (error) {
                console.error('The chatbot API returned invalid JSON.', error);
                throw new Error('The assistant returned an invalid response. Please try again.');
            }
            if (!response.ok) {
                throw new Error(result.error || `Chat request failed with status ${response.status}.`);
            }
            if (typeof result.text !== 'string' || !result.text.trim()) {
                throw new Error('The assistant returned an empty response. Please try again.');
            }

            pending.textContent = result.text.trim();
            conversation.push({ role: 'model', text: result.text.trim() });
        } catch (error) {
            console.error('Unable to send chatbot message:', error);
            pending.textContent = error.message || 'Could not reach the assistant. Please try again.';
            pending.classList.add('home-chatbot-bubble-error');
            conversation.pop();
        } finally {
            setBusy(false);
            input.focus();
            messagesElement.scrollTop = messagesElement.scrollHeight;
        }
    });
})();
