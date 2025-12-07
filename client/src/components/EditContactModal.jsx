import React, { useState, useEffect } from 'react'
import { X, Save, Trash2, AlertTriangle } from 'lucide-react'

export default function EditContactModal({ isOpen, onClose, contact, onSaved, onDeleted }) {
    const [formData, setFormData] = useState({
        name: '',
        email: ''
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [deleteError, setDeleteError] = useState(null)

    useEffect(() => {
        if (contact) {
            setFormData({
                name: contact.name || '',
                email: contact.email || ''
            })
            setError(null)
            setDeleteError(null)
        }
    }, [contact])

    if (!isOpen || !contact) return null

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const res = await fetch(`http://localhost:5000/api/options/contacts/${contact.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                onSaved()
                onClose()
            } else {
                const text = await res.text()
                setError(text)
            }
        } catch (err) {
            setError('Failed to update contact')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this contact?')) return

        setLoading(true)
        setDeleteError(null)

        try {
            const res = await fetch(`http://localhost:5000/api/options/contacts/${contact.id}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                onDeleted(contact.id)
                onClose()
            } else {
                const data = await res.json()
                setDeleteError(data.message || 'Failed to delete contact')
            }
        } catch (err) {
            setDeleteError('Error deleting contact')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-800">Edit Contact</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                        {error}
                    </div>
                )}

                {deleteError && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm flex items-start gap-2">
                        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                        <span>{deleteError}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                        <input
                            type="text"
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input
                            type="email"
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-6">
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md flex items-center gap-2"
                            disabled={loading}
                        >
                            <Trash2 className="h-4 w-4" /> Delete
                        </button>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md flex items-center gap-2"
                                disabled={loading}
                            >
                                <Save className="h-4 w-4" /> Save Changes
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
