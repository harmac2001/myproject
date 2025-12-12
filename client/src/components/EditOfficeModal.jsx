import React, { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'

export default function EditOfficeModal({ isOpen, onClose, officeId, onSaved }) {
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        code: '',
        line1: '',
        line2: '',
        line3: '',
        line4: '',
        telephone: '',
        fax: '',
        email: '',
        vat_number: '',
        registration: ''
    })

    useEffect(() => {
        if (isOpen) {
            if (officeId) {
                fetchData()
            } else {
                setFormData({
                    name: '', location: '', code: '',
                    line1: '', line2: '', line3: '', line4: '',
                    telephone: '', fax: '', email: '',
                    vat_number: '', registration: ''
                })
            }
        }
    }, [isOpen, officeId])

    const fetchData = async () => {
        setLoading(true)
        try {
            const response = await fetch('http://localhost:5000/api/options/offices')
            if (!response.ok) throw new Error('Failed to fetch offices')
            const data = await response.json()
            const item = data.find(i => i.id == officeId)
            if (item) {
                setFormData({
                    name: item.name || '',
                    location: item.location || '',
                    code: item.code || '',
                    line1: item.line1 || '',
                    line2: item.line2 || '',
                    line3: item.line3 || '',
                    line4: item.line4 || '',
                    telephone: item.telephone || '',
                    fax: item.fax || '',
                    email: item.email || '',
                    vat_number: item.vat_number || '',
                    registration: item.registration || ''
                })
            }
        } catch (err) {
            console.error('Error fetching office:', err)
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
            const url = officeId
                ? `http://localhost:5000/api/options/offices/${officeId}`
                : `http://localhost:5000/api/options/offices`

            const method = officeId ? 'PUT' : 'POST'

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
            alert('Error saving office: ' + err.message)
        } finally {
            setSaving(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70]">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <h2 className="text-lg font-bold text-slate-900">{officeId ? 'Edit Office' : 'Add Office'}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
                    ) : (
                        <div className="space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Name <span className="text-red-500">*</span></label>
                                    <input
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Office Name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Location</label>
                                    <input
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.location || ''}
                                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                                        placeholder="City/Region"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Code</label>
                                    <input
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.code || ''}
                                        onChange={e => setFormData({ ...formData, code: e.target.value })}
                                        placeholder="Short Code"
                                    />
                                </div>
                            </div>

                            {/* Address */}
                            <div className="border-t pt-4">
                                <h3 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">Address Details</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    <input
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.line1 || ''}
                                        onChange={e => setFormData({ ...formData, line1: e.target.value })}
                                        placeholder="Address Line 1"
                                    />
                                    <input
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.line2 || ''}
                                        onChange={e => setFormData({ ...formData, line2: e.target.value })}
                                        placeholder="Address Line 2"
                                    />
                                    <input
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.line3 || ''}
                                        onChange={e => setFormData({ ...formData, line3: e.target.value })}
                                        placeholder="Address Line 3"
                                    />
                                    <input
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.line4 || ''}
                                        onChange={e => setFormData({ ...formData, line4: e.target.value })}
                                        placeholder="Address Line 4 (Country/Postcode)"
                                    />
                                </div>
                            </div>

                            {/* Contact & Legal */}
                            <div className="border-t pt-4">
                                <h3 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">Contact & Legal</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Telephone</label>
                                        <input
                                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={formData.telephone || ''}
                                            onChange={e => setFormData({ ...formData, telephone: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Fax</label>
                                        <input
                                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={formData.fax || ''}
                                            onChange={e => setFormData({ ...formData, fax: e.target.value })}
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                                        <input
                                            type="email"
                                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={formData.email || ''}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">VAT Number</label>
                                        <input
                                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={formData.vat_number || ''}
                                            onChange={e => setFormData({ ...formData, vat_number: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Registration</label>
                                        <input
                                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={formData.registration || ''}
                                            onChange={e => setFormData({ ...formData, registration: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2 p-4 border-t border-slate-200 bg-gray-50 sticky bottom-0">
                    <button onClick={onClose} disabled={saving} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50">Cancel</button>
                    <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center gap-2">
                        <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    )
}
