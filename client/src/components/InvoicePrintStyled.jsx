import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import './InvoicePrintStyled.css'

export default function InvoicePrintStyled() {
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

            const resIncident = await fetch(`http://localhost:5000/api/incidents/${invoiceData.incident_id}/print`)
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

    // Helper for date formatting dd-MMM-yyyy
    const formatDate = (dateString) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        const day = date.getDate().toString().padStart(2, '0')
        const month = date.toLocaleString('en-GB', { month: 'short' })
        const year = date.getFullYear()
        return `${day}-${month}-${year}`
    }

    // Calculate totals
    const safeFees = fees || []
    const safeDisbursements = disbursements || []

    const correspondentFees = safeFees.filter(f => f.contractor_id)
    const thirdPartyFees = safeFees.filter(f => f.third_party_contractor_id)

    const totalCorrespondent = correspondentFees.reduce((sum, f) => sum + ((f.cost || 0) * (f.quantity || 0)), 0)
    const totalThirdParty = thirdPartyFees.reduce((sum, f) => sum + ((f.cost || 0) * (f.quantity || 0)), 0)
    const disbTotal = safeDisbursements.reduce((sum, d) => sum + (d.gross_amount || 0), 0)
    const total = totalCorrespondent + totalThirdParty + disbTotal

    // Separate fees and disbursements (if needed, but current API separates them)
    // Note: The template has "Breakdown of Correspondents Fees" and "Payments to Third Parties"
    // We assume 'fees' are correspondents fees and 'disbursements' are third party payments/disbursements.
    // However, the template shows "Total Third Party Fees" in the summary.
    // In our system, we have 'fees' (internal/correspondent) and 'disbursements' (external/third party).
    // We will map 'fees' to "Breakdown of Correspondents Fees"
    // We will map 'disbursements' to "Payments to Third Parties"

    return (
        <div className="styled-invoice-print">
            <div className="no-print" style={{ textAlign: 'right', marginBottom: '10px', padding: '10px' }}>
                <button
                    onClick={handlePrint}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: '#000080',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    Print Invoice
                </button>
            </div>
            <table cellPadding="0" cellSpacing="0" border="0" width="100%">
                <tbody>
                    <tr>
                        <td align="center" colSpan="6" className="headingnew5">
                            <img
                                src={`/assets/letterheads/office_${incident.local_office_id || 1}.png`}
                                width="100%"
                                alt="Letterhead"
                                style={{ maxHeight: (incident.local_office_id || 1) === 1 ? '165px' : '150px', objectFit: 'contain' }}
                                onError={(e) => { e.target.style.display = 'none' }}
                            />
                        </td>
                    </tr>
                </tbody>
            </table>
            <table>
                <tbody>
                    <tr>
                        <td />
                    </tr>
                </tbody>
            </table>
            <table className="tableborderthick" width="800px" border="0">
                <tbody>
                    <tr>
                        <td>
                            <table width="100%">
                                <tbody>
                                    <tr>
                                        <td className="headingnew">General Information</td>
                                    </tr>
                                </tbody>
                            </table>
                            <table width="100%">
                                <tbody>
                                    <tr>
                                        <td width="40" className="labelmediumbold">Date:&nbsp;</td>
                                        <td width="80" className="labelsmall">{formatDate(invoice.invoice_date)}</td>
                                        <td width="120" className="labelmediumbold">Invoice Number:&nbsp;</td>
                                        <td width="120" className="fieldlarge1">{invoice.formatted_invoice_number}</td>
                                        <td width="80" className="labelmediumbold">Period :&nbsp;</td>
                                        <td width="90" className="labelsmall">{formatDate(invoice.covered_from)}</td>
                                        <td width="10" className="labelmediumbold">To</td>
                                        <td width="90" align="right" className="labelsmall">{formatDate(invoice.covered_to)}</td>
                                    </tr>
                                </tbody>
                            </table>
                            <table width="100%">
                                <tbody>
                                    <tr style={{ height: '5px' }}><td /></tr>
                                </tbody>
                            </table>
                            <table width="100%" border="0" cellPadding="0" cellSpacing="0">
                                <tbody>
                                    <tr>
                                        <td width="48%" valign="top">
                                            <table width="100%" border="0" cellPadding="0" cellSpacing="0">
                                                <tbody>
                                                    <tr>
                                                        <td width="110" className="labelmediumbold">Final Invoice:&nbsp;</td>
                                                        <td className="labelsmall">{invoice.final_invoice ? 'YES' : 'NO'}</td>
                                                    </tr>

                                                    <tr>
                                                        <td width="110" className="labelmediumbold" style={{ verticalAlign: 'top' }}>To:&nbsp;</td>
                                                        <td className="labelsmall" style={{ whiteSpace: 'pre-wrap', verticalAlign: 'top' }}>{invoice.recipient_details}</td>
                                                    </tr>

                                                    <tr>
                                                        <td className="labelmediumbold">Contact Name:&nbsp;</td>
                                                        <td className="labelsmall">{invoice.club_contact_name}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="labelmediumbold">Email:&nbsp;</td>
                                                        <td className="labelsmall">{invoice.club_contact_email}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </td>
                                        <td width="4%" />
                                        <td width="48%" valign="top">
                                            <table width="100%" border="0" cellPadding="0" cellSpacing="0">
                                                <tbody>
                                                    <tr>
                                                        <td width="110" className="labelmediumbold">&nbsp;</td>
                                                        <td className="labelsmall">&nbsp;</td>
                                                    </tr>

                                                    <tr>
                                                        <td width="110" className="labelmediumbold">Invoice From:&nbsp;</td>
                                                        <td className="labelsmall">{invoice.office_name}</td>
                                                    </tr>

                                                    <tr>
                                                        <td className="labelmediumbold" valign="top">Address:&nbsp;</td>
                                                        <td className="labelsmall">
                                                            <div>{invoice.office_line1}</div>
                                                            <div>{invoice.office_line2}</div>
                                                            <div>{invoice.office_line3}</div>
                                                            <div>{invoice.office_line4}</div>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td className="labelmediumbold">Tel:&nbsp;</td>
                                                        <td className="labelsmall">{invoice.office_phone}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="labelmediumbold">Contact Name:&nbsp;</td>
                                                        <td className="labelsmall">{invoice.office_contact_name}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="labelmediumbold">Email:&nbsp;</td>
                                                        <td className="labelsmall">{invoice.office_contact_email || invoice.office_email}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </td>
                                    </tr>

                                    <tr>
                                        <td valign="top">
                                            <table width="100%" border="0" cellPadding="0" cellSpacing="0">
                                                <tbody>
                                                    <tr>
                                                        <td width="110" className="labelmediumbold">Client Reference:&nbsp;</td>
                                                        <td className="labelsmall">{invoice.club_reference}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </td>
                                        <td />
                                        <td valign="top">
                                            <table width="100%" border="0" cellPadding="0" cellSpacing="0">
                                                <tbody>
                                                    <tr>
                                                        <td width="110" className="labelmediumbold">Our Reference:&nbsp;</td>
                                                        <td className="labelsmall">{invoice.supplier_reference}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </td>
                                    </tr>

                                    <tr>
                                        <td valign="top">
                                            <table width="100%" border="0" cellPadding="0" cellSpacing="0">
                                                <tbody>
                                                    <tr>
                                                        <td width="110" className="labelmediumbold">Vessel Name:&nbsp;</td>
                                                        <td className="labelsmall">{invoice.vessel_name}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </td>
                                        <td />
                                        <td valign="top">
                                            <table width="100%" border="0" cellPadding="0" cellSpacing="0">
                                                <tbody>
                                                    <tr>
                                                        <td width="110" className="labelmediumbold">Voyage Number:&nbsp;</td>
                                                        <td className="labelsmall">{invoice.voyage_number}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td valign="top">
                                            <table width="100%" border="0" cellPadding="0" cellSpacing="0">
                                                <tbody>
                                                    <tr>
                                                        <td width="110" className="labelmediumbold">Incident Date:&nbsp;</td>
                                                        <td className="labelsmall">{formatDate(invoice.incident_date)}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </td>
                                        <td />
                                        <td valign="top">
                                            <table width="100%" border="0" cellPadding="0" cellSpacing="0">
                                                <tbody>
                                                    <tr>
                                                        <td width="110" className="labelmediumbold">Place of Incident:&nbsp;</td>
                                                        <td className="labelsmall">{invoice.place_of_incident}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </td>
                                    </tr>

                                    <tr>
                                        <td colSpan="3">
                                            <table width="100%" border="0" cellPadding="0" cellSpacing="0">
                                                <tbody>
                                                    <tr>
                                                        <td width="110" className="labelmediumbold">Description:&nbsp;</td>
                                                        <td className="labelsmall">{invoice.incident_description}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                </tbody>
            </table>
            <table>
                <tbody>
                    <tr>
                        <td />
                    </tr>
                </tbody>
            </table>
            <table className="tableborderthick" width="800px" border="0">
                <tbody>
                    <tr>
                        <td>
                            <table width="100%">
                                <tbody>
                                    <tr>
                                        <td className="headingnew">Payee Details</td>
                                    </tr>
                                </tbody>
                            </table>
                            <table width="100%" border="0" cellPadding="0" cellSpacing="0">
                                <tbody>
                                    <tr>
                                        <td width="48%" valign="top">
                                            <table width="100%" border="0" cellPadding="0" cellSpacing="0">
                                                <tbody>
                                                    <tr>
                                                        <td width="110" className="labelmediumbold">Payee Name:&nbsp;</td>
                                                        <td className="labelsmall">{invoice.office_name}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="labelmediumbold" valign="top">Address:&nbsp;</td>
                                                        <td className="labelsmall">
                                                            <div>{invoice.office_line1}</div>
                                                            <div>{invoice.office_line2}</div>
                                                            <div>{invoice.office_line3}</div>
                                                            <div>{invoice.office_line4}</div>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td className="labelmediumbold">VAT Number:&nbsp;</td>
                                                        <td className="labelsmall">{invoice.office_vat}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="labelmediumbold">Invoice Currency:&nbsp;</td>
                                                        <td className="labelsmall">{invoice.incident_currency_name}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </td>
                                        <td width="4%" />
                                        <td width="48%" valign="top">
                                            <table width="100%" border="0" cellPadding="0" cellSpacing="0">
                                                <tbody>
                                                    <tr>
                                                        <td width="110" className="labelmediumbold">Account Name:&nbsp;</td>
                                                        <td className="labelsmall">{invoice.office_name}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="labelmediumbold">Bank Name:&nbsp;</td>
                                                        <td className="labelsmall">{invoice.bank_name}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="labelmediumbold" valign="top">Bank Address:&nbsp;</td>
                                                        <td className="labelsmall">
                                                            <div>{invoice.bank_line1}</div>
                                                            <div>{invoice.bank_line2}</div>
                                                            <div>{invoice.bank_line3}</div>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td className="labelmediumbold">IBAN Number:&nbsp;</td>
                                                        <td className="labelsmall">{invoice.iban}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="labelmediumbold">Swift Code:&nbsp;</td>
                                                        <td className="labelsmall">{invoice.swift_code}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                </tbody>
            </table>

            <table>
                <tbody>
                    <tr>
                        <td />
                    </tr>
                </tbody>
            </table>
            <table className="tableborderthick" width="800px" border="0">
                <tbody>
                    <tr>
                        <td>
                            <table width="100%">
                                <tbody>
                                    <tr>
                                        <td className="headingnew">Invoice Summary</td>
                                    </tr>
                                </tbody>
                            </table>
                            <table width="100%">
                                <tbody>
                                    {totalCorrespondent > 0 && (
                                        <tr>
                                            <td width="210" />
                                            <td width="100" />
                                            <td width="230" className="labelmediumboldxx">Total Fees &nbsp;</td>
                                            <td width="110" align="right" className="labelsmall">{totalCorrespondent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        </tr>
                                    )}


                                    {totalThirdParty > 0 && (
                                        <tr>
                                            <td width="210" />
                                            <td width="100" />
                                            <td width="230" className="labelmediumboldxx">Total Third Party Fees &nbsp;</td>
                                            <td width="110" align="right" className="labelsmall">{totalThirdParty.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        </tr>
                                    )}

                                    {disbTotal > 0 && (
                                        <tr>
                                            <td width="210" />
                                            <td width="100" />
                                            <td width="230" className="labelmediumboldxx">Total Disbursements &nbsp;</td>
                                            <td width="110" align="right" className="labelsmall">{disbTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        </tr>
                                    )}


                                    <tr>
                                        <td width="210" />
                                        <td width="100" />
                                        <td width="230" className="labelmediumbold">Amount Payable &nbsp;</td>
                                        <td width="110" className="fieldlarge2">USD {total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                </tbody>
            </table>
            <p style={{ pageBreakAfter: 'always' }}>  </p>
            <table>
                <tbody>
                    <tr>
                        <td />
                    </tr>
                </tbody>
            </table>
            <table className="tableborderthick" width="800px" border="0">
                <tbody>
                    <tr>
                        <td>
                            <table width="100%">
                                <tbody>
                                    <tr>
                                        <td className="headingnew">Breakdown of Correspondents Fees</td>
                                    </tr>
                                </tbody>
                            </table>
                            <table width="100%">
                                <tbody>
                                    <tr>
                                        <td className="headingnew1" />
                                    </tr>
                                </tbody>
                            </table>
                            <table width="100%">
                                <tbody>
                                    <tr>
                                        <td width="100" className="labelmediumbold111">Date</td>
                                        <td width="200" className="labelmediumbold333">Contractor/ Work done</td>
                                        <td width="110" className="labelmediumbold333">Measure</td>
                                        <td width="70" className="labelmediumbold222">Cost</td>
                                        <td width="70" className="labelmediumbold222">Quantity</td>
                                        <td width="110" className="labelmediumbold222">Fee Amount</td>
                                    </tr>
                                    {correspondentFees.map((fee, index) => (
                                        <React.Fragment key={index}>
                                            <tr>
                                                <td align="center" className="labelsmall">{formatDate(fee.fee_date)}</td>
                                                <td align="left" className="labelsmall">{fee.contractor_name}</td>
                                                <td align="left" className="labelsmall">{fee.unit || 'Fixed'}</td>
                                                <td align="right" className="labelsmall">{(fee.cost || 0).toFixed(2)}</td>
                                                <td align="right" className="labelsmall">{(fee.quantity || 0).toFixed(2)}</td>
                                                <td align="right" className="labelsmall">{((fee.cost || 0) * (fee.quantity || 0)).toFixed(2)}</td>
                                            </tr>
                                            <tr>
                                                <td />
                                                <td colSpan="4" className="labelsmall">{fee.work_performed}</td>
                                            </tr>
                                        </React.Fragment>
                                    ))}

                                    {totalCorrespondent > 0 && (
                                        <tr>
                                            <td colSpan="2" />
                                            <td colSpan="3" className="labelmediumbold">Total Fees &nbsp;</td>
                                            <td className="fieldlarge2">USD {totalCorrespondent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        </tr>
                                    )}
                                    <tr>
                                        <td />
                                    </tr>
                                </tbody>
                            </table>

                            {/* Third Party Fees Section */}
                            {totalThirdParty > 0 && (
                                <>
                                    <table width="100%">
                                        <tbody>
                                            <tr>
                                                <td className="headingnew1" />
                                            </tr>
                                        </tbody>
                                    </table>
                                    <table width="100%">
                                        <tbody>
                                            <tr>
                                                <td className="headingnew">Payments to Third-Party</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                    <table width="100%">
                                        <tbody>
                                            <tr>
                                                <td className="headingnew1" />
                                            </tr>
                                        </tbody>
                                    </table>
                                    <table width="100%">
                                        <tbody>
                                            <tr>
                                                <td width="100" className="labelmediumbold111">Date</td>
                                                <td width="200" className="labelmediumbold333">Service Provider</td>
                                                <td width="110" className="labelmediumbold333">Work Performed</td>
                                                <td width="70" className="labelmediumbold222">Cost</td>
                                                <td width="70" className="labelmediumbold222">Quantity</td>
                                                <td width="110" className="labelmediumbold222">Total</td>
                                            </tr>
                                            {thirdPartyFees.map((fee, index) => (
                                                <React.Fragment key={index}>
                                                    <tr>
                                                        <td align="center" className="labelsmall">{formatDate(fee.fee_date)}</td>
                                                        <td align="left" className="labelsmall">{fee.contractor_name || fee.service_provider_name}</td>
                                                        <td align="left" className="labelsmall">{fee.work_performed || 'Fixed Amount'}</td>
                                                        <td align="right" className="labelsmall">{(fee.cost || 0).toFixed(2)}</td>
                                                        <td align="right" className="labelsmall">{(fee.quantity || 0).toFixed(2)}</td>
                                                        <td align="right" className="labelsmall">{((fee.cost || 0) * (fee.quantity || 0)).toFixed(2)}</td>
                                                    </tr>
                                                    <tr>
                                                        <td />
                                                        <td colSpan="4" className="labelsmall">{fee.work_performed}</td>
                                                    </tr>
                                                </React.Fragment>
                                            ))}
                                            <tr>
                                                <td colSpan="2" />
                                                <td colSpan="3" className="labelmediumbold">Total Third Party Fees &nbsp;</td>
                                                <td className="fieldlarge2">USD {totalThirdParty.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            </tr>
                                            <tr>
                                                <td />
                                            </tr>
                                        </tbody>
                                    </table>
                                </>
                            )}

                            <table width="100%">
                                <tbody>
                                    <tr>
                                        <td className="headingnew1" />
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                </tbody>
            </table>
            <table>
                <tbody>
                    <tr>
                        <td />
                    </tr>
                </tbody>
            </table>

            {disbTotal > 0 && (
                <table className="tableborderthick" width="800px" border="0">
                    <tbody>
                        <tr>
                            <td>
                                <table width="100%">
                                    <tbody>
                                        <tr>
                                            <td className="headingnew">Disbursements</td>
                                        </tr>
                                    </tbody>
                                </table>
                                <table width="100%">
                                    <tbody>
                                        <tr>
                                            <td className="headingnew1" />
                                        </tr>
                                    </tbody>
                                </table>
                                <table width="100%">
                                    <tbody>
                                        <tr>
                                            <td width="100" className="labelmediumbold111">Date</td>
                                            <td width="200" className="labelmediumbold333">Description</td>
                                            <td width="110" className="labelmediumbold333">Measure</td>
                                            <td width="70" className="labelmediumbold222">Cost</td>
                                            <td width="70" className="labelmediumbold222">Quantity</td>
                                            <td width="110" className="labelmediumbold222">Fee Amount</td>
                                        </tr>
                                        {disbursements.map((disb, index) => (
                                            <React.Fragment key={index}>
                                                <tr>
                                                    <td align="center" className="labelsmall">{formatDate(disb.created_date || invoice.invoice_date)}</td>
                                                    <td align="left" className="labelsmall">{disb.type_name || disb.type}</td>
                                                    <td align="left" className="labelsmall">Fixed Amount</td>
                                                    <td align="right" className="labelsmall">{(disb.gross_amount || 0).toFixed(2)}</td>
                                                    <td align="right" className="labelsmall">1.00</td>
                                                    <td align="right" className="labelsmall">{(disb.gross_amount || 0).toFixed(2)}</td>
                                                </tr>
                                                <tr>
                                                    <td />
                                                    <td colSpan="4" className="labelsmall">{disb.comments || disb.description}</td>
                                                </tr>
                                            </React.Fragment>
                                        ))}
                                        <tr>
                                            <td colSpan="2" />
                                            <td colSpan="3" className="labelmediumbold">Total Disbursements &nbsp;</td>
                                            <td className="fieldlarge2">USD {disbTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        </tr>
                                        <tr>
                                            <td />
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                    </tbody>
                </table>
            )}
            <table>
                <tbody>
                    <tr>
                        <td />
                    </tr>
                </tbody>
            </table>
            <table className="tableborderthick" width="800px" border="0">
                <tbody>
                    <tr>
                        <td>
                            <table width="100%">
                                <tbody>
                                    <tr>
                                        <td className="headingnew">Other Information</td>
                                    </tr>
                                </tbody>
                            </table>
                            <table width="100%">
                                <tbody>
                                    <tr>
                                        <td className="labelsmall">{invoice.other_information}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div >
    )
}
