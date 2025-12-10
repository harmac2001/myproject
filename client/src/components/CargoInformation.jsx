import { useState, useEffect, useRef } from 'react'
import { Save, Edit2 } from 'lucide-react'
import SearchableSelect from './SearchableSelect'
import MultiSelect from './MultiSelect'
import AddTraderModal from './AddTraderModal'

export default function CargoInformation({ incidentId, isEditing: parentIsEditing, onClose }) {
    const [isEditing, setIsEditing] = useState(parentIsEditing)
    const prevParentIsEditing = useRef(parentIsEditing)

    // Trader Modal State
    const [showTraderModal, setShowTraderModal] = useState(false)
    const [traderToEdit, setTraderToEdit] = useState(null)
    const [pendingTraderName, setPendingTraderName] = useState('')

    // Sync with parent edit state only when it changes
    useEffect(() => {
        if (parentIsEditing !== prevParentIsEditing.current) {
            setIsEditing(parentIsEditing)
            prevParentIsEditing.current = parentIsEditing
        }
    }, [parentIsEditing])

    const [saving, setSaving] = useState(false)
    const [cargoExists, setCargoExists] = useState(false)

    // Options
    const [cargoTypes, setCargoTypes] = useState([])
    const [ports, setPorts] = useState([])
    const [traders, setTraders] = useState([])

    // Form data
    const [formData, setFormData] = useState({
        bill_of_lading: '',
        containers: '',
        cargo_type_id: '',
        description: '',
        loading_port_ids: [],
        discharge_port_ids: [],
        shipper_ids: [],
        receiver_ids: []
    })

    // Fetch options
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const [cargoTypesRes, portsRes, tradersRes] = await Promise.all([
                    fetch('http://localhost:5000/api/options/cargo_types'),
                    fetch('http://localhost:5000/api/options/ports'),
                    fetch('http://localhost:5000/api/options/traders')
                ])

                setCargoTypes(await cargoTypesRes.json())
                setPorts(await portsRes.json())
                setTraders(await tradersRes.json())
            } catch (err) {
                console.error('Error fetching options:', err)
            }
        }
        fetchOptions()
    }, [])

    // Fetch cargo data
    useEffect(() => {
        if (incidentId && incidentId !== 'new') {
            fetchCargo()
        }
    }, [incidentId])

    const fetchCargo = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/cargo/incident/${incidentId}`)
            const data = await res.json()
            if (data) {
                setCargoExists(true)
                setFormData({
                    bill_of_lading: data.bill_of_lading_number || '',
                    containers: data.container_number || '',
                    cargo_type_id: data.cargo_type_id || '',
                    description: data.description || '',
                    loading_port_ids: data.loading_ports?.map(p => p.id) || [],
                    discharge_port_ids: data.discharge_ports?.map(p => p.id) || [],
                    shipper_ids: data.shippers?.map(s => s.id) || [],
                    receiver_ids: data.receivers?.map(r => r.id) || []
                })
            } else {
                setCargoExists(false)
            }
        } catch (err) {
            console.error('Error fetching cargo:', err)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        const requiredFields = [
            { key: 'cargo_type_id', label: 'Type of Cargo' },
            { key: 'description', label: 'Description' },
            { key: 'loading_port_ids', label: 'Port of Loading', isArray: true },
            { key: 'discharge_port_ids', label: 'Port of Discharge', isArray: true },
            { key: 'shipper_ids', label: 'Shippers', isArray: true },
            { key: 'receiver_ids', label: 'Receivers', isArray: true }
        ]

        const missingFields = requiredFields.filter(field => {
            if (field.isArray) {
                return !formData[field.key] || formData[field.key].length === 0
            }
            return !formData[field.key]
        })

        if (missingFields.length > 0) {
            alert(`Please fill in the following mandatory fields:\n${missingFields.map(f => `- ${f.label}`).join('\n')}`)
            return
        }

        setSaving(true)

        // Map frontend field names to backend/database field names
        const body = {
            incident_id: incidentId,
            bill_of_lading: formData.bill_of_lading,
            containers: formData.containers,
            cargo_type_id: formData.cargo_type_id,
            description: formData.description,
            loading_port_ids: formData.loading_port_ids,
            discharge_port_ids: formData.discharge_port_ids,
            shipper_ids: formData.shipper_ids,
            receiver_ids: formData.receiver_ids
        }

        console.log('Saving cargo data:', body)

        try {
            const response = await fetch('http://localhost:5000/api/cargo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            if (response.ok) {
                await fetchCargo()
                setIsEditing(false)
            } else {
                const errorText = await response.text()
                console.error('Server error:', errorText)
                alert(`Error saving cargo information: ${errorText}`)
            }
        } catch (err) {
            console.error('Request error:', err)
            alert('Error saving cargo information')
        } finally {
            setSaving(false)
        }
    }

    const getDisplayValue = (ids, options) => {
        if (!ids || ids.length === 0) return ''
        return ids.map(id => {
            const item = options.find(opt => opt.id === id)
            return item ? item.name : ''
        }).filter(Boolean).join(', ')
    }

    // Trader Handlers
    const handleCreateTrader = (name) => {
        setPendingTraderName(name)
        setTraderToEdit(null)
        setShowTraderModal(true)
    }

    const handleTraderSaved = (savedTrader) => {
        // Update traders list
        setTraders(prev => {
            const exists = prev.find(t => t.id === savedTrader.id)
            if (exists) {
                return prev.map(t => t.id === savedTrader.id ? savedTrader : t)
            }
            return [...prev, savedTrader].sort((a, b) => a.name.localeCompare(b.name))
        })
        setPendingTraderName('')
        setShowTraderModal(false)
    }

    return (
        <div className="border border-slate-200 rounded-b-md p-4 bg-white">
            {/* Cargo Form */}
            <div className={`grid grid-cols-2 gap-4 ${isEditing ? '' : 'opacity-80'}`}>
                {/* Bills of Lading */}
                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Bills of Lading</label>
                    <input
                        type="text"
                        className={`input-field w-full py-2.5 px-3 border border-slate-300 rounded-md shadow-sm ${!isEditing ? 'bg-white' : 'bg-white'} text-slate-900`}
                        value={formData.bill_of_lading}
                        onChange={(e) => setFormData({ ...formData, bill_of_lading: e.target.value })}
                        disabled={!isEditing}
                    />
                </div>

                {/* Containers involved */}
                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Containers involved</label>
                    <input
                        type="text"
                        className={`input-field w-full py-2.5 px-3 border border-slate-300 rounded-md shadow-sm ${!isEditing ? 'bg-white' : 'bg-white'} text-slate-900`}
                        value={formData.containers}
                        onChange={(e) => setFormData({ ...formData, containers: e.target.value })}
                        disabled={!isEditing}
                    />
                </div>

                {/* Type of Cargo */}
                <div className="col-span-1">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Type of Cargo <span className="text-red-500">*</span></label>
                    <SearchableSelect
                        options={cargoTypes}
                        value={formData.cargo_type_id}
                        onChange={(val) => setFormData({ ...formData, cargo_type_id: val })}
                        placeholder="Select Cargo Type..."
                        disabled={!isEditing}
                    />
                </div>

                {/* Description */}
                <div className="col-span-1">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Description <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        className={`input-field w-full py-2.5 px-3 border border-slate-300 rounded-md shadow-sm ${!isEditing ? 'bg-white' : 'bg-white'} text-slate-900`}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        disabled={!isEditing}
                    />
                </div>

                {/* Port of Loading */}
                <div className="col-span-1">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Port of Loading <span className="text-red-500">*</span></label>
                    {isEditing ? (
                        <MultiSelect
                            options={ports}
                            value={formData.loading_port_ids}
                            onChange={(val) => setFormData({ ...formData, loading_port_ids: val })}
                            placeholder="Select Ports..."
                            disabled={!isEditing}
                            labelKey="name"
                        />
                    ) : (
                        <input
                            type="text"
                            className="input-field w-full py-2.5 px-3 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm"
                            value={getDisplayValue(formData.loading_port_ids, ports)}
                            readOnly
                        />
                    )}
                </div>

                {/* Port of Discharge */}
                <div className="col-span-1">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Port of Discharge <span className="text-red-500">*</span></label>
                    {isEditing ? (
                        <MultiSelect
                            options={ports}
                            value={formData.discharge_port_ids}
                            onChange={(val) => setFormData({ ...formData, discharge_port_ids: val })}
                            placeholder="Select Ports..."
                            disabled={!isEditing}
                            labelKey="name"
                        />
                    ) : (
                        <input
                            type="text"
                            className="input-field w-full py-2.5 px-3 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm"
                            value={getDisplayValue(formData.discharge_port_ids, ports)}
                            readOnly
                        />
                    )}
                </div>

                {/* Shippers */}
                <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Shippers <span className="text-red-500">*</span></label>
                    {isEditing ? (
                        <MultiSelect
                            options={traders}
                            value={formData.shipper_ids}
                            onChange={(val) => setFormData({ ...formData, shipper_ids: val })}
                            placeholder="Select Shippers..."
                            disabled={!isEditing}
                            onCreateNew={handleCreateTrader}
                        />
                    ) : (
                        <input
                            type="text"
                            className="input-field w-full py-2.5 px-3 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm"
                            value={getDisplayValue(formData.shipper_ids, traders)}
                            readOnly
                        />
                    )}
                </div>

                {/* Receivers */}
                <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Receivers <span className="text-red-500">*</span></label>
                    {isEditing ? (
                        <MultiSelect
                            options={traders}
                            value={formData.receiver_ids}
                            onChange={(val) => setFormData({ ...formData, receiver_ids: val })}
                            placeholder="Select Receivers..."
                            disabled={!isEditing}
                            onCreateNew={handleCreateTrader}
                        />
                    ) : (
                        <input
                            type="text"
                            className="input-field w-full py-2.5 px-3 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm"
                            value={getDisplayValue(formData.receiver_ids, traders)}
                            readOnly
                        />
                    )}
                </div>
            </div>

            {/* Footer Buttons */}
            <div className="mt-6 flex gap-2">
                {isEditing ? (
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="bg-[#0078d4] text-white px-8 py-1.5 rounded text-sm font-medium hover:bg-[#006cbd] flex items-center gap-2 disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" />
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                ) : (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="bg-[#0078d4] text-white px-8 py-1.5 rounded text-sm font-medium hover:bg-[#006cbd] flex items-center gap-2"
                    >
                        <Edit2 className="h-4 w-4" />
                        Edit
                    </button>
                )}
            </div>

            <AddTraderModal
                isOpen={showTraderModal}
                onClose={() => setShowTraderModal(false)}
                onSave={handleTraderSaved}
                traderToEdit={traderToEdit}
                initialName={pendingTraderName}
            />
        </div>
    )
}
