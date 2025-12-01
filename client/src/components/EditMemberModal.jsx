import React, { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'

export default function EditMemberModal({ isOpen, onClose, memberId, onSaved }) {
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [memberData, setMemberData] = useState({
        name: '',
        line1: '',
        line2: '',
        line3: '',
        line4: '',
        vat_number: ''
    })

    useEffect(() => {
        if (isOpen && memberId) {
            fetchMemberData()
        }
    }, [isOpen, memberId])

    const fetchMemberData = async () => {
        setLoading(true)
        try {
            const response = await fetch(`http://localhost:5000/api/options/members`)
            const data = await response.json()
            const member = data.find(m => m.id === memberId)
            if (member) {
                setMemberData({
                    name: member.name || '',
                    line1: member.line1 || '',
                    line2: member.line2 || '',
                    line3: member.line3 || '',
                    line4: member.line4 || '',
                    vat_number: member.vat_number || ''
                })
            }
        } catch (err) {
            console.error('Error fetching member:', err)
            alert('Error loading member data')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!memberData.name || memberData.name.trim() === '') {
            alert('Member name is required')
            return
        }

        setSaving(true)
        try {
            const response = await fetch(`http://localhost:5000/api/options/members/${memberId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(memberData)
            })

            if (!response.ok) {
                const error = await response.text()
                throw new Error(error)
            }

            await response.json()
            onSaved()
            onClose()
        } catch (err) {
            console.error('Error saving member:', err)
            alert('Error saving member: ' + err.message)
        } finally {
            setSaving(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <h2 className="text-lg font-bold text-slate-900">Edit Member</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Member Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={memberData.name}
                                    onChange={(e) => setMemberData({ ...memberData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter member name"
                                    autoFocus
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-200">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        <Save className="h-4 w-4" />
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    )
}
