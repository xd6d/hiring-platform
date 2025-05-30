import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { API_URL } from '../config/apiConfig';

const VacancyDetailPage = () => {
  const { id } = useParams();
  const [vacancy, setVacancy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVacancy = async () => {
      try {
        const response = await fetch(`${API_URL}/vacancies/${id}/`, {
          headers: { accept: 'application/json' },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setVacancy(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVacancy();
  }, [id]);

  if (loading) return <div className="p-4 text-center">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!vacancy) return null;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">{vacancy.name}</h1>
      <p className="mb-4 text-gray-700">{vacancy.description}</p>

      <div className="mb-4">
        <span className="font-semibold">Work Format: </span>
        <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded">
          {vacancy.work_format}
        </span>
      </div>

      <div className="mb-4">
        <span className="font-semibold">Application Template ID: </span>
        <span>{vacancy.application_template}</span>
      </div>

      <div className="mb-4">
        <span className="font-semibold">Cities: </span>
        <div className="flex flex-wrap gap-2 mt-1">
          {vacancy.cities.map((city, idx) => (
            <span key={idx} className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
              {city}
            </span>
          ))}
        </div>
      </div>

      <div>
        <span className="font-semibold">Tags: </span>
        <div className="flex flex-wrap gap-2 mt-1">
          {vacancy.tags.map((tag) => (
            <span key={tag.id} className="bg-green-100 text-green-800 px-2 py-1 rounded">
              {tag.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VacancyDetailPage;
