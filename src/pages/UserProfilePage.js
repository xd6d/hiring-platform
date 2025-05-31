import React, { useEffect, useState } from 'react';
import { apiClient } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
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
import { Pencil, Plus, X, Trash2, GripVertical } from 'lucide-react';

const SortableItem = ({ tag, onDelete }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: tag.id });

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
                <GripVertical size={16} />
            </button>
            <span>{tag.name}</span>
            <button
                onClick={() => onDelete(tag.id)}
                className="ml-2 text-red-500 hover:text-red-700"
                title="Remove tag"
            >
                <Trash2 size={16} />
            </button>
        </div>
    );
};

const UserProfilePage = ({ refreshHeader }) => {
    const [user, setUser] = useState(null);
    const [editField, setEditField] = useState(null);
    const [fieldValues, setFieldValues] = useState({});
    const [tagsModalOpen, setTagsModalOpen] = useState(false);
    const [tagGroups, setTagGroups] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [lockedTags, setLockedTags] = useState([]);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [tagToDelete, setTagToDelete] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    const sensors = useSensors(useSensor(PointerSensor));

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await apiClient('users/me/', { method: 'GET' });
                if (!response.ok) throw new Error('Failed to fetch user data');
                const data = await response.json();
                setUser(data);
                setFieldValues({
                    email: data.email,
                    first_name: data.first_name,
                    last_name: data.last_name,
                    phone_number: data.phone_number,
                });
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    const handleFieldUpdate = async (field) => {
        try {
            const response = await apiClient('users/me/', {
                method: 'PATCH',
                body: JSON.stringify({ [field]: fieldValues[field] }),
            });
            if (!response.ok) throw new Error('Failed to update');
            const updatedUser = await response.json();
            setUser(updatedUser);
            setEditField(null);
        } catch (err) {
            alert(err.message);
        }
    };

    const openTagsModal = async () => {
        try {
            const response = await apiClient('tags/groups/', { method: 'GET' });
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
            const response = await apiClient(`users/me/tags/${tagId}/`, { method: 'DELETE' });
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
        const { active, over } = event;

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
                    body: JSON.stringify({ position: newIndex + 1 }),
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

    if (loading) return <div className="p-4 text-center">Loading...</div>;
    if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

    return (
        <div className="pt-8 px-6 max-w-xl mx-auto min-h-screen flex flex-col justify-between">
            <div>
                <h1 className="text-2xl font-bold mb-4">User Profile</h1>
                <div className="space-y-4">
                    {['email', 'first_name', 'last_name', 'phone_number'].map((field) => (
                        <div key={field} className="flex justify-between items-center">
                            <div className="flex-1">
                                <span className="font-medium capitalize">{field.replace('_', ' ')}:</span>{' '}
                                {editField === field ? (
                                    <input
                                        type="text"
                                        value={fieldValues[field] || ''}
                                        onChange={(e) =>
                                            setFieldValues({ ...fieldValues, [field]: e.target.value })
                                        }
                                        className="border px-2 py-1 rounded w-full mt-1"
                                    />
                                ) : (
                                    <span className="ml-2">{user[field] || '—'}</span>
                                )}
                            </div>
                            <div>
                                {editField === field ? (
                                    <button
                                        onClick={() => handleFieldUpdate(field)}
                                        className="text-green-600 hover:underline ml-2"
                                    >
                                        Save
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setEditField(field)}
                                        className="text-blue-500 hover:text-blue-700 ml-2"
                                    >
                                        <Pencil size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}

                    <div className="mt-4">
                        <span className="font-medium">Tags:</span>
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={user.tags.map((tag) => tag.id)} strategy={verticalListSortingStrategy}>
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
                            <Plus size={16} /> Add tags
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

            {/* Tags Modal */}
            {tagsModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="relative bg-white p-6 rounded-lg max-w-lg w-full max-h-[80vh] overflow-y-auto">
                        <button
                            onClick={() => setTagsModalOpen(false)}
                            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                        >
                            <X size={20} />
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
                                                    setSelectedTags((prev) =>
                                                        prev.includes(tag.id)
                                                            ? prev.filter((id) => id !== tag.id)
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
            )}

            {/* Delete Confirmation Modal */}
            {deleteModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="relative bg-white p-6 rounded-lg max-w-sm w-full">
                        <button
                            onClick={() => setDeleteModalOpen(false)}
                            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                        >
                            <X size={20} />
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
            )}
        </div>
    );
};

export default UserProfilePage;
