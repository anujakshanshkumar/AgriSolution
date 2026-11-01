(function () {
    const STORAGE_KEY = 'agriUser';

    function getUser() {
        let storedValue;
        try {
            storedValue = window.sessionStorage.getItem(STORAGE_KEY);
        } catch (error) {
            console.error('Unable to read the current session.', error);
            return null;
        }

        if (!storedValue) return null;

        try {
            const user = JSON.parse(storedValue);
            if (user && typeof user === 'object' && !Array.isArray(user)) {
                return user;
            }
            throw new Error('Stored session must be a user object.');
        } catch (error) {
            console.error('The stored session is invalid and will be cleared.', error);
            try {
                window.sessionStorage.removeItem(STORAGE_KEY);
            } catch (storageError) {
                console.error('Unable to clear the invalid session.', storageError);
            }
            return null;
        }
    }

    function saveUser(user) {
        if (!user || typeof user !== 'object' || Array.isArray(user)) {
            throw new TypeError('A valid user object is required to save a session.');
        }

        try {
            window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        } catch (error) {
            console.error('Unable to save the current session.', error);
            throw new Error('Unable to save your session in this browser.');
        }
    }

    function clearUser() {
        const token = getUser()?.accessToken;
        if (token) {
            fetch('/api/v1/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, keepalive: true })
                .catch(() => console.warn('Server logout unavailable; the session will expire automatically.'));
        }
        try {
            window.sessionStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.error('Unable to clear the current session.', error);
            throw new Error('Unable to clear your session in this browser.');
        }
    }

    window.AgriSessionStore = Object.freeze({ clearUser, getUser, saveUser });
})();
