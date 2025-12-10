import React, { useState, useEffect } from 'react'
import { X, Save, Ban } from 'lucide-react'
import SearchableSelect from './SearchableSelect'

export default function AddDisbursementModal({ isOpen, onClose, invoiceId, onSaved, disbursementToEdit = null }) {
    const [formData, setFormData] = useState({
        type_id: '',
        comments: '',
        amount: ''
    })
    const [saving, setSaving] = useState(false)
    const [types, setTypes] = useState([])

    useEffect(() => {
        const fetchTypes = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/options/disbursement_types')
                const data = await res.json()
                setTypes(data)
            } catch (err) {
                console.error('Error fetching disbursement types:', err)
            }
        }
        if (isOpen) {
            fetchTypes()
            if (disbursementToEdit) {
                setFormData({
                    type_id: disbursementToEdit.type_id,
                    comments: disbursementToEdit.comments || '',
                    amount: disbursementToEdit.gross_amount
                })
            } else {
                setFormData({
                    type_id: '',
                    comments: '',
                    amount: ''
                })
            }
        }
    }, [isOpen, disbursementToEdit])

    if (!isOpen) return null

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)

        if (!formData.type_id) {
            alert('Please select a Disbursement Type')
            setSaving(false)
            return
        }

        try {
            const url = disbursementToEdit
                ? `http://localhost:5000/api/invoices/disbursements/${disbursementToEdit.id}`
                : 'http://localhost:5000/api/invoices/disbursements'

            const method = disbursementToEdit ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...formData,
                    invoice_id: invoiceId
                })
            })

            if (!response.ok) {
                throw new Error('Failed to save disbursement')
            }

            onSaved()
            onClose()
        } catch (err) {
            console.error('Error saving disbursement:', err)
            alert('Error saving disbursement')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-800">
                        {disbursementToEdit ? 'Edit Disbursement' : 'Add Disbursement'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Type *</label>
                        <SearchableSelect
                            options={types}
                            value={formData.type_id}
                            onChange={(val) => setFormData({ ...formData, type_id: val })}
                            placeholder="Select Type..."
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description / Comments</label>
                        <textarea
                            rows="3"
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.comments}
                            onChange={e => setFormData({ ...formData, comments: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Amount *</label>
                        <input
                            type="number"
                            step="0.01"
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.amount}
                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 flex items-center gap-2"
                        >
                            <Ban className="h-4 w-4" /> Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
