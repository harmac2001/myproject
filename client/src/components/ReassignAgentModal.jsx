import React, { useState, useEffect } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import SearchableSelect from './SearchableSelect'

export default function ReassignAgentModal({ isOpen, onClose, agentId, agentName, agents, onReassignAndDelete }) {
    const [loading, setLoading] = useState(false)
    const [incidents, setIncidents] = useState([])
    const [newAgentId, setNewAgentId] = useState('')
    const [reassigning, setReassigning] = useState(false)

    useEffect(() => {
        if (isOpen && agentId) {
            fetchIncidentsUsingAgent()
        }
    }, [isOpen, agentId])

    const fetchIncidentsUsingAgent = async () => {
        setLoading(true)
        try {
            const response = await fetch(`http://localhost:5000/api/options/agents/${agentId}/incidents`)
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
        if (!newAgentId) {
            alert('Please select a replacement agent')
            return
        }

        if (newAgentId === agentId) {
            alert('Please select a different agent')
            return
        }

        setReassigning(true)
        try {
            // Update all incidents to use the new agent
            for (const incident of incidents) {
                const response = await fetch(`http://localhost:5000/api/incidents/${incident.id}/reassign-agent`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ newAgentId })
                })

                if (!response.ok) {
                    throw new Error(`Failed to update incident ${incident.reference_number}`)
                }
            }

            // Now delete the old agent
            await onReassignAndDelete(agentId)

            onClose()

            // Reload the page to show the updated agent
            window.location.reload()
        } catch (err) {
            console.error('Error reassigning agent:', err)
            alert('Error reassigning agent: ' + err.message)
        } finally {
            setReassigning(false)
        }
    }

    if (!isOpen) return null

    // Filter out the agent being deleted from the options
    const availableAgents = agents.filter(a => a.id !== agentId)

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        <h2 className="text-lg font-bold text-slate-900">Reassign Local Agent</h2>
                    </div>
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
                            <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
                                <p className="text-sm text-orange-800">
                                    The agent <strong>"{agentName}"</strong> is currently used in <strong>{incidents.length} incident{incidents.length !== 1 ? 's' : ''}</strong>.
                                    To delete this agent, you must first reassign {incidents.length === 1 ? 'this incident' : 'these incidents'} to a different agent.
                                </p>
                            </div>

                            {incidents.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-slate-700 mb-2">Incidents using this agent:</h3>
                                    <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-md">
                                        <table className="min-w-full divide-y divide-slate-200">
                                            <thead className="bg-slate-50 sticky top-0">
                                                <tr>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700">Reference</th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700">Description</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-slate-200">
                                                {incidents.map(incident => (
                                                    <tr key={incident.id}>
                                                        <td className="px-3 py-2 text-sm text-slate-900">{incident.reference_number || '-'}</td>
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
                                    Select Replacement Agent <span className="text-red-500">*</span>
                                </label>
                                <SearchableSelect
                                    options={availableAgents}
                                    value={newAgentId}
                                    onChange={setNewAgentId}
                                    placeholder="Select replacement agent..."
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
                        type="button"
                        onClick={onClose}
                        disabled={reassigning}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleReassign}
                        disabled={reassigning || loading || !newAgentId}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                    >
                        {reassigning ? 'Reassigning...' : 'Reassign & Delete'}
                    </button>
                </div>
            </div>
        </div>
    )
}
