import { Search, Plus, ChevronDown, Download } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import leftIcon from '../assets/left_icon.jpg'
import Header from './Header'

const SearchableSelect = ({ options, value, onChange, placeholder, className }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const wrapperRef = useRef(null)

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const filteredOptions = options.filter(opt => {
        const label = opt.name || opt.code || opt.id
        return String(label).toLowerCase().includes(searchTerm.toLowerCase())
    })

    const selectedOption = options.find(opt => String(opt.id) === String(value))
    const displayValue = selectedOption ? (selectedOption.name || selectedOption.code || selectedOption.id) : ''

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            <div
                className="input-field w-full flex items-center justify-between cursor-pointer bg-white py-2.5"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={`block truncate ${!displayValue ? 'text-slate-500' : 'text-slate-900'}`}>
                    {displayValue || placeholder}
                </span>
                <ChevronDown className="h-4 w-4 text-slate-400" />
            </div>

            {isOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-[500px] rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                    <div className="sticky top-0 z-10 bg-white px-2 py-2 border-b border-slate-100">
                        <input
                            type="text"
                            className="w-full border border-slate-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    {filteredOptions.length === 0 ? (
                        <div className="cursor-default select-none relative py-2 px-4 text-slate-500">
                            No results found
                        </div>
                    ) : (
                        filteredOptions.map((opt) => (
                            <div
                                key={opt.id}
                                className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-indigo-50 ${String(value) === String(opt.id) ? 'bg-indigo-50 text-indigo-600' : 'text-slate-900'}`}
                                onClick={() => {
                                    onChange(opt.id)
                                    setIsOpen(false)
                                    setSearchTerm('')
                                }}
                            >
                                <span className={`block truncate ${String(value) === String(opt.id) ? 'font-semibold' : 'font-normal'}`}>
                                    {opt.name || opt.code || opt.id}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}

export default function IncidentList() {
    const navigate = useNavigate()
    const [incidents, setIncidents] = useState([])
    const [search, setSearch] = useState('')
    const [searchScope, setSearchScope] = useState('All')
    const [status, setStatus] = useState('All')
    const [office, setOffice] = useState('')
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const limit = 20

    const [offices, setOffices] = useState([])

    // Advanced Search State
    const [advancedSearchCategory, setAdvancedSearchCategory] = useState('')
    const [advancedSearchValue, setAdvancedSearchValue] = useState('')
    const [advancedSearchOptions, setAdvancedSearchOptions] = useState([])

    const SEARCH_SCOPES = [
        'All',
        'B/L Number',
        'Claimant',
        'Claimant Ref. Number',
        'Client Reference Number',
        'Comments',
        'Container Number',
        'Description of Cargo',
        'Description of Claim',
        'Description of Incident',
        'Members and Managers',
        'Reference Number',
        'Vessel'
    ]

    const handleSearchChange = (val) => {
        setSearch(val)
        // Reset page and incidents explicitly to prevent race condition with fetch
        setPage(1)
        setIncidents([])
        setHasMore(true)
    }

    const handleScopeChange = (val) => {
        setSearchScope(val)
        setPage(1)
        setIncidents([])
        setHasMore(true)
    }

    const handleStatusChange = (val) => {
        setStatus(val)
        setPage(1)
        setIncidents([])
        setHasMore(true)
    }

    const handleOfficeChange = (id) => {
        // Toggle office logic moved here if needed, or just keep simple state update but add reset
        // Wait, 'office' state is comma separated string.
        let newOffice;
        const currentIds = office ? office.split(',') : []
        if (currentIds.includes(String(id))) {
            newOffice = currentIds.filter(oid => oid !== String(id)).join(',')
        } else {
            newOffice = [...currentIds, String(id)].join(',')
        }
        setOffice(newOffice)
        setPage(1)
        setIncidents([])
        setHasMore(true)
    }

    const ADVANCED_SEARCH_CATEGORIES = [
        'Cargo Type',
        'Claim Handler',
        'Client',
        'Consultant',
        'Incident Reported By',
        'Local Agent',
        'Loss Cause',
        'Loss Type',
        'Members/Managers',
        'Place of Incident',
        'Port of Discharge',
        'Port of Loading',
        'Receiver/Shipper',
        'Status',
        'Type of Incident',
        'Vessel'
    ]

    useEffect(() => {
        if (!advancedSearchCategory) {
            setAdvancedSearchOptions([])
            setAdvancedSearchValue('')
            return
        }

        setAdvancedSearchValue('')
        let url = ''
        switch (advancedSearchCategory) {
            case 'Vessel': url = 'http://localhost:5000/api/options/ships'; break;
            case 'Client': url = 'http://localhost:5000/api/options/clubs'; break;
            case 'Cargo Type': url = 'http://localhost:5000/api/options/cargo_types'; break;
            case 'Claim Handler': url = 'http://localhost:5000/api/options/claim_handlers'; break;
            case 'Consultant': url = 'http://localhost:5000/api/options/consultants'; break;
            case 'Incident Reported By': url = 'http://localhost:5000/api/options/reporters'; break;
            case 'Place of Incident': url = 'http://localhost:5000/api/options/ports'; break;
            case 'Port of Discharge': url = 'http://localhost:5000/api/options/ports'; break;
            case 'Port of Loading': url = 'http://localhost:5000/api/options/ports'; break;
            case 'Local Agent': url = 'http://localhost:5000/api/options/agents'; break;
            case 'Loss Cause': url = 'http://localhost:5000/api/options/loss_causes'; break;
            case 'Loss Type': url = 'http://localhost:5000/api/options/loss_types'; break;
            case 'Members/Managers': url = 'http://localhost:5000/api/options/members'; break;
            case 'Receiver/Shipper': url = 'http://localhost:5000/api/options/receivers_shippers'; break;
            case 'Type of Incident': url = 'http://localhost:5000/api/options/incident_types'; break;
            case 'Status':
                setAdvancedSearchOptions([
                    { id: 'Open', name: 'Open' },
                    { id: 'Closed', name: 'Closed' },
                    { id: 'Repudiated', name: 'Repudiated' },
                    { id: 'Withdrawn', name: 'Withdrawn' },
                    { id: 'Outstanding', name: 'Outstanding' },
                    { id: 'Discarded', name: 'Discarded' }
                ]);
                return;
            default: return;
        }

        if (url) {
            fetch(url)
                .then(res => res.json())
                .then(data => setAdvancedSearchOptions(data))
                .catch(err => console.error(err))
        }
    }, [advancedSearchCategory])

    // Reset incidents when advanced search changes
    useEffect(() => {
        setIncidents([])
        setPage(1)
        setHasMore(true)
    }, [advancedSearchCategory, advancedSearchValue])

    const fetchIncidents = (isLoadMore = false) => {
        if (loading) return
        setLoading(true)

        const params = new URLSearchParams()
        if (search) {
            params.append('search', search)
            params.append('search_scope', searchScope)
        }
        if (status !== 'All') params.append('status', status)
        if (office) params.append('office', office)
        if (advancedSearchCategory && advancedSearchValue) {
            params.append('filter_field', advancedSearchCategory)
            params.append('filter_value', advancedSearchValue)
        }
        params.append('page', page)
        params.append('limit', limit)

        const url = `http://localhost:5000/api/incidents?${params.toString()}`;

        fetch(url)
            .then(res => res.json())
            .then(data => {
                // TEMP DEBUG
                // alert(`Fetch Success! Found: ${data.data.length}, Total: ${data.total}`);
                const newIncidents = isLoadMore ? [...incidents, ...data.data] : data.data
                setIncidents(newIncidents)
                setTotal(data.total)
                setHasMore(newIncidents.length < data.total)
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }

    const fetchOptions = () => {
        fetch('http://localhost:5000/api/options/offices')
            .then(res => res.json())
            .then(data => {
                setOffices(data)
                const allOfficeIds = data.map(o => o.id).join(',')
                setOffice(allOfficeIds)
            })
            .catch(err => console.error('Error fetching offices:', err))
    }

    useEffect(() => {
        fetchOptions()
    }, [])

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchIncidents(page > 1)
        }, 500)

        return () => clearTimeout(delayDebounceFn)
    }, [search, searchScope, status, office, page, advancedSearchCategory, advancedSearchValue])

    // Reset logic is now handled in change handlers to prevent race conditions during fetch
    // useEffect(() => { ... }) removed

    // Infinite scroll with Intersection Observer
    const observerTarget = useRef(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                // Prevent loading more if we have no items (initial load or search reset)
                if (entries[0].isIntersecting && hasMore && !loading && incidents.length > 0) {
                    setPage(prev => prev + 1)
                }
            },
            { threshold: 0.1 }
        )

        if (observerTarget.current) {
            observer.observe(observerTarget.current)
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current)
            }
        }
    }, [hasMore, loading, incidents.length])



    const handleExport = () => {
        const params = new URLSearchParams()
        if (search) {
            params.append('search', search)
            params.append('search_scope', searchScope)
        }
        if (status !== 'All') params.append('status', status)
        if (office) params.append('office', office)
        if (advancedSearchCategory && advancedSearchValue) {
            params.append('filter_field', advancedSearchCategory)
            params.append('filter_value', advancedSearchValue)
        }

        // Trigger download
        window.open(`http://localhost:5000/api/incidents/export?${params.toString()}`, '_blank')
    }

    const getStatusColor = (status) => {
        const normalizedStatus = status?.toUpperCase()
        switch (normalizedStatus) {
            case 'OPEN':
            case 'INVESTIGATING':
                return 'bg-green-100 text-green-700 ring-green-600/20'
            case 'OUTSTANDING':
                return 'bg-orange-100 text-orange-700 ring-orange-600/20'
            case 'CLOSED':
            case 'REPUDIATED':
            case 'WITHDRAWN':
            case 'DISCARDED':
                return 'bg-slate-100 text-slate-700 ring-slate-600/20'
            default:
                return 'bg-gray-100 text-gray-700 ring-gray-600/20'
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* Header */}
            <Header />







            <main className="w-full px-4 py-8">


                {/* Filters */}
                <div className="flex flex-col gap-4 mb-8">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative w-[300px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="input-field pl-10 py-2.5 w-full"
                                value={search}
                                onChange={(e) => handleSearchChange(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            {/* Search Scope */}
                            <select
                                className="input-field w-64 py-2.5"
                                value={searchScope}
                                onChange={(e) => handleScopeChange(e.target.value)}
                            >
                                {SEARCH_SCOPES.map(scope => (
                                    <option key={scope} value={scope}>{scope}</option>
                                ))}
                            </select>

                            {/* Status Filter */}
                            <select
                                className="input-field w-40 py-2.5"
                                value={status}
                                onChange={(e) => handleStatusChange(e.target.value)}
                            >
                                <option value="All">All Statuses</option>
                                <option value="OPEN">Open</option>
                                <option value="INVESTIGATING">Investigating</option>
                                <option value="OUTSTANDING">Outstanding</option>
                                <option value="CLOSED">Closed</option>
                                <option value="WITHDRAWN">Withdrawn</option>
                                <option value="REPUDIATED">Repudiated</option>
                                <option value="DISCARDED">Discarded</option>
                            </select>

                            {/* Advanced Search Category */}
                            <select
                                className="input-field w-64 py-2.5"
                                value={advancedSearchCategory}
                                onChange={(e) => setAdvancedSearchCategory(e.target.value)}
                            >
                                <option value="">Select Category...</option>
                                {ADVANCED_SEARCH_CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>

                            {/* Advanced Search Value */}
                            {advancedSearchCategory && (
                                <SearchableSelect
                                    className="w-64"
                                    options={advancedSearchOptions}
                                    value={advancedSearchValue}
                                    onChange={setAdvancedSearchValue}
                                    placeholder="Select Item..."
                                />
                            )}

                            {/* Reset Button */}
                            <button
                                onClick={() => {
                                    setSearch('')
                                    setSearchScope('All')
                                    setAdvancedSearchCategory('')
                                    setAdvancedSearchValue('')
                                }}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg border border-slate-300 transition-colors duration-200 flex items-center gap-2"
                                title="Reset all search filters"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                </svg>
                                Reset
                            </button>

                            {/* New Incident Button */}
                            <button
                                onClick={() => navigate('/incident/new')}
                                className="inline-flex items-center justify-center rounded-lg bg-[#3A6082] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#2c4a66] focus:outline-none focus:ring-2 focus:ring-[#3A6082] focus:ring-offset-2 transition-all duration-200 flex items-center gap-2"
                            >
                                <Plus className="h-5 w-5" />
                                New Incident
                            </button>

                            {/* Export Button */}
                            <button
                                onClick={handleExport}
                                className="inline-flex items-center justify-center rounded-lg bg-white border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 flex items-center gap-2"
                                title="Export filtered list to Excel"
                            >
                                <Download className="h-5 w-5 text-green-600" />
                                Export
                            </button>
                        </div>
                    </div>

                    {/* Office Filter Checkboxes */}
                    <div className="flex flex-wrap gap-4 items-center bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                        <span className="text-sm font-medium text-slate-700 mr-2">Offices:</span>
                        {offices.map((off) => (
                            <label key={off.id} className="inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="form-checkbox h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                    checked={office.split(',').includes(String(off.id))}
                                    onChange={() => handleOfficeChange(off.id)}
                                />
                                <span className="ml-2 text-sm text-slate-700">{off.location}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Incidents Table */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden border border-slate-200">
                    <div className="overflow-x-auto">
                        <table className="w-full table-fixed">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-1.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider" style={{ width: '115px' }}>Reference Number</th>
                                    <th className="px-4 py-1.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider" style={{ width: '115px' }}>Vessel</th>
                                    <th className="px-4 py-1.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider" style={{ width: '105px' }}>Date of Incident</th>
                                    <th className="px-4 py-1.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider" style={{ width: '105px' }}>Place of Incident</th>
                                    <th className="px-4 py-1.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider" style={{ width: '115px' }}>Type of Incident</th>
                                    <th className="px-4 py-1.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider" style={{ width: '100px' }}>Managers</th>
                                    <th className="px-4 py-1.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider" style={{ width: '100px' }}>Members</th>
                                    <th className="px-4 py-1.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider" style={{ width: '60px' }}>Status</th>
                                    <th className="px-4 py-1.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider" style={{ width: '80px' }}>Office</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {incidents.map((incident) => (
                                    <tr
                                        key={incident.id}
                                        className="hover:bg-slate-50 transition-colors duration-150"
                                    >
                                        <td className="px-4 py-1.5 text-sm whitespace-nowrap overflow-hidden text-ellipsis" style={{ width: '115px' }}>
                                            <button
                                                onClick={() => window.open(`/incident/${incident.id}`, '_blank')}
                                                className="font-bold text-[#3A6082] hover:text-[#2c4a66] hover:underline cursor-pointer text-left truncate block w-full"
                                            >
                                                {incident.formatted_reference}
                                            </button>
                                        </td>
                                        <td className="px-4 py-1.5 text-sm text-slate-900 whitespace-nowrap overflow-hidden text-ellipsis" style={{ width: '115px' }} title={incident.ship_name || '-'}>{incident.ship_name || '-'}</td>
                                        <td className="px-4 py-1.5 text-sm text-slate-900 whitespace-nowrap overflow-hidden text-ellipsis" style={{ width: '105px' }}>
                                            {incident.incident_date ? new Date(incident.incident_date).toLocaleDateString('pt-BR') : '-'}
                                        </td>
                                        <td className="px-4 py-1.5 text-sm text-slate-900 whitespace-nowrap overflow-hidden text-ellipsis" style={{ width: '105px' }} title={incident.place_name || '-'}>{incident.place_name || '-'}</td>
                                        <td className="px-4 py-1.5 text-sm text-slate-900 whitespace-nowrap overflow-hidden text-ellipsis" style={{ width: '115px' }} title={incident.type_name || '-'}>{incident.type_name || '-'}</td>
                                        <td className="px-4 py-1.5 text-sm text-slate-900 whitespace-nowrap overflow-hidden text-ellipsis" style={{ width: '100px' }} title={incident.manager_name || '-'}>{incident.manager_name || '-'}</td>
                                        <td className="px-4 py-1.5 text-sm text-slate-900 whitespace-nowrap overflow-hidden text-ellipsis" style={{ width: '100px' }} title={incident.member_name || '-'}>{incident.member_name || '-'}</td>
                                        <td className="px-4 py-1.5 text-sm whitespace-nowrap overflow-hidden" style={{ width: '60px' }}>
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${getStatusColor(incident.status)}`}>
                                                {incident.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-1.5 text-sm text-slate-900 whitespace-nowrap overflow-hidden text-ellipsis" style={{ width: '80px' }} title={incident.office_location || '-'}>{incident.office_location || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {loading && (
                        <div className="text-center py-4">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                    )}

                    {!loading && incidents.length === 0 && (
                        <div className="text-center py-8 text-slate-500">
                            No incidents found
                        </div>
                    )}
                </div>

                {/* Results Info */}
                <div className="mt-4 text-sm text-slate-600 text-center">
                    Showing {incidents.length} of {total} incidents
                </div>

                {/* Scroll Sentinel */}
                <div ref={observerTarget} className="h-4 w-full" />
            </main>
        </div>
    )
}
