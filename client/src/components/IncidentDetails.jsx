import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Plus, X, Printer, Edit2, Ban } from 'lucide-react'
import SearchableSelect from './SearchableSelect'
import CargoInformation from './CargoInformation'
import DateInput from './DateInput'
import ClaimDetails from './ClaimDetails'
import CommentsTab from './CommentsTab'
import AddMemberModal from './AddMemberModal'

export default function IncidentDetails() {
    const { id } = useParams()
    const navigate = useNavigate()
    const isNew = id === 'new'

    const [isEditing, setIsEditing] = useState(isNew)
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [formattedReference, setFormattedReference] = useState('')
    const [activeTab, setActiveTab] = useState('details')
    const [openTabs, setOpenTabs] = useState(['details'])
    const [hasCargo, setHasCargo] = useState(false)
    const [hasClaim, setHasClaim] = useState(false)
    const [hasComments, setHasComments] = useState(false)
    const [showMemberModal, setShowMemberModal] = useState(false)
    const [pendingMemberName, setPendingMemberName] = useState('')

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
        { id: 'WITHDRAWN', name: 'WITHDRAWN' }
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
            setFormData(prev => ({ ...prev, time_bar_date: oneYearLater.toISOString().split('T')[0] }))
        }
    }, [isNew])

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
                        owner_id: data.owner_id || ''
                    })
                    setFormattedReference(data.reference_number || '')
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
                    alert('Error loading incident data')
                    setLoading(false)
                })
        }
    }, [id, isNew])

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.local_office_id) {
            alert('Please select a Handling Office')
            return
        }

        setSaving(true)

        const url = isNew
            ? 'http://localhost:5000/api/incidents'
            : `http://localhost:5000/api/incidents/${id}`

        const method = isNew ? 'POST' : 'PUT'

        try {
            // Sanitize data: convert empty strings to null for backend
            const sanitizedData = Object.fromEntries(
                Object.entries(formData).map(([key, value]) => {
                    if (value === '') return [key, null];
                    return [key, value];
                })
            );

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sanitizedData)
            })

            if (response.ok) {
                if (isNew) {
                    navigate('/')
                } else {
                    setIsEditing(false)
                }
            } else {
                const errorText = await response.text();
                alert(`Error saving incident: ${errorText}`)
            }
        } catch (err) {
            console.error(err)
            alert(`Error saving incident: ${err.message}`)
        } finally {
            setSaving(false)
        }
    }

    // Handle creating new ship - save directly without modal
    const handleCreateShip = async (searchTerm) => {
        try {
            const response = await fetch('http://localhost:5000/api/options/ships', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: searchTerm.trim() })
            })

            if (response.ok) {
                const newShip = await response.json()
                // Add to ships list and select it
                setShips(prev => [...prev, newShip])
                setFormData({ ...formData, ship_id: newShip.id })
            } else {
                alert('Error creating ship')
            }
        } catch (err) {
            console.error('Error creating ship:', err)
            alert('Error creating ship')
        }
    }

    // Handle creating new member
    const handleCreateMember = (searchTerm) => {
        setPendingMemberName(searchTerm)
        setShowMemberModal(true)
    }

    const handleMemberSaved = (newMember) => {
        // Add to members list and select it
        setMembers(prev => [...prev, newMember])
        // Auto-copy to manager field only for new incidents
        if (isNew) {
            setFormData(prev => ({ ...prev, member_id: newMember.id, owner_id: newMember.id }))
        } else {
            setFormData(prev => ({ ...prev, member_id: newMember.id }))
        }
    }

    // Auto-copy member to manager when member changes (only for new incidents)
    const handleMemberChange = (memberId) => {
        console.log('handleMemberChange called:', { memberId, isNew })
        if (isNew) {
            // For new incidents, auto-copy member to manager
            console.log('Copying member to manager')
            setFormData(prev => {
                console.log('Previous formData:', prev)
                const newData = { ...prev, member_id: memberId, owner_id: memberId }
                console.log('New formData:', newData)
                return newData
            })
        } else {
            // For existing incidents, only update member
            setFormData(prev => ({ ...prev, member_id: memberId }))
        }
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
        } else {
            const newTabs = openTabs.filter(t => t !== tabToClose)
            setOpenTabs(newTabs)
            if (activeTab === tabToClose) {
                setActiveTab('details')
            }
        }
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
                <button className="bg-[#0078d4] text-white px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1 whitespace-nowrap">
                    <Plus className="h-4 w-4" /> Invoices
                </button>
                <button className="bg-[#0078d4] text-white px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1 whitespace-nowrap">
                    <Plus className="h-4 w-4" /> Sub Incident
                </button>
                <div className="flex-1"></div>
                <button className="bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1 hover:bg-slate-50">
                    <Printer className="h-4 w-4" /> Print
                </button>
                <button
                    onClick={() => navigate('/')}
                    className="bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1 hover:bg-slate-50"
                >
                    <ArrowLeft className="h-4 w-4" /> Back
                </button>
            </div>

            {/* Tabs */}
            <div className="px-4 mt-4 border-b border-slate-200">
                <div className="flex gap-1">
                    {openTabs.sort((a, b) => {
                        const order = ['details', 'cargo', 'claim', 'comments'];
                        return order.indexOf(a) - order.indexOf(b);
                    }).map(tab => (
                        <div key={tab} className="relative">
                            <button
                                className={`px-4 py-2 text-sm font-medium rounded-t-md ${activeTab === tab ? 'bg-[#0078d4] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab === 'details' ? 'Details' : tab === 'cargo' ? 'Cargo Information' : tab === 'claim' ? 'Claim Details' : tab === 'comments' ? 'Comments' : tab}
                            </button>
                            {tab !== 'details' && (
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
            </div>

            {/* Content */}
            <div className="p-4 max-w-[1400px]">
                {activeTab === 'details' && (
                    <div className="border border-slate-200 rounded-b-md p-4 bg-white">
                        <div className="grid grid-cols-12 gap-x-4 gap-y-4">
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
                            {
                                formData.status !== 'OPEN' && formData.status !== 'OUTSTANDING' ? (
                                    <>
                                        <div className="col-span-3">
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Estimated Disposal Date</label>
                                            <DateInput
                                                className="input-field w-full py-2.5 disabled:bg-white disabled:text-slate-900 disabled:border-slate-300"
                                                value={formData.estimated_disposal_date}
                                                onChange={(e) => setFormData({ ...formData, estimated_disposal_date: e.target.value })}
                                                disabled={!isEditing}
                                            />
                                        </div>
                                        <div className="col-span-3">
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Closing Date</label>
                                            <DateInput
                                                className="input-field w-full py-2.5 disabled:bg-white disabled:text-slate-900 disabled:border-slate-300"
                                                value={formData.closing_date}
                                                onChange={(e) => setFormData({ ...formData, closing_date: e.target.value })}
                                                disabled={!isEditing}
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="col-span-3"></div>
                                        <div className="col-span-3"></div>
                                    </>
                                )
                            }

                            {/* Row 2: Vessel, Voyage, Arrival, Incident Date, Place */}
                            <div className="col-span-4">
                                <label className="block text-xs font-bold text-slate-700 mb-1">Vessel</label>
                                <SearchableSelect
                                    options={ships}
                                    value={formData.ship_id}
                                    onChange={(val) => setFormData({ ...formData, ship_id: val })}
                                    placeholder="Select Vessel..."
                                    className="w-full"
                                    disabled={!isEditing}
                                    allowCreate={isEditing}
                                    onCreateNew={handleCreateShip}
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
                                <label className="block text-xs font-bold text-slate-700 mb-1">Arrival Date</label>
                                <DateInput
                                    className="input-field w-full py-2.5 disabled:bg-white disabled:text-slate-900 disabled:border-slate-300"
                                    value={formData.berthing_date}
                                    onChange={(e) => setFormData({ ...formData, berthing_date: e.target.value })}
                                    disabled={!isEditing}
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-slate-700 mb-1">Date of Incident</label>
                                <DateInput
                                    className="input-field w-full py-2.5 disabled:bg-white disabled:text-slate-900 disabled:border-slate-300"
                                    value={formData.incident_date}
                                    onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })}
                                    disabled={!isEditing}
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-slate-700 mb-1">Place of Incident</label>
                                <SearchableSelect
                                    options={ports}
                                    value={formData.place_id}
                                    onChange={(val) => setFormData({ ...formData, place_id: val })}
                                    placeholder="Select Place..."
                                    className="w-full"
                                    disabled={!isEditing}
                                />
                            </div>

                            {/* Row 3: Client, Client Ref */}
                            <div className="col-span-6">
                                <label className="block text-xs font-bold text-slate-700 mb-1">Client</label>
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
                                <label className="block text-xs font-bold text-slate-700 mb-1">Members</label>
                                <SearchableSelect
                                    options={members}
                                    value={formData.member_id}
                                    onChange={handleMemberChange}
                                    placeholder="Select Member..."
                                    className="w-full"
                                    disabled={!isEditing}
                                    allowCreate={isEditing}
                                    onCreateNew={handleCreateMember}
                                />
                            </div>
                            <div className="col-span-6">
                                <label className="block text-xs font-bold text-slate-700 mb-1">Managers</label>
                                <SearchableSelect
                                    options={members}
                                    value={formData.owner_id}
                                    onChange={(val) => setFormData({ ...formData, owner_id: val })}
                                    placeholder="Select Manager..."
                                    className="w-full"
                                    disabled={!isEditing}
                                />
                            </div>

                            {/* Row 5: Type, Reporting Date, Reported By */}
                            <div className="col-span-4">
                                <label className="block text-xs font-bold text-slate-700 mb-1">Type of Incident</label>
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
                                <label className="block text-xs font-bold text-slate-700 mb-1">Date Reported</label>
                                <DateInput
                                    className="input-field w-full py-2.5 disabled:bg-white disabled:text-slate-900 disabled:border-slate-300"
                                    value={formData.reporting_date}
                                    onChange={(e) => setFormData({ ...formData, reporting_date: e.target.value })}
                                    disabled={!isEditing}
                                />
                            </div>
                            <div className="col-span-6">
                                <label className="block text-xs font-bold text-slate-700 mb-1">Reported By</label>
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
                                <label className="block text-xs font-bold text-slate-700 mb-1">Local Agents</label>
                                <SearchableSelect
                                    options={agents}
                                    value={formData.local_agent_id}
                                    onChange={(val) => setFormData({ ...formData, local_agent_id: val })}
                                    placeholder="Select Agent..."
                                    className="w-full"
                                    disabled={!isEditing}
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-slate-700 mb-1">Claim Handler</label>
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
                                <label className="block text-xs font-bold text-slate-700 mb-1">Next Review Date</label>
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
                            {console.log('Button render:', { isEditing, isNew, id })}
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
                                    {!isNew && (
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="bg-[#fbbf24] text-slate-900 px-8 py-2 rounded-md text-sm font-medium hover:bg-[#f59e0b] flex items-center gap-2"
                                        >
                                            <Ban className="h-4 w-4" /> Cancel
                                        </button>
                                    )}
                                </>
                            ) : (
                                !isNew && (
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
                    <CargoInformation incidentId={id} />
                )}

                {activeTab === 'claim' && (
                    <ClaimDetails incidentId={id} />
                )}

                {activeTab === 'comments' && (
                    <CommentsTab incidentId={id} />
                )}
            </div>

            {/* Modals */}
            <AddMemberModal
                isOpen={showMemberModal}
                onClose={() => setShowMemberModal(false)}
                onSave={handleMemberSaved}
                initialName={pendingMemberName}
            />
        </div>
    )
}
