import React, {useEffect, useState} from 'react';
import {apiClient} from '../utils/auth';
import {Pencil} from 'lucide-react';
import {useNavigate} from "react-router-dom";

const UserProfilePage = ({ refreshHeader }) => {
    const [user, setUser] = useState(null);
    const [editField, setEditField] = useState(null);
    const [fieldValues, setFieldValues] = useState({});
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await apiClient('users/me/', {method: 'GET'});
                if (!response.ok) throw new Error('Failed to fetch user data');
                const data = await response.json();
                setUser(data);
                setFieldValues({
                    email: data.email,
                    first_name: data.first_name,
                    last_name: data.last_name,
                    phone_number: data.phone_number,
                });
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    const handleFieldUpdate = async (field) => {
        try {
            const response = await apiClient('users/me/', {
                method: 'PATCH',
                body: JSON.stringify({[field]: fieldValues[field]}),
            });
            if (!response.ok) throw new Error('Failed to update');
            const updatedUser = await response.json();
            setUser(updatedUser);
            setEditField(null);
        } catch (err) {
            alert(err.message);
        }
    };

    const handleSignOut = () => {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        if (refreshHeader) refreshHeader();
        navigate('/login');
    };

    if (loading) return <div className="p-4 text-center">Loading...</div>;
    if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

    return (
        <div className="p-6 max-w-xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">User Profile</h1>
            <div className="space-y-4">
                {['email', 'first_name', 'last_name', 'phone_number'].map((field) => (
                    <div key={field} className="flex justify-between items-center">
                        <div className="flex-1">
                            <span className="font-medium capitalize">{field.replace('_', ' ')}:</span>{' '}
                            {editField === field ? (
                                <input
                                    type="text"
                                    value={fieldValues[field] || ''}
                                    onChange={(e) =>
                                        setFieldValues({...fieldValues, [field]: e.target.value})
                                    }
                                    className="border px-2 py-1 rounded w-full mt-1"
                                />
                            ) : (
                                <span className="ml-2">{user[field] || '—'}</span>
                            )}
                        </div>
                        <div>
                            {editField === field ? (
                                <button
                                    onClick={() => handleFieldUpdate(field)}
                                    className="text-green-600 hover:underline ml-2"
                                >
                                    Save
                                </button>
                            ) : (
                                <button
                                    onClick={() => setEditField(field)}
                                    className="text-blue-500 hover:text-blue-700 ml-2"
                                >
                                    <Pencil size={18}/>
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {user.role === 'EMPLOYER' && user.company && (
                    <div className="mt-6">
                        <h2 className="font-semibold">Company</h2>
                        <p>
                            <a
                                href={`/api/v1/companies/${user.company.id}/`}
                                className="text-blue-600 hover:underline"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {user.company.name}
                            </a>
                        </p>
                    </div>
                )}
                <div className="mt-8">
                    <button
                        onClick={handleSignOut}
                        className="text-red-500 border border-red-500 rounded px-4 py-2 hover:text-red-600 hover:border-red-600"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserProfilePage;
