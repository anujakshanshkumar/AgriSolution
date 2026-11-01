(function () {
    const configuredBaseUrl = window.AGRI_API_BASE_URL || '/api';
    const baseUrl = configuredBaseUrl.replace(/\/+$/, '') || '/api';

    async function request(endpoint, data, method = 'POST', options = {}) {
        const token = window.AgriSessionStore?.getUser()?.accessToken;
        const multipart = typeof FormData !== 'undefined' && data instanceof FormData;
        const response = await fetch(`${baseUrl}/${endpoint}`, {
            method,
            headers: { ...(multipart ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: data === undefined ? undefined : multipart ? data : JSON.stringify(data),
            signal: options.signal || AbortSignal.timeout(options.timeoutMs || 35000)
        });

        let result;
        try {
            result = await response.json();
        } catch (error) {
            console.error('The API returned an invalid JSON response.', error);
            throw new Error('The server returned an invalid response.');
        }

        if (!response.ok) {
            const error = new Error(result.error || `Request failed with status ${response.status}.`);
            error.status = response.status;
            error.code = result.code;
            throw error;
        }

        return result;
    }

    window.AgriApiClient = Object.freeze({
        post: request,
        get: (endpoint, options) => request(endpoint, undefined, 'GET', options),
        delete: endpoint => request(endpoint, undefined, 'DELETE'),
        upload: (endpoint, formData, options) => request(endpoint, formData, 'POST', options)
    });
})();
