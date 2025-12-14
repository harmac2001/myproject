import React, { useState, useEffect } from 'react'
import { X, Save, Ban } from 'lucide-react'
import SearchableSelect from './SearchableSelect'

export default function AddExpenseModal({ isOpen, onClose, incidentId, onSaved, expenseToEdit = null }) {
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        currency: 'BRL',
        date: new Date().toISOString().split('T')[0],
        paid_to: '',
        account_id: '',
        service_provider_id: ''
    })
    const [saving, setSaving] = useState(false)
    const [accounts, setAccounts] = useState([])
    const [serviceProviders, setServiceProviders] = useState([])

    useEffect(() => {
        if (isOpen) {
            // Fetch options
            fetch('http://localhost:5000/api/options/account_charts')
                .then(res => res.json())
                .then(data => setAccounts(data.map(a => ({ ...a, displayName: `${a.code} - ${a.name}` }))))
                .catch(err => console.error('Error fetching accounts:', err))

            fetch('http://localhost:5000/api/options/service_providers')
                .then(res => res.json())
                .then(data => setServiceProviders(data))
                .catch(err => console.error('Error fetching service providers:', err))

            if (expenseToEdit) {
                setFormData({
                    description: expenseToEdit.description,
                    amount: expenseToEdit.amount,
                    currency: expenseToEdit.currency || 'BRL',
                    date: expenseToEdit.date.split('T')[0],
                    paid_to: expenseToEdit.paid_to || '',
                    account_id: expenseToEdit.account_id || '',
                    service_provider_id: expenseToEdit.service_provider_id || ''
                })
            } else {
                setFormData({
                    description: '',
                    amount: '',
                    currency: 'BRL',
                    date: new Date().toISOString().split('T')[0],
                    paid_to: '',
                    account_id: '',
                    service_provider_id: ''
                })
            }
        }
    }, [isOpen, expenseToEdit])

    if (!isOpen) return null

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)

        try {
            const url = expenseToEdit
                ? `/api/expenses/${expenseToEdit.id}`
                : '/api/expenses'

            const method = expenseToEdit ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...formData,
                    incident_id: incidentId
                })
            })

            if (!response.ok) {
                throw new Error('Failed to save expense')
            }

            onSaved()
            onClose()
        } catch (err) {
            console.error('Error saving expense:', err)
            alert('Error saving expense')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-800">
                        {expenseToEdit ? 'Edit Expense' : 'Add Expense'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
                        <input
                            type="text"
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
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

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                        <input
                            type="date"
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.date}
                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Account</label>
                        <SearchableSelect
                            options={accounts}
                            value={formData.account_id}
                            onChange={(val) => setFormData({ ...formData, account_id: val })}
                            placeholder="Select Account"
                            labelKey="displayName"
                            className="w-full"
                            name="account"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Paid To</label>
                        <SearchableSelect
                            options={serviceProviders}
                            value={formData.service_provider_id}
                            onChange={(val) => setFormData({ ...formData, service_provider_id: val })}
                            placeholder="Select Service Provider"
                            className="w-full"
                            name="paid_to"
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
