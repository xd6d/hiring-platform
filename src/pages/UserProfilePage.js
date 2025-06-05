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
import {
    Pencil,
    Plus,
    X,
    Trash2,
    GripVertical,
    Edit2,
    Image,
    File,
    Clock,
    GraduationCap,
    FileText,
    Award, Shield, Briefcase, User
} from 'lucide-react';
import defaultProfilePicture from '../assets/default_profile_picture.png';

const SortableItem = ({tag, onDelete}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({id: tag.id});

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1 : 0,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                isDragging
                    ? 'bg-green-200 border-2 border-green-500 shadow-md'
                    : 'bg-green-100 text-green-800'
            }`}
        >
            <button
                {...attributes}
                {...listeners}
                className={`cursor-grab mr-1 ${isDragging ? 'text-green-700' : 'text-green-600 hover:text-green-800'}`}
            >
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
    const [deleteFileModal, setDeleteFileModal] = useState({
        isOpen: false,
        fileId: null,
        fileName: ''
    });
    const fileInputRef = useRef(null);
    const [fileTypes, setFileTypes] = useState([]);
    const [selectedFileType, setSelectedFileType] = useState('');
    const [fileUploadError, setFileUploadError] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

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

                await fetchFileTypes();
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

    const fetchFileTypes = async () => {
        try {
            const response = await apiClient('files/types/', {method: 'GET'});
            if (!response.ok) throw new Error('Failed to fetch file types');
            const data = await response.json();
            setFileTypes(data);
            if (data.length > 0) setSelectedFileType(data[0].name);
        } catch (err) {
            console.error('Error fetching file types:', err);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowedExtensions = ['.png', '.jpeg', '.jpg', '.pdf'];
        const fileExtension = file.name.split('.').pop().toLowerCase();

        if (!allowedExtensions.includes(`.${fileExtension}`)) {
            setFileUploadError('Only PNG, JPEG, JPG, and PDF files are allowed');
            return;
        }

        if (!selectedFileType) {
            setFileUploadError('Please select a file type');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', selectedFileType);

        setIsUploading(true);
        setFileUploadError(null);

        try {
            const response = await apiClient('files/', {
                method: 'POST',
                body: formData,
            });

            if (response.status === 400) {
                const errorData = await response.json();
                const errorMessage = errorData.file?.[0] || 'Invalid file';
                setFileUploadError(errorMessage);
                return;
            }

            if (!response.ok) throw new Error('Failed to upload file');

            // Refresh user data to show the new file
            const userResponse = await apiClient('users/me/', {method: 'GET'});
            if (userResponse.ok) {
                const userData = await userResponse.json();
                setUser(userData);
            }
        } catch (err) {
            setFileUploadError(err.message);
        } finally {
            setIsUploading(false);
            e.target.value = ''; // Reset file input
        }
    };

    const handleDeleteFile = async () => {
        if (!deleteFileModal.fileId) return;

        try {
            const response = await apiClient(`files/${deleteFileModal.fileId}/`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to delete file');

            setUser(prev => ({
                ...prev,
                files: prev.files.filter(file => file.id !== deleteFileModal.fileId)
            }));
        } catch (err) {
            alert(`Error deleting file: ${err.message}`);
        } finally {
            setDeleteFileModal({isOpen: false, fileId: null, fileName: ''});
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
        <div className="pt-8 px-4 sm:px-6 max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-start mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Profile Settings</h1>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        user.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : user.role === 'RECRUITER'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                    }`}>
                        {user.role === 'ADMIN' && <Shield size={14} className="mr-1"/>}
                        {user.role === 'RECRUITER' && <Briefcase size={14} className="mr-1"/>}
                        {user.role === 'CANDIDATE' && <User size={14} className="mr-1"/>}
                        {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
                    </div>
                </div>

                {/* Profile Picture Section */}
                <div className="flex flex-col items-center mb-6">
                    <div className="relative w-32 h-32 mb-4">
                        <img
                            src={photoUrl}
                            alt="Profile"
                            className="w-full h-full rounded-full object-cover border-2 border-gray-200"
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-md hover:bg-gray-50 border border-gray-200"
                        >
                        <Edit2 size={18} className="text-gray-700"/>
                        </button>
                        <input
                            type="file"
                            accept="image/png, image/jpeg"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800">
                        {user.first_name} {user.last_name}
                    </h2>
                    <p className="text-gray-500 mb-2">{user.email}</p>

                </div>

                {/* Personal Information Section */}
                <div className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">
                        Personal Information
                    </h2>
                    <div className="space-y-4">
                        {['first_name', 'last_name', 'email', 'phone_number'].map((field) => (
                            <div key={field} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                                <label className="text-sm font-medium text-gray-700 sm:col-span-1 capitalize">
                                    {field.replace('_', ' ')}
                                </label>
                                <div className="sm:col-span-2">
                                    {editField === field ? (
                                        <div className="space-y-2">
                                            {field === 'email' ? (
                                                <input
                                                    type="email"
                                                    pattern="[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"
                                                    value={fieldValues[field] || ''}
                                                    onChange={(e) => {
                                                        const filtered = e.target.value.replace(/[^\w@.]+/g, '');
                                                        setFieldValues(prev => ({...prev, [field]: filtered}));
                                                    }}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="example@domain.com"
                                                />
                                            ) : field === 'phone_number' ? (
                                                <input
                                                    type="text"
                                                    value={fieldValues[field] || ''}
                                                    onChange={handlePhoneChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="+380 (__) ___-__-__"
                                                />
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={fieldValues[field] || ''}
                                                    onChange={(e) =>
                                                        setFieldValues(prev => ({...prev, [field]: e.target.value}))
                                                    }
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            )}
                                            {fieldErrors[field] && (
                                                <p className="text-red-500 text-sm mt-1">
                                                    {fieldErrors[field]}
                                                </p>
                                            )}
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    onClick={() => setEditField(null)}
                                                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => handleFieldUpdate(field)}
                                                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                                                >
                                                    Save
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <p className="text-gray-800">
                                                {user[field] || <span className="text-gray-400">Not set</span>}
                                            </p>
                                            <button
                                                onClick={() => handlePencilClick(field)}
                                                className="ml-2 text-gray-500 hover:text-blue-600 p-1 rounded-full hover:bg-gray-100"
                                            >
                                                <Pencil size={16}/>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tags Section */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-800">Your Tags</h2>
                        <button
                            onClick={openTagsModal}
                            className="flex items-center gap-1 text-sm bg-blue-500 text-white px-3 py-1.5 rounded hover:bg-blue-600"
                        >
                            <Plus size={16}/> Add tags
                        </button>
                    </div>

                    {user.tags && user.tags.length > 0 ? (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={user.tags.map((tag) => tag.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="flex flex-wrap gap-2 min-h-[40px]">
                                    {user.tags.map((tag) => (
                                        <SortableItem
                                            key={tag.id}
                                            tag={tag}
                                            onDelete={(tagId) => {
                                                setTagToDelete(tagId);
                                                setDeleteModalOpen(true);
                                            }}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                            <div className="mt-2 text-xs text-gray-500 flex items-center">
                                <GripVertical size={12} className="mr-1"/>
                                <span>Drag to reorder tags</span>
                            </div>
                        </DndContext>
                    ) : (
                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                            <p className="text-gray-500">You haven't added any tags yet</p>
                        </div>
                    )}
                </div>

                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-800">Your Files</h2>
                        <div className="flex items-center space-x-3">
                            <label
                                className="flex items-center gap-1 text-sm bg-blue-500 text-white px-3 py-1.5 rounded hover:bg-blue-600 cursor-pointer">
                                <Plus size={16}/> Upload File
                                <input
                                    type="file"
                                    accept=".png,.jpeg,.jpg,.pdf"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    disabled={isUploading}
                                />
                            </label>
                            {fileTypes.length > 0 && (
                                <select
                                    value={selectedFileType}
                                    onChange={(e) => setSelectedFileType(e.target.value)}
                                    className="text-sm border border-gray-300 rounded-md px-2 py-1"
                                >
                                    {fileTypes.map((type) => (
                                        <option key={type.name} value={type.name}>
                                            {type.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>

                    {fileUploadError && (
                        <div className="mb-4 text-red-500 text-sm">{fileUploadError}</div>
                    )}

                    {isUploading && (
                        <div className="mb-4 text-blue-500 text-sm">Uploading file...</div>
                    )}

                    {user.files && user.files.length > 0 ? (
                        <div className="space-y-3">
                            {user.files.map((file) => {
                                const displayName = file.user_filename.length > 30
                                    ? `${file.user_filename.substring(0, 15)}...${file.user_filename.substring(file.user_filename.length - 10)}`
                                    : file.user_filename;

                                const formattedDate = new Date(file.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                });

                                return (
                                    <div key={file.id}
                                         className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-white rounded-md shadow-sm" title={file.type}>
                                                {(() => {
                                                    switch (file.type) {
                                                        case 'Photo':
                                                            return <Image size={16} className="text-blue-500"/>;
                                                        case 'CV':
                                                            return <FileText size={16} className="text-green-500"/>;
                                                        case 'Certificate':
                                                            return <Award size={16} className="text-yellow-500"/>;
                                                        case 'Education':
                                                            return <GraduationCap size={16}
                                                                                  className="text-purple-500"/>;
                                                        default:
                                                            return <File size={16} className="text-gray-500"/>;
                                                    }
                                                })()}
                                            </div>
                                            <div>
                                                <div className="flex items-center space-x-2">
                                                    {file.type && (
                                                        <span className="text-xs text-gray-500">
            Type: {file.type}
        </span>
                                                    )}
                                                    <span className="font-medium text-gray-800"
                                                          title={file.user_filename}>
                                        {displayName}
                                    </span>
                                                    <span
                                                        className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                                        {file.extension.toUpperCase()}
                                    </span>
                                                </div>
                                                <div className="flex items-center text-xs text-gray-500 mt-1">
                                                    <Clock size={12} className="mr-1"/>
                                                    <span>{formattedDate}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => setDeleteFileModal({
                                                    isOpen: true,
                                                    fileId: file.id,
                                                    fileName: file.user_filename
                                                })}
                                                className="p-2 text-gray-500 hover:text-red-500 rounded-full hover:bg-gray-200"
                                                title="Delete"
                                            >
                                                <Trash2 size={18}/>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                            <p className="text-gray-500">No files uploaded yet</p>
                        </div>
                    )}
                </div>

                {/* Sign Out Section */}
                <div className="flex justify-center border-t border-gray-100 pt-6">
                    <button
                        onClick={handleSignOut}
                        className="px-4 py-2 text-red-500 border border-red-500 rounded-md hover:bg-red-50 transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Tags Modal */}
            {tagsModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="relative bg-white p-6 rounded-lg max-w-lg w-full max-h-[80vh] overflow-y-auto">
                        <button
                            onClick={() => setTagsModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                        >
                            <X size={20}/>
                        </button>
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Select Tags</h2>
                        <div className="space-y-6">
                            {tagGroups.map((group) => (
                                <div key={group.id}>
                                    <h3 className="font-semibold text-gray-700 mb-2">{group.name}</h3>
                                    <div className="flex flex-wrap gap-2">
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
                                                className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
                                                    selectedTags.includes(tag.id)
                                                        ? lockedTags.includes(tag.id)
                                                            ? 'bg-gray-200 border-gray-400 text-gray-600 cursor-not-allowed'
                                                            : 'bg-green-100 border-green-400 text-green-800 hover:bg-green-200'
                                                        : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                                                }`}
                                                disabled={lockedTags.includes(tag.id)}
                                            >
                                                {tag.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
                            <button
                                onClick={() => setTagsModalOpen(false)}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveTags}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                            >
                                Save Changes
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
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                        >
                            <X size={20}/>
                        </button>
                        <h2 className="text-xl font-bold text-gray-800 mb-3">Confirm Removal</h2>
                        <p className="text-gray-600 mb-6">Are you sure you want to remove this tag from your
                            profile?</p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setDeleteModalOpen(false)}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteTag(tagToDelete)}
                                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                            >
                                Remove Tag
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {deleteFileModal.isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="relative bg-white p-6 rounded-lg max-w-sm w-full">
                        <button
                            onClick={() => setDeleteFileModal({isOpen: false, fileId: null, fileName: ''})}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                        >
                            <X size={20}/>
                        </button>
                        <h2 className="text-xl font-bold text-gray-800 mb-3">Confirm Deletion</h2>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete <span className="font-medium">"
                            {deleteFileModal.fileName.length > 30
                                ? `${deleteFileModal.fileName.substring(0, 15)}...${deleteFileModal.fileName.substring(deleteFileModal.fileName.length - 10)}`
                                : deleteFileModal.fileName
                            }"
    </span>?
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setDeleteFileModal({isOpen: false, fileId: null, fileName: ''})}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteFile}
                                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfilePage;