// src/pages/UserVacanciesPage.js

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../utils/auth';

const UserVacanciesPage = () => {
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserVacancies = async () => {
      try {
        // Note: endpoint 'users/me/vacancies/' corresponds to GET /api/v1/users/me/vacancies/
        const response = await apiClient('users/me/vacancies/', {
          method: 'GET',
        });

        // If token refresh failed, apiClient already redirected to /login and returned undefined
        if (!response) return;

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setVacancies(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserVacancies();
  }, []);

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>;
  }
  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">My Vacancies</h1>
      {vacancies.length === 0 ? (
        <p className="text-gray-600">You have not created any vacancies yet.</p>
      ) : (
        <div className="space-y-4">
          {vacancies.map((vacancy) => (
            <div
              key={vacancy.id}
              className="border rounded-lg p-4 shadow-sm"
            >
              <Link to={`/vacancies/${vacancy.id}`}>
                <h2 className="text-xl font-semibold mb-2 text-blue-600 hover:underline">
                  {vacancy.name}
                </h2>
              </Link>

              {/* Truncate description to 3 lines (requires tailwind line-clamp plugin) */}
              <p className="text-sm text-gray-700 mb-2 line-clamp-3">
                {vacancy.description}
              </p>

              <div className="flex flex-wrap gap-2 text-sm mb-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {vacancy.work_format === 'OFFICE' && 'Office'}
                  {vacancy.work_format === 'REMOTE' && 'Remote'}
                  {vacancy.work_format === 'HYBRID' && 'Hybrid'}
                </span>
                {vacancy.cities.map((city, idx) => (
                  <span
                    key={idx}
                    className="bg-gray-100 text-gray-800 px-2 py-1 rounded"
                  >
                    {city}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 text-sm">
                {vacancy.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="bg-green-100 text-green-800 px-2 py-1 rounded"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>

              <div className="mt-4">
                <Link
                  to={`/vacancies/${vacancy.id}`}
                  className="inline-block text-blue-500 hover:text-blue-600 text-sm font-medium"
                >
                  View Details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserVacanciesPage;
