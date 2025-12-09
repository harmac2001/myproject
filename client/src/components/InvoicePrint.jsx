import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'

export default function InvoicePrint() {
    const { id } = useParams()
    const [invoice, setInvoice] = useState(null)
    const [fees, setFees] = useState([])
    const [disbursements, setDisbursements] = useState([])
    const [incident, setIncident] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        fetchData()
    }, [id])

    const fetchData = async () => {
        try {
            const resInvoice = await fetch(`http://localhost:5000/api/invoices/${id}`)
            if (!resInvoice.ok) {
                const text = await resInvoice.text()
                throw new Error(`Failed to fetch invoice: ${resInvoice.status} ${text}`)
            }
            const invoiceData = await resInvoice.json()
            setInvoice(invoiceData)

            const resIncident = await fetch(`http://localhost:5000/api/incidents/${invoiceData.incident_id}`)
            if (!resIncident.ok) throw new Error('Failed to fetch incident')
            const incidentData = await resIncident.json()
            setIncident(incidentData)

            const resFees = await fetch(`http://localhost:5000/api/invoices/${id}/fees`)
            const feesData = await resFees.json()
            setFees(feesData)

            const resDisb = await fetch(`http://localhost:5000/api/invoices/${id}/disbursements`)
            const disbData = await resDisb.json()
            setDisbursements(disbData)

        } catch (err) {
            console.error('Error fetching data:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!loading && invoice && incident) {
            const timer = setTimeout(() => {
                window.print()
            }, 1000)
            return () => clearTimeout(timer)
        }
    }, [loading, invoice, incident])

    const handlePrint = () => {
        window.print()
    }

    if (loading) return <div className="p-8">Loading...</div>
    if (error) return <div className="p-8 text-red-600">Error: {error}</div>
    if (!invoice || !incident) return <div className="p-8">Invoice not found</div>

    // Calculate totals
    const feesTotal = fees.reduce((sum, f) => sum + (f.cost * f.quantity), 0)
    const disbTotal = disbursements.reduce((sum, d) => sum + d.gross_amount, 0)
    const total = feesTotal + disbTotal

    const officeAddress = [
        invoice.office_line1,
        invoice.office_line2,
        invoice.office_line3,
        invoice.office_line4
    ].filter(Boolean).join('\n')

    const bankAddress = [
        invoice.bank_line1,
        invoice.bank_line2,
        invoice.bank_line3,
        invoice.bank_line4
    ].filter(Boolean).join('\n')

    const memberAddress = [
        invoice.member_name,
        invoice.member_line1,
        invoice.member_line2,
        invoice.member_line3,
        invoice.member_line4,
        invoice.member_vat ? `VAT: ${invoice.member_vat}` : null
    ].filter(Boolean).join('\n')

    const recipientDetails = invoice.recipient_details || memberAddress

    return (
        <div className="bg-white min-h-screen p-8 max-w-[210mm] mx-auto text-xs font-sans text-black">
            {/* Print Button */}
            <div className="mb-4 no-print text-right">
                <button
                    onClick={handlePrint}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold"
                >
                    Print Invoice
                </button>
            </div>

            {/* Letterhead */}
            <div className="mb-8">
                <img
                    src={`/assets/letterheads/office_${incident.local_office_id || 1}.png`}
                    alt="Letterhead"
                    className="w-full max-h-40 object-contain"
                    onError={(e) => { e.target.style.display = 'none' }}
                />
            </div>

            {/* Header */}
            <div className="flex justify-end items-end mb-4">
                <h1 className="text-xl font-bold uppercase tracking-wide mb-2">INVOICE</h1>
            </div>

            {/* General Information */}
            <div className="mb-6">
                <div className="bg-gray-300 font-bold px-2 py-1 mb-2">General Information</div>

                {/* Row 1 */}
                <div className="flex justify-between items-center mb-4 text-xs">
                    <div>
                        <span className="font-bold mr-2">Date:</span>
                        {invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                    </div>
                    <div className="flex items-center">
                        <span className="font-bold mr-2">Invoice Number:</span>
                        <div className="border border-black px-4 py-0.5 bg-gray-100 font-bold">
                            {invoice.formatted_invoice_number || 'DRAFT'}
                        </div>
                    </div>
                    <div>
                        <span className="font-bold mr-2">Period:</span>
                        {invoice.covered_from ? new Date(invoice.covered_from).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                        <span className="mx-2">To</span>
                        {invoice.covered_to ? new Date(invoice.covered_to).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                    </div>
                </div>

                <div className="mb-4">
                    <span className="font-bold">Final Invoice:</span> {invoice.final_invoice ? 'YES' : 'NO'}
                </div>

                {/* Two Columns */}
                <div className="grid grid-cols-2 gap-8">
                    {/* Left Column */}
                    <div>
                        <div className="mb-4 flex">
                            <div className="font-bold mr-2">To:</div>
                            <div className="whitespace-pre-line">{recipientDetails}</div>
                        </div>

                        <div className="grid grid-cols-[100px_1fr] gap-y-1">
                            <div className="font-bold">Contact Name:</div>
                            <div>{invoice.club_contact_name || '-'}</div>

                            <div className="font-bold">Email:</div>
                            <div>{invoice.club_contact_email || '-'}</div>

                            <div className="font-bold">VAT Number:</div>
                            <div>{/* VAT Number not in schema yet */}</div>

                            <div className="font-bold">Club Reference:</div>
                            <div className="border border-black px-2 bg-gray-100 font-bold text-center">
                                {incident.club_reference || '-'}
                            </div>

                            <div className="font-bold">Vessel Name:</div>
                            <div>{incident.vessel_name || '-'}</div>

                            <div className="font-bold">Incident Date:</div>
                            <div>{incident.incident_date ? new Date(incident.incident_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</div>

                            <div className="font-bold">Description:</div>
                            <div>{incident.incident_description || '-'}</div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div>
                        <div className="mb-4">
                            <div className="font-bold mb-1">Invoice From: <span className="font-normal">{invoice.office_name}</span></div>
                            <div className="grid grid-cols-[60px_1fr] gap-y-1 ml-4">
                                <div className="font-bold">Address:</div>
                                <div className="whitespace-pre-line">{officeAddress}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-[100px_1fr] gap-y-1 text-right">
                            <div className="font-bold">Tel:</div>
                            <div>{invoice.office_phone || '-'}</div>

                            <div className="font-bold">Fax:</div>
                            <div>{/* Fax not in schema */}</div>

                            <div className="font-bold">Contact Name:</div>
                            <div>{invoice.office_contact_name || '-'}</div>

                            <div className="font-bold">Email:</div>
                            <div>{invoice.office_contact_email || invoice.office_email || '-'}</div>

                            <div className="font-bold">Supplier Reference:</div>
                            <div className="border border-black px-2 bg-gray-100 font-bold text-center">
                                {incident.reference_number || '-'}
                            </div>

                            <div className="font-bold">Voyage Number:</div>
                            <div>{invoice.voyage_number || '-'}</div>

                            <div className="font-bold">Place of Incident:</div>
                            <div>{invoice.place_of_incident || '-'}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payee Details */}
            <div className="mb-6">
                <div className="bg-gray-300 font-bold px-2 py-1 mb-2">Payee Details</div>
                <div className="grid grid-cols-2 gap-8 border-b-2 border-black pb-4">
                    {/* Left */}
                    <div className="grid grid-cols-[100px_1fr] gap-y-1">
                        <div className="font-bold">Payee Name:</div>
                        <div>{invoice.office_name}</div>

                        <div className="font-bold">Address:</div>
                        <div className="whitespace-pre-line">{officeAddress}</div>

                        <div className="font-bold">Registration:</div>
                        <div>{invoice.office_registration || '-'}</div>

                        <div className="font-bold">VAT Number:</div>
                        <div>{invoice.office_vat || '-'}</div>

                        <div className="font-bold">Invoice Currency:</div>
                        <div>USD</div>
                    </div>

                    {/* Right */}
                    <div className="grid grid-cols-[120px_1fr] gap-y-1 text-right">
                        <div className="font-bold">Account Name:</div>
                        <div>{invoice.office_name}</div>

                        <div className="font-bold">Bank Name:</div>
                        <div>{invoice.bank_name}</div>

                        <div className="font-bold">Bank Address:</div>
                        <div className="whitespace-pre-line">{bankAddress}</div>

                        <div className="font-bold">Account / IBAN:</div>
                        <div>{invoice.iban || invoice.account_number || '-'}</div>

                        <div className="font-bold">Sort Code:</div>
                        <div>{invoice.sort_code || '-'}</div>

                        <div className="font-bold">Swift Code:</div>
                        <div>{invoice.swift_code || '-'}</div>
                    </div>
                </div>
            </div>

            {/* Invoice Summary */}
            <div className="mb-8 break-inside-avoid">
                <div className="bg-gray-300 font-bold px-2 py-1 mb-2">Invoice Summary</div>
                <div className="flex justify-end">
                    <div className="w-1/2">
                        <div className="flex justify-between mb-1">
                            <span>Total Fees:</span>
                            <span>{feesTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between mb-1">
                            <span>Total Disbursements:</span>
                            <span>{disbTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between mb-1">
                            <span>Total Taxes:</span>
                            <span>0.00</span>
                        </div>
                        <div className="flex justify-between mb-1 font-bold border-t border-black pt-1 mt-1">
                            <span>Amount Payable:</span>
                            <span className="border-b-2 border-black">USD : {total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-8 break-before-page">
                <div className="bg-gray-300 font-bold px-2 py-1 mb-4">Breakdown of Correspondents Fees</div>
                <h3 className="font-bold mb-2">Fees</h3>
                <table className="w-full text-xs">
                    <thead>
                        <tr className="border-b border-black">
                            <th className="text-left py-1 w-24">Date</th>
                            <th className="text-left py-1">Contractor / Work done</th>
                            <th className="text-right py-1 w-24">Measure</th>
                            <th className="text-right py-1 w-20">Cost</th>
                            <th className="text-right py-1 w-16">Quantity</th>
                            <th className="text-right py-1 w-24">Fee Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {fees.map(fee => (
                            <tr key={fee.id}>
                                <td className="py-2 align-top">{formatDate(fee.fee_date)}</td>
                                <td className="py-2 align-top">
                                    <div className="font-bold">{fee.contractor_name}</div>
                                    <div className="text-gray-600">{fee.work_performed}</div>
                                </td>
                                <td className="py-2 text-right align-top">{fee.unit || 'rate'}</td>
                                <td className="py-2 text-right align-top">{fee.cost.toFixed(2)}</td>
                                <td className="py-2 text-right align-top">{fee.quantity.toFixed(2)}</td>
                                <td className="py-2 text-right align-top">{(fee.cost * fee.quantity).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="border-t-2 border-black font-bold">
                            <td colSpan="5" className="text-right py-2">Total Fees:</td>
                            <td className="text-right py-2">USD : {feesTotal.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Payments to Third Parties */}
            {disbursements.length > 0 && (
                <div className="mb-8">
                    <div className="bg-gray-300 font-bold px-2 py-1 mb-4">Payments to Third Parties</div>
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-black">
                                <th className="text-left py-1 w-24">Date</th>
                                <th className="text-left py-1">Description</th>
                                <th className="text-right py-1 w-24">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {disbursements.map(disb => (
                                <tr key={disb.id}>
                                    <td className="py-2 align-top">{formatDate(disb.created_date || invoice.invoice_date)}</td>
                                    <td className="py-2 align-top">
                                        <div className="font-bold">{disb.type_name || disb.type}</div>
                                        <div className="text-gray-600">{disb.comments || disb.description}</div>
                                    </td>
                                    <td className="py-2 text-right align-top">{disb.gross_amount.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="border-t-2 border-black font-bold">
                                <td colSpan="2" className="text-right py-2">Total Disbursements:</td>
                                <td className="text-right py-2">USD : {disbTotal.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}

            <style>{`
                @media print {
                    @page { margin: 10mm; }
                    body { -webkit-print-color-adjust: exact; }
                    .break-before-page { page-break-before: always; }
                    .break-inside-avoid { page-break-inside: avoid; }
                    .no-print { display: none !important; }
                }
            `}</style>
        </div>
    )
}
