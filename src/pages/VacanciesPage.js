import React, { useEffect, useState } from 'react';
import {API_URL} from "../config/apiConfig";

const VacanciesPage = () => {
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVacancies = async () => {
      try {
        const response = await fetch(`${API_URL}/vacancies/`, {
          headers: {
            accept: 'application/json',
          },
        });
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

    fetchVacancies();
  }, []);

  if (loading) return <div className="p-4 text-center">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Vacancies</h1>
      <div className="space-y-4">
        {vacancies.map((vacancy) => (
          <div key={vacancy.id} className="border rounded-lg p-4 shadow-sm">
            <h2 className="text-xl font-semibold mb-2">{vacancy.name}</h2>
            <p className="text-sm text-gray-700 mb-2">{vacancy.description}</p>

            <div className="flex flex-wrap gap-2 text-sm mb-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {vacancy.work_format === 'OFFICE' && 'Office'}
                {vacancy.work_format === 'REMOTE' && 'Remote'}
                {vacancy.work_format === 'HYBRID' && 'Hybrid'}
              </span>
              {vacancy.cities.map((city, index) => (
                <span
                  key={index}
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
          </div>
        ))}
      </div>
    </div>
  );
};

export default VacanciesPage;
