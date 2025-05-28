import { API_URL } from '../config/apiConfig';

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
    });

    if (!response.ok) throw new Error('Failed to refresh token');

    const data = await response.json();
    setAuthToken(data.access);
    return data.access;
};

export const apiClient = async (endpoint, options = {}, retry = true) => {
    let token = getAuthToken();

    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await fetch(`${API_URL}/${endpoint}`, {
        ...options,
        headers,
    });

    if (response.status === 401 && retry) {
        try {
            await refreshToken();
            return apiClient(endpoint, options, false); // retry once
        } catch (err) {
            redirectToLogin();
            return;
        }
    }

    return response;
};
