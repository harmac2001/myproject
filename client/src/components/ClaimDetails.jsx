import React, { useState, useEffect } from 'react'
import { Save, Ban, Edit2 } from 'lucide-react'
import SearchableSelect from './SearchableSelect'
import DateInput from './DateInput'

export default function ClaimDetails({ incidentId, isEditing: parentIsEditing }) {
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [isEditing, setIsEditing] = useState(false)

    // Sync with parent edit state
    useEffect(() => {
        if (parentIsEditing !== undefined) {
            setIsEditing(parentIsEditing)
        }
    }, [parentIsEditing])

    const [claimExists, setClaimExists] = useState(false)

    // Options
    const [lossTypes, setLossTypes] = useState([])
    const [lossCauses, setLossCauses] = useState([])
    const [traders, setTraders] = useState([])
    const [serviceProviders, setServiceProviders] = useState([])
    const [currencies, setCurrencies] = useState([])

    const [formData, setFormData] = useState({
        received_date: '',
        complete_date: '',
        directly_claimant: false,
        surrogate_claimant_id: '',
        claimant_reference: '',
        loss_type_id: '',
        loss_cause_id: '',
        amount: '',
        currency_id: '',
        settlement_amount: '',
        settlement_currency_id: '',
        description: ''
    })

    // Store original data for cancel
    const [originalData, setOriginalData] = useState(null)

    // Fetch options and data
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const [lt, lc, tr, sp, cur] = await Promise.all([
                    fetch('http://localhost:5000/api/options/loss_types').then(res => res.json()),
                    fetch('http://localhost:5000/api/options/loss_causes').then(res => res.json()),
                    fetch('http://localhost:5000/api/options/traders').then(res => res.json()),
                    fetch('http://localhost:5000/api/options/service_providers').then(res => res.json()),
                    fetch('http://localhost:5000/api/options/currencies').then(res => res.json())
                ])
                setLossTypes(lt)
                setLossCauses(lc)
                setTraders(tr)
                setServiceProviders(sp)
                setCurrencies(cur)
            } catch (err) {
                console.error('Error fetching options:', err)
            }
        }

        const fetchData = async () => {
            setLoading(true)
            try {
                const res = await fetch(`http://localhost:5000/api/claims/${incidentId}`)
                const data = await res.json()
                if (data) {
                    setClaimExists(true)
                    const formattedData = {
                        received_date: data.received_date ? data.received_date.split('T')[0] : '',
                        complete_date: data.complete_date ? data.complete_date.split('T')[0] : '',
                        directly_claimant: data.directly_claimant,
                        surrogate_claimant_id: data.surrogate_claimant_id || '',
                        claimant_reference: data.claimant_reference || '',
                        loss_type_id: data.loss_type_id || '',
                        loss_cause_id: data.loss_cause_id || '',
                        amount: data.amount || '',
                        currency_id: data.currency_id || '',
                        settlement_amount: data.settlement_amount || '',
                        settlement_currency_id: data.settlement_currency_id || '',
                        description: data.description || ''
                    }
                    setFormData(formattedData)
                    setOriginalData(formattedData)
                    setIsEditing(false)
                } else {
                    setClaimExists(false)
                    setIsEditing(true) // Start in edit mode if new
                }
            } catch (err) {
                console.error('Error fetching claim details:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchOptions()
        fetchData()
    }, [incidentId])

    const handleSubmit = async () => {
        setSaving(true)

        const requiredFields = [
            { key: 'received_date', label: 'Claim Received Date' },
            { key: 'surrogate_claimant_id', label: formData.directly_claimant ? 'Claimant' : 'Subrogate Claimant' },
            { key: 'loss_type_id', label: 'Type of Loss' },
            { key: 'loss_cause_id', label: 'Cause of Loss' },
            { key: 'amount', label: 'Claim Amount' },
            { key: 'currency_id', label: 'Claim Currency' }
        ]

        const missingFields = requiredFields.filter(field => !formData[field.key])

        if (missingFields.length > 0) {
            alert(`Please fill in the following mandatory fields:\n${missingFields.map(f => `- ${f.label}`).join('\n')}`)
            setSaving(false)
            return
        }

        try {
            const res = await fetch(`http://localhost:5000/api/claims/${incidentId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            if (res.ok) {
                setClaimExists(true)
                setOriginalData(formData)
                setIsEditing(false)
                // Optionally notify parent to update tabs/buttons if needed
            } else {
                alert('Error saving claim details')
            }
        } catch (err) {
            console.error(err)
            alert('Error saving claim details')
        } finally {
            setSaving(false)
        }
    }

    const handleCancel = () => {
        if (claimExists && originalData) {
            setFormData(originalData)
            setIsEditing(false)
        } else {
            // If it was new and cancelled, maybe clear form?
            // But usually we just leave it or reset to empty defaults
        }
    }

    // Dynamic Options for Claimant
    // If Direct Claimant (Yes) -> Trader
    // If Direct Claimant (No) -> Service Provider
    const claimantOptions = formData.directly_claimant ? traders : serviceProviders
    const claimantLabel = formData.directly_claimant ? 'Claimant' : 'Subrogate Claimant'

    if (loading) return <div className="p-4">Loading...</div>

    return (
        <div className="border border-slate-200 rounded-b-md p-4 bg-white">
            <div className="grid grid-cols-12 gap-x-4 gap-y-4">

                {/* Row 1 */}
                <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Claim Received Date <span className="text-red-500">*</span></label>
                    <DateInput
                        className="input-field w-full py-2.5 disabled:bg-white disabled:text-slate-900 disabled:border-slate-300"
                        value={formData.received_date}
                        onChange={(e) => setFormData({ ...formData, received_date: e.target.value })}
                        disabled={!isEditing}
                    />
                </div>
                <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Claim Complete Date</label>
                    <DateInput
                        className="input-field w-full py-2.5 disabled:bg-white disabled:text-slate-900 disabled:border-slate-300"
                        value={formData.complete_date}
                        onChange={(e) => setFormData({ ...formData, complete_date: e.target.value })}
                        disabled={!isEditing}
                    />
                </div>
                <div className="col-span-1">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Direct Claimant</label>
                    <button
                        onClick={() => {
                            setFormData(prev => ({
                                ...prev,
                                directly_claimant: !prev.directly_claimant,
                                surrogate_claimant_id: '' // Reset selection on toggle
                            }))
                        }}
                        disabled={!isEditing}
                        className={`w-full py-2.5 px-3 rounded-md border text-sm font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed ${formData.directly_claimant
                            ? 'bg-green-100 border-green-300 text-green-700 hover:bg-green-200'
                            : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        {formData.directly_claimant ? 'Yes' : 'No'}
                    </button>
                </div>
                <div className="col-span-5">
                    <label className="block text-xs font-bold text-slate-700 mb-1">{claimantLabel} <span className="text-red-500">*</span></label>
                    <SearchableSelect
                        options={claimantOptions}
                        value={formData.surrogate_claimant_id}
                        onChange={(val) => setFormData({ ...formData, surrogate_claimant_id: val })}
                        placeholder={`Select ${claimantLabel}...`}
                        className="w-full"
                        disabled={!isEditing}
                    />
                </div>
                <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Claimant's Reference No.</label>
                    <input
                        type="text"
                        className="input-field w-full py-2.5 px-3 bg-white border border-slate-300 rounded-md disabled:bg-white disabled:text-slate-900 disabled:border-slate-300"
                        value={formData.claimant_reference}
                        onChange={(e) => setFormData({ ...formData, claimant_reference: e.target.value })}
                        disabled={!isEditing}
                    />
                </div>

                {/* Row 2 */}
                <div className="col-span-6">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Type of Loss <span className="text-red-500">*</span></label>
                    <SearchableSelect
                        options={lossTypes}
                        value={formData.loss_type_id}
                        onChange={(val) => setFormData({ ...formData, loss_type_id: val })}
                        placeholder="Select Type of Loss..."
                        className="w-full"
                        disabled={!isEditing}
                    />
                </div>
                <div className="col-span-6">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Cause of Loss <span className="text-red-500">*</span></label>
                    <SearchableSelect
                        options={lossCauses}
                        value={formData.loss_cause_id}
                        onChange={(val) => setFormData({ ...formData, loss_cause_id: val })}
                        placeholder="Select Cause of Loss..."
                        className="w-full"
                        disabled={!isEditing}
                    />
                </div>

                {/* Row 3 */}
                <div className="col-span-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Claim Amount <span className="text-red-500">*</span></label>
                    <input
                        type="number"
                        className="input-field w-full py-2.5 px-3 bg-white border border-slate-300 rounded-md disabled:bg-white disabled:text-slate-900 disabled:border-slate-300"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        disabled={!isEditing}
                    />
                </div>
                <div className="col-span-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Claim Currency <span className="text-red-500">*</span></label>
                    <div className="flex gap-1">
                        {currencies.slice(0, 3).map(curr => (
                            <button
                                key={curr.id}
                                onClick={() => setFormData({ ...formData, currency_id: curr.id })}
                                disabled={!isEditing}
                                className={`px-3 py-2.5 text-sm font-medium rounded-md border flex-1 disabled:opacity-70 disabled:cursor-not-allowed ${formData.currency_id === curr.id
                                    ? 'bg-[#0078d4] text-white border-[#0078d4]'
                                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                                    }`}
                            >
                                {curr.code}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="col-span-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Settlement Amount</label>
                    <input
                        type="number"
                        className="input-field w-full py-2.5 px-3 bg-white border border-slate-300 rounded-md disabled:bg-white disabled:text-slate-900 disabled:border-slate-300"
                        value={formData.settlement_amount}
                        onChange={(e) => setFormData({ ...formData, settlement_amount: e.target.value })}
                        disabled={!isEditing}
                    />
                </div>
                <div className="col-span-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Settlement Currency</label>
                    <div className="flex gap-1">
                        {currencies.slice(0, 3).map(curr => (
                            <button
                                key={curr.id}
                                onClick={() => setFormData({ ...formData, settlement_currency_id: curr.id })}
                                disabled={!isEditing}
                                className={`px-3 py-2.5 text-sm font-medium rounded-md border flex-1 disabled:opacity-70 disabled:cursor-not-allowed ${formData.settlement_currency_id === curr.id
                                    ? 'bg-slate-300 text-slate-700 border-slate-300' // Grey for settlement as per screenshot style
                                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                                    }`}
                            >
                                {curr.code}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Row 4 */}
                <div className="col-span-12">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Description of Claim</label>
                    <textarea
                        className="input-field w-full px-3 py-2 bg-white border border-slate-300 rounded-md disabled:bg-white disabled:text-slate-900 disabled:border-slate-300"
                        rows="3"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        disabled={!isEditing}
                    />
                </div>

                {/* Buttons */}
                <div className="col-span-12 flex gap-2 mt-4">
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
                                onClick={handleCancel}
                                className="bg-[#fbbf24] text-slate-900 px-8 py-2 rounded-md text-sm font-medium hover:bg-[#f59e0b] flex items-center gap-2"
                            >
                                <Ban className="h-4 w-4" /> Cancel
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="bg-[#0078d4] text-white px-8 py-2 rounded-md text-sm font-medium hover:bg-[#006cbd] flex items-center gap-2"
                        >
                            <Edit2 className="h-4 w-4" /> Edit
                        </button>
                    )}
                </div>

            </div>
        </div>
    )
}
