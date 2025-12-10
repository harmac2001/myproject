import { useState, useEffect, useRef } from 'react'
import { Save, Edit2, X } from 'lucide-react'

export default function MultiSelect({ options, value = [], onChange, placeholder, disabled, labelKey, onEdit, onDelete, onCreateNew }) {
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

    const getLabel = (opt) => {
        if (labelKey && opt[labelKey]) return opt[labelKey]
        return opt.name || opt.code || opt.id || opt.location || opt.friendly_name
    }

    const filteredOptions = options.filter(opt => {
        const label = getLabel(opt)
        return String(label).toLowerCase().includes(searchTerm.toLowerCase())
    })

    const selectedOptions = options.filter(opt => value.includes(opt.id))
    const displayValue = selectedOptions.map(opt => getLabel(opt)).join(', ')

    const toggleOption = (optId) => {
        if (value.includes(optId)) {
            onChange(value.filter(id => id !== optId))
        } else {
            onChange([...value, optId])
        }
    }

    if (disabled) {
        return (
            <div className="relative w-full">
                <div className="input-field w-full flex items-center justify-between bg-white py-2.5 px-3 text-slate-900 cursor-default border border-slate-300 rounded-md">
                    <span className="block truncate">
                        {displayValue || placeholder}
                    </span>
                </div>
            </div>
        )
    }

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <div
                className="input-field w-full flex items-center justify-between bg-white py-2.5 px-3 border border-slate-300 rounded-md cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={`block truncate ${!displayValue ? 'text-slate-500' : 'text-slate-900'}`}>
                    {displayValue || placeholder}
                </span>
                <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>

            {isOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-[300px] rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                    <div className="sticky top-0 z-10 bg-white px-2 py-2 border-b border-slate-100">
                        <input
                            type="text"
                            className="w-full border border-slate-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
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
                                className={`cursor-pointer select-none relative py-2 pl-8 pr-4 hover:bg-indigo-50 ${value.includes(opt.id) ? 'bg-indigo-50 text-indigo-600' : 'text-slate-900'} group flex justify-between items-center`}
                                onClick={() => toggleOption(opt.id)}
                            >
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <input
                                        type="checkbox"
                                        checked={value.includes(opt.id)}
                                        onChange={() => { }}
                                        className="absolute left-2 top-1/2 -translate-y-1/2"
                                    />
                                    <span className={`block truncate ${value.includes(opt.id) ? 'font-semibold' : 'font-normal'}`}>
                                        {getLabel(opt)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    {onEdit && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onEdit(opt)
                                            }}
                                            className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-white"
                                            title="Edit"
                                        >
                                            <Edit2 className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onDelete(opt)
                                            }}
                                            className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-white"
                                            title="Delete"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                    {onCreateNew && searchTerm.trim() && (
                        <div className="sticky bottom-0 bg-white border-t border-slate-100 p-2">
                            <button
                                type="button"
                                className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded flex items-center gap-2"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onCreateNew(searchTerm)
                                    setSearchTerm('')
                                }}
                            >
                                <span className="text-lg">+</span> Create "{searchTerm}"
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
