import React, { useState, useEffect } from 'react'
import { X, AlertTriangle, ArrowRight } from 'lucide-react'
import SearchableSelect from './SearchableSelect'

export default function ReassignContactModal({ isOpen, onClose, contactToDelete, onReassigned }) {
    const [contacts, setContacts] = useState([])
    const [selectedContactId, setSelectedContactId] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (isOpen) {
            fetchContacts()
        }
    }, [isOpen])

    const fetchContacts = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/options/contacts')
            const data = await res.json()
            // Filter out the contact being deleted
            setContacts(data.filter(c => c.id !== contactToDelete?.id))
        } catch (err) {
            console.error('Error fetching contacts:', err)
        }
    }

    const handleReassign = async () => {
        if (!selectedContactId) {
            setError('Please select a contact to reassign to')
            return
        }

        setLoading(true)
        setError(null)

        try {
            // 1. Reassign
            const reassignRes = await fetch(`http://localhost:5000/api/options/contacts/${contactToDelete.id}/reassign`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ new_contact_id: selectedContactId })
            })

            if (!reassignRes.ok) {
                throw new Error('Failed to reassign contact')
            }

            // 2. Delete
            const deleteRes = await fetch(`http://localhost:5000/api/options/contacts/${contactToDelete.id}`, {
                method: 'DELETE'
            })

            if (!deleteRes.ok) {
                throw new Error('Failed to delete contact after reassignment')
            }

            onReassigned()
            onClose()
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen || !contactToDelete) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-800">Reassign Contact</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800">
                        <p className="font-medium mb-1">Cannot delete contact</p>
                        <p>
                            <strong>{contactToDelete.name}</strong> is currently used in invoices.
                            You must reassign these invoices to another contact before deleting.
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Reassign to</label>
                        <SearchableSelect
                            options={contacts}
                            value={selectedContactId}
                            onChange={setSelectedContactId}
                            placeholder="Select new contact..."
                            labelKey="name"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-6">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleReassign}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md flex items-center gap-2"
                            disabled={loading}
                        >
                            <ArrowRight className="h-4 w-4" /> Reassign & Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
