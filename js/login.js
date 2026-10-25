const container = document.querySelector('.container');
const registerBtn = document.querySelector('.register-btn');
const loginBtn = document.querySelector('.login-btn');
const loginForm = document.querySelector('#login-form');
const registerForm = document.querySelector('#register-form');

const API_BASE_URL = window.AGRI_API_BASE_URL || '/api';

registerBtn.addEventListener('click', () => {
    container.classList.add('active');
})

loginBtn.addEventListener('click', () => {
    container.classList.remove('active');
})

var moblie1 = new Audio();
moblie1.src = "/audios/moblie1.mp3";

var password1 = new Audio();
password1.src = "/audios/password1.mp3";

var login1 = new Audio();
login1.src = "/audios/login1.mp3";

var succ1 = new Audio();
succ1.src = "/audios/succ1.mp3";

var district3 = new Audio();
district3.src = "/audios/district3.mp3";

var reg1 = new Audio();
reg1.src = "/audios/reg1.mp3";

var new1 = new Audio();
new1.src = "/audios/new1.mp3";
var name1 = new Audio();
name1.src = "/audios/name1.mp3";

function showMessage(elementId, message, isError = false) {
    const element = document.querySelector(`#${elementId}`);
    element.textContent = message;
    element.classList.toggle('error', isError);
    element.classList.toggle('success', !isError);
}

function showAlertPopup(message) {
    const popup = document.createElement('div');
    popup.className = 'login-alert-popup';
    popup.setAttribute('role', 'alert');
    popup.textContent = message;
    document.body.appendChild(popup);

    window.setTimeout(() => {
        popup.remove();
    }, 3000);
}

async function submitForm(form, endpoint, messageId) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    const button = form.querySelector('button[type="submit"]');

    button.disabled = true;
    showMessage(messageId, 'Please wait...');

    try {
        const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const responseText = await response.text();
        let result;
        try {
            result = JSON.parse(responseText);
        } catch {
            throw new Error(responseText || 'The server returned an invalid response');
        }

        if (!response.ok) {
            throw new Error(result.error || 'Request failed');
        }

        showMessage(messageId, result.message || 'Done');
        if (endpoint === 'login') {
            succ1.currentTime = 0;
            succ1.play().catch(() => {});
            showAlertPopup('Logged in Successfully');
            sessionStorage.setItem('agriUser', JSON.stringify(result));
            window.setTimeout(() => {
                const messageElement = document.querySelector(`#${messageId}`);
                if (messageElement) messageElement.textContent = '';
                window.location.href = '/dashboard.html';
            }, 3000);
        } else {
            alert('Your registration is done.');
            registerForm.reset();
            container.classList.remove('active');
        }
    } catch (error) {
        const message = error instanceof TypeError
            ? 'Cannot connect to the server. Start both servers.'
            : error.message;
        showMessage(messageId, message, true);
        if (endpoint === 'login') {
            alert(`Login failed: ${message}`);
        }
    } finally {
        button.disabled = false;
    }
}

loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    submitForm(loginForm, 'login', 'login-message');
});

registerForm.addEventListener('submit', (event) => {
    event.preventDefault();
    submitForm(registerForm, 'register', 'register-message');
});