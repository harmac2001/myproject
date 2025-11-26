import { Search, ChevronDown, Plus } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

const SearchableSelect = ({ options, value, onChange, placeholder, className, disabled, labelKey, searchable = true, allowCreate = false, onCreateNew }) => {
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

    const filteredOptions = searchable ? options.filter(opt => {
        const label = getLabel(opt)
        return String(label).toLowerCase().includes(searchTerm.toLowerCase())
    }) : options

    const selectedOption = options.find(opt => String(opt.id) === String(value))
    const displayValue = selectedOption ? getLabel(selectedOption) : ''

    const handleCreateNew = () => {
        if (onCreateNew) {
            onCreateNew(searchTerm)
            setIsOpen(false)
            setSearchTerm('')
        }
    }

    if (disabled) {
        return (
            <div className={`relative ${className}`}>
                <div className="input-field w-full flex items-center justify-between bg-white py-2.5 px-3 text-slate-900 cursor-default border border-slate-300 rounded-md">
                    <span className="block truncate">
                        {displayValue || placeholder}
                    </span>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                </div>
            </div>
        )
    }

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            <div
                className={`input-field w-full flex items-center justify-between bg-white py-2.5 px-3 border border-slate-300 rounded-md ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <span className={`block truncate ${!displayValue ? 'text-slate-500' : 'text-slate-900'}`}>
                    {displayValue || placeholder}
                </span>
                <ChevronDown className="h-4 w-4 text-slate-400" />
            </div>

            {isOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-[300px] rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                    {searchable && (
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
                    )}
                    {filteredOptions.length === 0 ? (
                        <>
                            <div className="cursor-default select-none relative py-2 px-4 text-slate-500">
                                No results found
                            </div>
                            {allowCreate && searchTerm.trim() && onCreateNew && (
                                <div
                                    className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-green-50 text-green-700 border-t border-slate-100 flex items-center gap-2"
                                    onClick={handleCreateNew}
                                >
                                    <Plus className="h-4 w-4" />
                                    <span className="font-medium">Add "{searchTerm}"</span>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            {filteredOptions.map((opt) => (
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
                                        {getLabel(opt)}
                                    </span>
                                </div>
                            ))}
                            {allowCreate && searchTerm.trim() && onCreateNew && (
                                <div
                                    className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-green-50 text-green-700 border-t border-slate-100 flex items-center gap-2"
                                    onClick={handleCreateNew}
                                >
                                    <Plus className="h-4 w-4" />
                                    <span className="font-medium">Add "{searchTerm}"</span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    )
}

export default SearchableSelect
