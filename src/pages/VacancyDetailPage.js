// VacancyDetailPage.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '../utils/auth';

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

  // Local “applied” state to reflect a successful POST.
  // Combined with vacancy.is_applied to determine if user has already applied.
  const [applied, setApplied] = useState(false);

  // --- Fetch vacancy details via apiClient ---
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

  // --- Handler: “Apply Now” → load the application template via apiClient ---
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

  // --- Track user inputs per question ID ---
  const handleInputChange = (questionId, value) => {
    setAnswersByQuestionId((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  // --- Handler: send POST to create application ---
  const handleSubmitResponse = async () => {
    if (!vacancy || !template) return;
    setSubmitError(null);

    // Build payload:
    // - Include required questions always (empty-string if no answer).
    // - Include non-required only if user provided a non-empty answer.
    const answersPayload = template.questions.reduce((arr, q) => {
      const answerValue = answersByQuestionId[q.id];

      if (q.is_required) {
        // Required: always include (use empty string if unanswered)
        arr.push({ question: q.id, value: answerValue ?? '' });
      } else {
        // Non-required: include only if user gave a non-empty value
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
        // Once we know the server accepted the application, mark as applied
        setApplied(true);
        // Hide the form/template so that the top‐level message appears
        setShowTemplate(false);
      } else {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to submit application.');
      }
    } catch (err) {
      setSubmitError(err.message);
    }
  };

  // --- Render loading/error states for vacancy fetch ---
  if (loading) return <div className="p-4 text-center">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!vacancy) return null;

  // Determine if the user has already applied (either from server or from local POST)
  const alreadyApplied = vacancy.is_applied || applied;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Vacancy Header */}
      <h1 className="text-3xl font-bold mb-4">{vacancy.name}</h1>
      <p className="mb-4 text-gray-700">{vacancy.description}</p>

      {/* Work Format */}
      <div className="mb-4">
        <span className="font-semibold">Work Format: </span>
        <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded">
          {vacancy.work_format}
        </span>
      </div>

      {/* Cities */}
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

      {/* Tags */}
      <div className="mb-6">
        <span className="font-semibold">Tags: </span>
        <div className="flex flex-wrap gap-2 mt-1">
          {vacancy.tags.map((tag) => (
            <span key={tag.id} className="bg-green-100 text-green-800 px-2 py-1 rounded">
              {tag.name}
            </span>
          ))}
        </div>
      </div>

      {/* If already applied (from server or just submitted), show message */}
      {alreadyApplied && (
        <div className="text-green-700 text-lg font-semibold mb-6">
          You already applied!
        </div>
      )}

      {/* If not yet applied and template not showing, show “Apply Now” */}
      {!alreadyApplied && !showTemplate && (
        <button
          onClick={handleApplyNow}
          className="mb-6 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Apply Now
        </button>
      )}

      {/* If user clicked “Apply Now,” show the template (only if not alreadyApplied) */}
      {!alreadyApplied && showTemplate && (
        <div className="border rounded-lg p-6 shadow-sm mb-6">
          {templateLoading && <div className="text-center">Loading template...</div>}
          {templateError && (
            <div className="text-red-500">Error loading template: {templateError}</div>
          )}

          {template && (
            <>
              <h2 className="text-2xl font-semibold mb-4">Application Form</h2>

              {/* Render each question: show q.name (with optional asterisk) above q.label */}
              {template.questions.map((q) => (
                <div key={q.id} className="mb-6">
                  {/* Question name with red asterisk if is_required */}
                  <div className="flex items-center mb-1">
                    <span className="text-sm text-gray-500">{q.name}</span>
                    {q.is_required && <span className="text-red-500 ml-1">*</span>}
                  </div>

                  {/* Human-readable label */}
                  <label className="block font-medium mb-1">{q.label}</label>

                  {/* Render input based on type */}
                  {q.type === 'SHORT_TEXT' && (
                    <input
                      type="text"
                      className="w-full border px-3 py-2 rounded"
                      onChange={(e) => handleInputChange(q.id, e.target.value)}
                    />
                  )}

                  {q.type === 'LONG_TEXT' && (
                    <textarea
                      className="w-full border px-3 py-2 rounded"
                      rows={4}
                      onChange={(e) => handleInputChange(q.id, e.target.value)}
                    />
                  )}

                  {q.type === 'SINGLE_ANSWER' && q.answers && (
                    <div className="flex flex-col mt-1">
                      {q.answers.map((opt) => (
                        <label key={opt.id} className="inline-flex items-center mt-1">
                          <input
                            type="radio"
                            name={`q-${q.id}`}
                            value={opt.id}
                            className="mr-2"
                            onChange={() => handleInputChange(q.id, opt.id)}
                          />
                          {opt.value}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Submission error message */}
              {submitError && <div className="mb-4 text-red-500">{submitError}</div>}

              {/* “Send respond” Button */}
              <button
                onClick={handleSubmitResponse}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Send respond
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default VacancyDetailPage;
