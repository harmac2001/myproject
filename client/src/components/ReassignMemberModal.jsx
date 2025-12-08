import React, { useState, useEffect } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import SearchableSelect from './SearchableSelect'

export default function ReassignMemberModal({ isOpen, onClose, memberId, memberName, members, onReassignAndDelete, isManger }) {
    const [loading, setLoading] = useState(false)
    const [incidents, setIncidents] = useState([])
    const [newMemberId, setNewMemberId] = useState('')
    const [reassigning, setReassigning] = useState(false)

    useEffect(() => {
        if (isOpen && memberId) {
            fetchIncidentsUsingMember()
        }
    }, [isOpen, memberId])

    const fetchIncidentsUsingMember = async () => {
        setLoading(true)
        try {
            const response = await fetch(`/api/options/members/${memberId}/incidents`)
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
        if (!newMemberId) {
            alert('Please select a replacement member')
            return
        }

        if (newMemberId === memberId) {
            alert('Please select a different member')
            return
        }

        setReassigning(true)
        try {
            // Group incidents by where the member is used
            const memberIncidents = incidents.filter(i => i.used_as === 'member')
            const managerIncidents = incidents.filter(i => i.used_as === 'manager')

            // Update member incidents
            for (const incident of memberIncidents) {
                const response = await fetch(`/api/incidents/${incident.id}/reassign-member`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ newMemberId })
                })

                if (!response.ok) {
                    throw new Error(`Failed to update incident ${incident.reference_number}`)
                }
            }

            // Update manager incidents
            for (const incident of managerIncidents) {
                const response = await fetch(`/api/incidents/${incident.id}/reassign-manager`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ newManagerId: newMemberId })
                })

                if (!response.ok) {
                    throw new Error(`Failed to update incident ${incident.reference_number}`)
                }
            }

            // Now delete the old member
            await onReassignAndDelete(memberId)

            onClose()

            // Reload the page to show the updated member
            window.location.reload()
        } catch (err) {
            console.error('Error reassigning member:', err)
            alert('Error reassigning member: ' + err.message)
        } finally {
            setReassigning(false)
        }
    }

    if (!isOpen) return null

    // Filter out the member being deleted from the options
    const availableMembers = members.filter(m => m.id !== memberId)

    const fieldLabel = isManger ? 'Manager' : 'Member'

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        <h2 className="text-lg font-bold text-slate-900">Reassign {fieldLabel}</h2>
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
                                    The member <strong>"{memberName}"</strong> is currently used in <strong>{incidents.length} incident{incidents.length !== 1 ? 's' : ''}</strong>.
                                    To delete this member, you must first reassign {incidents.length === 1 ? 'this incident' : 'these incidents'} to a different member.
                                </p>
                            </div>

                            {incidents.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-slate-700 mb-2">Incidents using this member:</h3>
                                    <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-md">
                                        <table className="min-w-full divide-y divide-slate-200">
                                            <thead className="bg-slate-50 sticky top-0">
                                                <tr>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700">Reference</th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700">Used As</th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700">Description</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-slate-200">
                                                {incidents.map(incident => (
                                                    <tr key={incident.id}>
                                                        <td className="px-3 py-2 text-sm text-slate-900">{incident.reference_number || '-'}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-600 capitalize">{incident.used_as || '-'}</td>
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
                                    Select Replacement {fieldLabel} <span className="text-red-500">*</span>
                                </label>
                                <SearchableSelect
                                    options={availableMembers}
                                    value={newMemberId}
                                    onChange={setNewMemberId}
                                    placeholder="Select replacement member..."
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
                        disabled={reassigning || loading || !newMemberId}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                    >
                        {reassigning ? 'Reassigning...' : 'Reassign & Delete'}
                    </button>
                </div>
            </div>
        </div>
    )
}
