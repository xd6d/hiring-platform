import React, {useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import {apiClient} from '../utils/auth';
import {formatDate} from '../utils/formatDate';
import {useTranslation, Trans} from 'react-i18next';
import VacancyCardCompact from "../components/VacancyCardCompact";
import defaultProfilePicture from "../assets/default_profile_picture.png";
import {Trash2, Pencil, Eye, EyeOff, Phone, Link} from 'lucide-react';


const VacancyApplicationsPage = () => {
    const {id} = useParams();
    const {t} = useTranslation();
    const [vacancy, setVacancy] = useState(null);
    const [applications, setApplications] = useState([]);
    const [statusOptions, setStatusOptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newNoteText, setNewNoteText] = useState('');
    const [activeNoteForm, setActiveNoteForm] = useState(null);
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [editedNoteText, setEditedNoteText] = useState('');
    const [expandedContacts, setExpandedContacts] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [vacancyRes, appsRes, statusesRes] = await Promise.all([
                    apiClient(`users/me/vacancies/${id}/`, {method: 'GET'}),
                    apiClient(`vacancies/${id}/applications/`, {method: 'GET'}),
                    apiClient(`applications/statuses/`, {method: 'GET'}),
                ]);

                if (!vacancyRes.ok || !appsRes.ok || !statusesRes.ok) {
                    throw new Error(t('error_loading_vacancies'));
                }

                const vacancyData = await vacancyRes.json();
                const appsData = await appsRes.json();
                const statusesData = await statusesRes.json();

                setVacancy(vacancyData);
                setApplications(appsData);
                setStatusOptions(statusesData.map(item => item.name));
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, t]);

    const toggleContacts = (applicationId) => {
        setExpandedContacts(prev => ({
            ...prev,
            [applicationId]: !prev[applicationId]
        }));
    };

    const handleStatusChange = async (applicationId, newStatus) => {
        try {
            const response = await apiClient(`applications/${applicationId}/`, {
                method: 'PATCH',
                body: JSON.stringify({status: newStatus}),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(t('error_updating_status'));
            }

            setApplications(prevApplications =>
                prevApplications.map(app =>
                    app.id === applicationId ? {...app, status: newStatus} : app
                )
            );
        } catch (err) {
            setError(err.message);
        }
    };

    const handleAddNote = async (applicationId) => {
        if (!newNoteText.trim()) return;

        try {
            const response = await apiClient(`application-notes/`, {
                method: 'POST',
                body: JSON.stringify({
                    text: newNoteText,
                    application: applicationId
                }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(t('error_adding_note'));
            }

            const newNote = await response.json();

            setApplications(prevApplications =>
                prevApplications.map(app =>
                    app.id === applicationId
                        ? {...app, notes: [...(app.notes || []), newNote]}
                        : app
                )
            );

            setNewNoteText('');
            setActiveNoteForm(null);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDeleteNote = async (applicationId, noteId) => {
        try {
            const response = await apiClient(`application-notes/${noteId}/`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(t('error_deleting_note'));
            }

            setApplications(prevApplications =>
                prevApplications.map(app =>
                    app.id === applicationId
                        ? {
                            ...app,
                            notes: app.notes.filter(note => note.id !== noteId)
                        }
                        : app
                )
            );
        } catch (err) {
            setError(err.message);
        }
    };

    const handleEditNote = async (noteId, currentText) => {
        try {
            const response = await apiClient(`application-notes/${noteId}/`, {
                method: 'PATCH',
                body: JSON.stringify({text: editedNoteText}),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(t('error_updating_note'));
            }

            setApplications(prevApplications =>
                prevApplications.map(app => ({
                    ...app,
                    notes: app.notes.map(note =>
                        note.id === noteId
                            ? {...note, text: editedNoteText}
                            : note
                    )
                }))
            );

            setEditingNoteId(null);
            setEditedNoteText('');
        } catch (err) {
            setError(err.message);
        }
    };

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
                                <div className="flex-1">
                                    <h3 className="font-semibold">{app.created_by.first_name} {app.created_by.last_name}</h3>
                                    <p className="text-sm text-gray-500">{formatDate(app.created_at)}</p>
                                </div>
                                {/* Contacts Toggle Button */}
                                <button
                                    onClick={() => toggleContacts(app.id)}
                                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-800"
                                >
                                    {expandedContacts[app.id] ? (
                                        <>
                                            <span>{t('hide_contacts')}</span>
                                            <EyeOff size={16} className="text-gray-600"/>
                                        </>
                                    ) : (
                                        <>
                                            <span>{t('show_contacts')}</span>
                                            <Eye size={16} className="text-gray-600"/>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Expanded Contacts Section */}
                            {expandedContacts[app.id] && (
                                <div className="bg-gray-50 p-3 rounded-lg mb-3 space-y-3">
                                    {/* Phone Number */}
                                    {app.created_by.phone_number && (
                                        <div className="flex items-center gap-2">
                                            <Phone size={16} className="text-gray-500 flex-shrink-0"/>
                                            <a
                                                href={`tel:${app.created_by.phone_number.replace(/[^\d+]/g, '')}`}
                                                className="text-gray-700 hover:text-blue-600"
                                            >
                                                {app.created_by.phone_number}
                                            </a>
                                        </div>
                                    )}

                                    {/* Other Contacts */}
                                    {app.created_by.contacts?.length > 0 && (
                                        <div className="space-y-2">
                                            {app.created_by.contacts.map((contact, index) => (
                                                <div key={index} className="flex items-start gap-2">
                                                    <Link size={16} className="text-gray-500 flex-shrink-0 mt-0.5"/>
                                                    <div className="text-sm">
                                                            <span
                                                                className="font-medium text-gray-600">{contact.name}: </span>
                                                        {contact.value.startsWith('http') ? (
                                                            <a
                                                                href={contact.value}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-blue-600 hover:underline break-all"
                                                            >
                                                                {contact.value}
                                                            </a>
                                                        ) : (
                                                            <span className="text-gray-700 break-all">
                                                        {contact.value}
                                                    </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="text-sm text-gray-700 mb-2">
                                <div className="flex items-start gap-2">
                                    <strong>{t('application_status')}:</strong>
                                    <select
                                        value={app.status}
                                        onChange={(e) => handleStatusChange(app.id, e.target.value)}
                                        className="ml-2 border rounded p-1 text-sm"
                                    >
                                        {statusOptions.map((option) => (
                                            <option key={option} value={option}>
                                                {option}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    <Trans i18nKey="status_visibility">
                                        Application status <span className="font-medium text-600 underline">is visible</span> for the candidate.
                                    </Trans>
                                </p>
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

                            {/* Notes Section */}
                            <div className="border-t pt-4 mt-4">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-medium text-gray-700">{t('notes')}</h4>
                                    {activeNoteForm !== app.id && (
                                        <button
                                            onClick={() => setActiveNoteForm(app.id)}
                                            className="text-sm text-blue-600 hover:text-blue-800"
                                        >
                                            + {t('add_note')}
                                        </button>
                                    )}
                                </div>

                                <p className="text-xs text-gray-500 mb-2">
                                    <Trans i18nKey="notes_visibility">
                                        Notes are <span className="font-medium text-600 underline">not shown</span> for the candidate.
                                    </Trans>
                                </p>

                                {app.notes && app.notes.length > 0 ? (
                                    <div className="space-y-4">
                                        {app.notes.map((note) => (
                                            <div key={note.id}
                                                 className="relative p-3 pl-4 pr-10 rounded-lg transition-colors duration-150 hover:bg-gray-50 group"
                                            >
                                                {editingNoteId === note.id ? (
                                                    <div className="space-y-2">
                            <textarea
                                value={editedNoteText}
                                onChange={(e) => setEditedNoteText(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                rows="3"
                                autoFocus
                            />
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleEditNote(note.id)}
                                                                className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                                                            >
                                                                {t('save')}
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingNoteId(null);
                                                                    setEditedNoteText('');
                                                                }}
                                                                className="bg-gray-200 px-3 py-1 rounded text-sm hover:bg-gray-300"
                                                            >
                                                                {t('cancel')}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <p className="text-gray-800 note-text whitespace-pre-wrap text-base font-normal leading-relaxed tracking-wide">
                                                            {note.text}
                                                        </p>
                                                        <div className="flex items-center mt-1 text-xs text-gray-500">
                                                    <span>
                                                        {note.created_by.first_name} {note.created_by.last_name}
                                                    </span>
                                                            <span className="mx-2">•</span>
                                                            <span>
                                                        {formatDate(note.created_at)}
                                                    </span>
                                                        </div>

                                                        {/* Edit Button */}
                                                        <button
                                                            onClick={() => {
                                                                setEditingNoteId(note.id);
                                                                setEditedNoteText(note.text);
                                                            }}
                                                            className="absolute right-10 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:bg-gray-200 text-gray-500 hover:text-blue-500"
                                                            title={t('edit_note')}
                                                        >
                                                            <Pencil size={16} strokeWidth={2}/>
                                                        </button>

                                                        {/* Delete Button */}
                                                        <button
                                                            onClick={() => handleDeleteNote(app.id, note.id)}
                                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:bg-gray-200 text-gray-500 hover:text-red-500"
                                                            title={t('delete_note')}
                                                        >
                                                            <Trash2 className="h-4 w-4"/>
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-400 text-sm italic">{t('no_notes_message')}</p>
                                )}

                                {/* Add Note Form */}
                                {activeNoteForm === app.id && (
                                    <div className="mt-4">
                                        <textarea
                                            value={newNoteText}
                                            onChange={(e) => setNewNoteText(e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            rows="3"
                                            placeholder={t('add_note_placeholder')}
                                            autoFocus
                                        />
                                        <div className="flex gap-2 mt-2">
                                            <button
                                                onClick={() => handleAddNote(app.id)}
                                                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                                            >
                                                {t('add_note')}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setActiveNoteForm(null);
                                                    setNewNoteText('');
                                                }}
                                                className="bg-gray-100 px-4 py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                                            >
                                                {t('cancel')}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default VacancyApplicationsPage;