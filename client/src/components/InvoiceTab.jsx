
import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Save, X, Ban, FileText, FileCheck, ArrowLeft, Printer, AlertCircle } from 'lucide-react'
import AddFeeModal from './AddFeeModal'
import SearchableSelect from './SearchableSelect'

import EditContactModal from './EditContactModal'
import ReassignContactModal from './ReassignContactModal'
import AddDisbursementModal from './AddDisbursementModal'

export default function InvoiceTab({ incidentId, incident }) {
    const [invoices, setInvoices] = useState([])
    const [selectedInvoice, setSelectedInvoice] = useState(null)
    const [fees, setFees] = useState([])
    const [disbursements, setDisbursements] = useState([])
    const [loading, setLoading] = useState(true)

    // Fee Modal State
    const [isFeeModalOpen, setIsFeeModalOpen] = useState(false)
    const [feeModalType, setFeeModalType] = useState('correspondent')
    const [feeToEdit, setFeeToEdit] = useState(null)

    // Contact Modal State
    const [isEditContactModalOpen, setIsEditContactModalOpen] = useState(false)
    const [isReassignContactModalOpen, setIsReassignContactModalOpen] = useState(false)
    const [contactToEdit, setContactToEdit] = useState(null)
    const [contactToDelete, setContactToDelete] = useState(null)

    // Disbursement Modal State
    const [isDisbursementModalOpen, setIsDisbursementModalOpen] = useState(false)

    // Edit Invoice State
    const [isEditingInvoice, setIsEditingInvoice] = useState(false)
    const [invoiceForm, setInvoiceForm] = useState({})
    const [banks, setBanks] = useState([])
    const [contacts, setContacts] = useState([])
    const [clubs, setClubs] = useState([])

    useEffect(() => {
        fetchInvoices()
        fetchContacts()
        fetchClubs()
        if (incident?.local_office_id) {
            fetchBanks()
        }
    }, [incidentId, incident?.local_office_id])

    useEffect(() => {
        if (selectedInvoice) {
            fetchFees(selectedInvoice.id)
            fetchDisbursements(selectedInvoice.id)
            setInvoiceForm({
                invoice_date: selectedInvoice.invoice_date ? selectedInvoice.invoice_date.split('T')[0] : '',
                bank_id: selectedInvoice.bank_id || '',
                covered_from: selectedInvoice.covered_from ? selectedInvoice.covered_from.split('T')[0] : '',
                covered_to: selectedInvoice.covered_to ? selectedInvoice.covered_to.split('T')[0] : '',
                club_contact_id: selectedInvoice.club_contact_id || '',
                office_contact_id: selectedInvoice.office_contact_id || '',
                other_information: selectedInvoice.other_information || '',
                recipient_details: selectedInvoice.recipient_details || '',

                care_of_id: selectedInvoice.care_of_id || '',
                care_of_details: selectedInvoice.care_of_details || '',
                final_invoice: selectedInvoice.final_invoice || false
            })
        }
    }, [selectedInvoice])

    const fetchInvoices = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/invoices/incident/${incidentId}`)
            const data = await res.json()
            setInvoices(data)

            // If currently selected invoice exists in new data, update it
            if (selectedInvoice) {
                const updated = data.find(i => i.id === selectedInvoice.id)
                if (updated) setSelectedInvoice(updated)
            }
        } catch (err) {
            console.error('Error fetching invoices:', err)
        } finally {
            setLoading(false)
        }
    }

    const fetchBanks = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/options/banks?office_id=${incident.local_office_id}`)
            const data = await res.json()
            setBanks(data)
        } catch (err) {
            console.error('Error fetching banks:', err)
        }
    }

    const fetchContacts = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/options/contacts')
            const data = await res.json()
            setContacts(data)
        } catch (err) {
            console.error('Error fetching contacts:', err)
        }
    }

    const fetchClubs = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/options/clubs')
            const data = await res.json()
            setClubs(data)
        } catch (err) {
            console.error('Error fetching clubs:', err)
        }
    }

    const handleClubChange = (clubId) => {
        const club = clubs.find(c => c.id === clubId)

        // Format Member Details
        const memberDetails = [
            selectedInvoice.member_name,
            selectedInvoice.member_line1,
            selectedInvoice.member_line2,
            selectedInvoice.member_line3,
            selectedInvoice.member_line4,
            selectedInvoice.member_vat ? `VAT: ${selectedInvoice.member_vat}` : null
        ].filter(val => val && val.trim() !== '').join('\n')

        // Format Club Details
        let clubDetails = ''
        if (club) {
            clubDetails = [
                `c/o ${club.name}`,
                club.line1,
                club.line2,
                club.line3,
                club.line4,
                club.vat_number ? `VAT: ${club.vat_number}` : null
            ].filter(val => val && val.trim() !== '').join('\n')
        }

        // Combine Member and Club details
        const finalDetails = [memberDetails, clubDetails].filter(val => val && val.trim() !== '').join('\n')

        setInvoiceForm({
            ...invoiceForm,
            care_of_id: clubId,
            recipient_details: finalDetails
        })
    }

    const fetchFees = async (invoiceId) => {
        try {
            const res = await fetch(`http://localhost:5000/api/invoices/${invoiceId}/fees`)
            const data = await res.json()
            setFees(data)
        } catch (err) {
            console.error('Error fetching fees:', err)
        }
    }

    const fetchDisbursements = async (invoiceId) => {
        try {
            const res = await fetch(`http://localhost:5000/api/invoices/${invoiceId}/disbursements`)
            const data = await res.json()
            setDisbursements(data)
        } catch (err) {
            console.error('Error fetching disbursements:', err)
        }
    }

    const handleCreateInvoice = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    incident_id: incidentId,
                    other_information: 'This invoice is subject to our payment terms and conditions, which are available at https://proinde.com.br/payment_terms/.'
                })
            })
            if (res.ok) {
                const newInvoice = await res.json()
                await fetchInvoices()
                setSelectedInvoice(newInvoice)
                setIsEditingInvoice(true)
            } else {
                alert('Error creating invoice')
            }
        } catch (err) {
            console.error('Error creating invoice:', err)
        }
    }

    const handleUpdateInvoice = async () => {
        // Validation for mandatory fields
        if (!invoiceForm.covered_from || !invoiceForm.covered_to || !invoiceForm.club_contact_id || !invoiceForm.office_contact_id) {
            alert('Please fill in all mandatory fields:\n- Covering Period (From & To)\n- Recipient Contact (Club)\n- Origin Contact (Office)')
            return
        }

        // Validation for date consistency
        if (invoiceForm.covered_from && invoiceForm.covered_to && invoiceForm.covered_to < invoiceForm.covered_from) {
            alert('The "To" date cannot be earlier than the "From" date in the Covering Period.')
            return
        }

        try {
            const res = await fetch(`http://localhost:5000/api/invoices/${selectedInvoice.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(invoiceForm)
            })
            if (res.ok) {
                const updatedInvoice = await res.json()
                setSelectedInvoice(updatedInvoice)
                setIsEditingInvoice(false)
                fetchInvoices() // Refresh list
            } else {
                alert('Error updating invoice')
            }
        } catch (err) {
            console.error('Error updating invoice:', err)
        }
    }

    const handleRegister = async () => {
        if (!selectedInvoice || !window.confirm('Are you sure you want to register this invoice? This will assign an Invoice Number.')) return

        try {
            const res = await fetch(`http://localhost:5000/api/invoices/${selectedInvoice.id}/register`, {
                method: 'PUT'
            })
            if (res.ok) {
                fetchInvoices() // Will update selectedInvoice via useEffect logic if we re-fetch
                // Manually update selected invoice to reflect changes immediately
                const data = await res.json()
                setSelectedInvoice(prev => ({ ...prev, invoice_number: data.invoice_number, invoice_year: data.invoice_year }))
            } else {
                alert('Error registering invoice')
            }
        } catch (err) {
            console.error('Error registering invoice:', err)
        }
    }

    const handleDeleteFee = async (id) => {
        if (!window.confirm('Are you sure you want to delete this fee?')) return

        try {
            const res = await fetch(`http://localhost:5000/api/invoices/fees/${id}`, {
                method: 'DELETE'
            })
            if (res.ok) {
                fetchFees(selectedInvoice.id)
            } else {
                alert('Error deleting fee')
            }
        } catch (err) {
            console.error('Error deleting fee:', err)
        }
    }

    const handleDeleteDisbursement = async (id) => {
        if (!window.confirm('Are you sure you want to delete this disbursement?')) return

        try {
            const res = await fetch(`http://localhost:5000/api/invoices/disbursements/${id}`, {
                method: 'DELETE'
            })
            if (res.ok) {
                fetchDisbursements(selectedInvoice.id)
            } else {
                alert('Error deleting disbursement')
            }
        } catch (err) {
            console.error('Error deleting disbursement:', err)
        }
    }

    const handleMarkSettled = async (e, invoiceId) => {
        e.stopPropagation() // Prevent row click
        if (!window.confirm('Mark this invoice as settled today?')) return

        try {
            const res = await fetch(`http://localhost:5000/api/invoices/${invoiceId}/settle`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settlement_date: new Date().toISOString().split('T')[0] })
            })

            if (res.ok) {
                fetchInvoices()
            } else {
                alert('Error settling invoice')
            }
        } catch (err) {
            console.error('Error settling invoice:', err)
        }
    }

    const handleSettlementDateChange = async (e, invoiceId) => {
        e.stopPropagation()
        const newDate = e.target.value

        try {
            const res = await fetch(`http://localhost:5000/api/invoices/${invoiceId}/settle`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settlement_date: newDate || null })
            })

            if (res.ok) {
                fetchInvoices()
            } else {
                alert('Error updating settlement date')
            }
        } catch (err) {
            console.error('Error updating settlement date:', err)
        }
    }

    const handleChasingDateChange = async (e, invoiceId) => {
        e.stopPropagation()
        const newDate = e.target.value

        try {
            const res = await fetch(`http://localhost:5000/api/invoices/${invoiceId}/chasing_date`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ next_chasing_date: newDate || null })
            })

            if (res.ok) {
                fetchInvoices()
            } else {
                alert('Error updating next chasing date')
            }
        } catch (err) {
            console.error('Error updating next chasing date:', err)
        }
    }

    const handleRemarksChange = (e, invoiceId) => {
        e.stopPropagation()
        const newValue = e.target.value
        setInvoices(prev => prev.map(inv =>
            inv.id === invoiceId ? { ...inv, remarks: newValue } : inv
        ))
    }

    const handleRemarksBlur = async (e, invoiceId) => {
        e.stopPropagation()
        const newValue = e.target.value

        try {
            const res = await fetch(`http://localhost:5000/api/invoices/${invoiceId}/remarks`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ remarks: newValue })
            })

            if (!res.ok) {
                alert('Error updating remarks')
                fetchInvoices() // Revert on error
            }
        } catch (err) {
            console.error('Error updating remarks:', err)
            fetchInvoices() // Revert on error
        }
    }

    const openAddModal = (type) => {
        setFeeModalType(type)
        setFeeToEdit(null)
        setIsFeeModalOpen(true)
    }

    const openEditModal = (fee, type) => {
        setFeeModalType(type)
        setFeeToEdit(fee)
        setIsFeeModalOpen(true)
    }

    const handleEditContact = (contactId) => {
        const contact = contacts.find(c => c.id === contactId)
        if (contact) {
            setContactToEdit(contact)
            setIsEditContactModalOpen(true)
        }
    }

    const handleContactDeleted = (deletedContactId) => {
        // Refresh contacts
        fetchContacts()
        setIsEditContactModalOpen(false)

        // Clear selection if the deleted contact was selected
        if (invoiceForm.club_contact_id === deletedContactId) {
            setInvoiceForm(prev => ({ ...prev, club_contact_id: '' }))
        }
        if (invoiceForm.office_contact_id === deletedContactId) {
            setInvoiceForm(prev => ({ ...prev, office_contact_id: '' }))
        }
    }

    const handleContactDeleteError = (error, contact) => {
        if (error.error === 'Cannot delete contact') {
            setIsEditContactModalOpen(false)
            setContactToDelete(contact)
            setIsReassignContactModalOpen(true)
        } else {
            alert(error.message || 'Error deleting contact')
        }
    }

    // Calculations
    const correspondentFees = fees.filter(f => f.contractor_id)
    const thirdPartyFees = fees.filter(f => f.third_party_contractor_id)

    const totalCorrespondent = correspondentFees.reduce((sum, f) => sum + (f.cost * f.quantity), 0)
    const totalThirdParty = thirdPartyFees.reduce((sum, f) => sum + (f.cost * f.quantity), 0)
    const totalDisbursements = disbursements.reduce((sum, d) => sum + (d.gross_amount || 0), 0)
    const totalAmount = totalCorrespondent + totalThirdParty + totalDisbursements

    if (loading) return <div className="p-4 text-center">Loading invoices...</div>

    // LIST VIEW
    if (!selectedInvoice) {
        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-slate-800">Invoices</h3>
                    <button
                        onClick={handleCreateInvoice}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" /> New Invoice
                    </button>
                </div>

                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3">Invoice #</th>
                                <th className="px-4 py-3 text-right">Expenses</th>
                                <th className="px-4 py-3 text-right">Fees</th>
                                <th className="px-4 py-3 text-right">Value</th>
                                <th className="px-4 py-3">Settlement Date</th>
                                <th className="px-4 py-3">Next Chasing Date</th>
                                <th className="px-4 py-3">Remarks</th>
                                <th className="px-4 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {invoices.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-4 py-8 text-center text-slate-400">No invoices found</td>
                                </tr>
                            ) : (
                                invoices.map(inv => (
                                    <tr key={inv.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedInvoice(inv)}>
                                        <td className="px-4 py-3 font-medium text-blue-600">
                                            {inv.formatted_invoice_number || 'DRAFT'}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {(inv.expenses_total || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {(inv.correspondent_fees_total || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium">
                                            {(inv.invoice_total || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="text"
                                                placeholder=""
                                                onFocus={(e) => (e.target.type = "date")}
                                                onBlur={(e) => (e.target.type = e.target.value ? "date" : "text")}
                                                className="px-2 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 min-w-[100px]"
                                                value={inv.settlement_date ? inv.settlement_date.split('T')[0] : ''}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={(e) => handleSettlementDateChange(e, inv.id)}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="text"
                                                placeholder=""
                                                onFocus={(e) => (e.target.type = "date")}
                                                onBlur={(e) => (e.target.type = e.target.value ? "date" : "text")}
                                                className={`px-2 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 min-w-[100px] ${inv.settlement_date ? 'line-through text-slate-400 bg-slate-50' : ''}`}
                                                value={inv.next_chasing_date ? inv.next_chasing_date.split('T')[0] : ''}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={(e) => handleChasingDateChange(e, inv.id)}
                                                disabled={!!inv.settlement_date}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    className={`px-2 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 w-full font-bold ${inv.remarks ? 'text-slate-900' : 'text-slate-500 font-normal'}`}
                                                    value={inv.remarks || ''}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={(e) => handleRemarksChange(e, inv.id)}
                                                    onBlur={(e) => handleRemarksBlur(e, inv.id)}
                                                    placeholder="Add remarks..."
                                                />
                                                {inv.remarks && (
                                                    <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right flex justify-end gap-2">
                                            {!inv.settlement_date && inv.invoice_number && (
                                                <button
                                                    onClick={(e) => handleMarkSettled(e, inv.id)}
                                                    className="text-green-600 hover:underline text-xs border border-green-200 bg-green-50 px-2 py-1 rounded"
                                                >
                                                    Mark Settled
                                                </button>
                                            )}
                                            <button className="text-blue-600 hover:underline">View</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }

    // DETAIL VIEW
    return (
        <div className="space-y-6">
            <button
                onClick={() => setSelectedInvoice(null)}
                className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
            >
                <ArrowLeft className="h-4 w-4" /> Back to List
            </button>

            {/* General Information */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-slate-800">
                        Invoice: {selectedInvoice.formatted_invoice_number || 'DRAFT'}
                    </h3>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            {isEditingInvoice ? (
                                <input
                                    type="checkbox"
                                    id="final_invoice_header"
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    checked={invoiceForm.final_invoice}
                                    onChange={e => setInvoiceForm({ ...invoiceForm, final_invoice: e.target.checked })}
                                />
                            ) : (
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                    checked={selectedInvoice.final_invoice || false}
                                    readOnly
                                    disabled
                                />
                            )}
                            <label htmlFor="final_invoice_header" className="text-sm font-medium text-slate-700">Final Invoice</label>
                        </div>
                        <div className="flex gap-2">
                            {!isEditingInvoice && !selectedInvoice.invoice_number && (
                                <button
                                    onClick={handleRegister}
                                    className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 flex items-center gap-2"
                                >
                                    <FileCheck className="h-4 w-4" /> Register
                                </button>
                            )}
                            <button
                                onClick={() => window.open(`/invoice/${selectedInvoice.id}/print`, '_blank')}
                                className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 flex items-center gap-2"
                            >
                                <Printer className="h-4 w-4" /> Print
                            </button>
                            <button
                                onClick={() => window.open(`/invoice/${selectedInvoice.id}/print-styled`, '_blank')}
                                className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 flex items-center gap-2"
                            >
                                <Printer className="h-4 w-4" /> Print (Styled)
                            </button>
                            {!isEditingInvoice ? (
                                <button
                                    onClick={() => setIsEditingInvoice(true)}
                                    className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 flex items-center gap-2"
                                >
                                    <Edit2 className="h-4 w-4" /> Edit
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setIsEditingInvoice(false)}
                                        className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 flex items-center gap-2"
                                    >
                                        <Ban className="h-4 w-4" /> Cancel
                                    </button>
                                    <button
                                        onClick={handleUpdateInvoice}
                                        className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center gap-2"
                                    >
                                        <Save className="h-4 w-4" /> Save
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="flex flex-col">
                            <span className="text-sm text-slate-500">Date</span>
                            {isEditingInvoice ? (
                                <input
                                    type={invoiceForm.invoice_date ? "date" : "text"}
                                    placeholder=""
                                    onFocus={(e) => (e.target.type = "date")}
                                    onBlur={(e) => (e.target.type = e.target.value ? "date" : "text")}
                                    className="mt-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={invoiceForm.invoice_date}
                                    onChange={e => setInvoiceForm({ ...invoiceForm, invoice_date: e.target.value })}
                                />
                            ) : (
                                <span className="font-medium">{selectedInvoice.invoice_date ? new Date(selectedInvoice.invoice_date).toLocaleDateString() : '-'}</span>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm text-slate-500">Office</span>
                            <span className="font-medium">{selectedInvoice.office_name || '-'}</span>
                        </div>
                        <span className="text-sm text-slate-500">IBAN / SWIFT</span>
                        <span className="font-medium">
                            {selectedInvoice.iban || '-'} / {selectedInvoice.swift_code || '-'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="space-y-4">
                    <div className="flex flex-col">
                        <span className="text-sm text-slate-500">Covering Period (From) <span className="text-red-500">*</span></span>
                        {isEditingInvoice ? (
                            <input
                                type={invoiceForm.covered_from ? "date" : "text"}
                                placeholder=""
                                onFocus={(e) => (e.target.type = "date")}
                                onBlur={(e) => (e.target.type = e.target.value ? "date" : "text")}
                                className="mt-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={invoiceForm.covered_from}
                                onChange={e => setInvoiceForm({ ...invoiceForm, covered_from: e.target.value })}
                            />
                        ) : (
                            <span className="font-medium">{selectedInvoice.covered_from ? new Date(selectedInvoice.covered_from).toLocaleDateString() : '-'}</span>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm text-slate-500">To <span className="text-red-500">*</span></span>
                        {isEditingInvoice ? (
                            <input
                                type={invoiceForm.covered_to ? "date" : "text"}
                                placeholder=""
                                onFocus={(e) => (e.target.type = "date")}
                                onBlur={(e) => (e.target.type = e.target.value ? "date" : "text")}
                                className="mt-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={invoiceForm.covered_to}
                                onChange={e => setInvoiceForm({ ...invoiceForm, covered_to: e.target.value })}
                            />
                        ) : (
                            <span className="font-medium">{selectedInvoice.covered_to ? new Date(selectedInvoice.covered_to).toLocaleDateString() : '-'}</span>
                        )}
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="flex flex-col">
                        <span className="text-sm text-slate-500">Recipient Contact (Club) <span className="text-red-500">*</span></span>
                        {isEditingInvoice ? (
                            <>
                                <SearchableSelect
                                    options={contacts}
                                    value={invoiceForm.club_contact_id}
                                    onChange={(val) => setInvoiceForm({ ...invoiceForm, club_contact_id: val })}
                                    placeholder="Select Contact..."
                                    labelKey="name"
                                />
                                <div className="flex justify-between items-start mt-1">
                                    <span className="text-xs text-slate-500">
                                        {contacts.find(c => c.id === invoiceForm.club_contact_id)?.email || ''}
                                    </span>
                                    {invoiceForm.club_contact_id && (
                                        <button
                                            onClick={() => handleEditContact(invoiceForm.club_contact_id)}
                                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                        >
                                            <Edit2 className="h-3 w-3" /> Edit
                                        </button>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col">
                                <span className="font-medium">{selectedInvoice.club_contact_name || '-'}</span>
                                {selectedInvoice.club_contact_email && (
                                    <span className="text-sm text-slate-500">{selectedInvoice.club_contact_email}</span>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm text-slate-500">Origin Contact (Office) <span className="text-red-500">*</span></span>
                        {isEditingInvoice ? (
                            <>
                                <SearchableSelect
                                    options={contacts}
                                    value={invoiceForm.office_contact_id}
                                    onChange={(val) => setInvoiceForm({ ...invoiceForm, office_contact_id: val })}
                                    placeholder="Select Contact..."
                                    labelKey="name"
                                />
                                <div className="flex justify-between items-start mt-1">
                                    <span className="text-xs text-slate-500">
                                        {contacts.find(c => c.id === invoiceForm.office_contact_id)?.email || ''}
                                    </span>
                                    {invoiceForm.office_contact_id && (
                                        <button
                                            onClick={() => handleEditContact(invoiceForm.office_contact_id)}
                                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                        >
                                            <Edit2 className="h-3 w-3" /> Edit
                                        </button>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col">
                                <span className="font-medium">{selectedInvoice.office_contact_name || '-'}</span>
                                {selectedInvoice.office_contact_email && (
                                    <span className="text-sm text-slate-500">{selectedInvoice.office_contact_email}</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-4">
                <div className="flex flex-col">
                    <span className="text-sm text-slate-500">Other Information</span>
                    {isEditingInvoice ? (
                        <textarea
                            rows="3"
                            className="mt-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={invoiceForm.other_information}
                            onChange={e => setInvoiceForm({ ...invoiceForm, other_information: e.target.value })}
                        />
                    ) : (
                        <p className="font-medium text-slate-700 whitespace-pre-wrap">{selectedInvoice.other_information || '-'}</p>
                    )}
                </div>
            </div>


            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Recipient Details</h3>
                <div className="space-y-4">
                    {isEditingInvoice && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Select Club (Auto-populate)</label>
                            <SearchableSelect
                                options={clubs.filter(c => !selectedInvoice.club_code || c.code === selectedInvoice.club_code)}
                                value={invoiceForm.care_of_id}
                                onChange={handleClubChange}
                                placeholder="Select Club..."
                                className="w-full"
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Recipient</label>
                        {isEditingInvoice ? (
                            <textarea
                                rows="10"
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                value={invoiceForm.recipient_details}
                                onChange={e => setInvoiceForm({ ...invoiceForm, recipient_details: e.target.value })}
                                placeholder="Member Name&#10;Address&#10;City, Country&#10;VAT Number"
                            />
                        ) : (
                            <div className="bg-slate-50 p-3 rounded border border-slate-200 font-mono text-sm whitespace-pre-wrap text-slate-700 h-full">
                                {selectedInvoice.recipient_details || 'No recipient details available.'}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Breakdown of Correspondent Fees */}
            < div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm" >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-slate-800">Breakdown of Correspondent Fees</h3>
                    <button
                        onClick={() => openAddModal('correspondent')}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" /> Add Fee
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Contractor</th>
                                <th className="px-4 py-3">Work Performed</th>
                                <th className="px-4 py-3">Measure</th>
                                <th className="px-4 py-3 text-right">Qty</th>
                                <th className="px-4 py-3 text-right">Cost</th>
                                <th className="px-4 py-3 text-right">Total</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {correspondentFees.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-4 py-8 text-center text-slate-400">No fees added yet</td>
                                </tr>
                            ) : (
                                correspondentFees.map(fee => (
                                    <tr key={fee.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3">{new Date(fee.fee_date).toLocaleDateString()}</td>
                                        <td className="px-4 py-3">{fee.contractor_name}</td>
                                        <td className="px-4 py-3">{fee.work_performed}</td>
                                        <td className="px-4 py-3">{fee.unit}</td>
                                        <td className="px-4 py-3 text-right">{fee.quantity}</td>
                                        <td className="px-4 py-3 text-right">{fee.cost?.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td>
                                        <td className="px-4 py-3 text-right font-medium">{(fee.cost * fee.quantity).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(fee, 'correspondent')}
                                                    className="p-1 text-slate-400 hover:text-blue-600"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteFee(fee.id)}
                                                    className="p-1 text-slate-400 hover:text-red-600"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        <tfoot className="border-t border-slate-200 font-semibold bg-slate-50">
                            <tr>
                                <td colSpan="6" className="px-4 py-3 text-right">Total Fees:</td>
                                <td className="px-4 py-3 text-right">{totalCorrespondent.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div >

            {/* Disbursements */}
            < div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm" >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-slate-800">Disbursements</h3>
                    <button
                        onClick={() => setIsDisbursementModalOpen(true)}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" /> Add Disbursement
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3">Type</th>
                                <th className="px-4 py-3">Description</th>
                                <th className="px-4 py-3 text-right">Amount</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {disbursements.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-4 py-8 text-center text-slate-400">No disbursements added yet</td>
                                </tr>
                            ) : (
                                disbursements.map(disb => (
                                    <tr key={disb.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3">{disb.type_name}</td>
                                        <td className="px-4 py-3">{disb.comments}</td>
                                        <td className="px-4 py-3 text-right font-medium">
                                            {(disb.gross_amount || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => handleDeleteDisbursement(disb.id)}
                                                className="p-1 text-slate-400 hover:text-red-600"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        <tfoot className="border-t border-slate-200 font-semibold bg-slate-50">
                            <tr>
                                <td colSpan="2" className="px-4 py-3 text-right">Total Disbursements:</td>
                                <td className="px-4 py-3 text-right">{totalDisbursements.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div >

            {/* Payments to Third Parties */}
            < div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm" >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-slate-800">Payments to Third Parties</h3>
                    <button
                        onClick={() => openAddModal('third-party')}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" /> Add Payment
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Service Provider</th>
                                <th className="px-4 py-3">Work Performed</th>
                                <th className="px-4 py-3">Measure</th>
                                <th className="px-4 py-3 text-right">Qty</th>
                                <th className="px-4 py-3 text-right">Cost</th>
                                <th className="px-4 py-3 text-right">Total</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {thirdPartyFees.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-4 py-8 text-center text-slate-400">No payments added yet</td>
                                </tr>
                            ) : (
                                thirdPartyFees.map(fee => (
                                    <tr key={fee.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3">{new Date(fee.fee_date).toLocaleDateString()}</td>
                                        <td className="px-4 py-3">{fee.service_provider_name}</td>
                                        <td className="px-4 py-3">{fee.work_performed}</td>
                                        <td className="px-4 py-3">{fee.unit}</td>
                                        <td className="px-4 py-3 text-right">{fee.quantity}</td>
                                        <td className="px-4 py-3 text-right">{fee.cost?.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td>
                                        <td className="px-4 py-3 text-right font-medium">{(fee.cost * fee.quantity).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(fee, 'third-party')}
                                                    className="p-1 text-slate-400 hover:text-blue-600"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteFee(fee.id)}
                                                    className="p-1 text-slate-400 hover:text-red-600"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        <tfoot className="border-t border-slate-200 font-semibold bg-slate-50">
                            <tr>
                                <td colSpan="6" className="px-4 py-3 text-right">Total Third Party:</td>
                                <td className="px-4 py-3 text-right">{totalThirdParty.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div >

            {/* Grand Total */}
            < div className="bg-slate-800 text-white p-4 rounded-lg shadow-sm flex justify-between items-center text-lg font-bold" >
                <span>Amount Payable:</span>
                <span>{totalAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
            </div >

            <AddFeeModal
                isOpen={isFeeModalOpen}
                onClose={() => setIsFeeModalOpen(false)}
                invoiceId={selectedInvoice?.id}
                type={feeModalType}
                onSaved={() => fetchFees(selectedInvoice.id)}
                feeToEdit={feeToEdit}
            />

            <EditContactModal
                isOpen={isEditContactModalOpen}
                onClose={() => setIsEditContactModalOpen(false)}
                contact={contactToEdit}
                onSaved={fetchContacts}
                onDeleted={handleContactDeleted}
                onDeleteError={handleContactDeleteError}
            />

            <ReassignContactModal
                isOpen={isReassignContactModalOpen}
                onClose={() => setIsReassignContactModalOpen(false)}
                contactToDelete={contactToDelete}
                onReassigned={fetchContacts}
            />

            <AddDisbursementModal
                isOpen={isDisbursementModalOpen}
                onClose={() => setIsDisbursementModalOpen(false)}
                invoiceId={selectedInvoice?.id}
                onSaved={() => fetchDisbursements(selectedInvoice.id)}
            />
        </div >
    )
}
