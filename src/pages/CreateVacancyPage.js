import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {apiClient} from '../utils/auth';
import {ChevronDown, ChevronUp, Plus, Search, X} from 'lucide-react';
import {closestCenter, DndContext, PointerSensor, useSensor, useSensors,} from '@dnd-kit/core';
import {arrayMove, SortableContext, verticalListSortingStrategy,} from '@dnd-kit/sortable';
import ReactMarkdown from "react-markdown";
import {useTranslation} from 'react-i18next';
import SortableTagItem from "../components/SortableTagItem";


const CreateVacancyPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        work_format: 'OFFICE',
        cities: [],
        tags: [],
        application_template: null,
    });
    const [templateInfo, setTemplateInfo] = useState(null);
    const [countries, setCountries] = useState([]);
    const [tagGroups, setTagGroups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [showChangeModal, setShowChangeModal] = useState(false);
    const [allTemplates, setAllTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCountry, setExpandedCountry] = useState(null);
    const [expandedTagGroup, setExpandedTagGroup] = useState(null);
    const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);
    const [newTemplateData, setNewTemplateData] = useState({
        name: '',
        is_global: false,
    });
    const [templateError, setTemplateError] = useState(null);
    const [questionTypes, setQuestionTypes] = useState([]);
    const [showQuestionForm, setShowQuestionForm] = useState(false);
    const [newQuestion, setNewQuestion] = useState({
        name: '',
        type: '',
        max_length: null,
        is_required: false,
        custom_requirements: {},
    });
    const [questions, setQuestions] = useState([]);
    const [showAnswerForm, setShowAnswerForm] = useState(false);
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);
    const [fileTypes, setFileTypes] = useState([]);
    const [selectedFileTypes, setSelectedFileTypes] = useState([]);

    const navigate = useNavigate();
    const sensors = useSensors(useSensor(PointerSensor));
    const [isPreview, setIsPreview] = useState(false);
  const { t } = useTranslation();

    useEffect(() => {
        (async () => {
            try {
                const [countriesRes, tagGroupsRes, templateRes] = await Promise.all([
                    apiClient('dict/countries/', {method: 'GET'}),
                    apiClient('tags/groups/', {method: 'GET'}),
                    apiClient('templates/1/', {method: 'GET'}),
                ]);

                if (!countriesRes.ok || !tagGroupsRes.ok || !templateRes.ok) {
                    throw new Error('Failed to fetch initial data');
                }

                const countriesData = await countriesRes.json();
                const tagGroupsData = await tagGroupsRes.json();
                const templateData = await templateRes.json();

                setCountries(countriesData);
                setTagGroups(tagGroupsData);
                setFormData(fd => ({...fd, application_template: templateData.id}));
                setTemplateInfo(templateData);
            } catch (err) {
                console.error(err);
            }
        })();
    }, []);

    useEffect(() => {
        if (showCreateTemplateModal && !fileTypes.length) {
            const fetchFileTypes = async () => {
                try {
                    const res = await apiClient('files/types/', {method: 'GET'});
                    if (res.ok) {
                        setFileTypes(await res.json());
                    }
                } catch (err) {
                    console.error('Failed to fetch file types', err);
                }
            };
            fetchFileTypes();
        }
    }, [showCreateTemplateModal, fileTypes.length]);

    useEffect(() => {
        if (showCreateTemplateModal) {
            const fetchQuestionTypes = async () => {
                try {
                    const res = await apiClient('templates/questions/types/', {method: 'GET'});
                    if (res.ok) {
                        setQuestionTypes(await res.json());
                    }
                } catch (err) {
                    console.error('Failed to fetch question types', err);
                }
            };
            fetchQuestionTypes();
        }
    }, [showCreateTemplateModal]);

    const handleAddQuestion = () => {
        if (!newQuestion.name.trim()) {
            setTemplateError(t('question_name_is_required'));
            return;
        }

        if (newQuestion.name.length > 100) {
            setTemplateError(t('question_name_cannot_exceed_100_characters'));
            return;
        }

        if (!newQuestion.type) {
            setTemplateError(t('question_type_is_required'));
            return;
        }

        if (newQuestion.type === 'FILE' && selectedFileTypes.length === 0) {
            setTemplateError(t('at_least_one_file_type_must_be_selected'));
            return;
        }

        // Validate max_length for text questions
        if (['SHORT_TEXT', 'LONG_TEXT'].includes(newQuestion.type)) {
            if (!newQuestion.max_length || newQuestion.max_length <= 0) {
                setTemplateError(t('max_length_must_be_a_positive_number_for_text_questions'));
                return;
            }
        }

        const questionToAdd = {
            ...newQuestion,
            custom_requirements: newQuestion.type === 'FILE'
                ? {types: selectedFileTypes}
                : newQuestion.custom_requirements
        };

        if (editingQuestionIndex !== null) {
            const updatedQuestions = [...questions];
            updatedQuestions[editingQuestionIndex] = questionToAdd;
            setQuestions(updatedQuestions);
        } else {
            setQuestions([...questions, questionToAdd]);
        }

        // Reset form
        setNewQuestion({
            name: '',
            type: '',
            max_length: null,
            is_required: false,
            custom_requirements: {},
        });
        setSelectedFileTypes([]);
        setShowQuestionForm(false);
        setTemplateError(null);
    };

    const handleFileTypeToggle = (fileType) => {
        setSelectedFileTypes(prev =>
            prev.includes(fileType)
                ? prev.filter(type => type !== fileType)
                : [...prev, fileType]
        );
    };

    const handleAddAnswer = () => {
        if (!currentAnswer.trim()) {
            setTemplateError(t('answer_value_is_required'));
            return;
        }

        const updatedQuestions = [...questions];
        const questionToUpdate = editingQuestionIndex !== null
            ? updatedQuestions[editingQuestionIndex]
            : newQuestion;

        const updatedAnswers = [
            ...(questionToUpdate.answers || []),
            {value: currentAnswer}
        ];

        if (editingQuestionIndex !== null) {
            updatedQuestions[editingQuestionIndex] = {
                ...questionToUpdate,
                answers: updatedAnswers
            };
            setQuestions(updatedQuestions);
        } else {
            setNewQuestion({
                ...newQuestion,
                answers: updatedAnswers
            });
        }

        setCurrentAnswer('');
        setTemplateError(null);
    };

    const handleRemoveAnswer = (answerIndex, questionIndex) => {
        const updatedQuestions = [...questions];
        updatedQuestions[questionIndex] = {
            ...updatedQuestions[questionIndex],
            answers: updatedQuestions[questionIndex].answers.filter((_, idx) => idx !== answerIndex)
        };
        setQuestions(updatedQuestions);
    };

    const handleCityToggle = useCallback((cityId) => {
        setFormData(fd => {
            const exists = fd.cities.includes(cityId);
            return {
                ...fd,
                cities: exists
                    ? fd.cities.filter(id => id !== cityId)
                    : [...fd.cities, cityId],
            };
        });
    }, []);

    const handleAddTag = useCallback((tag) => {
        setFormData(fd =>
            fd.tags.some(t => t.id === tag.id)
                ? fd
                : {...fd, tags: [...fd.tags, tag]}
        );
    }, []);

    const handleRemoveTag = useCallback((id) => {
        setFormData(fd => ({...fd, tags: fd.tags.filter(t => t.id !== id)}));
    }, []);

    const handleDragEnd = useCallback((event) => {
        const {active, over} = event;
        if (active.id !== over.id) {
            setFormData(fd => {
                const oldIndex = fd.tags.findIndex(t => t.id === active.id);
                const newIndex = fd.tags.findIndex(t => t.id === over.id);
                return {...fd, tags: arrayMove(fd.tags, oldIndex, newIndex)};
            });
        }
    }, []);

    const filteredCountries = useMemo(() => {
        if (!searchTerm) return countries;
        return countries.filter(country =>
            country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            country.cities.some(city =>
                city.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
    }, [countries, searchTerm]);

    const handleCreateTemplate = async () => {
        if (!newTemplateData.name.trim()) {
            setTemplateError(t('template_name_is_required'));
            return;
        }

        const payload = {
            name: newTemplateData.name,
            is_global: newTemplateData.is_global,
            questions: questions.map(q => ({
                name: q.name,
                type: q.type,
                max_length: ['SHORT_TEXT', 'LONG_TEXT'].includes(q.type) ? q.max_length : null,
                is_required: q.is_required,
                custom_requirements: q.custom_requirements,
                answers: q.type === 'SINGLE_ANSWER' ? q.answers : [],
            })),
        };

        setLoading(true);
        setTemplateError(null);

        try {
            const res = await apiClient('templates/', {
                method: 'POST',
                body: JSON.stringify(payload),
            });

            if (res.status === 201) {
                const data = await res.json();
                setFormData(fd => ({
                    ...fd,
                    application_template: data.id,
                }));
                setTemplateInfo(data);
                setShowCreateTemplateModal(false);
                setNewTemplateData({name: '', is_global: false});
                setQuestions([]);
            } else {
                const errorData = await res.json();
                setTemplateError(errorData.detail || t('failed_to_create_template'));
            }
        } catch (err) {
            setTemplateError(t('network_error'));
        } finally {
            setLoading(false);
        }
    };

    const citiesBlock = useMemo(() => (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18}/>
                <input
                    type="text"
                    placeholder={`${t('search_countries_or_cities')}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
            </div>
            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 space-y-4 bg-white">
                {filteredCountries.map(country => (
                    <div key={country.name} className="border-b border-gray-100 last:border-b-0 pb-2 last:pb-0">
                        <button
                            type="button"
                            onClick={() => setExpandedCountry(expandedCountry === country.name ? null : country.name)}
                            className="w-full flex justify-between items-center py-2 px-1 hover:bg-gray-50 rounded"
                        >
                            <span className="font-semibold text-gray-700">{country.name}</span>
                            {expandedCountry === country.name ? (
                                <ChevronUp className="text-gray-500"/>
                            ) : (
                                <ChevronDown className="text-gray-500"/>
                            )}
                        </button>
                        {expandedCountry === country.name && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 pl-2">
                                {country.cities.map(city => (
                                    <label key={city.id}
                                           className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                                        <input
                                            type="checkbox"
                                            checked={formData.cities.includes(city.id)}
                                            onChange={() => handleCityToggle(city.id)}
                                            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                        />
                                        <span className="text-gray-700">{city.name}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {formData.cities.length > 0 && (
                <div className="bg-blue-50 p-3 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">{t('selected_cities')}</h4>
                    <div className="flex flex-wrap gap-2">
                        {formData.cities.map(cityId => {
                            const country = countries.find(c => c.cities.some(ct => ct.id === cityId));
                            const city = country?.cities.find(c => c.id === cityId);
                            return (
                                <span key={cityId}
                                      className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm">
                                    {city?.name}
                                    <button
                                        onClick={() => handleCityToggle(cityId)}
                                        className="ml-2 text-blue-500 hover:text-blue-700"
                                    >
                                        <X size={14}/>
                                    </button>
                                </span>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    ), [countries, formData.cities, handleCityToggle, searchTerm, filteredCountries, expandedCountry, t]);

    const tagsBlock = useMemo(() => (
        <div className="space-y-4">
            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-white">
                {tagGroups.map(group => (
                    <div key={group.id} className="mb-4 last:mb-0">
                        <button
                            type="button"
                            onClick={() => setExpandedTagGroup(expandedTagGroup === group.id ? null : group.id)}
                            className="w-full flex justify-between items-center py-2 px-1 hover:bg-gray-50 rounded"
                        >
                            <span className="font-semibold text-gray-700">{group.name}</span>
                            {expandedTagGroup === group.id ? (
                                <ChevronUp className="text-gray-500"/>
                            ) : (
                                <ChevronDown className="text-gray-500"/>
                            )}
                        </button>
                        {expandedTagGroup === group.id && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pl-2">
                                {group.tags.map(tag => (
                                    <button
                                        key={tag.id}
                                        type="button"
                                        onClick={() => handleAddTag(tag)}
                                        disabled={formData.tags.some(t => t.id === tag.id)}
                                        className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                                            formData.tags.some(t => t.id === tag.id)
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                        }`}
                                    >
                                        {tag.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {formData.tags.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">{t('selected_tags_drag_to_reorder')}</h4>
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={formData.tags.map(t => t.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-2">
                                {formData.tags.map(tag => (
                                    <SortableTagItem key={tag.id} tag={tag} onRemove={handleRemoveTag}/>
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>
            )}
        </div>
    ), [tagGroups, formData.tags, handleAddTag, handleRemoveTag, handleDragEnd, sensors, expandedTagGroup, t]);

    const handleSubmit = async e => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const payload = {
            ...formData,
            tags: formData.tags.map((tag, idx) => ({tag: tag.id, position: idx + 1})),
        };

        try {
            const res = await apiClient('vacancies/', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            if (res.status === 201) {
                const data = await res.json();
                navigate(`/vacancies/${data.id}`);
            } else {
                const errD = await res.json();
                setError(errD.detail || t('failed_to_create_vacancy'));
            }
        } catch {
            setError(t('network_error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
                        <h1 className="text-2xl font-bold text-gray-800">{t('create_new_vacancy')}</h1>
                        <p className="mt-1 text-sm text-gray-600">{t('fill_in_the_details_to_create_vacancy')}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">
                        {error && (
                            <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg"
                                             viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd"
                                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                                  clipRule="evenodd"/>
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-red-700">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Name */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">{t('job_title')}</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData(fd => ({...fd, name: e.target.value}))}
                                className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                placeholder={t('job_title_placeholder')}
                                required
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block font-medium text-gray-700">{t('description')}</label>
                                <button
                                    type="button"
                                    onClick={() => setIsPreview(!isPreview)}
                                    className="text-sm text-blue-600 hover:text-blue-800"
                                >
                                    {isPreview ? t('edit_markdown') : t('preview_markdown')}
                                </button>
                            </div>

                            {isPreview ? (
                                <div className="border border-gray-300 rounded-lg p-4 bg-white min-h-[200px]">
                                    <article className="prose max-w-none">
                                        <ReactMarkdown>{formData.description}</ReactMarkdown>
                                    </article>
                                </div>
                            ) : (
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData(fd => ({...fd, description: e.target.value}))}
                                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500 min-h-[200px]"
                                    placeholder={`${t('description_placeholder')}...`}
                                    required
                                />
                            )}

                            <div className="mt-1 text-xs text-gray-500">
                                {t('supports_markdown_formatting')}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Work Format */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">{t('work_format')}</label>
                                <select
                                    value={formData.work_format}
                                    onChange={e => setFormData(fd => ({...fd, work_format: e.target.value}))}
                                    className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    required
                                >
                                    <option value="OFFICE">{t('office')}</option>
                                    <option value="REMOTE">{t('remote')}</option>
                                    <option value="HYBRID">{t('hybrid')}</option>
                                </select>
                            </div>

                            {/* Application Template */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">{t('application_form_template')}</label>
                                <div className="flex items-center space-x-3">
                                    <div className="flex-1 border border-gray-300 rounded-lg px-4 py-2 bg-white">
                                        {templateInfo ? (
                                            <span className="text-gray-700">
                                                {templateInfo.name} ({t('created')} {new Date(templateInfo.created_at).toLocaleDateString('en-GB', {
                                                day: '2-digit', month: 'short', year: 'numeric'
                                            })})
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">{t('loading_default_template')}...</span>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowPreviewModal(true)}
                                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        {t('preview')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            try {
                                                const res = await apiClient('templates/', {method: 'GET'});
                                                if (!res.ok) throw new Error();
                                                setAllTemplates(await res.json());
                                                setShowChangeModal(true);
                                                setSelectedTemplate(null);
                                            } catch {
                                                console.error(t('failed_to_load_templates'));
                                            }
                                        }}
                                        className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                    >
                                        {t('change')}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Cities */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">{t('job_locations')}</label>
                            {citiesBlock}
                        </div>

                        {/* Tags */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">{t('skills_and_technologies')}</label>
                            {tagsBlock}
                        </div>

                        <div className="pt-4 border-t border-gray-200">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white ${
                                    loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors`}
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                             xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                                    strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor"
                                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {t('creating_vacancy')}...
                                    </>
                                ) : t('create_vacancy')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Preview Modal */}
            {showPreviewModal && templateInfo && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div
                        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">
                                {t('application_form_preview')}: {templateInfo.name}
                            </h2>
                            <button
                                onClick={() => setShowPreviewModal(false)}
                                className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                            >
                                <X size={24}/>
                            </button>
                        </div>
                        <div className="overflow-y-auto p-6 space-y-6">
                            <form className="space-y-6">
                                {templateInfo.questions.map(q => (
                                    <div key={q.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {q.name}
                                            {q.is_required && <span className="text-red-500 ml-1">*</span>}
                                        </label>
                                        {q.type === 'SHORT_TEXT' && (
                                            <>
                                                <input
                                                    type="text"
                                                    placeholder={t('your_answer')}
                                                    className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                />
                                                <p className="text-xs text-gray-500 mt-2">
                                                    {t('max_length')}: {q.max_length} {t('characters')}
                                                </p>
                                            </>
                                        )}
                                        {q.type === 'LONG_TEXT' && (
                                            <>
                                                <textarea
                                                    placeholder={t('your_answer')}
                                                    className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                    rows={4}
                                                />
                                                <p className="text-xs text-gray-500 mt-2">
                                                    {t('max_length')}: {q.max_length} {t('characters')}
                                                </p>
                                            </>
                                        )}
                                        {q.type === 'SINGLE_ANSWER' && (
                                            <ul className="space-y-3 mt-3">
                                                {q.answers.map(ans => (
                                                    <li
                                                        key={ans.id}
                                                        onClick={() =>
                                                            setSelectedAnswers(sa => ({...sa, [q.id]: ans.id}))
                                                        }
                                                        className={`flex items-start p-3 rounded-lg cursor-pointer ${
                                                            selectedAnswers[q.id] === ans.id
                                                                ? 'bg-blue-50 border border-blue-200'
                                                                : 'hover:bg-gray-50 border border-transparent'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`inline-flex items-center justify-center h-5 w-5 rounded-full mr-3 mt-0.5 flex-shrink-0 ${
                                                                selectedAnswers[q.id] === ans.id
                                                                    ? 'bg-blue-600 text-white'
                                                                    : 'border border-gray-300'
                                                            }`}>
                                                        </span>
                                                        <span className="text-gray-700">{ans.value}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                        {q.type === 'FILE' && q.custom_requirements?.types?.length > 0 && (
                                            <div className="mt-2">
                                                <p className="text-xs font-medium text-gray-500">{t('required_types')}:</p>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {q.custom_requirements.types.map(type => (
                                                        <span
                                                            key={type}
                                                            className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-800 text-xs"
                                                        >
                                                            {type}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </form>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                            <button
                                onClick={() => setShowPreviewModal(false)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                {t('close_preview')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Change Modal */}
            {showChangeModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div
                        className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">{t('select_application_template')}</h2>
                            <button
                                onClick={() => setShowChangeModal(false)}
                                className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                            >
                                <X size={24}/>
                            </button>
                        </div>
                        <div className="p-4 border-b border-gray-200">
                            <button
                                onClick={() => {
                                    setShowChangeModal(false);
                                    setShowCreateTemplateModal(true);
                                }}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                            >
                                <Plus size={18} className="mr-2"/>
                                {t('create_new_template')}
                            </button>
                        </div>
                        <div className="overflow-y-auto p-6">
                            <div className="space-y-4">
                                {allTemplates.map(tpl => {
                                    const isOpen = selectedTemplate?.id === tpl.id;
                                    return (
                                        <div
                                            key={tpl.id}
                                            className={`border rounded-lg overflow-hidden ${
                                                isOpen ? 'border-blue-300 shadow-md' : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className="p-4 bg-white">
                                                <div className="flex justify-between items-center">
                                                    <div className="flex-1">
                                                        <h3 className="font-medium text-gray-800">{tpl.name}</h3>
                                                        <p className="text-sm text-gray-500">
                                                            {t('created')} {new Date(tpl.created_at).toLocaleDateString('en-GB', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric',
                                                        })}
                                                        </p>
                                                    </div>
                                                    <div className="flex space-x-3">
                                                        <button
                                                            onClick={() => setSelectedTemplate(isOpen ? null : tpl)}
                                                            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                                        >
                                                            {isOpen ? t('hide_details') : t('show_details')}
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setFormData(fd => ({
                                                                    ...fd,
                                                                    application_template: tpl.id,
                                                                }));
                                                                setTemplateInfo(tpl);
                                                                setShowChangeModal(false);
                                                            }}
                                                            className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                                                        >
                                                            {t('select')}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            {isOpen && (
                                                <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-4">
                                                    {tpl.questions.map(q => (
                                                        <div
                                                            key={q.id}
                                                            className="border border-gray-200 rounded-lg p-4 bg-white"
                                                        >
                                                            <label
                                                                className="block text-sm font-medium text-gray-700 mb-2">
                                                                {q.name}
                                                                {q.is_required && (
                                                                    <span className="text-red-500 ml-1">*</span>
                                                                )}
                                                            </label>
                                                            {q.type === 'SHORT_TEXT' && (
                                                                <>
                                                                    <input
                                                                        type="text"
                                                                        placeholder={t('your_answer')}
                                                                        className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                                    />
                                                                    <p className="text-xs text-gray-500 mt-2">
                                                                        {t('max_length')}: {q.max_length} {t('characters')}
                                                                    </p>
                                                                </>
                                                            )}
                                                            {q.type === 'LONG_TEXT' && (
                                                                <>
                                                                    <textarea
                                                                        placeholder={t('your_answer')}
                                                                        className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                                        rows={4}
                                                                    />
                                                                    <p className="text-xs text-gray-500 mt-2">
                                                                        {t('max_length')}: {q.max_length} {t('characters')}
                                                                    </p>
                                                                </>
                                                            )}
                                                            {q.type === 'SINGLE_ANSWER' && (
                                                                <ul className="space-y-3 mt-3">
                                                                    {q.answers.map(ans => (
                                                                        <li
                                                                            key={ans.id}
                                                                            className="flex items-start text-gray-700 p-2"
                                                                        >
                                                                            <span
                                                                                className="inline-flex items-center justify-center h-5 w-5 rounded-full border border-gray-300 mr-3 mt-0.5 flex-shrink-0"></span>
                                                                            <span>{ans.value}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            )}
                                                            {q.type === 'FILE' && q.custom_requirements?.types?.length > 0 && (
                                                                <div className="mt-2">
                                                                    <p className="text-xs font-medium text-gray-500">{t('required_types')}:</p>
                                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                                        {q.custom_requirements.types.map(type => (
                                                                            <span
                                                                                key={type}
                                                                                className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-800 text-xs"
                                                                            >
                                                                                {type}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                            <button
                                onClick={() => setShowChangeModal(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                {t('cancel')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Template Modal */}
            {showCreateTemplateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div
                        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">{t('create_new_template')}</h2>
                            <button
                                onClick={() => {
                                    setShowCreateTemplateModal(false);
                                    setNewTemplateData({name: '', is_global: false});
                                    setQuestions([]);
                                    setTemplateError(null);
                                }}
                                className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                            >
                                <X size={24}/>
                            </button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto">
                            {templateError && (
                                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                                    {templateError}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            {t('template_name')} *
                                        </label>
                                        <input
                                            type="text"
                                            value={newTemplateData.name}
                                            onChange={(e) => setNewTemplateData({
                                                ...newTemplateData,
                                                name: e.target.value
                                            })}
                                            maxLength={300}
                                            className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                            placeholder={t('enter_template_name')}
                                        />
                                        <p className="text-xs text-gray-500">
                                            {newTemplateData.name.length}/300 {t('characters')}
                                        </p>
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="is-global"
                                            checked={newTemplateData.is_global}
                                            onChange={(e) => setNewTemplateData({
                                                ...newTemplateData,
                                                is_required: e.target.checked
                                            })}
                                            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                        />
                                        <label htmlFor="is-global" className="ml-2 block text-sm text-gray-700">
                                            {t('global_template_available_to_all_users')}
                                        </label>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-medium text-gray-800">{t('questions')}</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowQuestionForm(true)}
                                            className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                        >
                                            {t('add_new_question')}
                                        </button>
                                    </div>

                                    {questions.length > 0 ? (
                                        <div className="space-y-3">
                                            {questions.map((q, index) => (
                                                <div key={index} className="border border-gray-200 rounded-lg p-3">
                                                    <div className="flex justify-between">
                                                        <div>
                                                            <p className="font-medium">{q.name}</p>
                                                            <p className="text-sm text-gray-500">{q.type}</p>
                                                            {q.max_length && (
                                                                <p className="text-xs text-gray-500">{t('max_length')}: {q.max_length}</p>
                                                            )}
                                                            {q.type === 'SINGLE_ANSWER' && q.answers?.length > 0 && (
                                                                <div className="mt-2">
                                                                    <p className="text-xs font-medium text-gray-500">{t('options')}:</p>
                                                                    <ul className="text-xs text-gray-500 list-disc list-inside">
                                                                        {q.answers.map((a, idx) => (
                                                                            <li key={idx}>{a.value}</li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                            {q.type === 'FILE' && q.custom_requirements?.types?.length > 0 && (
                                                                <div className="mt-2">
                                                                    <p className="text-xs font-medium text-gray-500">{t('required_types')}:</p>
                                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                                        {q.custom_requirements.types.map(type => (
                                                                            <span key={type}
                                                                                  className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-800 text-xs">
                                                                                {type}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <p className="text-xs text-gray-500">
                                                                {q.is_required ? t('required') : t('optional')}
                                                            </p>
                                                        </div>
                                                        <div className="flex space-x-2">
                                                            <button
                                                                onClick={() => {
                                                                    setNewQuestion({...q});
                                                                    setEditingQuestionIndex(index);
                                                                    setShowQuestionForm(true);
                                                                }}
                                                                className="text-blue-500 hover:text-blue-700"
                                                            >
                                                                {t('edit')}
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setQuestions(questions.filter((_, i) => i !== index));
                                                                }}
                                                                className="text-red-500 hover:text-red-700"
                                                            >
                                                                <X size={16}/>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500">{t('no_questions_added_yet')}</p>
                                    )}
                                </div>
                            </div>

                            {/* Question Form */}
                            {showQuestionForm && (
                                <div className="mt-6 border-t pt-6 space-y-4">
                                    <h3 className="text-lg font-medium text-gray-800">{t('add_new_question')}</h3>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            {t('question_name')} *
                                        </label>
                                        <input
                                            type="text"
                                            value={newQuestion.name}
                                            onChange={(e) => setNewQuestion({
                                                ...newQuestion,
                                                name: e.target.value
                                            })}
                                            maxLength={100}
                                            className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Enter question text"
                                        />
                                        <p className="text-xs text-gray-500">
                                            {newQuestion.name.length}/100 {t('characters')}
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            {t('question_type')} *
                                        </label>
                                        <select
                                            value={newQuestion.type}
                                            onChange={(e) => setNewQuestion({
                                                ...newQuestion,
                                                type: e.target.value,
                                                max_length: ['SHORT_TEXT', 'LONG_TEXT'].includes(e.target.value) ? newQuestion.max_length : null
                                            })}
                                            className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="">Select a type</option>
                                            {questionTypes.map((type) => (
                                                <option key={type.name} value={type.name}>
                                                    {type.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {['SHORT_TEXT', 'LONG_TEXT'].includes(newQuestion.type) && (
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">
                                                {t('max_length')} *
                                            </label>
                                            <input
                                                type="number"
                                                value={newQuestion.max_length || ''}
                                                onChange={(e) => setNewQuestion({
                                                    ...newQuestion,
                                                    max_length: parseInt(e.target.value) || null
                                                })}
                                                min="1"
                                                className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                placeholder={t("enter_maximum_length")}
                                            />
                                        </div>
                                    )}

                                    {newQuestion.type === 'SINGLE_ANSWER' && (
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <h4 className="text-sm font-medium text-gray-700">{t('answers')}</h4>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditingQuestionIndex(null);
                                                        setCurrentAnswer('');
                                                        setShowAnswerForm(true);
                                                    }}
                                                    className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-sm hover:bg-blue-100"
                                                >
                                                    {t('add_answer')}
                                                </button>
                                            </div>

                                            {(newQuestion.answers || []).length > 0 ? (
                                                <div className="space-y-2">
                                                    {newQuestion.answers.map((answer, idx) => (
                                                        <div key={idx}
                                                             className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                            <span>{answer.value}</span>
                                                            <button
                                                                onClick={() => {
                                                                    const updatedAnswers = [...newQuestion.answers];
                                                                    updatedAnswers.splice(idx, 1);
                                                                    setNewQuestion({
                                                                        ...newQuestion,
                                                                        answers: updatedAnswers
                                                                    });
                                                                }}
                                                                className="text-red-500 hover:text-red-700"
                                                            >
                                                                <X size={16}/>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-500">{t('no_answers_added_yet')}</p>
                                            )}
                                        </div>
                                    )}

                                    {newQuestion.type === 'FILE' && (
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">
                                                {t('required_types')} *
                                            </label>
                                            <div
                                                className="max-h-40 overflow-y-auto border border-gray-200 rounded p-2">
                                                {fileTypes.length > 0 ? (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        {fileTypes.map((fileType) => (
                                                            <label key={fileType.name}
                                                                   className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedFileTypes.includes(fileType.name)}
                                                                    onChange={() => handleFileTypeToggle(fileType.name)}
                                                                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                                                />
                                                                <span
                                                                    className="text-sm text-gray-700">{fileType.name}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-gray-500">{t('loading_file_types')}...</p>
                                                )}
                                            </div>
                                            {selectedFileTypes.length > 0 && (
                                                <div className="mt-2">
                                                    <p className="text-xs font-medium text-gray-500">{t('selected_types')}:</p>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {selectedFileTypes.map(type => (
                                                            <span key={type}
                                                                  className="inline-flex items-center px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs">
              {type}
                                                                <button
                                                                    onClick={() => handleFileTypeToggle(type)}
                                                                    className="ml-1 text-blue-500 hover:text-blue-700"
                                                                >
                <X size={12}/>
              </button>
            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* For editing existing questions */}
                                    {editingQuestionIndex !== null && questions[editingQuestionIndex]?.type === 'SINGLE_ANSWER' && (
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <h4 className="text-sm font-medium text-gray-700">Answers</h4>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditingQuestionIndex(null);
                                                        setCurrentAnswer('');
                                                        setShowAnswerForm(true);
                                                    }}
                                                    className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-sm hover:bg-blue-100"
                                                >
                                                    {t('add_answer')}
                                                </button>
                                            </div>

                                            {questions[editingQuestionIndex]?.answers?.length > 0 ? (
                                                <div className="space-y-2">
                                                    {questions[editingQuestionIndex].answers.map((answer, idx) => (
                                                        <div key={idx}
                                                             className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                            <span>{answer.value}</span>
                                                            <button
                                                                onClick={() => handleRemoveAnswer(idx, editingQuestionIndex)}
                                                                className="text-red-500 hover:text-red-700"
                                                            >
                                                                <X size={16}/>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-500">{t('no_answers_added_yet')}</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Answer Form Modal */}
                                    {showAnswerForm && (
                                        <div
                                            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                                            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                                                <div className="flex justify-between items-center mb-4">
                                                    <h3 className="text-lg font-medium">{t('add_answer')}</h3>
                                                    <button
                                                        onClick={() => {
                                                            setShowAnswerForm(false);
                                                            setCurrentAnswer('');
                                                        }}
                                                        className="text-gray-500 hover:text-gray-700"
                                                    >
                                                        <X size={20}/>
                                                    </button>
                                                </div>

                                                <div className="space-y-4">
                                                    {templateError && (
                                                        <div className="p-2 bg-red-50 text-red-600 rounded text-sm">
                                                            {templateError}
                                                        </div>
                                                    )}

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            {t('answer_value')} *
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={currentAnswer}
                                                            onChange={(e) => setCurrentAnswer(e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                            placeholder="Enter answer option"
                                                        />
                                                    </div>

                                                    <div className="flex justify-end space-x-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setShowAnswerForm(false);
                                                                setCurrentAnswer('');
                                                            }}
                                                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                                                        >
                                                            {t('cancel')}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={handleAddAnswer}
                                                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                                        >
                                                            {t('add_answer')}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="is-required"
                                            checked={newQuestion.is_required}
                                            onChange={(e) => setNewQuestion({
                                                ...newQuestion,
                                                is_required: e.target.checked
                                            })}
                                            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                        />
                                        <label htmlFor="is-required" className="ml-2 block text-sm text-gray-700">
                                            {t('required_question')}
                                        </label>
                                    </div>

                                    <div className="flex justify-end space-x-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowQuestionForm(false)}
                                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                        >
                                            {t('cancel')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleAddQuestion}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                        >
                                            {t('add_question')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowCreateTemplateModal(false);
                                    setNewTemplateData({name: '', is_global: false});
                                    setQuestions([]);
                                    setTemplateError(null);
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                {t('cancel')}
                            </button>
                            <button
                                onClick={handleCreateTemplate}
                                disabled={loading || questions.length === 0}
                                className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${
                                    loading || questions.length === 0 ? 'opacity-70 cursor-not-allowed' : ''
                                }`}
                            >
                                {loading ? `${t('creating')}...` : t('create_template')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateVacancyPage;