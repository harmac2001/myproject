import React, { useState, useEffect } from 'react'
import { Save, Edit2, Trash2, Plus, X } from 'lucide-react'
import SearchableSelect from './SearchableSelect'

export default function AppointmentsTab({ incidentId }) {
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [activeSubTab, setActiveSubTab] = useState('details')
    const [appointments, setAppointments] = useState([])
    const [consultants, setConsultants] = useState([])
    const [currentAppointment, setCurrentAppointment] = useState(null)

    useEffect(() => {
        if (incidentId && incidentId !== 'new') {
            fetchAppointments()
            fetchConsultants()
        }
    }, [incidentId])

    const fetchAppointments = async () => {
        setLoading(true)
        try {
            const response = await fetch(`http://localhost:5000/api/appointments/incident/${incidentId}`)
            const data = await response.json()
            setAppointments(data)
            if (data.length > 0) {
                setCurrentAppointment(data[0])
            }
        } catch (err) {
            console.error('Error fetching appointments:', err)
        } finally {
            setLoading(false)
        }
    }

    const fetchConsultants = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/options/consultants')
            const data = await response.json()
            setConsultants(data)
        } catch (err) {
            console.error('Error fetching consultants:', err)
        }
    }

    const handleAdd = () => {
        setCurrentAppointment({
            id: null,
            incident_id: incidentId,
            consultant_id: '',
            appointment_date: '',
            final_survey_date: '',
            preliminary_report_date: '',
            report_delivery_date: '',
            invoice_proinde: true,
            isNew: true
        })
        setIsEditing(true)
    }

    const handleSave = async () => {
        if (!currentAppointment.consultant_id) {
            alert('Please select a consultant')
            return
        }

        setSaving(true)
        try {
            const method = currentAppointment.isNew ? 'POST' : 'PUT'
            const url = currentAppointment.isNew
                ? 'http://localhost:5000/api/appointments'
                : `http://localhost:5000/api/appointments/${currentAppointment.id}`

            await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentAppointment)
            })

            await fetchAppointments()
            setIsEditing(false)
        } catch (err) {
            console.error('Error saving appointment:', err)
            alert('Error saving appointment: ' + err.message)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!currentAppointment || currentAppointment.isNew) return
        if (!confirm('Are you sure you want to delete this appointment?')) return

        setSaving(true)
        try {
            await fetch(`http://localhost:5000/api/appointments/${currentAppointment.id}`, {
                method: 'DELETE'
            })

            await fetchAppointments()
            setIsEditing(false)
        } catch (err) {
            console.error('Error deleting appointment:', err)
            alert('Error deleting appointment: ' + err.message)
        } finally {
            setSaving(false)
        }
    }

    const formatDate = (dateString) => {
        if (!dateString) return ''
        return new Date(dateString).toISOString().split('T')[0]
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    return (
        <div className="border border-slate-200 rounded-b-md bg-white">
            {/* Add Button */}
            <div className="p-4 border-b border-slate-200">
                <button
                    onClick={handleAdd}
                    disabled={incidentId === 'new'}
                    className="bg-slate-200 text-slate-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-300 flex items-center gap-2 disabled:opacity-50"
                >
                    <Plus className="h-4 w-4" /> Add
                </button>
            </div>

            {/* Appointment Details Form */}
            {currentAppointment && (isEditing || currentAppointment.isNew) && (
                <div className="p-6 border-b border-slate-200">
                    <h3 className="text-sm font-bold text-slate-700 mb-4">
                        {currentAppointment.isNew ? 'New Appointment' : 'Appointment Details'}
                    </h3>
                    <div className="space-y-4">
                        {/* Consultant */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Consultant
                            </label>
                            <SearchableSelect
                                options={consultants}
                                value={currentAppointment.consultant_id}
                                onChange={(val) =>
                                    setCurrentAppointment({
                                        ...currentAppointment,
                                        consultant_id: val
                                    })
                                }
                                placeholder="Select consultant..."
                                className="w-full"
                                disabled={!isEditing}
                            />
                        </div>

                        {/* Date Fields Grid */}
                        <div className="grid grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Appointment Date
                                </label>
                                <input
                                    type="date"
                                    value={formatDate(currentAppointment.appointment_date)}
                                    onChange={(e) =>
                                        setCurrentAppointment({
                                            ...currentAppointment,
                                            appointment_date: e.target.value
                                        })
                                    }
                                    disabled={!isEditing}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm disabled:bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Final Survey Date
                                </label>
                                <input
                                    type="date"
                                    value={formatDate(currentAppointment.final_survey_date)}
                                    onChange={(e) =>
                                        setCurrentAppointment({
                                            ...currentAppointment,
                                            final_survey_date: e.target.value
                                        })
                                    }
                                    disabled={!isEditing}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm disabled:bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Preliminary Report Date
                                </label>
                                <input
                                    type="date"
                                    value={formatDate(currentAppointment.preliminary_report_date)}
                                    onChange={(e) =>
                                        setCurrentAppointment({
                                            ...currentAppointment,
                                            preliminary_report_date: e.target.value
                                        })
                                    }
                                    disabled={!isEditing}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm disabled:bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Report Delivery Date
                                </label>
                                <input
                                    type="date"
                                    value={formatDate(currentAppointment.report_delivery_date)}
                                    onChange={(e) =>
                                        setCurrentAppointment({
                                            ...currentAppointment,
                                            report_delivery_date: e.target.value
                                        })
                                    }
                                    disabled={!isEditing}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm disabled:bg-white"
                                />
                            </div>
                        </div>

                        {/* Invoice through Proinde */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Invoice through Proinde
                            </label>
                            {isEditing ? (
                                <div className="flex items-center gap-2 h-[38px]">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                        checked={currentAppointment.invoice_proinde || false}
                                        onChange={(e) => setCurrentAppointment({
                                            ...currentAppointment,
                                            invoice_proinde: e.target.checked
                                        })}
                                    />
                                    <span className="text-sm text-slate-700">Yes</span>
                                </div>
                            ) : (
                                <div className="text-sm font-bold pt-2">
                                    {currentAppointment.invoice_proinde ? 'YES' : 'NO'}
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-4">
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="bg-[#56a7e9] text-white px-8 py-2 rounded-md text-sm font-medium hover:bg-[#4a96d3] flex items-center gap-2 disabled:opacity-50"
                                    >
                                        <Save className="h-4 w-4" />
                                        {saving ? 'Saving...' : 'Save'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsEditing(false)
                                            if (currentAppointment.isNew) {
                                                setCurrentAppointment(null)
                                            } else {
                                                fetchAppointments()
                                            }
                                        }}
                                        disabled={saving}
                                        className="bg-slate-200 text-slate-700 px-8 py-2 rounded-md text-sm font-medium hover:bg-slate-300 flex items-center gap-2 disabled:opacity-50"
                                    >
                                        <X className="h-4 w-4" /> Cancel
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    disabled={!currentAppointment || incidentId === 'new'}
                                    className="bg-[#0078d4] text-white px-8 py-2 rounded-md text-sm font-medium hover:bg-[#006cbd] flex items-center gap-2 disabled:opacity-50"
                                >
                                    <Edit2 className="h-4 w-4" /> Edit
                                </button>
                            )}

                            {currentAppointment && !currentAppointment.isNew && (
                                <button
                                    onClick={handleDelete}
                                    disabled={saving}
                                    className="bg-red-600 text-white px-8 py-2 rounded-md text-sm font-medium hover:bg-red-700 flex items-center gap-2 disabled:opacity-50"
                                >
                                    <Trash2 className="h-4 w-4" /> Delete
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Appointments List */}
            <div className="p-6">
                <h3 className="text-sm font-bold text-slate-700 mb-4">All Appointments</h3>
                {appointments.length === 0 ? (
                    <div className="text-center text-slate-500 py-8">
                        No appointments yet. Click "Add" to create one.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Consultant
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Appointment Date
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Final Survey Date
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Preliminary Report
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Report Delivery
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Invoice Proinde
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {appointments.map((appointment) => (
                                    <tr
                                        key={appointment.id}
                                        className={`hover:bg-slate-50 ${currentAppointment?.id === appointment.id ? 'bg-blue-50' : ''}`}
                                    >
                                        <td className="px-4 py-3 text-sm text-slate-900">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        setCurrentAppointment(appointment)
                                                        setIsEditing(true)
                                                    }}
                                                    className="text-slate-400 hover:text-blue-600"
                                                    title="Edit appointment"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <span>{appointment.consultant_name || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-900">
                                            {appointment.appointment_date ? new Date(appointment.appointment_date).toLocaleDateString('en-GB') : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-900">
                                            {appointment.final_survey_date ? new Date(appointment.final_survey_date).toLocaleDateString('en-GB') : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-900">
                                            {appointment.preliminary_report_date ? new Date(appointment.preliminary_report_date).toLocaleDateString('en-GB') : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-900">
                                            {appointment.report_delivery_date ? new Date(appointment.report_delivery_date).toLocaleDateString('en-GB') : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-900">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${appointment.invoice_proinde ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
                                                {appointment.invoice_proinde ? 'YES' : 'NO'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
