import React, { useState } from 'react'
import { X } from 'lucide-react'

export default function AddMemberModal({ isOpen, onClose, onSave, initialName = '' }) {
    const [formData, setFormData] = useState({
        name: initialName,
        line1: '',
        line2: '',
        line3: '',
        line4: '',
        vat_number: ''
    })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.name.trim()) {
            setError('Member name is required')
            return
        }

        setSaving(true)
        setError('')

        try {
            const response = await fetch('http://localhost:5000/api/options/members', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (response.ok) {
                const newMember = await response.json()
                onSave(newMember)
                setFormData({
                    name: '',
                    line1: '',
                    line2: '',
                    line3: '',
                    line4: '',
                    vat_number: ''
                })
                onClose()
            } else {
                const errorText = await response.text()
                setError(errorText || 'Error creating member')
            }
        } catch (err) {
            console.error('Error creating member:', err)
            setError('Error creating member')
        } finally {
            setSaving(false)
        }
    }

    const handleClose = () => {
        setFormData({
            name: '',
            line1: '',
            line2: '',
            line3: '',
            line4: '',
            vat_number: ''
        })
        setError('')
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-900">Add New Member</h2>
                    <button
                        onClick={handleClose}
                        className="text-slate-400 hover:text-slate-600"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0078d4] focus:border-transparent"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Enter member name..."
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Line 1
                            </label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0078d4] focus:border-transparent"
                                value={formData.line1}
                                onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
                                placeholder="Address line 1..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Line 2
                            </label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0078d4] focus:border-transparent"
                                value={formData.line2}
                                onChange={(e) => setFormData({ ...formData, line2: e.target.value })}
                                placeholder="Address line 2..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Line 3
                            </label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0078d4] focus:border-transparent"
                                value={formData.line3}
                                onChange={(e) => setFormData({ ...formData, line3: e.target.value })}
                                placeholder="Address line 3..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Line 4
                            </label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0078d4] focus:border-transparent"
                                value={formData.line4}
                                onChange={(e) => setFormData({ ...formData, line4: e.target.value })}
                                placeholder="Address line 4..."
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-2 justify-end">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-4 py-2 text-sm font-medium text-white bg-[#0078d4] rounded-md hover:bg-[#006cbd] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
