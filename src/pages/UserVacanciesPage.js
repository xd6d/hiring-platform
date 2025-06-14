import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {apiClient} from '../utils/auth';
import {useTranslation} from 'react-i18next';
import {MoreVertical, Trash2, Clock, RotateCcw} from 'lucide-react';

const UserVacanciesPage = () => {
    const {t, i18n} = useTranslation();
    const [vacancies, setVacancies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [vacancyToDelete, setVacancyToDelete] = useState(null);
    const [vacancyToRestore, setVacancyToRestore] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const [showDeleted, setShowDeleted] = useState(false);

    useEffect(() => {
        const fetchUserVacancies = async () => {
            try {
                setLoading(true);
                const endpoint = showDeleted ? 'users/me/vacancies/deleted/' : 'users/me/vacancies/';
                const response = await apiClient(endpoint, {
                    method: 'GET',
                });

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
    }, [i18n.language, showDeleted]);

    const toggleDeleted = () => {
        setShowDeleted(!showDeleted);
    };

    const toggleDropdown = (id, e) => {
        e.stopPropagation(); // Prevent event bubbling
        setOpenDropdownId(openDropdownId === id ? null : id);
    };

    const handleDeleteClick = (vacancy) => {
        setVacancyToDelete(vacancy);
        setIsDeleteModalOpen(true);
        setOpenDropdownId(null);
    };

    const handleRestoreClick = (vacancy) => {
        setVacancyToRestore(vacancy);
        setIsRestoreModalOpen(true);
        setOpenDropdownId(null);
    };

    const handleConfirmDelete = async () => {
        if (!vacancyToDelete) return;

        try {
            const response = await apiClient(`vacancies/${vacancyToDelete.id}/`, {
                method: 'DELETE',
            });

            if (!response) return;
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            setVacancies(vacancies.filter(v => v.id !== vacancyToDelete.id));
        } catch (err) {
            setError(err.message);
        } finally {
            setIsDeleteModalOpen(false);
            setVacancyToDelete(null);
        }
    };

    const handleConfirmRestore = async () => {
        if (!vacancyToRestore) return;

        try {
            const response = await apiClient(`vacancies/${vacancyToRestore.id}/restore/`, {
                method: 'PATCH',
            });

            if (!response) return;
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            setVacancies(vacancies.filter(v => v.id !== vacancyToRestore.id));
        } catch (err) {
            setError(err.message);
        } finally {
            setIsRestoreModalOpen(false);
            setVacancyToRestore(null);
        }
    };

    const handleCancelDelete = () => {
        setIsDeleteModalOpen(false);
        setVacancyToDelete(null);
    };

    const handleCancelRestore = () => {
        setIsRestoreModalOpen(false);
        setVacancyToRestore(null);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setOpenDropdownId(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    if (loading) {
        return <div className="p-4 text-center">{t('loading')}...</div>;
    }
    if (error) {
        return <div className="p-4 text-red-500">{t('error')}: {error}</div>;
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && vacancyToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-medium mb-4">
                            {t('confirm_delete_title')}: <span className="font-semibold">"{vacancyToDelete.name}"</span>?
                        </h3>
                        <p className="mb-6">{t('confirm_delete_message')}</p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={handleCancelDelete}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                {t('cancel')}
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                            >
                                {t('delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Restore Confirmation Modal */}
            {isRestoreModalOpen && vacancyToRestore && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-medium mb-4">
                            {t('confirm_restore_title')}: <span
                            className="font-semibold">"{vacancyToRestore.name}"</span>?
                        </h3>
                        <p className="mb-6">{t('confirm_restore_message')}</p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={handleCancelRestore}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                {t('cancel')}
                            </button>
                            <button
                                onClick={handleConfirmRestore}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                {t('restore')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">{t('my_vacancies')}</h1>
                <div className="flex items-center space-x-4">
                    <span className={`font-medium ${!showDeleted ? 'text-blue-600' : 'text-gray-500'}`}>
                        {t('active')}
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showDeleted}
                            onChange={toggleDeleted}
                            className="sr-only peer"
                        />
                        <div
                            className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                    <span className={`font-medium ${showDeleted ? 'text-blue-600' : 'text-gray-500'}`}>
                        {t('deleted')}
                    </span>
                </div>
            </div>

            {vacancies.length === 0 ? (
                <p className="text-gray-600">{t('no_vacancies_message')}.</p>
            ) : (
                <div className="space-y-4">
                    {vacancies.map((vacancy) => (
                        <div key={vacancy.id} className="border rounded-lg p-4 shadow-sm relative">
                            {showDeleted && vacancy.deleted_at && (
                                <div className="flex items-center text-sm text-gray-500 mb-2">
                                    <Clock className="h-4 w-4 mr-1"/>
                                    {t('deleted_on')}: {new Date(vacancy.deleted_at).toLocaleDateString()}
                                </div>
                            )}

                            <div className="flex justify-between items-start">
                                {showDeleted ? (
                                    <div className="flex-grow">
                                        <h2 className="text-xl font-semibold mb-2 text-gray-600">
                                            {vacancy.name}
                                        </h2>
                                    </div>
                                ) : (
                                    <Link to={`/vacancies/${vacancy.id}`} className="flex-grow">
                                        <h2 className="text-xl font-semibold mb-2 text-blue-600 hover:underline">
                                            {vacancy.name}
                                        </h2>
                                    </Link>
                                )}
                                <div className="relative">
                                    <button
                                        onClick={(e) => toggleDropdown(vacancy.id, e)}
                                        className="p-1 rounded-full hover:bg-gray-100 focus:outline-none"
                                        aria-label="More options"
                                    >
                                        <MoreVertical className="h-5 w-5 text-gray-500"/>
                                    </button>
                                    {openDropdownId === vacancy.id && (
                                        <div
                                            className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                                            {!showDeleted ? (
                                                <button
                                                    onClick={() => handleDeleteClick(vacancy)}
                                                    className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4"/>
                                                    {t('delete')}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleRestoreClick(vacancy)}
                                                    className="flex items-center w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
                                                >
                                                    <RotateCcw className="mr-2 h-4 w-4"/>
                                                    {t('restore')}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <p className="text-sm text-gray-700 mb-2 line-clamp-3">
                                {vacancy.description}
                            </p>

                            <div className="flex flex-wrap gap-2 text-sm mb-2">
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    {vacancy.work_format === 'OFFICE' && t('office')}
                                    {vacancy.work_format === 'REMOTE' && t('remote')}
                                    {vacancy.work_format === 'HYBRID' && t('hybrid')}
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

                            <div className="mt-4 flex justify-between items-center">
                                {!showDeleted && (
                                    <Link
                                        to={`/my-vacancies/${vacancy.id}/applications`}
                                        className="inline-block text-blue-500 hover:text-blue-600 text-sm font-medium"
                                    >
                                        {t('view_applications')} →
                                    </Link>
                                )}
                                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">
                                    {t('applications')}: {vacancy.applied}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UserVacanciesPage;