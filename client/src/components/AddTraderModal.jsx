import React, { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'

export default function AddTraderModal({ isOpen, onClose, onSave, traderToEdit = null, initialName = '' }) {
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (isOpen) {
            setError(null)
            if (traderToEdit) {
                setName(traderToEdit.name)
            } else if (initialName) {
                setName(initialName)
            } else {
                setName('')
            }
        }
    }, [isOpen, traderToEdit, initialName])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!name.trim()) return

        setLoading(true)
        setError(null)

        try {
            const url = traderToEdit
                ? `http://localhost:5000/api/options/traders/${traderToEdit.id}`
                : 'http://localhost:5000/api/options/traders'

            const method = traderToEdit ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim() })
            })

            if (!response.ok) {
                const text = await response.text()
                throw new Error(text || 'Failed to save trader')
            }

            const data = await response.json()
            onSave(data)
            onClose()
        } catch (err) {
            console.error('Error saving trader:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
                <div className="flex justify-between items-center px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <h3 className="font-semibold text-slate-800">
                        {traderToEdit ? 'Edit Trader' : 'Add New Trader'}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value.toUpperCase())}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="ENTER COMPANY NAME"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-md border border-slate-300 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !name.trim()}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Save className="h-4 w-4" />
                            {loading ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
