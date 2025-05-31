import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../utils/auth';
import { formatDate } from '../utils/formatDate'; // see Utility section below

const ApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Track which application IDs have their answers shown
  const [showAnswers, setShowAnswers] = useState({});

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await apiClient('users/me/applications/', {
          method: 'GET',
        });
        if (!response) {
          // apiClient may redirect to login on 401, so response could be undefined
          return;
        }
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setApplications(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const toggleAnswers = (appId) => {
    setShowAnswers((prev) => ({
      ...prev,
      [appId]: !prev[appId],
    }));
  };

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>;
  }
  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }
  if (!applications.length) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">My Applications</h1>
        <p className="text-gray-700">You have not applied to any vacancies yet.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">My Applications</h1>
      <div className="space-y-4">
        {applications.map((application) => {
          const appId = application.id;
          const vac = application.vacancy;
          const vacCreated = formatDate(vac.created_at);
          const appCreated = formatDate(application.created_at);
          const isOpen = Boolean(showAnswers[appId]);

          return (
            <div key={appId} className="border rounded-lg p-4 shadow-sm">
              {/* Vacancy title and created date */}
              <h2 className="text-xl font-semibold mb-2">
                <Link
                    to={`/vacancies/${vac.id}`}
                    className="text-blue-600 hover:underline"
                >
                  Applied for {vac.name} from {vacCreated}
                </Link>
              </h2>

              {/* Status and applied date */}
              <p className="text-sm text-gray-700 mb-1">
                <span className="font-medium">Application status:</span> {application.status}
              </p>
              <p className="text-sm text-gray-700 mb-2">
                <span className="font-medium">Applied at:</span> {appCreated}
              </p>

              {/* Show/Hide answers button */}
              <button
                onClick={() => toggleAnswers(appId)}
                className="text-blue-500 hover:text-blue-600 text-sm font-medium"
              >
                {isOpen ? 'Hide answers' : 'Show answers'}
              </button>

              {/* Conditionally render the answers section */}
              {isOpen && (
                <div className="mt-3 border-t pt-2">
                  {application.answers.length > 0 ? (
                    application.answers.map((ans, idx) => (
                      <div key={idx} className="mb-2">
                        <p className="text-sm">
                          <span className="font-medium">{ans.question.name}:</span>{' '}
                          {ans.value}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No answers provided.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ApplicationsPage;
