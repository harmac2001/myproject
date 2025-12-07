import React, { useState, useEffect } from 'react'
import { X, Save, Ban } from 'lucide-react'
import SearchableSelect from './SearchableSelect'

export default function AddFeeModal({ isOpen, onClose, invoiceId, type, onSaved, feeToEdit = null }) {
    const [formData, setFormData] = useState({
        fee_date: new Date().toISOString().split('T')[0],
        contractor_id: '',
        third_party_contractor_id: '',
        work_performed: '',
        quantity: '1',
        unit: 'Hourly Rate',
        cost: ''
    })
    const [saving, setSaving] = useState(false)
    const [options, setOptions] = useState([])

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const endpoint = type === 'correspondent' ? 'contractors' : 'service_providers'
                const res = await fetch(`http://localhost:5000/api/options/${endpoint}`)
                const data = await res.json()
                setOptions(data)
            } catch (err) {
                console.error('Error fetching options:', err)
            }
        }
        if (isOpen) {
            fetchOptions()
        }
    }, [isOpen, type])

    useEffect(() => {
        if (isOpen) {
            if (feeToEdit) {
                setFormData({
                    fee_date: feeToEdit.fee_date.split('T')[0],
                    contractor_id: feeToEdit.contractor_id || '',
                    third_party_contractor_id: feeToEdit.third_party_contractor_id || '',
                    work_performed: feeToEdit.work_performed,
                    quantity: feeToEdit.quantity,
                    unit: feeToEdit.unit,
                    cost: feeToEdit.cost
                })
            } else {
                // Load cached contractor/provider if available
                const cachedId = localStorage.getItem(`last_${type}_id`)
                const cachedRate = localStorage.getItem(`last_${type}_rate`)
                setFormData({
                    fee_date: new Date().toISOString().split('T')[0],
                    contractor_id: type === 'correspondent' ? (cachedId || '') : '',
                    third_party_contractor_id: type !== 'correspondent' ? (cachedId || '') : '',
                    work_performed: '',
                    quantity: '1',
                    unit: 'Hourly Rate',
                    cost: cachedRate || ''
                })
            }
        }
    }, [isOpen, feeToEdit, type])

    if (!isOpen) return null

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)

        // Validate SearchableSelect
        if (type === 'correspondent' && !formData.contractor_id) {
            alert('Please select a Contractor')
            setSaving(false)
            return
        }
        if (type !== 'correspondent' && !formData.third_party_contractor_id) {
            alert('Please select a Service Provider')
            setSaving(false)
            return
        }

        try {
            const url = feeToEdit
                ? `http://localhost:5000/api/invoices/fees/${feeToEdit.id}`
                : 'http://localhost:5000/api/invoices/fees'

            const method = feeToEdit ? 'PUT' : 'POST'

            const body = {
                ...formData,
                invoice_id: invoiceId
            }

            // Clear the irrelevant ID based on type
            if (type === 'correspondent') {
                body.third_party_contractor_id = null
                // Cache the selected contractor
                if (formData.contractor_id) {
                    localStorage.setItem(`last_${type}_id`, formData.contractor_id)
                }
            } else {
                body.contractor_id = null
                // Cache the selected provider
                if (formData.third_party_contractor_id) {
                    localStorage.setItem(`last_${type}_id`, formData.third_party_contractor_id)
                }
            }

            // Cache Hourly Rate
            if (formData.unit === 'Hourly Rate' && formData.cost) {
                localStorage.setItem(`last_${type}_rate`, formData.cost)
            }

            // Ensure quantity is 1 for Fixed Amount
            if (formData.unit === 'Fixed Amount') {
                body.quantity = 1
            }

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            })

            if (!response.ok) {
                throw new Error('Failed to save fee')
            }

            onSaved()
            onClose()
        } catch (err) {
            console.error('Error saving fee:', err)
            alert('Error saving fee')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-800">
                        {feeToEdit ? 'Edit Fee' : `Add ${type === 'correspondent' ? 'Correspondent Fee' : 'Third-Party Payment'}`}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                        <input
                            type="date"
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.fee_date}
                            onChange={e => setFormData({ ...formData, fee_date: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            {type === 'correspondent' ? 'Contractor *' : 'Service Provider *'}
                        </label>
                        <SearchableSelect
                            options={options}
                            value={type === 'correspondent' ? formData.contractor_id : formData.third_party_contractor_id}
                            onChange={(val) => setFormData({
                                ...formData,
                                [type === 'correspondent' ? 'contractor_id' : 'third_party_contractor_id']: val
                            })}
                            placeholder={`Select ${type === 'correspondent' ? 'Contractor' : 'Provider'}`}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Work Performed / Description *</label>
                        <textarea
                            required
                            rows="3"
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.work_performed}
                            onChange={e => setFormData({ ...formData, work_performed: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Measure (Unit)</label>
                            <select
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.unit}
                                onChange={e => setFormData({ ...formData, unit: e.target.value, quantity: e.target.value === 'Fixed Amount' ? '1' : formData.quantity })}
                            >
                                <option value="Fixed Amount">Fixed Amount</option>
                                <option value="Hourly Rate">Hourly Rate</option>
                            </select>
                        </div>
                        {formData.unit === 'Hourly Rate' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Time (Hours)</label>
                                <input
                                    type="number"
                                    step="0.25"
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.quantity}
                                    onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                                />
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            {formData.unit === 'Hourly Rate' ? 'Hourly Rate *' : 'Amount *'}
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.cost}
                            onChange={e => setFormData({ ...formData, cost: e.target.value })}
                        />
                    </div>

                    {formData.unit === 'Hourly Rate' && formData.quantity && formData.cost && (
                        <div className="text-right text-sm font-medium text-slate-700">
                            Total: {(parseFloat(formData.quantity) * parseFloat(formData.cost)).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </div>
                    )}

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
