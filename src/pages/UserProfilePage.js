import React, {useEffect, useState, useRef} from 'react';
import {apiClient} from '../utils/auth';
import {useNavigate} from 'react-router-dom';
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
import {CSS} from '@dnd-kit/utilities';
import {Pencil, Plus, X, Trash2, GripVertical, Edit2} from 'lucide-react';
import defaultProfilePicture from '../assets/default_profile_picture.png';

const SortableItem = ({tag, onDelete}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({id: tag.id});

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
        >
            <button {...attributes} {...listeners} className="cursor-move mr-1">
                <GripVertical size={16}/>
            </button>
            <span>{tag.name}</span>
            <button
                onClick={() => onDelete(tag.id)}
                className="ml-2 text-red-500 hover:text-red-700"
                title="Remove tag"
            >
                <Trash2 size={16}/>
            </button>
        </div>
    );
};

const UserProfilePage = ({refreshHeader}) => {
    const [user, setUser] = useState(null);
    const [editField, setEditField] = useState(null);
    const [fieldValues, setFieldValues] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});
    const [tagsModalOpen, setTagsModalOpen] = useState(false);
    const [tagGroups, setTagGroups] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [lockedTags, setLockedTags] = useState([]);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [tagToDelete, setTagToDelete] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [photoUrl, setPhotoUrl] = useState(null);
    const fileInputRef = useRef(null);

    const navigate = useNavigate();
    const sensors = useSensors(useSensor(PointerSensor));

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await apiClient('users/me/', {method: 'GET'});
                if (!response.ok) throw new Error('Failed to fetch user data');
                const data = await response.json();
                setUser(data);
                setFieldValues({
                    email: data.email,
                    first_name: data.first_name,
                    last_name: data.last_name,
                    phone_number: data.phone_number,
                });
                setPhotoUrl(data.photo?.url ?? defaultProfilePicture);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    const handleFieldUpdate = async (field) => {
        // Clear any existing error for this field before sending
        setFieldErrors(prev => ({...prev, [field]: null}));

        try {
            const response = await apiClient('users/me/', {
                method: 'PATCH',
                body: JSON.stringify({[field]: fieldValues[field]}),
            });

            if (response.status === 400) {
                const errorData = await response.json();
                const messages = errorData[field];
                const messageToShow =
                    Array.isArray(messages) && messages.length > 0
                        ? messages[0]
                        : 'Invalid value';
                setFieldErrors(prev => ({...prev, [field]: messageToShow}));
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to update');
            }

            const updatedUser = await response.json();
            setUser(updatedUser);
            setEditField(null);
            setFieldErrors(prev => ({...prev, [field]: null}));
        } catch (err) {
            alert(err.message);
        }
    };

    const handlePhoneChange = (e) => {
        let digits = e.target.value.replace(/\D/g, '');
        // Ensure country code '380' at start
        if (!digits.startsWith('380')) {
            digits = '380' + digits;
        }
        // Limit to 12 digits (3 for country, 2 for area, 3 for prefix, 2-2 for lines)
        if (digits.length > 12) {
            digits = digits.slice(0, 12);
        }

        let formatted = '+' + digits.slice(0, 3);
        if (digits.length > 3) {
            const area = digits.slice(3, Math.min(5, digits.length));
            formatted += ' (' + area;
            if (area.length === 2) {
                formatted += ')';
            }
        }
        if (digits.length > 5) {
            formatted += ' ' + digits.slice(5, Math.min(8, digits.length));
        }
        if (digits.length > 8) {
            formatted += '-' + digits.slice(8, Math.min(10, digits.length));
        }
        if (digits.length > 10) {
            formatted += '-' + digits.slice(10, Math.min(12, digits.length));
        }

        setFieldValues((prev) => ({...prev, phone_number: formatted}));
    };

    const openTagsModal = async () => {
        try {
            const response = await apiClient('tags/groups/', {method: 'GET'});
            if (!response.ok) throw new Error('Failed to fetch tags');
            const data = await response.json();
            setTagGroups(data);

            const userTagIds = user.tags ? user.tags.map((tag) => tag.id) : [];
            setSelectedTags(userTagIds);
            setLockedTags(userTagIds);

            setTagsModalOpen(true);
        } catch (err) {
            alert(err.message);
        }
    };

    const saveTags = async () => {
        try {
            const newSelectedTags = selectedTags.filter((tagId) => !lockedTags.includes(tagId));
            const startPosition = user.tags ? user.tags.length + 1 : 1;

            const payload = newSelectedTags.map((tagId, index) => ({
                tag: tagId,
                position: startPosition + index,
            }));

            if (payload.length === 0) {
                alert('No new tags selected.');
                setTagsModalOpen(false);
                return;
            }

            const response = await apiClient('users/me/tags/', {
                method: 'POST',
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error('Failed to save tags');

            const addedTags = [];
            tagGroups.forEach((group) => {
                group.tags.forEach((tag) => {
                    if (newSelectedTags.includes(tag.id)) {
                        addedTags.push(tag);
                    }
                });
            });

            setUser((prevUser) => ({
                ...prevUser,
                tags: [...prevUser.tags, ...addedTags],
            }));

            setTagsModalOpen(false);
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDeleteTag = async (tagId) => {
        try {
            const response = await apiClient(`users/me/tags/${tagId}/`, {method: 'DELETE'});
            if (!response.ok) throw new Error('Failed to delete tag');

            setUser((prevUser) => ({
                ...prevUser,
                tags: prevUser.tags.filter((tag) => tag.id !== tagId),
            }));

            setDeleteModalOpen(false);
            setTagToDelete(null);
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDragEnd = async (event) => {
        const {active, over} = event;

        if (active.id !== over.id) {
            const oldIndex = user.tags.findIndex((tag) => tag.id === active.id);
            const newIndex = user.tags.findIndex((tag) => tag.id === over.id);

            const reordered = arrayMove(user.tags, oldIndex, newIndex);

            setUser((prevUser) => ({
                ...prevUser,
                tags: reordered,
            }));

            try {
                const response = await apiClient(`users/me/tags/${active.id}/`, {
                    method: 'PATCH',
                    body: JSON.stringify({position: newIndex + 1}),
                });

                if (!response.ok) throw new Error('Failed to update tag position');
            } catch (err) {
                alert(err.message);
            }
        }
    };

    const handleSignOut = () => {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        if (refreshHeader) refreshHeader();
        navigate('/login');
    };

    const handlePencilClick = (field) => {
        setFieldErrors(prev => ({...prev, [field]: null}));
        setEditField(field);
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            alert('Please upload a PNG or JPEG file.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await apiClient('users/me/upload-photo/', {
                method: 'POST',
                body: formData,
            });
            if (response.status === 201) {
                const data = await response.json();
                const newUrl = data.url;
                if (newUrl) {
                    setPhotoUrl(newUrl);
                    setUser((prev) => ({...prev, photo: {url: newUrl}}));
                    refreshHeader();
                }
            } else {
                const errData = await response.json();
                throw new Error(errData.detail || `Upload failed: ${response.status}`);
            }
        } catch (uploadErr) {
            alert(`Error uploading image: ${uploadErr.message}`);
        } finally {
            e.target.value = '';
        }
    };

    if (loading) return <div className="p-4 text-center">Loading...</div>;
    if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
    if (!user) {
        return null;
    }

    return (
        <div className="pt-8 px-6 max-w-xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold mb-4">User Profile</h1>
                <div className="space-y-4">
                    <div className="relative w-36 h-36 mb-6 mx-auto">
                        <img
                            src={photoUrl}
                            alt="Profile"
                            className="w-36 h-36 rounded-full object-cover border border-gray-300"
                        />
                        <button
                            type="button"
                            onClick={() => {
                                if (fileInputRef.current) {
                                    fileInputRef.current.click();
                                }
                            }}
                            className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow hover:bg-gray-100"
                        >
                            <Edit2 size={22} className="text-gray-600"/>
                        </button>
                        <input
                            type="file"
                            accept="image/png, image/jpeg"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />
                    </div>

                    {['email', 'first_name', 'last_name', 'phone_number'].map((field) => (
                            <div key={field} className="flex justify-between items-start">
                                <div className="flex-1">
                                    <span className="font-medium capitalize">{field.replace('_', ' ')}:</span>{' '}
                                    {editField === field ? (
                                        <>
                                            {field === 'email' ? (
                                                <input
                                                    type="email"
                                                    pattern="[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"
                                                    value={fieldValues[field] || ''}
                                                    onChange={(e) => {
                                                        const filtered = e.target.value.replace(/[^\w@.]+/g, '');
                                                        setFieldValues(prev => ({...prev, [field]: filtered}));
                                                    }}
                                                    className="border px-2 py-1 rounded w-full mt-1"
                                                    placeholder="example@domain.com"
                                                />
                                            ) : field === 'phone_number' ? (
                                                <input
                                                    type="text"
                                                    value={fieldValues[field] || ''}
                                                    onChange={handlePhoneChange}
                                                    className="border px-2 py-1 rounded w-full mt-1"
                                                    placeholder="+380 (__) ___-__-__"
                                                />
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={fieldValues[field] || ''}
                                                    onChange={(e) =>
                                                        setFieldValues(prev => ({...prev, [field]: e.target.value}))
                                                    }
                                                    className="border px-2 py-1 rounded w-full mt-1"
                                                />
                                            )}
                                            {fieldErrors[field] && (
                                                <div className="text-red-500 text-sm mt-1">
                                                    {fieldErrors[field]}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <span className="ml-2">{user[field] || '—'}</span>
                                    )}
                                </div>
                                <div className="ml-4">
                                    {editField === field ? (
                                        <button
                                            onClick={() => handleFieldUpdate(field)}
                                            className="text-green-600 hover:underline mt-1"
                                        >
                                            Save
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handlePencilClick(field)}
                                            className="text-blue-500 hover:text-blue-700 mt-1"
                                        >
                                            <Pencil size={18}/>
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    )}

                    <div className="mt-4">
                        <span className="font-medium">Tags:</span>
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext
                                items={user.tags.map((tag) => tag.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="mt-2 flex flex-col gap-2">
                                    {user.tags && user.tags.length > 0 ? (
                                        user.tags.map((tag) => (
                                            <SortableItem
                                                key={tag.id}
                                                tag={tag}
                                                onDelete={(tagId) => {
                                                    setTagToDelete(tagId);
                                                    setDeleteModalOpen(true);
                                                }}
                                            />
                                        ))
                                    ) : (
                                        <span className="text-gray-500 text-sm">No tags yet</span>
                                    )}
                                </div>
                            </SortableContext>
                        </DndContext>
                        <button
                            onClick={openTagsModal}
                            className="mt-2 bg-blue-500 text-white px-3 py-1 rounded flex items-center gap-1"
                        >
                            <Plus size={16}/> Add tags
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-8 flex justify-center">
                <button
                    onClick={handleSignOut}
                    className="text-red-500 border border-red-500 rounded px-4 py-2 hover:text-red-600 hover:border-red-600"
                >
                    Sign Out
                </button>
            </div>

            {
                tagsModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="relative bg-white p-6 rounded-lg max-w-lg w-full max-h-[80vh] overflow-y-auto">
                            <button
                                onClick={() => setTagsModalOpen(false)}
                                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                            >
                                <X size={20}/>
                            </button>
                            <h2 className="text-xl font-bold mb-4">Select Tags</h2>
                            {tagGroups.map((group) => (
                                <div key={group.id} className="mb-4">
                                    <h3 className="font-semibold">{group.name}</h3>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {group.tags.map((tag) => (
                                            <button
                                                key={tag.id}
                                                onClick={() => {
                                                    if (!lockedTags.includes(tag.id)) {
                                                        setSelectedTags(prev =>
                                                            prev.includes(tag.id)
                                                                ? prev.filter(id => id !== tag.id)
                                                                : [...prev, tag.id]
                                                        );
                                                    }
                                                }}
                                                className={`px-3 py-1 rounded border ${
                                                    selectedTags.includes(tag.id)
                                                        ? lockedTags.includes(tag.id)
                                                            ? 'bg-gray-300 border-gray-500 cursor-not-allowed'
                                                            : 'bg-green-200 border-green-500'
                                                        : 'bg-gray-100 border-gray-300'
                                                }`}
                                                disabled={lockedTags.includes(tag.id)}
                                            >
                                                {tag.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            <div className="flex justify-end mt-4 gap-2">
                                <button
                                    onClick={() => setTagsModalOpen(false)}
                                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveTags}
                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                deleteModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="relative bg-white p-6 rounded-lg max-w-sm w-full">
                            <button
                                onClick={() => setDeleteModalOpen(false)}
                                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                            >
                                <X size={20}/>
                            </button>
                            <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
                            <p className="mb-4">Are you sure you want to remove this tag?</p>
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setDeleteModalOpen(false)}
                                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDeleteTag(tagToDelete)}
                                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    )
        ;
};

export default UserProfilePage;
