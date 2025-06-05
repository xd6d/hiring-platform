import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '../utils/auth';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';

const VacancyDetailPage = () => {
  const { id } = useParams();
  const [vacancy, setVacancy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // States for application‐form/template
  const [showTemplate, setShowTemplate] = useState(false);
  const [template, setTemplate] = useState(null);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateError, setTemplateError] = useState(null);

  // Track user inputs per question
  const [answersByQuestionId, setAnswersByQuestionId] = useState({});
  const [submitError, setSubmitError] = useState(null);

  // Local "applied" state to reflect a successful POST.
  const [applied, setApplied] = useState(false);

  // User info
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await apiClient(`users/me/`, { method: 'GET' });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setUser(data);
      } catch (err) {
        setUserError(err.message);
        setUser(null);
      } finally {
        setUserLoading(false);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const fetchVacancy = async () => {
      try {
        const response = await apiClient(`vacancies/${id}/`, { method: 'GET' });
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

  const handleApplyNow = async () => {
    if (!vacancy) return;

    setShowTemplate(true);
    setTemplate(null);
    setTemplateError(null);
    setTemplateLoading(true);

    try {
      const tplId = vacancy.application_template;
      const response = await apiClient(`templates/${tplId}/`, { method: 'GET' });
      if (!response.ok) {
        throw new Error(`Failed to load template: ${response.status}`);
      }
      const tplData = await response.json();
      setTemplate(tplData);
    } catch (err) {
      setTemplateError(err.message);
    } finally {
      setTemplateLoading(false);
    }
  };

  const handleInputChange = (questionId, value) => {
    setAnswersByQuestionId((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmitResponse = async () => {
    if (!vacancy || !template) return;
    setSubmitError(null);

    const answersPayload = template.questions.reduce((arr, q) => {
      const answerValue = answersByQuestionId[q.id];

      if (q.is_required) {
        arr.push({ question: q.id, value: answerValue ?? '' });
      } else {
        if (answerValue !== undefined && answerValue !== '') {
          arr.push({ question: q.id, value: answerValue });
        }
      }
      return arr;
    }, []);

    try {
      const response = await apiClient(`applications/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vacancy: vacancy.id,
          answers: answersPayload,
        }),
      });

      if (response.status === 201) {
        setApplied(true);
        setShowTemplate(false);
      } else {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to submit application.');
      }
    } catch (err) {
      setSubmitError(err.message);
    }
  };

  if (loading || userLoading) {
    return <div className="p-8 text-center">Loading vacancy details...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500 text-center">Error: {error}</div>;
  }

  if (userError) {
    console.warn('Error fetching user info:', userError);
  }

  if (!vacancy) return null;

  const alreadyApplied = vacancy.is_applied || applied;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Vacancy Header Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{vacancy.name}</h1>
            <article className="prose prose-gray max-w-none mb-6">
              <ReactMarkdown>{vacancy.description}</ReactMarkdown>
            </article>

            {/* Work Format and Cities */}
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex items-center">
                <span className="text-gray-700 font-medium mr-2">Work Format:</span>
                <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {vacancy.work_format}
                </span>
              </div>

              <div className="flex items-center">
                <span className="text-gray-700 font-medium mr-2">Locations:</span>
                <div className="flex flex-wrap gap-2">
                  {vacancy.cities.map((city, idx) => (
                    <span key={idx} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                      {city}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="mb-4">
              <span className="text-gray-700 font-medium mr-2">Skills:</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {vacancy.tags.map((tag) => (
                  <span key={tag.id} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Apply Button Section */}
          <div className="md:w-48 flex flex-col items-center">
            {alreadyApplied ? (
              <div className="bg-green-100 text-green-700 px-4 py-3 rounded-lg text-center w-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Application Submitted
              </div>
            ) : (
              !showTemplate && user?.role !== 'RECRUITER' && (
                <button
                  onClick={handleApplyNow}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg w-full transition-colors duration-200 flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                  </svg>
                  Apply Now
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Application Form Section */}
      {!alreadyApplied && showTemplate && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-2 border-b border-gray-200">Application Form</h2>

          {templateLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p>Loading application form...</p>
            </div>
          )}

          {templateError && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
              <p className="font-medium">Error loading template:</p>
              <p>{templateError}</p>
            </div>
          )}

          {template && (
            <div className="space-y-8">
              {template.questions.map((q) => (
                <div key={q.id} className="space-y-2">
                  <div className="flex items-center">
                    <label className="block text-gray-800 font-medium">
                      {q.name}
                      {q.is_required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                  </div>

                  {q.type === 'SHORT_TEXT' && (
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      onChange={(e) => handleInputChange(q.id, e.target.value)}
                    />
                  )}

                  {q.type === 'LONG_TEXT' && (
                    <textarea
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      rows={5}
                      onChange={(e) => handleInputChange(q.id, e.target.value)}
                    />
                  )}

                  {q.type === 'SINGLE_ANSWER' && q.answers && (
                    <div className="space-y-2 mt-2">
                      {q.answers.map((opt) => (
                        <label key={opt.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                          <input
                            type="radio"
                            name={`q-${q.id}`}
                            value={opt.id}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            onChange={() => handleInputChange(q.id, opt.id)}
                          />
                          <span className="text-gray-700">{opt.value}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type === 'FILE' && user.files && (
                    <div className="space-y-3 mt-2">
                      {q.custom_requirements?.types?.length > 0 && (
                        <div className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Accepted and required file types:</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {q.custom_requirements.types.map(type => (
                              <span
                                key={type}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800 text-xs font-medium"
                              >
                                {type}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        {user.files.map((file) => {
                          const selectedList = answersByQuestionId[q.id] || [];
                          const isChecked = Array.isArray(selectedList) && selectedList.includes(file.id);
                          return (
                            <label key={file.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                              <input
                                type="checkbox"
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                value={file.id}
                                checked={isChecked}
                                onChange={() => {
                                  const current = answersByQuestionId[q.id] || [];
                                  let updated;
                                  if (current.includes(file.id)) {
                                    updated = current.filter((id) => id !== file.id);
                                  } else {
                                    updated = [...current, file.id];
                                  }
                                  handleInputChange(q.id, updated);
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-700 truncate">{file.user_filename}</p>
                                <p className="text-xs text-gray-500">{file.type}</p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {submitError && (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg">
                  <p className="font-medium">Submission error:</p>
                  <p>{submitError}</p>
                </div>
              )}

              <div className="pt-4">
                <button
                  onClick={handleSubmitResponse}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg transition-colors duration-200 flex items-center justify-center w-full md:w-auto"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Submit Application
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VacancyDetailPage;