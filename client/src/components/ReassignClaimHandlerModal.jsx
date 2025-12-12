import React, { useState, useEffect } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import SearchableSelect from './SearchableSelect'

export default function ReassignClaimHandlerModal({ isOpen, onClose, handlerId, handlerName, handlers, onReassignAndDelete }) {
    const [loading, setLoading] = useState(false)
    const [incidents, setIncidents] = useState([])
    const [newHandlerId, setNewHandlerId] = useState('')
    const [reassigning, setReassigning] = useState(false)

    useEffect(() => {
        if (isOpen && handlerId) {
            fetchIncidents()
        }
    }, [isOpen, handlerId])

    const fetchIncidents = async () => {
        setLoading(true)
        try {
            const response = await fetch(`http://localhost:5000/api/options/claim_handlers/${handlerId}/incidents`)
            const data = await response.json()
            setIncidents(data)
        } catch (err) {
            console.error('Error fetching incidents:', err)
            alert('Error loading incidents')
        } finally {
            setLoading(false)
        }
    }

    const handleReassign = async () => {
        if (!newHandlerId) {
            alert('Please select a replacement claim handler')
            return
        }

        if (String(newHandlerId) === String(handlerId)) {
            alert('Please select a different claim handler')
            return
        }

        setReassigning(true)
        try {
            // Update all incidents to use the new handler
            for (const incident of incidents) {
                const response = await fetch(`http://localhost:5000/api/incidents/${incident.id}/reassign-claim-handler`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ newHandlerId })
                })

                if (!response.ok) {
                    throw new Error(`Failed to update incident ${incident.reference_number}`)
                }
            }

            // Now delete the old handler
            await onReassignAndDelete(handlerId)

            onClose()

            // Reload the page to show updates
            window.location.reload()
        } catch (err) {
            console.error('Error reassigning handlers:', err)
            alert('Error reassigning handlers: ' + err.message)
        } finally {
            setReassigning(false)
        }
    }

    if (!isOpen) return null

    // Filter out the handler being deleted from the options
    const availableHandlers = handlers.filter(h => String(h.id) !== String(handlerId))

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[80]">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        <h2 className="text-lg font-bold text-slate-900">Reassign Claim Handler</h2>
                    </div>
                    <button
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
                            <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
                                <p className="text-sm text-orange-800">
                                    The handler <strong>"{handlerName}"</strong> is currently assigned to <strong>{incidents.length} incident{incidents.length !== 1 ? 's' : ''}</strong>.
                                    To delete this handler, you must first reassign {incidents.length === 1 ? 'this incident' : 'these incidents'} to a different person.
                                </p>
                            </div>

                            {incidents.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-slate-700 mb-2">Incidents assigned to this handler:</h3>
                                    <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-md">
                                        <table className="min-w-full divide-y divide-slate-200">
                                            <thead className="bg-slate-50 sticky top-0">
                                                <tr>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700">Reference</th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700">Office</th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700">Description</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-slate-200">
                                                {incidents.map(incident => (
                                                    <tr key={incident.id}>
                                                        <td className="px-3 py-2 text-sm text-slate-900">{incident.reference_number || '-'}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-600">{incident.office_name || '-'}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-600 truncate max-w-xs">{incident.description || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Select Replacement Handler <span className="text-red-500">*</span>
                                </label>
                                <SearchableSelect
                                    options={availableHandlers}
                                    value={newHandlerId}
                                    onChange={setNewHandlerId}
                                    placeholder="Select replacement handler..."
                                    className="w-full"
                                    disabled={false}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-200">
                    <button
                        onClick={onClose}
                        disabled={reassigning}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleReassign}
                        disabled={reassigning || loading || !newHandlerId}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                    >
                        {reassigning ? 'Reassigning...' : 'Reassign & Delete'}
                    </button>
                </div>
            </div>
        </div>
    )
}
