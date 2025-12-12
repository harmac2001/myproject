import React, { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'

export default function EditClaimHandlerModal({ isOpen, onClose, handlerId, onSaved }) {
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        email: ''
    })

    useEffect(() => {
        if (isOpen) {
            if (handlerId) {
                fetchData()
            } else {
                setFormData({ name: '', code: '', email: '' })
            }
        }
    }, [isOpen, handlerId])

    const fetchData = async () => {
        setLoading(true)
        try {
            // Fetch all and find, as backend lacks GET /:id for handlers
            const response = await fetch('http://localhost:5000/api/options/claim_handlers')
            if (!response.ok) throw new Error('Failed to fetch handlers')
            const data = await response.json()
            const item = data.find(i => i.id == handlerId)
            if (item) {
                setFormData({
                    name: item.name || '',
                    code: item.code || '',
                    email: item.email || ''
                })
            }
        } catch (err) {
            console.error('Error fetching handler:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!formData.name || formData.name.trim() === '') {
            alert('Name is required')
            return
        }

        setSaving(true)
        try {
            const url = handlerId
                ? `http://localhost:5000/api/options/claim_handlers/${handlerId}`
                : `http://localhost:5000/api/options/claim_handlers`

            const method = handlerId ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (!response.ok) throw new Error(await response.text())

            await response.json()
            onSaved()
            onClose()
        } catch (err) {
            alert('Error saving handler: ' + err.message)
        } finally {
            setSaving(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70]">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <h2 className="text-lg font-bold text-slate-900">{handlerId ? 'Edit Claim Handler' : 'Add Claim Handler'}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Name <span className="text-red-500">*</span></label>
                                <input
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Code</label>
                                <input
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                                <input
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2 p-4 border-t border-slate-200">
                    <button onClick={onClose} disabled={saving} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">Cancel</button>
                    <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center gap-2">
                        <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    )
}
