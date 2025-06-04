import {API_URL} from '../config/apiConfig';

export const getAuthToken = () => localStorage.getItem('access');
export const getRefreshToken = () => localStorage.getItem('refresh');
export const setAuthToken = (token) => localStorage.setItem('access', token);

const redirectToLogin = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    if (window.location.pathname !== '/login') {
        window.location.replace('/login');
    }
};

const refreshToken = async () => {
    const refresh = getRefreshToken();
    const response = await fetch(`${API_URL}/auth/token/refresh/`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({refresh}),
    });

    if (!response.ok) throw new Error('Failed to refresh token');

    const data = await response.json();
    setAuthToken(data.access);
    return data.access;
};

export const apiClient = async (endpoint, options = {}, retry = true) => {
    const token = getAuthToken();

    // Start with any headers passed in options, plus Authorization if we have a token
    const headers = {
        ...(token ? {Authorization: `Bearer ${token}`} : {}),
        ...options.headers,
    };

    const isFormData = options.body instanceof FormData;
    if (!isFormData && !('Content-Type' in headers)) {
        headers['Content-Type'] = 'application/json';
    }

    // Perform the fetch
    const response = await fetch(`${API_URL}/${endpoint}`, {
        ...options,
        headers,
    });

    if (response.status === 401 && retry) {
        try {
            await refreshToken();
            // Retry once (but disable further retries)
            return apiClient(endpoint, options, false);
        } catch (err) {
            redirectToLogin();
            return;
        }
    }

    return response;
};
