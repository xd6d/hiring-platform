import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../utils/auth';
import { User, Briefcase, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';

const Header = ({ refreshKey }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await apiClient('users/me/', { method: 'GET' });
        if (response.ok) {
          setUser(await response.json());
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    };
    fetchUser();
  }, [refreshKey]);

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'CANDIDATE':
        return <User size={24} className="ml-2" title="Candidate" />;
      case 'RECRUITER':
        return <Briefcase size={24} className="ml-2" title="Recruiter" />;
      case 'ADMIN':
        return <Shield size={24} className="ml-2" title="Admin" />;
      default:
        return null;
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full h-16 flex justify-between items-center px-6 bg-white shadow z-50">
      <div className="flex items-center gap-8">
        <Link to="/" className="text-2xl font-extrabold text-gray-800 hover:text-gray-900">
          HRP
        </Link>
        <Link to="/" className="text-lg text-gray-700 hover:text-gray-900">
          {t('vacancy')}
        </Link>
        <Link
          to="/my-vacancies"
          className="text-lg text-gray-700 hover:text-gray-900"
        >
          My Vacancies
        </Link>
        <Link to="/applications" className="text-lg text-gray-700 hover:text-gray-900">
          My Applications
        </Link>
      </div>

      <div className="flex items-center gap-6 mr-6">
        <button
            onClick={() => handleLanguageChange('en')}
            className={`text-sm ${i18n.language === 'en' ? 'font-bold' : 'text-gray-600'}`}
        >
          EN
        </button>
        <button
            onClick={() => handleLanguageChange('uk')}
            className={`text-sm ${i18n.language === 'uk' ? 'font-bold' : 'text-gray-600'}`}
        >
          УК
        </button>
        {user ? (
            <>
              {user.role === 'RECRUITER' && (
                  <Link
                      to="/vacancies/create"
                      className="text-lg text-blue-500 hover:text-blue-600"
                  >
                    Create Vacancy
                  </Link>
              )}
              <Link
                  to="/profile"
                  className="text-xl font-semibold text-blue-800 hover:text-blue-900 no-underline flex items-center"
              >
                {/* First name */}
                {user.first_name}

                {/* Profile photo (if available) */}
                {user.photo && user.photo.url && (
                    <img
                        src={user.photo.url}
                        alt={`${user.first_name}'s profile`}
                        className="w-8 h-8 rounded-full ml-2 mr-2 object-cover"
                    />
                )}

                {/* Role icon */}
                {getRoleIcon(user.role)}
              </Link>
            </>
        ) : (
            <>
              <button
                  onClick={() => navigate('/sign-up')}
                  className="text-lg text-blue-500 hover:text-blue-600"
              >
                Sign up
              </button>
              <button
                  onClick={() => navigate('/login')}
                  className="text-lg text-blue-500 hover:text-blue-600"
              >
                Login
              </button>
            </>
        )}
      </div>
    </header>
  );
};

export default Header;
