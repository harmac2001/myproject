import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import AddExpenseModal from './AddExpenseModal'

export default function ExpensesTab({ incidentId }) {
    const [expenses, setExpenses] = useState([])
    const [loading, setLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [editingExpense, setEditingExpense] = useState(null)

    const fetchExpenses = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/expenses/incident/${incidentId}`)
            if (response.ok) {
                const data = await response.json()
                setExpenses(data)
            }
        } catch (err) {
            console.error('Error fetching expenses:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchExpenses()
    }, [incidentId])

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this expense?')) {
            try {
                const response = await fetch(`http://localhost:5000/api/expenses/${id}`, {
                    method: 'DELETE'
                })
                if (response.ok) {
                    fetchExpenses()
                } else {
                    alert('Error deleting expense')
                }
            } catch (err) {
                console.error('Error deleting expense:', err)
                alert('Error deleting expense')
            }
        }
    }

    const totalAmount = expenses.reduce((sum, expense) => {
        return sum + Number(expense.amount)
    }, 0)

    const totalAmountUSD = expenses.reduce((sum, expense) => {
        return sum + (expense.amount_usd ? Number(expense.amount_usd) : 0)
    }, 0)

    if (loading) return <div className="p-4">Loading expenses...</div>

    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 mt-4">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-slate-800">Expenses</h3>
                <button
                    onClick={() => {
                        setEditingExpense(null)
                        setShowAddModal(true)
                    }}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-blue-700 flex items-center gap-1"
                >
                    <Plus className="h-4 w-4" /> Add Expense
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Description</th>
                            <th className="px-4 py-3">Paid To</th>
                            <th className="px-4 py-3 text-right">Amount</th>
                            <th className="px-4 py-3 text-right">ROE</th>
                            <th className="px-4 py-3 text-right">Amount (USD)</th>
                            <th className="px-4 py-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {expenses.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="px-4 py-8 text-center text-slate-500">
                                    No expenses recorded yet.
                                </td>
                            </tr>
                        ) : (
                            expenses.map((expense) => (
                                <tr key={expense.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                        {(() => {
                                            const d = new Date(expense.date)
                                            const day = String(d.getUTCDate()).padStart(2, '0')
                                            const month = String(d.getUTCMonth() + 1).padStart(2, '0')
                                            const year = d.getUTCFullYear()
                                            return `${day}-${month}-${year}`
                                        })()}
                                    </td>
                                    <td className="px-4 py-3 text-slate-800 font-medium">
                                        {expense.description}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">
                                        {expense.paid_to || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-right text-slate-800 font-mono">
                                        {Number(expense.amount).toLocaleString('pt-BR', {
                                            style: 'currency',
                                            currency: 'BRL',
                                            currencyDisplay: 'code'
                                        })}
                                    </td>
                                    <td className="px-4 py-3 text-right text-slate-600 font-mono">
                                        {expense.exchange_rate
                                            ? Number(expense.exchange_rate).toLocaleString('en-US', { minimumFractionDigits: 4 })
                                            : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-right text-slate-800 font-mono">
                                        {expense.amount_usd
                                            ? Number(expense.amount_usd).toLocaleString('en-US', {
                                                style: 'currency',
                                                currency: 'USD',
                                                currencyDisplay: 'code'
                                            })
                                            : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setEditingExpense(expense)
                                                    setShowAddModal(true)
                                                }}
                                                className="text-blue-600 hover:text-blue-800"
                                                title="Edit"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(expense.id)}
                                                className="text-red-600 hover:text-red-800"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    <tfoot className="bg-slate-50 font-semibold text-slate-800 border-t border-slate-200">
                        <tr>
                            <td colSpan="3" className="px-4 py-3 text-right">Total Paid:</td>
                            <td className="px-4 py-3 text-right font-mono text-lg text-blue-700">
                                {totalAmount.toLocaleString('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                    currencyDisplay: 'code'
                                })}
                            </td>
                            <td></td>
                            <td className="px-4 py-3 text-right font-mono text-lg text-blue-700">
                                {totalAmountUSD.toLocaleString('en-US', {
                                    style: 'currency',
                                    currency: 'USD',
                                    currencyDisplay: 'code'
                                })}
                            </td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <AddExpenseModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                incidentId={incidentId}
                onSaved={fetchExpenses}
                expenseToEdit={editingExpense}
            />
        </div>
    )
}
