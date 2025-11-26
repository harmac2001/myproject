import React, { useState, useEffect, useRef } from 'react'

const DateInput = ({ value, onChange, disabled, className, id }) => {
    const [displayValue, setDisplayValue] = useState('')
    const dateInputRef = useRef(null)

    useEffect(() => {
        if (value) {
            const [year, month, day] = value.split('-')
            setDisplayValue(`${day}/${month}/${year}`)
        } else {
            setDisplayValue('')
        }
    }, [value])

    const handleTextChange = (e) => {
        const input = e.target.value
        setDisplayValue(input)

        const match = input.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
        if (match) {
            const [, day, month, year] = match
            const isoDate = `${year}-${month}-${day}`
            onChange({ target: { value: isoDate } })
        } else if (input === '') {
            onChange({ target: { value: '' } })
        }
    }

    const handleTextBlur = () => {
        const match = displayValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
        if (match) {
            const [, day, month, year] = match
            const paddedDay = day.padStart(2, '0')
            const paddedMonth = month.padStart(2, '0')
            setDisplayValue(`${paddedDay}/${paddedMonth}/${year}`)
            const isoDate = `${year}-${paddedMonth}-${paddedDay}`
            onChange({ target: { value: isoDate } })
        }
    }

    const handleDatePickerChange = (e) => {
        const isoDate = e.target.value
        onChange({ target: { value: isoDate } })
    }

    const handleTextClick = () => {
        if (!disabled && dateInputRef.current && !displayValue) {
            dateInputRef.current.showPicker()
        }
    }

    const handleIconClick = (e) => {
        e.preventDefault()
        if (!disabled && dateInputRef.current) {
            dateInputRef.current.showPicker()
        }
    }

    return (
        <div className="relative w-full">
            <input
                id={id}
                type="text"
                className={`${className} px-3 bg-white border border-slate-300 rounded-md`}
                value={displayValue}
                onChange={handleTextChange}
                onBlur={handleTextBlur}
                onClick={handleTextClick}
                placeholder="dd/mm/yyyy"
                disabled={disabled}
            />
            <input
                ref={dateInputRef}
                type="date"
                className="absolute inset-0 opacity-0 pointer-events-none"
                value={value || ''}
                onChange={handleDatePickerChange}
                disabled={disabled}
                tabIndex={-1}
            />
            {!disabled && (
                <button
                    type="button"
                    onClick={handleIconClick}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                </button>
            )}
        </div>
    )
}

export default DateInput
