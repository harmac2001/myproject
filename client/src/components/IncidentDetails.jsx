import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Save, Plus, X, Printer, Edit2, Ban } from 'lucide-react'
import SearchableSelect from './SearchableSelect'
import CargoInformation from './CargoInformation'
import DateInput from './DateInput'
import ClaimDetails from './ClaimDetails'
import CommentsTab from './CommentsTab'
import AppointmentsTab from './AppointmentsTab'
import AddMemberModal from './AddMemberModal'
import EditVesselModal from './EditVesselModal'
import ReassignVesselModal from './ReassignVesselModal'
import EditMemberModal from './EditMemberModal'
import EditAgentModal from './EditAgentModal'
import ReassignMemberModal from './ReassignMemberModal'
import ReassignAgentModal from './ReassignAgentModal'
import ExpensesTab from './ExpensesTab'
import InvoiceTab from './InvoiceTab';
import DocumentsTab from './DocumentsTab';
import Header from './Header'

export default function IncidentDetails() {
    const { id } = useParams()
    const navigate = useNavigate()
    const location = useLocation()
    const isNew = id === 'new'

    // Initialize isEditing based on isNew OR if passed via navigation state (e.g. from sub-incident creation)
    const [isEditing, setIsEditing] = useState(isNew || location.state?.isEditing || false)
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [formattedReference, setFormattedReference] = useState('')
    const [activeTab, setActiveTab] = useState('details')
    const [openTabs, setOpenTabs] = useState(isNew ? ['details'] : ['details', 'expenses', 'invoice', 'documents'])
    const [hasCargo, setHasCargo] = useState(false)
    const [hasClaim, setHasClaim] = useState(false)
    const [hasComments, setHasComments] = useState(false)
    const [hasAppointments, setHasAppointments] = useState(false)
    const [showMemberModal, setShowMemberModal] = useState(false)
    const [pendingMemberName, setPendingMemberName] = useState('')
    const [printUrl, setPrintUrl] = useState(null)
    const [showEditVesselModal, setShowEditVesselModal] = useState(false)
    const [editingVesselId, setEditingVesselId] = useState(null)
    const [showReassignVesselModal, setShowReassignVesselModal] = useState(false)
    const [deletingVesselId, setDeletingVesselId] = useState(null)
    const [deletingVesselName, setDeletingVesselName] = useState('')

    // Member modals (used for both Members and Managers)
    const [showEditMemberModal, setShowEditMemberModal] = useState(false)
    const [editingMemberId, setEditingMemberId] = useState(null)
    const [showReassignMemberModal, setShowReassignMemberModal] = useState(false)
    const [deletingMemberId, setDeletingMemberId] = useState(null)
    const [deletingMemberName, setDeletingMemberName] = useState('')
    const [isManager, setIsManager] = useState(false) // Track if we're deleting a manager
    const [addingMemberType, setAddingMemberType] = useState('member') // 'member' or 'manager'

    // Agent modals
    const [showEditAgentModal, setShowEditAgentModal] = useState(false)
    const [editingAgentId, setEditingAgentId] = useState(null)
    const [showReassignAgentModal, setShowReassignAgentModal] = useState(false)
    const [deletingAgentId, setDeletingAgentId] = useState(null)
    const [deletingAgentName, setDeletingAgentName] = useState('')

    // Options
    const [ships, setShips] = useState([])
    const [members, setMembers] = useState([])
    const [clubs, setClubs] = useState([])
    const [claimHandlers, setClaimHandlers] = useState([])
    const [offices, setOffices] = useState([])
    const [incidentTypes, setIncidentTypes] = useState([])
    const [reporters, setReporters] = useState([])
    const [agents, setAgents] = useState([])
    const [ports, setPorts] = useState([])
    const [statusOptions, setStatusOptions] = useState([
        { id: 'OPEN', name: 'OPEN' },
        { id: 'CLOSED', name: 'CLOSED' },
        { id: 'OUTSTANDING', name: 'OUTSTANDING' },
        { id: 'REPUDIATED', name: 'REPUDIATED' },
        { id: 'WITHDRAWN', name: 'WITHDRAWN' },
        { id: 'DISCARDED', name: 'DISCARDED' }
    ])

    // Calculate time bar date (1 year from now) for new incidents
    const getTimeBarDate = () => {
        const today = new Date()
        const oneYearLater = new Date(today)
        oneYearLater.setFullYear(today.getFullYear() + 1)
        return oneYearLater.toISOString().split('T')[0]
    }

    const [formData, setFormData] = useState({
        incident_date: new Date().toISOString().split('T')[0],
        status: 'OPEN',
        description: '',
        ship_id: '',
        member_id: '',
        owner_id: '', // Managers
        club_id: '',
        handler_id: '',
        local_office_id: '',
        type_id: '',
        reporter_id: '',
        local_agent_id: '',
        place_id: '',
        closing_date: '',
        estimated_disposal_date: '',
        berthing_date: '',
        voyage_and_leg: '',
        club_reference: '',
        reporting_date: '',
        time_bar_date: '',
        latest_report_date: '',
        next_review_date: ''
    })

    // Fetch options
    useEffect(() => {
        const endpoints = [
            { url: 'http://localhost:5000/api/options/ships', setter: setShips },
            { url: 'http://localhost:5000/api/options/members', setter: setMembers },
            { url: 'http://localhost:5000/api/options/clubs', setter: setClubs },
            { url: 'http://localhost:5000/api/options/claim_handlers', setter: setClaimHandlers },
            { url: 'http://localhost:5000/api/options/offices', setter: setOffices },
            { url: 'http://localhost:5000/api/options/incident_types', setter: setIncidentTypes },
            { url: 'http://localhost:5000/api/options/reporters', setter: setReporters },
            { url: 'http://localhost:5000/api/options/agents', setter: setAgents },
            { url: 'http://localhost:5000/api/options/ports', setter: setPorts }
        ]

        endpoints.forEach(({ url, setter }) => {
            fetch(url)
                .then(res => res.json())
                .then(data => setter(data))
                .catch(err => console.error(`Error fetching ${url}:`, err))
        })
    }, [])

    // Fetch incident data
    // Helper function to format date to YYYY-MM-DD
    const formatDate = (value) => {
        if (!value) return ''
        const date = new Date(value)
        if (isNaN(date.getTime())) return ''
        // Check if it's epoch (1970-01-01) which usually means 0/null in some systems
        if (date.getFullYear() === 1970) return ''
        return date.toISOString().split('T')[0]
    }

    useEffect(() => {
        // Set time bar date for new incidents
        if (isNew) {
            const today = new Date()
            const oneYearLater = new Date(today)
            oneYearLater.setFullYear(today.getFullYear() + 1)

            if (location.state?.parentIncident) {
                const parent = location.state.parentIncident
                setFormData(prev => ({
                    ...prev,
                    ...parent,
                    id: '', // Clear ID for new record
                    incident_date: new Date().toISOString().split('T')[0], // Reset incident date to today
                    status: 'OPEN', // Reset status
                    time_bar_date: oneYearLater.toISOString().split('T')[0],
                    // Keep other fields from parent
                }))
            } else {
                setFormData(prev => ({ ...prev, time_bar_date: oneYearLater.toISOString().split('T')[0] }))
            }
        }

        // Update isEditing when navigating to a new incident (e.g. sub-incident)
        // This is necessary because the component might not unmount/remount
        setIsEditing(isNew || location.state?.isEditing || false)
    }, [isNew, id, location.state])

    useEffect(() => {
        if (!isNew && id) {
            setLoading(true)
            fetch(`http://localhost:5000/api/incidents/${id}`)
                .then(res => {
                    if (!res.ok) {
                        throw new Error(`HTTP error! status: ${res.status}`)
                    }
                    return res.json()
                })
                .then(data => {
                    console.log('Incident Data:', data)
                    setFormData({
                        incident_date: formatDate(data.incident_date),
                        status: data.status ? data.status.toUpperCase() : 'OPEN',
                        description: data.description || '',
                        berthing_date: formatDate(data.berthing_date),
                        closing_date: formatDate(data.closing_date),
                        club_reference: data.club_reference || '',
                        effective_disposal_date: formatDate(data.effective_disposal_date),
                        estimated_disposal_date: formatDate(data.estimated_disposal_date),
                        latest_report_date: formatDate(data.latest_report_date),
                        next_review_date: formatDate(data.next_review_date),
                        reporting_date: formatDate(data.reporting_date),
                        time_bar_date: formatDate(data.time_bar_date),
                        voyage_and_leg: data.voyage_and_leg || '',
                        ship_id: data.ship_id || '',
                        member_id: data.member_id || '',
                        club_id: data.club_id || '',
                        handler_id: data.handler_id || '',
                        local_office_id: data.local_office_id || '',
                        type_id: data.type_id || '',
                        reporter_id: data.reporter_id || '',
                        local_agent_id: data.local_agent_id || '',
                        place_id: data.place_id || '',
                        owner_id: data.owner_id || '',
                        reference_year: data.reference_year || '',
                        created_date: data.created_date,
                        last_modified_date: data.last_modified_date,
                        club_code: data.club_code || ''
                    })
                    setFormattedReference(data.formatted_reference || '')
                    setLoading(false)

                    // Check if cargo exists for this incident
                    fetch(`http://localhost:5000/api/cargo/incident/${id}`)
                        .then(res => res.json())
                        .then(cargoData => {
                            if (cargoData) {
                                setHasCargo(true)
                                setOpenTabs(prev => {
                                    if (!prev.includes('cargo')) {
                                        return [...prev, 'cargo']
                                    }
                                    return prev
                                })
                            } else {
                                setHasCargo(false)
                            }
                        })
                        .catch(err => console.error('Error checking cargo:', err))

                    // Check if claim details exist for this incident
                    fetch(`http://localhost:5000/api/claims/${id}`)
                        .then(res => res.json())
                        .then(claimData => {
                            if (claimData) {
                                setHasClaim(true)
                                setOpenTabs(prev => {
                                    if (!prev.includes('claim')) {
                                        return [...prev, 'claim']
                                    }
                                    return prev
                                })
                            } else {
                                setHasClaim(false)
                            }
                        })
                        .catch(err => console.error('Error checking claim:', err))

                    // Check if comments exist for this incident
                    fetch(`http://localhost:5000/api/comments/${id}`)
                        .then(res => res.json())
                        .then(commentsData => {
                            if (commentsData && commentsData.length > 0) {
                                setHasComments(true)
                                setOpenTabs(prev => {
                                    if (!prev.includes('comments')) {
                                        return [...prev, 'comments']
                                    }
                                    return prev
                                })
                            } else {
                                setHasComments(false)
                            }
                        })
                        .catch(err => console.error('Error checking comments:', err))
                })
                .catch(err => {
                    console.error('Error fetching incident:', err)
                    alert(`Error loading incident data: ${err.message}`)
                    setLoading(false)
                })
        }
    }, [id, isNew])

    const handleSubmit = async (e) => {
        e.preventDefault()

        const requiredFields = [
            { key: 'local_office_id', label: 'Handling Office' },
            { key: 'ship_id', label: 'Vessel' },
            { key: 'incident_date', label: 'Date of Incident' },
            { key: 'place_id', label: 'Place of Incident' },
            { key: 'club_id', label: 'Client' },
            { key: 'member_id', label: 'Members' },
            { key: 'owner_id', label: 'Managers' },
            { key: 'type_id', label: 'Type of Incident' },
            { key: 'reporting_date', label: 'Date Reported' },
            { key: 'local_agent_id', label: 'Local Agents' },
            { key: 'handler_id', label: 'Claim Handler' },
            { key: 'next_review_date', label: 'Next Review Date' },
            { key: 'reporter_id', label: 'Reported By' },
            { key: 'berthing_date', label: 'Arrival Date' }
        ]

        const missingFields = requiredFields.filter(field => !formData[field.key])

        if (missingFields.length > 0) {
            alert(`Please fill in the following mandatory fields:\n${missingFields.map(f => `- ${f.label}`).join('\n')}`)
            return
        }

        // Validate Next Review Date is in the future
        if (formData.next_review_date) {
            const nextReview = new Date(formData.next_review_date)
            const today = new Date()
            today.setHours(0, 0, 0, 0) // Reset time part for accurate date comparison

            if (nextReview <= today) {
                alert('Next Review Date must be a future date.')
                return
            }
        }

        setSaving(true)

        const method = isNew ? 'POST' : 'PUT'
        const url = isNew
            ? 'http://localhost:5000/api/incidents'
            : `http://localhost:5000/api/incidents/${id}`

        // Sanitize data: convert empty strings to null for backend
        const sanitizedData = Object.fromEntries(
            Object.entries(formData).map(([key, value]) => {
                if (value === '') return [key, null];
                return [key, value];
            })
        );

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(sanitizedData)
            })

            if (response.ok) {
                const data = await response.json()
                if (isNew) {
                    navigate(`/incident/${data.id}`)
                } else {
                    setIsEditing(false)
                    // Refresh data to ensure everything is in sync
                    // window.location.reload() // Removed reload to prevent full page refresh
                }
            } else {
                const errorText = await response.text()
                console.error('Save incident failed:', response.status, errorText)
                alert(`Error saving incident: ${errorText}`)
            }
        } catch (err) {
            console.error('Error saving incident:', err)
            alert(`Error saving incident: ${err.message}`)
        } finally {
            setSaving(false)
        }
    }

    const handleCreateShip = async (name) => {
        try {
            const response = await fetch('http://localhost:5000/api/options/ships', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            })
            if (response.ok) {
                const newShip = await response.json()
                setShips([...ships, newShip])
                setFormData({ ...formData, ship_id: newShip.id })
            }
        } catch (err) {
            console.error('Error creating ship:', err)
        }
    }

    const handleCreateMember = (name) => {
        setPendingMemberName(name)
        setAddingMemberType('member')
        setShowMemberModal(true)
    }

    const handleCreateAgent = async (name) => {
        try {
            const response = await fetch('http://localhost:5000/api/options/agents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            })
            if (response.ok) {
                const newAgent = await response.json()
                setAgents(prev => [...prev, newAgent])
                setFormData(prev => ({ ...prev, local_agent_id: newAgent.id }))
            } else {
                const err = await response.text()
                alert(`Error creating agent: ${err}`)
            }
        } catch (err) {
            console.error('Error creating agent:', err)
            alert(`Error creating agent: ${err.message}`)
        }
    }

    const handleCreateManager = (name) => {
        setPendingMemberName(name)
        setAddingMemberType('manager')
        setShowMemberModal(true)
    }

    const handleMemberChange = (val) => {
        const updates = { member_id: val }
        // Suggest same member_id on "Manager" field for new incidents
        if (isNew) {
            updates.owner_id = val
        }
        setFormData({ ...formData, ...updates })

        // Check if member exists in list
        const member = members.find(m => m.id === val)
        if (!member && val) {
            setPendingMemberName(val)
        }
    }

    const handleMemberSaved = (newMember) => {
        setMembers(prev => [...prev, newMember])
        if (addingMemberType === 'manager') {
            setFormData(prev => ({ ...prev, owner_id: newMember.id }))
        } else {
            setFormData(prev => ({ ...prev, member_id: newMember.id }))
        }
        setShowMemberModal(false)
    }

    const handleEditVessel = (vesselId) => {
        setEditingVesselId(vesselId)
        setShowEditVesselModal(true)
    }

    const handleDeleteVessel = async (vesselId) => {
        try {
            // Check if vessel is used in any incidents
            const checkResponse = await fetch(`http://localhost:5000/api/options/ships/${vesselId}/incidents`)
            const incidents = await checkResponse.json()

            if (incidents.length > 0) {
                // Vessel is in use, show reassignment modal
                const vessel = ships.find(s => s.id === vesselId)
                setDeletingVesselId(vesselId)
                setDeletingVesselName(vessel?.name || 'Unknown')
                setShowReassignVesselModal(true)
            } else {
                // Vessel is not in use, delete directly
                await performVesselDeletion(vesselId)
            }
        } catch (err) {
            console.error('Error checking vessel usage:', err)
            alert('Error checking vessel usage: ' + err.message)
        }
    }

    const performVesselDeletion = async (vesselId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/options/ships/${vesselId}`, {
                method: 'DELETE'
            })

            if (!response.ok) {
                const errorData = await response.json()
                alert(errorData.message || 'Error deleting vessel')
                return
            }

            // Refresh ships list
            const shipsResponse = await fetch('http://localhost:5000/api/options/ships')
            const shipsData = await shipsResponse.json()
            setShips(shipsData)

            // Clear selection if this vessel was selected
            if (formData.ship_id === vesselId) {
                setFormData({ ...formData, ship_id: '' })
            }
        } catch (err) {
            console.error('Error deleting vessel:', err)
            alert('Error deleting vessel: ' + err.message)
        }
    }

    // Member Handlers (used for both Member and Manager fields)
    const handleEditMember = (memberId) => {
        setEditingMemberId(memberId)
        setShowEditMemberModal(true)
    }

    const handleDeleteMember = async (memberId, isManagerDeletion = false) => {
        setIsManager(isManagerDeletion)
        try {
            // Check if member is used in any incidents
            const checkResponse = await fetch(`http://localhost:5000/api/options/members/${memberId}/incidents`)
            const incidents = await checkResponse.json()

            if (incidents.length > 0) {
                // Member is in use, show reassignment modal
                const member = members.find(m => m.id === memberId)
                setDeletingMemberId(memberId)
                setDeletingMemberName(member?.name || 'Unknown')
                setShowReassignMemberModal(true)
            } else {
                // Member is not in use, delete directly
                await performMemberDeletion(memberId)
            }
        } catch (err) {
            console.error('Error checking member usage:', err)
            alert('Error checking member usage: ' + err.message)
        }
    }

    const performMemberDeletion = async (memberId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/options/members/${memberId}`, {
                method: 'DELETE'
            })

            if (!response.ok) {
                const errorData = await response.json()
                alert(errorData.message || 'Error deleting member')
                return
            }

            // Refresh members list
            const membersResponse = await fetch('http://localhost:5000/api/options/members')
            const membersData = await membersResponse.json()
            setMembers(membersData)

            // Clear selection if this member was selected
            if (formData.member_id === memberId) {
                setFormData(prev => ({ ...prev, member_id: '' }))
            }
            if (formData.owner_id === memberId) {
                setFormData(prev => ({ ...prev, owner_id: '' }))
            }
        } catch (err) {
            console.error('Error deleting member:', err)
            alert('Error deleting member: ' + err.message)
        }
    }

    // Agent Handlers
    const handleEditAgent = (agentId) => {
        setEditingAgentId(agentId)
        setShowEditAgentModal(true)
    }

    const handleDeleteAgent = async (agentId) => {
        try {
            // Check if agent is used in any incidents
            const checkResponse = await fetch(`http://localhost:5000/api/options/agents/${agentId}/incidents`)
            const incidents = await checkResponse.json()

            if (incidents.length > 0) {
                // Agent is in use, show reassignment modal
                const agent = agents.find(a => a.id === agentId)
                setDeletingAgentId(agentId)
                setDeletingAgentName(agent?.name || 'Unknown')
                setShowReassignAgentModal(true)
            } else {
                // Agent is not in use, delete directly
                await performAgentDeletion(agentId)
            }
        } catch (err) {
            console.error('Error checking agent usage:', err)
            alert('Error checking agent usage: ' + err.message)
        }
    }

    const performAgentDeletion = async (agentId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/options/agents/${agentId}`, {
                method: 'DELETE'
            })

            if (!response.ok) {
                const errorData = await response.json()
                alert(errorData.message || 'Error deleting agent')
                return
            }

            // Refresh agents list
            const agentsResponse = await fetch('http://localhost:5000/api/options/agents')
            const agentsData = await agentsResponse.json()
            setAgents(agentsData)

            // Clear selection if this agent was selected
            if (formData.local_agent_id === agentId) {
                setFormData(prev => ({ ...prev, local_agent_id: '' }))
            }
        } catch (err) {
            console.error('Error deleting agent:', err)
            alert('Error deleting agent: ' + err.message)
        }
    }

    const handleVesselSaved = async () => {
        // Refresh ships list
        const response = await fetch('http://localhost:5000/api/options/ships')
        const data = await response.json()
        setShips(data)
        setShowEditVesselModal(false)
    }

    const handleCloseTab = async (tabToClose) => {
        if (tabToClose === 'cargo') {
            if (window.confirm("Closing this tab will permanently delete all cargo information associated with this incident. This action cannot be undone. Are you sure you want to proceed?")) {
                try {
                    const response = await fetch(`http://localhost:5000/api/cargo/incident/${id}`, {
                        method: 'DELETE'
                    })

                    if (response.ok) {
                        setHasCargo(false)
                        const newTabs = openTabs.filter(t => t !== tabToClose)
                        setOpenTabs(newTabs)
                        if (activeTab === tabToClose) {
                            setActiveTab('details')
                        }
                    } else {
                        alert('Error deleting cargo information')
                    }
                } catch (err) {
                    console.error('Error deleting cargo:', err)
                    alert('Error deleting cargo information')
                }
            }
        } else if (tabToClose === 'claim') {
            if (window.confirm("Closing this tab will permanently delete all claim details associated with this incident. This action cannot be undone. Are you sure you want to proceed?")) {
                try {
                    const response = await fetch(`http://localhost:5000/api/claims/${id}`, {
                        method: 'DELETE'
                    })

                    if (response.ok) {
                        setHasClaim(false)
                        const newTabs = openTabs.filter(t => t !== tabToClose)
                        setOpenTabs(newTabs)
                        if (activeTab === tabToClose) {
                            setActiveTab('details')
                        }
                    } else {
                        alert('Error deleting claim details')
                    }
                } catch (err) {
                    console.error('Error deleting claim:', err)
                    alert('Error deleting claim details')
                }
            }
        } else if (tabToClose === 'comments') {
            if (window.confirm("Closing this tab will permanently delete all comments associated with this incident. This action cannot be undone. Are you sure you want to proceed?")) {
                try {
                    // Get all comments for this incident
                    const commentsRes = await fetch(`http://localhost:5000/api/comments/${id}`)
                    const comments = await commentsRes.json()

                    // Delete all comments
                    for (const comment of comments) {
                        await fetch(`http://localhost:5000/api/comments/${comment.id}`, {
                            method: 'DELETE'
                        })
                    }

                    setHasComments(false)
                    const newTabs = openTabs.filter(t => t !== tabToClose)
                    setOpenTabs(newTabs)
                    if (activeTab === tabToClose) {
                        setActiveTab('details')
                    }
                } catch (err) {
                    console.error('Error deleting comments:', err)
                    alert('Error deleting comments')
                }
            }
        } else if (tabToClose === 'appointments') {
            if (window.confirm("Closing this tab will permanently delete all appointments associated with this incident. This action cannot be undone. Are you sure you want to proceed?")) {
                try {
                    const response = await fetch(`http://localhost:5000/api/appointments/incident/${id}`, {
                        method: 'DELETE'
                    })

                    if (response.ok) {
                        setHasAppointments(false)
                        const newTabs = openTabs.filter(t => t !== tabToClose)
                        setOpenTabs(newTabs)
                        if (activeTab === tabToClose) {
                            setActiveTab('details')
                        }
                    } else {
                        alert('Error deleting appointments')
                    }
                } catch (err) {
                    console.error('Error deleting appointments:', err)
                    alert('Error deleting appointments')
                }
            }
        } else {
            const newTabs = openTabs.filter(t => t !== tabToClose)
            setOpenTabs(newTabs)
            if (activeTab === tabToClose) {
                setActiveTab('details')
            }
        }
    }

    const handleNewSubIncident = async () => {
        if (isNew) return

        // Navigate to new incident page with current data as parent
        navigate('/incident/new', {
            state: {
                isEditing: true,
                parentIncident: {
                    ...formData,
                    reference_number: formattedReference.split('/')[0], // Extract ref number
                    reference_year: formData.reference_year || new Date().getFullYear(), // Use stored year or current year
                    id: id // Parent ID
                }
            }
        })
    }

    const handlePrint = () => {
        // Append timestamp to force reload if printing same incident again
        setPrintUrl(`/incident/${id}/print?t=${Date.now()}`)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white">
            <Header />

            {/* Hidden iframe for printing */}
            {printUrl && (
                <iframe
                    src={printUrl}
                    style={{ position: 'absolute', width: 0, height: 0, border: 0, visibility: 'hidden' }}
                    title="print-frame"
                />
            )}
            {/* Top Navigation Bar */}
            <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-2 overflow-x-auto">
                {!hasCargo && (
                    <button
                        onClick={() => {
                            if (!openTabs.includes('cargo')) {
                                setOpenTabs([...openTabs, 'cargo'])
                            }
                            setActiveTab('cargo')
                        }}
                        className="bg-[#0078d4] text-white px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1 whitespace-nowrap"
                    >
                        <Plus className="h-4 w-4" /> Cargo Information
                    </button>
                )}
                {!hasClaim && (
                    <button
                        onClick={() => {
                            if (!openTabs.includes('claim')) {
                                setOpenTabs([...openTabs, 'claim'])
                            }
                            setActiveTab('claim')
                        }}
                        className="bg-[#0078d4] text-white px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1 whitespace-nowrap"
                    >
                        <Plus className="h-4 w-4" /> Claim Details
                    </button>
                )}
                {!hasComments && (
                    <button
                        onClick={() => {
                            if (!openTabs.includes('comments')) {
                                setOpenTabs([...openTabs, 'comments'])
                            }
                            setActiveTab('comments')
                        }}
                        className="bg-[#0078d4] text-white px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1 whitespace-nowrap"
                    >
                        <Plus className="h-4 w-4" /> Comments
                    </button>
                )}
                {!hasAppointments && (
                    <button
                        onClick={() => {
                            if (!openTabs.includes('appointments')) {
                                setOpenTabs([...openTabs, 'appointments'])
                            }
                            setActiveTab('appointments')
                        }}
                        className="bg-[#0078d4] text-white px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1 whitespace-nowrap"
                    >
                        <Plus className="h-4 w-4" /> Appointment
                    </button>
                )}
                {!openTabs.includes('invoice') && !isNew && (
                    <button
                        onClick={() => {
                            if (!openTabs.includes('invoice')) {
                                setOpenTabs([...openTabs, 'invoice'])
                            }
                            setActiveTab('invoice')
                        }}
                        className="bg-[#0078d4] text-white px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1 whitespace-nowrap"
                    >
                        <Plus className="h-4 w-4" /> Invoice
                    </button>
                )}
                <button
                    onClick={handleNewSubIncident}
                    disabled={isNew}
                    className="bg-[#0078d4] text-white px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Plus className="h-4 w-4" /> Sub Incident
                </button>
                <div className="flex-1"></div>
                <button
                    onClick={handlePrint}
                    className="bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1 hover:bg-slate-50"
                >
                    <Printer className="h-4 w-4" /> Print
                </button>
                <button
                    onClick={() => navigate('/')}
                    className="bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1 hover:bg-slate-50"
                >
                    <ArrowLeft className="h-4 w-4" /> Back
                </button>
            </div>

            {/* Tabs and Reference Number */}
            <div className="px-4 mt-4 border-b border-slate-200 flex items-center justify-between">
                {/* Reference Number */}
                <div className="mr-12">
                    <h1 className="text-xl font-bold text-[#3A6082]">{formattedReference || 'New'}</h1>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 flex-1">
                    {openTabs.filter(tab => tab !== 'expenses' || !isNew).sort((a, b) => {
                        const order = ['details', 'expenses', 'invoice', 'cargo', 'claim', 'comments', 'appointments', 'documents'];
                        return order.indexOf(a) - order.indexOf(b);
                    }).map(tab => (
                        <div key={tab} className="relative">
                            <button
                                className={`px-4 py-2 text-sm font-medium rounded-t-md ${activeTab === tab ? 'bg-[#0078d4] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab === 'details' ? 'Details' : tab === 'expenses' ? 'Expenses' : tab === 'invoice' ? 'Invoice' : tab === 'cargo' ? 'Cargo Information' : tab === 'claim' ? 'Claim Details' : tab === 'comments' ? 'Comments' : tab === 'appointments' ? 'Appointments' : tab === 'documents' ? 'Documents' : tab}
                            </button>
                            {tab !== 'details' && tab !== 'expenses' && tab !== 'invoice' && tab !== 'documents' && (
                                <button
                                    onClick={() => handleCloseTab(tab)}
                                    className={`absolute -right-1 -top-1 rounded-full p-0.5 ${activeTab === tab ? 'bg-white text-[#0078d4]' : 'bg-slate-300 text-slate-600'} hover:bg-red-500 hover:text-white`}
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Dates - Right Aligned */}
                {(formData.created_date || formData.last_modified_date) && (
                    <div className="text-xs text-slate-500 ml-4 flex flex-col items-end justify-center min-w-fit">
                        {formData.created_date && (
                            <span>Created: {new Date(parseInt(formData.created_date)).toLocaleDateString()}</span>
                        )}
                        {formData.last_modified_date && (
                            <span>Updated: {new Date(parseInt(formData.last_modified_date)).toLocaleDateString()}</span>
                        )}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4 max-w-[1400px]">
                {activeTab === 'details' && (
                    <div className="border border-slate-200 rounded-b-md p-4 bg-white">
                        <div className="grid grid-cols-12 gap-x-4 gap-y-4">
                            {/* Row 1: Handling Office, Status */}
                            <div className="col-span-3">
                                <label className="block text-xs font-bold text-slate-700 mb-1">Handling Office <span className="text-red-500">*</span></label>
                                <SearchableSelect
                                    options={offices}
                                    value={formData.local_office_id}
                                    onChange={(val) => setFormData({ ...formData, local_office_id: val })}
                                    placeholder="Select Office..."
                                    className="w-full"
                                    disabled={!isEditing}
                                    labelKey="location"
                                    searchable={false}
                                />
                            </div>
                            <div className="col-span-3">
                                <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                                <SearchableSelect
                                    options={statusOptions}
                                    value={formData.status}
                                    onChange={(val) => {
                                        const updates = { status: val };
                                        if (val !== 'OPEN' && val !== 'OUTSTANDING') {
                                            const today = new Date();
                                            const twoYearsLater = new Date(today);
                                            twoYearsLater.setFullYear(today.getFullYear() + 2);

                                            updates.closing_date = today.toISOString().split('T')[0];
                                            updates.estimated_disposal_date = twoYearsLater.toISOString().split('T')[0];
                                        }
                                        setFormData({ ...formData, ...updates });
                                    }}
                                    placeholder="Select Status..."
                                    className="w-full"
                                    disabled={!isEditing}
                                    searchable={false}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-x-4 gap-y-4 mt-4">
                            {/* Row 2: Vessel, Voyage, Arrival Date, Date of Incident, Place of Incident */}
                            <div className="col-span-4">
                                <label className="block text-xs font-bold text-slate-700 mb-1">Vessel <span className="text-red-500">*</span></label>
                                <SearchableSelect
                                    options={ships}
                                    value={formData.ship_id}
                                    onChange={(val) => setFormData({ ...formData, ship_id: val })}
                                    placeholder="Select Vessel..."
                                    className="w-full"
                                    disabled={!isEditing}
                                    allowCreate={isEditing}
                                    onCreateNew={handleCreateShip}
                                    onEdit={handleEditVessel}
                                    onDelete={handleDeleteVessel}
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-slate-700 mb-1">Voyage and Leg</label>
                                <input
                                    type="text"
                                    className="input-field w-full py-2.5 px-3 bg-white border border-slate-300 rounded-md disabled:bg-white disabled:text-slate-900 disabled:border-slate-300"
                                    value={formData.voyage_and_leg}
                                    onChange={(e) => setFormData({ ...formData, voyage_and_leg: e.target.value })}
                                    disabled={!isEditing}
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-slate-700 mb-1">Arrival Date <span className="text-red-500">*</span></label>
                                <DateInput
                                    className="input-field w-full py-2.5 disabled:bg-white disabled:text-slate-900 disabled:border-slate-300"
                                    value={formData.berthing_date}
                                    onChange={(e) => setFormData({ ...formData, berthing_date: e.target.value })}
                                    disabled={!isEditing}
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-slate-700 mb-1">Date of Incident <span className="text-red-500">*</span></label>
                                <DateInput
                                    className="input-field w-full py-2.5 disabled:bg-white disabled:text-slate-900 disabled:border-slate-300"
                                    value={formData.incident_date}
                                    onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })}
                                    disabled={!isEditing}
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-slate-700 mb-1">Place of Incident <span className="text-red-500">*</span></label>
                                <SearchableSelect
                                    options={ports}
                                    value={formData.place_id}
                                    onChange={(val) => setFormData({ ...formData, place_id: val })}
                                    placeholder="Select Place..."
                                    className="w-full"
                                    disabled={!isEditing}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-x-4 gap-y-4 mt-4">
                            {/* Row 3: Client, Client Ref */}
                            <div className="col-span-6">
                                <label className="block text-xs font-bold text-slate-700 mb-1">Client <span className="text-red-500">*</span></label>
                                <SearchableSelect
                                    options={clubs}
                                    value={formData.club_id}
                                    onChange={(val) => setFormData({ ...formData, club_id: val })}
                                    placeholder="Select Client..."
                                    className="w-full"
                                    disabled={!isEditing}
                                />
                            </div>
                            <div className="col-span-6">
                                <label className="block text-xs font-bold text-slate-700 mb-1">Client's Reference Number</label>
                                <input
                                    type="text"
                                    className="input-field w-full py-2.5 px-3 bg-white border border-slate-300 rounded-md disabled:bg-white disabled:text-slate-900 disabled:border-slate-300"
                                    value={formData.club_reference}
                                    onChange={(e) => setFormData({ ...formData, club_reference: e.target.value })}
                                    disabled={!isEditing}
                                />
                            </div>

                            {/* Row 4: Members, Managers */}
                            <div className="col-span-6">
                                <label className="block text-xs font-bold text-slate-700 mb-1">Members <span className="text-red-500">*</span></label>
                                <SearchableSelect
                                    options={members}
                                    value={formData.member_id}
                                    onChange={handleMemberChange}
                                    placeholder="Select Member..."
                                    className="w-full"
                                    disabled={!isEditing}
                                    allowCreate={isEditing}
                                    onCreateNew={handleCreateMember}
                                    onEdit={handleEditMember}
                                    onDelete={handleDeleteMember}
                                    disablePaste={true}
                                />
                            </div>
                            <div className="col-span-6">
                                <label className="block text-xs font-bold text-slate-700 mb-1">Managers <span className="text-red-500">*</span></label>
                                <SearchableSelect
                                    options={members}
                                    value={formData.owner_id}
                                    onChange={(val) => setFormData({ ...formData, owner_id: val })}
                                    placeholder="Select Manager..."
                                    className="w-full"
                                    disabled={!isEditing}
                                    allowCreate={isEditing}
                                    onCreateNew={handleCreateManager}
                                    onEdit={handleEditMember}
                                    onDelete={(id) => handleDeleteMember(id, true)}
                                    disablePaste={true}
                                />
                            </div>

                            {/* Row 5: Type, Reporting Date, Reported By */}
                            <div className="col-span-4">
                                <label className="block text-xs font-bold text-slate-700 mb-1">Type of Incident <span className="text-red-500">*</span></label>
                                <SearchableSelect
                                    options={incidentTypes}
                                    value={formData.type_id}
                                    onChange={(val) => setFormData({ ...formData, type_id: val })}
                                    placeholder="Select Type..."
                                    className="w-full"
                                    disabled={!isEditing}
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-slate-700 mb-1">Date Reported <span className="text-red-500">*</span></label>
                                <DateInput
                                    className="input-field w-full py-2.5 disabled:bg-white disabled:text-slate-900 disabled:border-slate-300"
                                    value={formData.reporting_date}
                                    onChange={(e) => setFormData({ ...formData, reporting_date: e.target.value })}
                                    disabled={!isEditing}
                                />
                            </div>
                            <div className="col-span-6">
                                <label className="block text-xs font-bold text-slate-700 mb-1">Reported By <span className="text-red-500">*</span></label>
                                <SearchableSelect
                                    options={reporters}
                                    value={formData.reporter_id}
                                    onChange={(val) => setFormData({ ...formData, reporter_id: val })}
                                    placeholder="Select Reporter..."
                                    className="w-full"
                                    disabled={!isEditing}
                                />
                            </div>

                            {/* Row 6: Local Agents, Claim Handler, Time Bar, Latest Report, Next Review */}
                            <div className="col-span-4">
                                <label className="block text-xs font-bold text-slate-700 mb-1">Local Agents <span className="text-red-500">*</span></label>
                                <SearchableSelect
                                    options={agents}
                                    value={formData.local_agent_id}
                                    onChange={(val) => setFormData({ ...formData, local_agent_id: val })}
                                    placeholder="Select Agent..."
                                    className="w-full"
                                    disabled={!isEditing}
                                    allowCreate={isEditing}
                                    onCreateNew={handleCreateAgent}
                                    onEdit={handleEditAgent}
                                    onDelete={handleDeleteAgent}
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-slate-700 mb-1">Claim Handler <span className="text-red-500">*</span></label>
                                <SearchableSelect
                                    options={claimHandlers}
                                    value={formData.handler_id}
                                    onChange={(val) => setFormData({ ...formData, handler_id: val })}
                                    placeholder="Select Handler..."
                                    className="w-full"
                                    disabled={!isEditing}
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-slate-700 mb-1">Time Bar Date</label>
                                <DateInput
                                    className="input-field w-full py-2.5 disabled:bg-white disabled:text-slate-900 disabled:border-slate-300"
                                    value={formData.time_bar_date}
                                    onChange={(e) => setFormData({ ...formData, time_bar_date: e.target.value })}
                                    disabled={!isEditing}
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-slate-700 mb-1">Latest Report Date</label>
                                <DateInput
                                    className="input-field w-full py-2.5 disabled:bg-white disabled:text-slate-900 disabled:border-slate-300"
                                    value={formData.latest_report_date}
                                    onChange={(e) => setFormData({ ...formData, latest_report_date: e.target.value })}
                                    disabled={!isEditing}
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-slate-700 mb-1">Next Review Date <span className="text-red-500">*</span></label>
                                <DateInput
                                    className="input-field w-full py-2.5 disabled:bg-white disabled:text-slate-900 disabled:border-slate-300"
                                    value={formData.next_review_date}
                                    onChange={(e) => setFormData({ ...formData, next_review_date: e.target.value })}
                                    disabled={!isEditing}
                                />
                            </div>

                            {/* Row 8: Description */}
                            <div className="col-span-12">
                                <label className="block text-xs font-bold text-slate-700 mb-1">Description of Incident</label>
                                <textarea
                                    className="input-field w-full px-3 py-2 bg-white border border-slate-300 rounded-md disabled:bg-white disabled:text-slate-900 disabled:border-slate-300"
                                    rows="3"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    disabled={!isEditing}
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-6 flex gap-2">
                            {console.log('Button render:', { isEditing, isNew: !id })}
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={saving}
                                        className="bg-[#56a7e9] text-white px-8 py-2 rounded-md text-sm font-medium hover:bg-[#4a96d3] flex items-center gap-2"
                                    >
                                        <Save className="h-4 w-4" />
                                        {saving ? 'Saving...' : 'Save'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (!id) {
                                                navigate(-1)
                                            } else {
                                                setIsEditing(false)
                                            }
                                        }}
                                        className="bg-[#fbbf24] text-slate-900 px-8 py-2 rounded-md text-sm font-medium hover:bg-[#f59e0b] flex items-center gap-2"
                                    >
                                        <Ban className="h-4 w-4" /> Cancel
                                    </button>
                                </>
                            ) : (
                                id && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="bg-[#0078d4] text-white px-8 py-2 rounded-md text-sm font-medium hover:bg-[#006cbd] flex items-center gap-2"
                                    >
                                        <Edit2 className="h-4 w-4" /> Edit
                                    </button>
                                )
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'cargo' && (
                    <CargoInformation incidentId={id} isEditing={isEditing} />
                )}

                {activeTab === 'claim' && (
                    <ClaimDetails incidentId={id} isEditing={isEditing} />
                )}

                {activeTab === 'comments' && (
                    <CommentsTab incidentId={id} isEditing={isEditing} />
                )}

                {activeTab === 'appointments' && (
                    <AppointmentsTab incidentId={id} />
                )}

                {activeTab === 'expenses' && (
                    <ExpensesTab incidentId={id} />
                )}

                {activeTab === 'invoice' && (
                    <InvoiceTab incidentId={id} incident={formData} />
                )}

                {activeTab === 'documents' && (
                    <DocumentsTab incidentId={id} />
                )}
            </div>

            {/* Modals */}
            <AddMemberModal
                isOpen={showMemberModal}
                onClose={() => setShowMemberModal(false)}
                onSave={handleMemberSaved}
                initialName={pendingMemberName}
            />

            <EditVesselModal
                isOpen={showEditVesselModal}
                onClose={() => setShowEditVesselModal(false)}
                vesselId={editingVesselId}
                onSaved={handleVesselSaved}
            />

            <ReassignVesselModal
                isOpen={showReassignVesselModal}
                onClose={() => setShowReassignVesselModal(false)}
                vesselId={deletingVesselId}
                vesselName={deletingVesselName}
                ships={ships}
                onReassignAndDelete={performVesselDeletion}
            />

            <EditMemberModal
                isOpen={showEditMemberModal}
                onClose={() => setShowEditMemberModal(false)}
                memberId={editingMemberId}
                onSaved={() => {
                    // Refresh members list
                    fetch('http://localhost:5000/api/options/members')
                        .then(res => res.json())
                        .then(data => setMembers(data))
                }}
            />

            <ReassignMemberModal
                isOpen={showReassignMemberModal}
                onClose={() => setShowReassignMemberModal(false)}
                memberId={deletingMemberId}
                memberName={deletingMemberName}
                members={members}
                onReassignAndDelete={performMemberDeletion}
                isManger={isManager}
            />

            <EditAgentModal
                isOpen={showEditAgentModal}
                onClose={() => setShowEditAgentModal(false)}
                agentId={editingAgentId}
                onSaved={() => {
                    // Refresh agents list
                    fetch('http://localhost:5000/api/options/agents')
                        .then(res => res.json())
                        .then(data => setAgents(data))
                }}
            />

            <ReassignAgentModal
                isOpen={showReassignAgentModal}
                onClose={() => setShowReassignAgentModal(false)}
                agentId={deletingAgentId}
                agentName={deletingAgentName}
                agents={agents}
                onReassignAndDelete={performAgentDeletion}
            />
        </div>
    )
}
