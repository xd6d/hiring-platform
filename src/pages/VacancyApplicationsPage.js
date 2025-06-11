import React, {useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import {apiClient} from '../utils/auth';
import {formatDate} from '../utils/formatDate';
import {useTranslation} from 'react-i18next';
import VacancyCardCompact from "../components/VacancyCardCompact";
import defaultProfilePicture from "../assets/default_profile_picture.png";

const VacancyApplicationsPage = () => {
    const {id} = useParams();
    const {t} = useTranslation();
    const [vacancy, setVacancy] = useState(null);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [vacancyRes, appsRes] = await Promise.all([
                    apiClient(`users/me/vacancies/${id}/`, {method: 'GET'}),
                    apiClient(`vacancies/${id}/applications/`, {method: 'GET'}),
                ]);

                if (!vacancyRes.ok || !appsRes.ok) {
                    throw new Error(t('error_loading_vacancies'));
                }

                const vacancyData = await vacancyRes.json();
                const appsData = await appsRes.json();

                setVacancy(vacancyData);
                setApplications(appsData);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, t]);

    if (loading) return <div className="p-4 text-center">{t('loading')}...</div>;
    if (error) return <div className="p-4 text-red-500 text-center">{t('error')}: {error}</div>;

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            {/* Vacancy Info */}
            {vacancy && <VacancyCardCompact vacancy={vacancy}/>}

            {/* Applications */}
            <div className="space-y-4">
                {applications.length === 0 ? (
                    <p className="text-gray-600">{t('no_applications_message')}</p>
                ) : (
                    applications.map((app, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-lg shadow">
                            <div className="flex items-center gap-4 mb-3">
                                <img
                                    src={app.created_by.photo ?? defaultProfilePicture}
                                    alt={`${app.created_by.first_name} profile`}
                                    className="w-12 h-12 rounded-full object-cover"
                                />
                                <div>
                                    <h3 className="font-semibold">{app.created_by.first_name} {app.created_by.last_name}</h3>
                                    <p className="text-sm text-gray-500">{formatDate(app.created_at)}</p>
                                </div>
                            </div>

                            <div className="text-sm text-gray-700 mb-2">
                                <strong>{t('application_status')}:</strong> {app.status}
                            </div>

                            <div className="border-t pt-3 space-y-2">
                                {app.answers.map((ans, i) => (
                                    <div key={i}>
                                        <p className="font-medium">{ans.question.name}:</p>
                                        {ans.question.type === 'FILE' ? (
                                            <div className="mt-1 ml-4">
                                                {ans.value.map((file, fileIdx) => (
                                                    <div key={fileIdx} className="mb-1">
                                                        <a
                                                            href={file.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:underline"
                                                        >
                                                            {file.user_filename.length > 30
                                                                ? `${file.user_filename.substring(0, 27)}...`
                                                                : file.user_filename}
                                                        </a>
                                                        <span
                                                            className="text-gray-500 text-xs ml-2">({file.type})</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="ml-2">{ans.value}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default VacancyApplicationsPage;
