import React, { useState } from 'react'
import { X, Save, Ban } from 'lucide-react'

export default function AddContactModal({ isOpen, onClose, onSave, initialName = '' }) {
    const [formData, setFormData] = useState({
        name: initialName,
        email: ''
    })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.name.trim()) {
            setError('Name is required')
            return
        }

        setSaving(true)
        setError(null)

        try {
            const res = await fetch('http://localhost:5000/api/options/contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                const newContact = await res.json()
                onSave(newContact)
                setFormData({ name: '', email: '' })
                onClose()
            } else {
                const text = await res.text()
                setError(text || 'Failed to create contact')
            }
        } catch (err) {
            console.error('Error creating contact:', err)
            setError('Error creating contact: ' + err.message)
        } finally {
            setSaving(false)
        }
    }

    const handleClose = () => {
        setFormData({ name: '', email: '' })
        setError(null)
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl">
                <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                    <h2 className="text-xl font-bold text-slate-800">Add New Contact</h2>
                    <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-200">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Name <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Enter contact name..."
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input
                            type="email"
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            placeholder="Enter email address..."
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-6">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 flex items-center gap-2"
                            disabled={saving}
                        >
                            <Ban className="h-4 w-4" /> Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md flex items-center gap-2"
                            disabled={saving}
                        >
                            <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Contact'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
