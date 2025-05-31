import React, {
  useState,
  useEffect,
  useMemo,
  useCallback
} from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../utils/auth';
import { GripVertical, X } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableTagItem = ({ tag, onRemove }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: tag.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between border px-3 py-1 rounded bg-gray-100"
    >
      <div className="flex items-center">
        <GripVertical className="cursor-move mr-2" {...attributes} {...listeners} />
        {tag.name}
      </div>
      <button onClick={() => onRemove(tag.id)} className="text-red-500 hover:text-red-700">
        <X size={16} />
      </button>
    </div>
  );
};

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

  const navigate = useNavigate();
  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    (async () => {
      try {
        const [countriesRes, tagGroupsRes, templateRes] = await Promise.all([
          apiClient('dict/countries/', { method: 'GET' }),
          apiClient('tags/groups/', { method: 'GET' }),
          apiClient('templates/1/', { method: 'GET' }),
        ]);

        if (!countriesRes.ok || !tagGroupsRes.ok || !templateRes.ok) {
          throw new Error('Failed to fetch initial data');
        }

        const countriesData = await countriesRes.json();
        const tagGroupsData = await tagGroupsRes.json();
        const templateData = await templateRes.json();

        setCountries(countriesData);
        setTagGroups(tagGroupsData);
        setFormData(fd => ({ ...fd, application_template: templateData.id }));
        setTemplateInfo(templateData);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

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
        : { ...fd, tags: [...fd.tags, tag] }
    );
  }, []);

  const handleRemoveTag = useCallback((id) => {
    setFormData(fd => ({ ...fd, tags: fd.tags.filter(t => t.id !== id) }));
  }, []);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setFormData(fd => {
        const oldIndex = fd.tags.findIndex(t => t.id === active.id);
        const newIndex = fd.tags.findIndex(t => t.id === over.id);
        return { ...fd, tags: arrayMove(fd.tags, oldIndex, newIndex) };
      });
    }
  }, []);

  const citiesBlock = useMemo(() => (
    <div className="max-h-48 overflow-y-auto border rounded p-2 space-y-2">
      {countries.map(country => (
        <div key={country.name}>
          <div className="font-semibold mb-1">{country.name}</div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            {country.cities.map(city => (
              <label key={city.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.cities.includes(city.id)}
                  onChange={() => handleCityToggle(city.id)}
                />
                <span>{city.name}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  ), [countries, formData.cities, handleCityToggle]);

  const tagsBlock = useMemo(() => (
    <>
      <div className="max-h-48 overflow-y-auto border rounded p-2 space-y-2 mb-2">
        {tagGroups.map(group => (
          <div key={group.id}>
            <div className="font-semibold mb-1">{group.name}</div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {group.tags.map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleAddTag(tag)}
                  className="bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200"
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
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
              <SortableTagItem key={tag.id} tag={tag} onRemove={handleRemoveTag} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </>
  ), [tagGroups, formData.tags, handleAddTag, handleRemoveTag, handleDragEnd, sensors]);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      ...formData,
      tags: formData.tags.map((tag, idx) => ({ tag: tag.id, position: idx + 1 })),
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
        setError(errD.detail || 'Failed to create vacancy');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-8 max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Create Vacancy</h1>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block mb-1 font-medium">Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={e => setFormData(fd => ({ ...fd, name: e.target.value }))}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>
        {/* Description */}
        <div>
          <label className="block mb-1 font-medium">Description</label>
          <textarea
            value={formData.description}
            onChange={e => setFormData(fd => ({ ...fd, description: e.target.value }))}
            className="w-full border px-3 py-2 rounded"
            rows="4"
            required
          />
        </div>
        {/* Work Format */}
        <div>
          <label className="block mb-1 font-medium">Work Format</label>
          <select
            value={formData.work_format}
            onChange={e => setFormData(fd => ({ ...fd, work_format: e.target.value }))}
            className="w-full border px-3 py-2 rounded"
            required
          >
            <option value="OFFICE">Office</option>
            <option value="REMOTE">Remote</option>
            <option value="HYBRID">Hybrid</option>
          </select>
        </div>
        {/* Cities */}
        <div>
          <label className="block mb-1 font-medium">Cities</label>
          {citiesBlock}
        </div>
        {/* Tags */}
        <div>
          <label className="block mb-1 font-medium">Tags</label>
          {tagsBlock}
        </div>
        {/* Application Template */}
        <div>
          <label className="block mb-1 font-medium">Application Template</label>
          <div className="border px-3 py-2 rounded bg-gray-50 flex justify-between items-center">
            {templateInfo
              ? `${templateInfo.name} from ${new Date(templateInfo.created_at).toLocaleDateString('en-GB', {
                  day: '2-digit', month: 'short', year: 'numeric'
                })}`
              : 'Loading default template...'}
            <div className="flex space-x-4">
              <button
                type="button"
                className="text-blue-500 hover:underline"
                onClick={() => setShowPreviewModal(true)}
              >
                Show Details
              </button>
              <button
                type="button"
                className="text-blue-500 hover:underline"
                onClick={async () => {
                  try {
                    const res = await apiClient('templates/', { method: 'GET' });
                    if (!res.ok) throw new Error();
                    setAllTemplates(await res.json());
                    setShowChangeModal(true);
                    setSelectedTemplate(null);
                  } catch {
                    console.error('Failed to load templates');
                  }
                }}
              >
                Change
              </button>
            </div>
          </div>
        </div>
        {/* Submit */}
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create'}
        </button>
      </form>

      {/* Preview Modal */}
      {showPreviewModal && templateInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto relative">
            <button
              onClick={() => setShowPreviewModal(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold mb-4">
              Preview: {templateInfo.name}
            </h2>
            <form className="space-y-6">
              {templateInfo.questions.map(q => (
                <div key={q.id} className="border p-3 rounded bg-gray-50">
                  <label className="block font-semibold mb-1">
                    {q.name}
                    {q.is_required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {q.type === 'SHORT_TEXT' && (
                    <>
                      <input
                        type="text"
                        placeholder="Your answer..."
                        className="w-full border px-3 py-2 rounded"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Max length: {q.max_length}
                      </p>
                    </>
                  )}
                  {q.type === 'LONG_TEXT' && (
                    <>
                      <textarea
                        placeholder="Your answer..."
                        className="w-full border px-3 py-2 rounded"
                        rows={4}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Max length: {q.max_length}
                      </p>
                    </>
                  )}
                  {q.type === 'SINGLE_ANSWER' && (
                    <ul className="space-y-2 mt-2">
                      {q.answers.map(ans => (
                        <li
                          key={ans.id}
                          onClick={() =>
                            setSelectedAnswers(sa => ({ ...sa, [q.id]: ans.id }))
                          }
                          className={`flex items-center cursor-pointer ${
                            selectedAnswers[q.id] === ans.id
                              ? 'font-semibold text-blue-600'
                              : 'text-gray-700'
                          }`}
                        >
                          <span className="mr-2">
                            {selectedAnswers[q.id] === ans.id ? '●' : '○'}
                          </span>
                          {ans.value}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </form>
          </div>
        </div>
      )}

      {/* Change Modal */}
      {showChangeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto relative">
            <button
              onClick={() => setShowChangeModal(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold mb-4">
              Select Application Template
            </h2>
            <div className="space-y-4">
              {allTemplates.map(tpl => {
                const isOpen = selectedTemplate?.id === tpl.id;
                return (
                  <div
                    key={tpl.id}
                    className="border p-3 rounded bg-gray-50 hover:bg-gray-100"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        {tpl.name} from{' '}
                        {new Date(tpl.created_at).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="flex space-x-4">
                        <button
                          onClick={() =>
                            setSelectedTemplate(isOpen ? null : tpl)
                          }
                          className="text-blue-400 hover:underline text-sm"
                        >
                          {isOpen ? 'Hide Details' : 'Show Details'}
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
                          className="text-blue-500 hover:underline text-sm"
                        >
                          Select
                        </button>
                      </div>
                    </div>
                    {isOpen && (
                      <div className="mt-3 border-t pt-4 space-y-4">
                        {tpl.questions.map(q => (
                          <div
                            key={q.id}
                            className="border p-3 rounded bg-gray-50"
                          >
                            <label className="block font-semibold mb-1">
                              {q.name}
                              {q.is_required && (
                                <span className="text-red-500 ml-1">*</span>
                              )}
                            </label>
                            {q.type === 'SHORT_TEXT' && (
                              <>
                                <input
                                  type="text"
                                  placeholder="Your answer..."
                                  className="w-full border px-3 py-2 rounded"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  Max length: {q.max_length}
                                </p>
                              </>
                            )}
                            {q.type === 'LONG_TEXT' && (
                              <>
                                <textarea
                                  placeholder="Your answer..."
                                  className="w-full border px-3 py-2 rounded"
                                  rows={4}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  Max length: {q.max_length}
                                </p>
                              </>
                            )}
                            {q.type === 'SINGLE_ANSWER' && (
                              <ul className="space-y-2 mt-2">
                                {q.answers.map(ans => (
                                  <li
                                    key={ans.id}
                                    className="flex items-center text-gray-700"
                                  >
                                    ○ {ans.value}
                                  </li>
                                ))}
                              </ul>
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
        </div>
      )}
    </div>
  );
};

export default CreateVacancyPage;
