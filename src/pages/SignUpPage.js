import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {API_URL} from '../config/apiConfig';
import {setAuthToken} from '../utils/auth';
import {User, Briefcase} from 'lucide-react';

const SignUpPage = ({setGlobalAppMessage, refreshHeader}) => {
    const [stage, setStage] = useState('chooseRole');
    const [role, setRole] = useState('');
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        password: '',
        confirm_password: '',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            const response = await fetch(`${API_URL}/users/`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    phone_number: formData.phone_number,
                    role,
                }),
            });

            if (response.status === 400) {
                const errorData = await response.json();
                setErrors(errorData);
                return;
            }

            if (!response.ok) throw new Error('Failed to register');

            const loginResponse = await fetch(`${API_URL}/auth/login/`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                }),
            });

            if (!loginResponse.ok) throw new Error('Login after registration failed');
            const loginData = await loginResponse.json();
            setAuthToken(loginData.access);
            localStorage.setItem('refresh', loginData.refresh);
            setGlobalAppMessage('Registration successful! 🎉');
            refreshHeader();
            navigate('/');

        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="pt-24 relative min-h-screen">
            {stage === 'chooseRole' ? (
                <div className="p-6 max-w-xl mx-auto">
                    <h1 className="text-2xl font-bold mb-6 text-center">Choose Your Role</h1>
                    <div className="grid grid-cols-2 gap-4">
                        <div
                            onClick={() => {
                                setRole('CANDIDATE');
                                setStage('fillForm');
                            }}
                            className="border rounded p-6 text-center cursor-pointer hover:bg-gray-100"
                        >
                            <User size={40} className="mx-auto mb-2"/>
                            <span className="font-medium">Candidate</span>
                        </div>

                        <div
                            onClick={() => {
                                setRole('RECRUITER');
                                setStage('fillForm');
                            }}
                            className="border rounded p-6 text-center cursor-pointer hover:bg-gray-100"
                        >
                            <Briefcase size={40} className="mx-auto mb-2"/>
                            <span className="font-medium">Recruiter</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="p-6 max-w-xl mx-auto">
                    <h1 className="text-2xl font-bold mb-4 text-center">Sign Up</h1>
                    <button
                        onClick={() => setStage('chooseRole')}
                        className="mb-4 text-blue-500 hover:text-blue-600"
                    >
                        ← Back to role selection
                    </button>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {['first_name', 'last_name', 'email', 'phone_number', 'password', 'confirm_password'].map((field) => (
                            <div key={field}>
                                <label className="block mb-1 font-medium capitalize">
                                    {field.replace('_', ' ')}
                                </label>
                                <input
                                    type={field.includes('password') ? 'password' : 'text'}
                                    value={formData[field]}
                                    onChange={(e) => setFormData({...formData, [field]: e.target.value})}
                                    required={['first_name', 'last_name', 'email', 'password', 'confirm_password'].includes(field)}
                                    className="w-full border px-3 py-2 rounded"
                                />
                                {errors[field] && (
                                    <div className="text-red-500 text-sm mt-1">{errors[field].join(' ')}</div>
                                )}
                            </div>
                        ))}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
                        >
                            {loading ? 'Signing up...' : 'Sign Up'}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default SignUpPage;
