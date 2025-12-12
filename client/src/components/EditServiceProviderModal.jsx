import React, { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'

export default function EditServiceProviderModal({ isOpen, onClose, providerId, onSaved }) {
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        friendly_name: '',
        rate: '',
        city: '',
        complement: '',
        country: '',
        district: '',
        location: '',
        location_number: '',
        postal_code: '',
        state_or_region: '',
        cnpj: '',
        email: '',
        mobile: '',
        phone: '',
        website: '',
        is_consultant: false
    })

    useEffect(() => {
        if (isOpen) {
            if (providerId) {
                fetchData()
            } else {
                setFormData({
                    name: '', friendly_name: '', rate: '',
                    city: '', complement: '', country: '', district: '', location: '', location_number: '', postal_code: '', state_or_region: '',
                    cnpj: '', email: '', mobile: '', phone: '', website: '', is_consultant: false
                })
            }
        }
    }, [isOpen, providerId])

    const fetchData = async () => {
        setLoading(true)
        try {
            // Use the new specific GET endpoint
            const response = await fetch(`http://localhost:5000/api/options/service_providers/${providerId}`)
            if (!response.ok) throw new Error('Failed to fetch provider')
            const item = await response.json()
            if (item) {
                setFormData({
                    name: item.name || '',
                    friendly_name: item.friendly_name || '',
                    rate: item.rate || '',
                    city: item.city || '',
                    complement: item.complement || '',
                    country: item.country || '',
                    district: item.district || '',
                    location: item.location || '',
                    location_number: item.location_number || '',
                    postal_code: item.postal_code || '',
                    state_or_region: item.state_or_region || '',
                    cnpj: item.cnpj || '',
                    email: item.email || '',
                    mobile: item.mobile || '',
                    phone: item.phone || '',
                    website: item.website || '',
                    is_consultant: item.is_consultant || false
                })
            }
        } catch (err) {
            console.error('Error fetching provider:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!formData.name || formData.name.trim() === '') {
            alert('Name is required')
            return
        }

        setSaving(true)
        try {
            const url = providerId
                ? `http://localhost:5000/api/options/service_providers/${providerId}`
                : `http://localhost:5000/api/options/service_providers`

            const method = providerId ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (!response.ok) throw new Error(await response.text())

            await response.json()
            onSaved()
            onClose()
        } catch (err) {
            alert('Error saving provider: ' + err.message)
        } finally {
            setSaving(false)
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <h2 className="text-lg font-bold text-slate-900">{providerId ? 'Edit Service Provider' : 'Add Service Provider'}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-slate-700 mb-2">Name <span className="text-red-500">*</span></label>
                                <input
                                    name="name"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.name}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-slate-700 mb-2">Friendly Name</label>
                                <input
                                    name="friendly_name"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.friendly_name}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="col-span-2 flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_consultant"
                                    name="is_consultant"
                                    checked={formData.is_consultant}
                                    onChange={(e) => setFormData(prev => ({ ...prev, is_consultant: e.target.checked }))}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="is_consultant" className="text-sm font-medium text-slate-700">
                                    Is Consultant
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                                <input
                                    name="email"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Phone</label>
                                <input
                                    name="phone"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.phone}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Mobile</label>
                                <input
                                    name="mobile"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.mobile}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Website</label>
                                <input
                                    name="website"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.website}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">CNPJ</label>
                                <input
                                    name="cnpj"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.cnpj}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Rate</label>
                                <input
                                    name="rate"
                                    type="number"
                                    step="0.01"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.rate}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="col-span-2 border-t border-slate-100 mt-2 pt-4">
                                <h3 className="font-semibold text-slate-800 mb-2">Address</h3>
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-slate-700 mb-2">Location (Street)</label>
                                <input
                                    name="location"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.location}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Number</label>
                                <input
                                    name="location_number"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.location_number}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Complement</label>
                                <input
                                    name="complement"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.complement}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">District</label>
                                <input
                                    name="district"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.district}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">City</label>
                                <input
                                    name="city"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.city}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">State/Region</label>
                                <input
                                    name="state_or_region"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.state_or_region}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Postal Code</label>
                                <input
                                    name="postal_code"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.postal_code}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Country</label>
                                <input
                                    name="country"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.country}
                                    onChange={handleChange}
                                />
                            </div>

                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2 p-4 border-t border-slate-200">
                    <button onClick={onClose} disabled={saving} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">Cancel</button>
                    <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center gap-2">
                        <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    )
}
