import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../utils/auth';
import { User, Briefcase, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import ReactCountryFlag from 'react-country-flag';

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

  const toggleLanguage = () => {
    const newLang = i18n.language === 'uk' ? 'en' : 'uk';
    i18n.changeLanguage(newLang);
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'CANDIDATE':
        return <User size={24} className="ml-2" title={t('candidate')} />;
      case 'RECRUITER':
        return <Briefcase size={24} className="ml-2" title={t('recruiter')} />;
      case 'ADMIN':
        return <Shield size={24} className="ml-2" title={t('admin')} />;
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
          {t('vacancies')}
        </Link>
        <Link
          to="/my-vacancies"
          className="text-lg text-gray-700 hover:text-gray-900"
        >
          {t('my_vacancies')}
        </Link>
        <Link to="/applications" className="text-lg text-gray-700 hover:text-gray-900">
          {t('my_applications')}
        </Link>
      </div>

      <div className="flex items-center gap-6 mr-6">
        {user ? (
            <>
              {user.role === 'RECRUITER' && (
                  <Link
                      to="/vacancies/create"
                      className="text-lg text-blue-500 hover:text-blue-600"
                  >
                    {t('create_vacancy')}
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
                {t('sign_up')}
              </button>
              <button
                  onClick={() => navigate('/login')}
                  className="text-lg text-blue-500 hover:text-blue-600"
              >
                {t('login')}
              </button>
            </>
        )}
        <button
            onClick={toggleLanguage}
            className="ml-4"
            aria-label={
              i18n.language === 'uk'
                  ? 'Switch to English'
                  : 'Переключитися на українську'
            }
        >
          {i18n.language === 'uk' ? (
              <ReactCountryFlag
                  countryCode="GB"
                  svg
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                  }}
                  title="English"
              />
          ) : (
              <ReactCountryFlag
                  countryCode="UA"
                  svg
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                  }}
                  title="Українська"
              />
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;
