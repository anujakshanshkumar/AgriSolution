const container = document.querySelector('.container');
const registerBtn = document.querySelector('.register-btn');
const loginBtn = document.querySelector('.login-btn');
const loginForm = document.querySelector('#login-form');
const registerForm = document.querySelector('#register-form');

function configureMobileInput(input) {
    input.addEventListener('input', () => {
        const digits = input.value.replace(/\D/g, '').slice(0, 10);
        if (input.value !== digits) {
            input.value = digits;
        }
        input.setCustomValidity(digits.length === 10 ? '' : 'Enter exactly 10 digits.');
    });
}

function configureNameInput(input) {
    input.addEventListener('input', () => {
        const lettersAndSpaces = [...input.value.replace(/[^\p{L}\p{M}\s]/gu, '')]
            .slice(0, 18)
            .join('');
        if (input.value !== lettersAndSpaces) {
            input.value = lettersAndSpaces;
        }
        input.setCustomValidity(
            /\p{L}/u.test(lettersAndSpaces) && [...lettersAndSpaces].length <= 18
                ? ''
                : 'Enter a name using letters only, up to 18 characters.'
        );
    });
}

document.querySelectorAll('input[name="mobile"]').forEach(configureMobileInput);
document.querySelectorAll('#register-form input[name="name"]').forEach(configureNameInput);

registerBtn?.addEventListener('click', () => {
    container.classList.add('active');
    playInputAudio(registerToggleAudio);
})

loginBtn?.addEventListener('click', () => {
    container.classList.remove('active');
    playInputAudio(loginToggleAudio);
})

const mobileInputAudio = new Audio('/audios/moblie1.mp3');
const passwordInputAudio = new Audio('/audios/password1.mp3');
const districtInputAudio = new Audio('/audios/district3.mp3');
const nameInputAudio = new Audio('/audios/name1.mp3');
const registerToggleAudio = new Audio('/audios/new1.mp3');
const loginToggleAudio = new Audio('/audios/login1.mp3');
const loginSuccessAudio = new Audio('/audios/login-success.mp3');
const registrationSuccessAudio = new Audio('/audios/reg-success.mp3');

function playInputAudio(audio) {
    audio.currentTime = 0;
    audio.play().catch(() => {});
}

document.querySelectorAll('input[name="mobile"]').forEach((input) => {
    input.addEventListener('pointerdown', () => playInputAudio(mobileInputAudio));
});
document.querySelectorAll('input[name="password"]').forEach((input) => {
    input.addEventListener('pointerdown', () => playInputAudio(passwordInputAudio));
});
document.querySelector('#register-form select[name="district"]')
    ?.addEventListener('pointerdown', () => playInputAudio(districtInputAudio));
document.querySelector('#register-form input[name="name"]')
    ?.addEventListener('pointerdown', () => playInputAudio(nameInputAudio));

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
        const result = await window.AgriApiClient.post(endpoint, data);
        if (result.success !== true) {
            throw new Error(result.message || `${endpoint === 'login' ? 'Login' : 'Registration'} failed.`);
        }

        showMessage(messageId, result.message || 'Done');
        if (endpoint === 'login') {
            loginSuccessAudio.currentTime = 0;
            loginSuccessAudio.play().catch(() => {});
            showAlertPopup('Logged in Successfully');
            window.AgriSessionStore.saveUser(result);
            window.setTimeout(() => {
                const messageElement = document.querySelector(`#${messageId}`);
                if (messageElement) messageElement.textContent = '';
                window.location.href = '/dashboard.html';
            }, 3000);
        } else {
            registrationSuccessAudio.currentTime = 0;
            registrationSuccessAudio.play().catch(() => {});
            alert(window.agriTranslate('Your registration is done.'));
            registerForm.reset();
            container.classList.remove('active');
        }
    } catch (error) {
        const message = error instanceof TypeError
            ? 'Cannot connect to the server. Check that the application is running and try again.'
            : error.message;
        showMessage(messageId, message, true);
        if (endpoint === 'login') {
            alert(window.agriTranslate(`Login failed: ${message}`));
        }
    } finally {
        button.disabled = false;
    }
}

loginForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!loginForm.reportValidity()) return;
    submitForm(loginForm, 'login', 'login-message');
});

registerForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!registerForm.reportValidity()) return;
    submitForm(registerForm, 'register', 'register-message');
});
