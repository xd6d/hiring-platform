import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../utils/auth';

const Header = ({ refreshKey }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await apiClient('users/me/', { method: 'GET' });
        if (response.ok) {
          const data = await response.json();
          setUser(data);
        } else {
          setUser(null);
        }
      } catch (err) {
        setUser(null);
      }
    };
    fetchUser();
  }, [refreshKey]);

  return (
    <header className="w-full flex justify-between items-center px-6 py-4 bg-white shadow">
      <div className="flex items-center gap-8">
        <Link to="/" className="text-2xl font-extrabold text-gray-800 hover:text-gray-900">
          HRP
        </Link>
        <Link to="/" className="text-lg text-gray-700 hover:text-gray-900">
          Vacancies
        </Link>
      </div>
      <div className="flex items-center gap-8 mr-6">
        {user ? (
          <Link
            to="/profile"
            className="text-lg font-semibold text-blue-800 hover:text-blue-900 no-underline"
          >
            {user.first_name}
          </Link>
        ) : (
          <>
            <button onClick={() => navigate('/sign-up')} className="text-lg text-blue-500 hover:text-blue-600">Sign up</button>
            <button onClick={() => navigate('/login')} className="text-lg text-blue-500 hover:text-blue-600">Login</button>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
