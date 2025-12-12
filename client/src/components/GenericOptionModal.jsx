import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

const GenericOptionModal = ({ isOpen, onClose, title, items, onSave, onDelete, type, onAddCustom, onEditCustom }) => {
    const [name, setName] = useState('');
    const [editingItem, setEditingItem] = useState(null);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setName('');
            setEditingItem(null);
            setError(null);
            setSearchTerm('');
        }
    }, [isOpen, onAddCustom, title]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSaving(true);

        try {
            await onSave({ name, id: editingItem?.id });
            setName('');
            setEditingItem(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setName(item.name || '');
        setError(null);
    };

    const handleCancelEdit = () => {
        setEditingItem(null);
        setName('');
        setError(null);
    };

    const safeItems = Array.isArray(items) ? items : [];

    const filteredItems = safeItems.filter(item =>
        (item?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity bg-black/30 backdrop-blur-sm" onClick={onClose} />

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

                <div className="relative z-10 inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">


                    {/* Header */}
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Manage {title}</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-500 max-w-fit">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="px-4 py-4 sm:p-6">
                        {/* Form or Add Button */}
                        {onAddCustom ? (
                            <div className="mb-6 flex justify-end">
                                <button
                                    onClick={onAddCustom}
                                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Add New {title}
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="mb-6">
                                <div className="flex gap-2 items-end">
                                    <div className="flex-grow">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {editingItem ? `Edit ${title}` : `Add New ${title}`}
                                        </label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                            placeholder={`Enter ${title} name...`}
                                            required
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        {editingItem && (
                                            <button
                                                type="button"
                                                onClick={handleCancelEdit}
                                                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            {saving ? (editingItem ? 'Saving...' : 'Adding...') : (editingItem ? 'Update' : 'Add')}
                                        </button>
                                    </div>
                                </div>
                                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                            </form>
                        )}

                        {/* List - with Search */}
                        <div className="mt-4 border-t border-gray-200 pt-4">
                            <div className="mb-3">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search items..."
                                    className="w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md p-2 border"
                                />
                            </div>
                            <div className="max-h-80 overflow-y-auto">
                                <ul className="divide-y divide-gray-200">
                                    {filteredItems.map((item, index) => {
                                        if (!item) return null; // Safe check for map
                                        return (
                                            <li key={item.id || index} className="py-3 flex justify-between items-center group hover:bg-gray-50 px-2 rounded">
                                                <span className="text-sm font-medium text-gray-900">{item.name || 'Unnamed Item'}</span>
                                                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => onEditCustom ? onEditCustom(item) : handleEdit(item)}
                                                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
                                                                onDelete(item.id);
                                                            }
                                                        }}
                                                        className="text-red-600 hover:text-red-900 text-sm font-medium"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </li>
                                        );
                                    })}
                                    {filteredItems.length === 0 && (
                                        <li className="py-4 text-center text-sm text-gray-500">
                                            {searchTerm ? 'No matches found.' : 'No items found.'}
                                        </li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GenericOptionModal;
