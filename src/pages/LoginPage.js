import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {API_URL} from '../config/apiConfig';
import {setAuthToken} from '../utils/auth';
import {useTranslation} from 'react-i18next';

const LoginPage = ({refreshHeader}) => {
    const {t} = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_URL}/auth/login/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({email, password}),
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = errorData.detail || t('invalid_credentials_or_server_error');
                throw new Error(errorMessage);
            }

            const data = await response.json();
            const {access, refresh} = data;

            // Store tokens
            setAuthToken(access);
            localStorage.setItem('refresh', refresh);
            refreshHeader();
            navigate('/'); // Redirect to the index page

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="pt-8 flex items-center justify-center min-h-screen bg-gray-100">
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-full max-w-sm">
                <h2 className="text-xl font-bold mb-4 text-center">{t('login')}</h2>

                {error && <div className="mb-4 text-red-500 text-sm">{t('error')}: {error}</div>}

                <div className="mb-4">
                    <label className="block mb-1 text-sm font-medium">{t('email')}</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full border px-3 py-2 rounded"
                        required
                    />
                </div>

                <div className="mb-4">
                    <label className="block mb-1 text-sm font-medium">{t('password')}</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full border px-3 py-2 rounded"
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
                    disabled={loading}
                >
                    {loading ? `${t('logging_in')}...` : t('login')}
                </button>
            </form>
        </div>
    );
};

export default LoginPage;
