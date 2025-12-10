import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Header from './Header'

export default function PrintableSheet() {
    const { id } = useParams()
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch(`http://localhost:5000/api/incidents/${id}/print`)
            .then(res => res.json())
            .then(data => {
                setData(data)
                setLoading(false)
                // Wait for render then print
                setTimeout(() => {
                    window.print()
                }, 500)
            })
            .catch(err => {
                console.error('Error fetching print data:', err)
                setLoading(false)
            })
    }, [id])

    if (loading) return <div className="p-8">Loading...</div>
    if (!data) return <div className="p-8">Incident not found</div>

    const formatDate = (dateString) => {
        if (!dateString) return ''
        return new Date(dateString).toLocaleDateString('en-GB')
    }

    return (
        <div className="bg-white min-h-screen">
            <Header />

            <div className="p-8 max-w-[1000px] mx-auto">
                <div className="mb-4 flex justify-between items-end border-b-2 border-slate-800 pb-2">
                    <h1 className="text-xl font-bold text-slate-800">INCIDENT FACE SHEET</h1>
                    <div className="text-right">
                        <div className="text-xs text-slate-500">Reference Number</div>
                        <div className="text-lg font-bold text-[#3A6082]">{data.formatted_reference}</div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    {/* Left Column */}
                    <div className="space-y-4">
                        <Section title="General Information">
                            <Field label="Handling Office" value={data.office_name} />
                            <Field label="Status" value={data.status} />
                            <Field label="Type of Incident" value={data.type_name} />
                        </Section>

                        <Section title="Vessel Information">
                            <Field label="Vessel" value={data.ship_name} />
                            <Field label="Voyage and Leg" value={data.voyage_and_leg} />
                        </Section>

                        <Section title="Incident Details">
                            <Field label="Date of Incident" value={formatDate(data.incident_date)} />
                            <Field label="Place of Incident" value={data.place_name} />
                            <Field label="Arrival Date" value={formatDate(data.berthing_date)} />
                        </Section>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                        <Section title="Parties Involved">
                            <Field label="Client" value={data.club_name} />
                            <Field label="Client Reference" value={data.club_reference} />
                            <Field label="Member" value={data.member_name} />
                            <Field label="Manager" value={data.owner_name} />
                        </Section>

                        <Section title="Reporting & Handling">
                            <Field label="Date Reported" value={formatDate(data.reporting_date)} />
                            <Field label="Reported By" value={data.reporter_name} />
                            <Field label="Local Agents" value={data.agent_name} />
                            <Field label="Claim Handler" value={data.handler_name} />
                        </Section>

                        <Section title="Key Dates">
                            <Field label="Time Bar Date" value={formatDate(data.time_bar_date)} />
                            <Field label="Latest Report" value={formatDate(data.latest_report_date)} />
                            <Field label="Next Review" value={formatDate(data.next_review_date)} />
                            {data.closing_date && (
                                <Field label="Closing Date" value={formatDate(data.closing_date)} />
                            )}
                        </Section>
                    </div>
                </div>

                {/* Cargo Information */}
                {data.cargo && data.cargo.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-slate-200">
                        <h3 className="text-xs font-bold text-[#344e6e] uppercase tracking-wider mb-2">Cargo Information</h3>
                        {data.cargo.map((item, index) => (
                            <div key={index} className="mb-3 grid grid-cols-2 gap-4 bg-slate-50 p-2 rounded">
                                <Field label="B/L Number" value={item.bill_of_lading_number} />
                                <Field label="Container No." value={item.container_number} />
                                <Field label="Cargo Type" value={item.cargo_type_name} />
                                <Field label="Description" value={item.description} />
                            </div>
                        ))}
                    </div>
                )}

                {/* Claim Details */}
                {data.claims && data.claims.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-slate-200">
                        <h3 className="text-xs font-bold text-[#344e6e] uppercase tracking-wider mb-2">Claim Details</h3>
                        {data.claims.map((claim, index) => (
                            <div key={index} className="mb-3 grid grid-cols-2 gap-4 bg-slate-50 p-2 rounded">
                                <Field label="Claimant" value={claim.claimant_name} />
                                <Field label="Claimant Ref" value={claim.claimant_reference} />
                                <Field label="Loss Type" value={claim.loss_type_name} />
                                <Field label="Loss Cause" value={claim.loss_cause_name} />
                                <Field label="Claim Amount" value={`${claim.claim_currency || ''} ${claim.claim_amount || ''}`} />
                                <Field label="Description" value={claim.description} />
                            </div>
                        ))}
                    </div>
                )}

                {/* Description */}
                <div className="mt-6 pt-4 border-t border-slate-200">
                    <h3 className="text-xs font-bold text-slate-700 mb-1">Description</h3>
                    <p className="text-xs text-slate-600 whitespace-pre-wrap">{data.description}</p>
                </div>

                {/* Comments */}
                {data.comments && data.comments.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-slate-200">
                        <h3 className="text-xs font-bold text-[#344e6e] uppercase tracking-wider mb-2">Comments</h3>
                        <div className="space-y-2">
                            {data.comments.map((comment, index) => (
                                <div key={index} className="bg-slate-50 p-2 rounded">
                                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                        <span>{new Date(comment.created_date * 1000).toLocaleString()}</span>
                                        <span>{comment.created_by_user}</span>
                                    </div>
                                    <div className="text-xs text-slate-700 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: comment.comment_text }} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function Section({ title, children }) {
    return (
        <div>
            <h3 className="text-xs font-bold text-[#344e6e] uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
                {title}
            </h3>
            <div className="space-y-2">
                {children}
            </div>
        </div>
    )
}

function Field({ label, value }) {
    return (
        <div className="grid grid-cols-3 gap-2">
            <div className="text-[10px] font-semibold text-slate-500 uppercase pt-0.5">{label}</div>
            <div className="col-span-2 text-xs text-slate-900 font-medium break-words">{value || '-'}</div>
        </div>
    )
}
