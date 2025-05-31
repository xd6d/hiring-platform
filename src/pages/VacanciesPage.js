import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {apiClient} from '../utils/auth';
import {Info} from 'lucide-react';

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
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Vacancies</h1>

            <form onSubmit={handleSearch} className="mb-6 flex">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search vacancies..."
                    className="flex-grow border border-gray-300 rounded-l px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600"
                >
                    Search
                </button>
            </form>

            <div className="flex gap-6">
                <div className="flex-grow">
                    {vacLoading ? (
                        <div className="text-center py-8">Loading vacancies...</div>
                    ) : vacError ? (
                        <div className="text-red-500 py-8">Error: {vacError}</div>
                    ) : (
                        <div className="space-y-4">
                            {vacancies.length > 0 ? (
                                vacancies.map((vacancy) => (
                                    <div
                                        key={vacancy.id}
                                        className="relative border rounded-lg p-4 shadow-sm"
                                    >
                                        {vacancy.is_applied && (
                                            <span className="absolute top-2 right-2 text-green-600 font-semibold">
                        Applied ✓
                      </span>
                                        )}

                                        <Link to={`/vacancies/${vacancy.id}`}>
                                            <h2 className="text-xl font-semibold mb-2 text-blue-600 hover:underline">
                                                {vacancy.name}
                                            </h2>
                                        </Link>

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

                                        <div className="flex flex-wrap gap-2 text-sm mb-2">
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
                                ))
                            ) : (
                                <p className="text-gray-600">No vacancies found.</p>
                            )}
                        </div>
                    )}
                </div>

                <aside className="w-96 border-l pl-6">
                    <label className="mb-4 flex items-center cursor-pointer">
                        <span className="mr-3 font-medium">Personalized search</span>
                        <div className="relative inline-block w-12 h-6">
                            <input
                                id="personalized-toggle"
                                type="checkbox"
                                checked={personalized}
                                onChange={() => setPersonalized((prev) => !prev)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer peer"
                            />
                            <div
                                className="w-12 h-6 bg-gray-300 rounded-full
                  peer-checked:bg-green-500
                  transition-colors duration-200"
                            />
                            <div
                                className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow
                    peer-checked:translate-x-6
                   transition-transform duration-200"
                            />
                        </div>
                    </label>
                    <div className="flex items-center mb-3">
                        <h2 className="text-lg font-semibold">Filter by Tags</h2>
                        <div className="group relative ml-2">
                            <Info className="h-5 w-5 text-gray-500 cursor-pointer"/>
                            <div
                                className="absolute left-6 -top-1 w-72 p-2 text-xs text-white bg-gray-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-normal z-10">
                                You can select any number of tags. The more tags you choose, the
                                more vacancies will appear. A vacancy is displayed if it has at
                                least one tag matching your selected tags.
                            </div>
                        </div>
                    </div>

                    {tagsLoading ? (
                        <div className="text-gray-500">Loading tags...</div>
                    ) : tagsError ? (
                        <div className="text-red-500">Error: {tagsError}</div>
                    ) : (
                        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                            {tagGroups.map((group) => (
                                <div key={group.id} className="mb-2">
                                    <h3 className="font-medium">{group.name}</h3>
                                    <div className="mt-1 space-y-1">
                                        {group.tags.map((tag) => (
                                            <label
                                                key={tag.id}
                                                className="flex items-center text-sm"
                                            >
                                                <input
                                                    type="checkbox"
                                                    value={tag.id}
                                                    checked={selectedTagIds.includes(tag.id)}
                                                    onChange={() => handleTagToggle(tag.id)}
                                                    className="mr-2"
                                                />
                                                {tag.name}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
};

export default VacanciesPage;
