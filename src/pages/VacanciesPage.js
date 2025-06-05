import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {apiClient} from '../utils/auth';
import {Info, Search, Filter} from 'lucide-react';

const VacanciesPage = () => {
    const [vacancies, setVacancies] = useState([]);
    const [vacLoading, setVacLoading] = useState(true);
    const [vacError, setVacError] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');

    const [tagGroups, setTagGroups] = useState([]);
    const [tagsLoading, setTagsLoading] = useState(true);
    const [tagsError, setTagsError] = useState(null);
    const [selectedTagIds, setSelectedTagIds] = useState([]);

    const [personalized, setPersonalized] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    const fetchVacancies = async () => {
        setVacLoading(true);
        setVacError(null);

        try {
            const baseEndpoint = personalized ? 'vacancies/personalized/' : 'vacancies/';

            const params = new URLSearchParams();
            if (searchTerm.trim() !== '') {
                params.append('search', searchTerm.trim());
            }
            if (selectedTagIds.length > 0) {
                params.append('tags', selectedTagIds.join(','));
            }
            const endpoint =
                params.toString().length > 0
                    ? `${baseEndpoint}?${params.toString()}`
                    : baseEndpoint;

            const response = await apiClient(endpoint, {method: 'GET'});
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const data = await response.json();
            setVacancies(data);
        } catch (err) {
            setVacError(err.message);
            setVacancies([]);
        } finally {
            setVacLoading(false);
        }
    };

    useEffect(() => {
        fetchVacancies();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const fetchTagGroups = async () => {
            setTagsLoading(true);
            setTagsError(null);

            try {
                const response = await apiClient('tags/groups/', {method: 'GET'});
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                const data = await response.json();
                setTagGroups(data);
            } catch (err) {
                setTagsError(err.message);
                setTagGroups([]);
            } finally {
                setTagsLoading(false);
            }
        };

        fetchTagGroups();
    }, []);

    useEffect(() => {
        fetchVacancies();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [personalized, selectedTagIds]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchVacancies();
    };

    const handleTagToggle = (tagId) => {
        setSelectedTagIds((prev) => {
            if (prev.includes(tagId)) {
                return prev.filter((id) => id !== tagId);
            } else {
                return [...prev, tagId];
            }
        });
    };

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Job Vacancies</h1>

                <div className="w-full md:w-auto flex items-center gap-3">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <Filter className="h-4 w-4"/>
                        <span>Filters</span>
                    </button>

                    <form onSubmit={handleSearch} className="flex-1 md:flex-none md:w-80">
                        <div className="relative">
                            <Search
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search vacancies..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </form>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Filters Sidebar - now collapsible */}
                {showFilters && (
                    <aside className="lg:w-80 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="mb-6">
                            <label className="flex items-center justify-between cursor-pointer">
                                <div className="flex items-center">
                                    <span className="font-medium text-gray-700">Personalized search</span>
                                    <div className="group relative ml-2">
                                        <Info className="h-4 w-4 text-gray-500 cursor-pointer"/>
                                        <div
                                            className="absolute left-full ml-2 w-72 p-2 text-xs text-white bg-gray-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-normal z-10">
                                            Shows vacancies tailored to your profile and preferences
                                        </div>
                                    </div>
                                </div>
                                <div className="relative inline-block w-12 h-6">
                                    <input
                                        id="personalized-toggle"
                                        type="checkbox"
                                        checked={personalized}
                                        onChange={() => setPersonalized((prev) => !prev)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer peer"
                                    />
                                    <div
                                        className="w-12 h-6 bg-gray-300 rounded-full peer-checked:bg-blue-500 transition-colors duration-200"
                                    />
                                    <div
                                        className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-6 transition-transform duration-200"
                                    />
                                </div>
                            </label>
                        </div>

                        <div className="mb-4">
                            <div className="flex items-center">
                                <h2 className="text-lg font-semibold text-gray-800">Filter by Tags</h2>
                                <div className="group relative ml-2">
                                    <Info className="h-4 w-4 text-gray-500 cursor-pointer"/>
                                    <div
                                        className="absolute left-full ml-2 w-72 p-2 text-xs text-white bg-gray-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-normal z-10">
                                        You can select any number of tags. The more tags you choose, the
                                        more vacancies will appear. A vacancy is displayed if it has at
                                        least one tag matching your selected tags.
                                    </div>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">Select tags to filter vacancies</p>
                        </div>

                        {tagsLoading ? (
                            <div className="text-gray-500 py-4">Loading tags...</div>
                        ) : tagsError ? (
                            <div className="text-red-500 py-4">Error: {tagsError}</div>
                        ) : (
                            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                                {tagGroups.map((group) => (
                                    <div key={group.id} className="mb-4">
                                        <h3 className="font-medium text-gray-700 mb-2">{group.name}</h3>
                                        <div className="space-y-2">
                                            {group.tags.map((tag) => (
                                                <label
                                                    key={tag.id}
                                                    className="flex items-center text-sm hover:bg-gray-50 p-2 rounded"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        value={tag.id}
                                                        checked={selectedTagIds.includes(tag.id)}
                                                        onChange={() => handleTagToggle(tag.id)}
                                                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                                    />
                                                    <span className="ml-3 text-gray-700">{tag.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </aside>
                )}

                {/* Main Content */}
                <div className="flex-1">
                    {vacLoading ? (
                        <div className="flex justify-center items-center py-12">
                            <div
                                className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    ) : vacError ? (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd"
                                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                              clipRule="evenodd"/>
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-red-700">Error loading vacancies: {vacError}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {vacancies.length > 0 ? (
                                vacancies.map((vacancy) => (
                                    <div
                                        key={vacancy.id}
                                        className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow relative"
                                    >
                                        {vacancy.is_applied && (
                                            <span
                                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 absolute top-4 right-4"
                                            >
                                                Applied ✓
                                            </span>
                                        )}

                                        <Link to={`/vacancies/${vacancy.id}`} className="block">
                                            <h2 className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors mb-2">
                                                {vacancy.name}
                                            </h2>
                                        </Link>

                                        <p className="text-gray-600 mb-4 line-clamp-2">
                                            {vacancy.description}
                                        </p>

                                        <div className="flex flex-wrap gap-2 mb-4">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    vacancy.work_format === 'OFFICE' ? 'bg-blue-100 text-blue-800' :
                                                        vacancy.work_format === 'REMOTE' ? 'bg-purple-100 text-purple-800' :
                                                            'bg-indigo-100 text-indigo-800'
                                                }`}>
                                                {vacancy.work_format === 'OFFICE' && 'Office'}
                                                {vacancy.work_format === 'REMOTE' && 'Remote'}
                                                {vacancy.work_format === 'HYBRID' && 'Hybrid'}
                                            </span>
                                            {vacancy.cities.map((city, idx) => (
                                                <span
                                                    key={idx}
                                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                                                >
                                                    {city}
                                                </span>
                                            ))}
                                        </div>

                                        {vacancy.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {vacancy.tags.map((tag) => (
                                                    <span
                                                        key={tag.id}
                                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                                                    >
                                                        {tag.name}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        <div className="mt-4">
                                            <Link
                                                to={`/vacancies/${vacancy.id}`}
                                                className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
                                            >
                                                View Details
                                                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor"
                                                     viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                          d="M9 5l7 7-7 7"/>
                                                </svg>
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24"
                                         stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                                              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                    <h3 className="mt-2 text-lg font-medium text-gray-900">No vacancies found</h3>
                                    <p className="mt-1 text-gray-500">Try adjusting your search or filter criteria</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VacanciesPage;