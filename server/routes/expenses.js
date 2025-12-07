const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../db');

// GET expenses for an incident
router.get('/incident/:incidentId', async (req, res) => {
    try {
        const { incidentId } = req.params;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('incident_id', sql.BigInt, incidentId)
            .query(`
                SELECT 
                    e.id,
                    e.description,
                    e.expense_value as amount,
                    e.expense_date as date,
                    e.account_id,
                    e.service_provider_id,
                    COALESCE(sp.friendly_name, sp.name) as paid_to,
                    'USD' as currency,
                    (e.expense_value / NULLIF(dr.purchase_value, 0)) as amount_usd,
                    dr.purchase_value as exchange_rate
                FROM expense e
                LEFT JOIN service_provider sp ON e.service_provider_id = sp.id
                LEFT JOIN dollar_rate dr ON e.expense_date = dr.rate_date
                WHERE e.incident_id = @incident_id 
                ORDER BY e.expense_date DESC
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching expenses:', err);
        res.status(500).send(err.message);
    }
});

// POST create new expense
router.post('/', async (req, res) => {
    try {
        const { incident_id, description, amount, currency, date, paid_to, account_id, service_provider_id } = req.body;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('incident_id', sql.BigInt, incident_id)
            .input('description', sql.NVarChar, description)
            .input('amount', sql.Money, amount)
            .input('date', sql.Date, date)
            .input('account_id', sql.Int, account_id || null)
            .input('service_provider_id', sql.BigInt, service_provider_id || null)
            .query(`
                INSERT INTO expense (incident_id, description, expense_value, expense_date, service_provider_id, account_id)
                OUTPUT INSERTED.id, INSERTED.description, INSERTED.expense_value as amount, INSERTED.expense_date as date, INSERTED.account_id, INSERTED.service_provider_id
                VALUES (@incident_id, @description, @amount, @date, @service_provider_id, @account_id)
            `);

        const newExpense = result.recordset[0];
        newExpense.paid_to = null; // Since we inserted NULL
        newExpense.currency = 'USD'; // Default

        res.status(201).json(newExpense);
    } catch (err) {
        console.error('Error creating expense:', err);
        res.status(500).send(err.message);
    }
});

// PUT update expense
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { description, amount, currency, date, paid_to, account_id, service_provider_id } = req.body;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('id', sql.BigInt, id)
            .input('description', sql.NVarChar, description)
            .input('amount', sql.Money, amount)
            .input('date', sql.Date, date)
            .input('account_id', sql.Int, account_id || null)
            .input('service_provider_id', sql.BigInt, service_provider_id || null)
            .query(`
                UPDATE expense
                SET 
                    description = @description,
                    expense_value = @amount,
                    expense_date = @date,
                    account_id = @account_id,
                    service_provider_id = @service_provider_id
                WHERE id = @id
            `);

        res.json({ message: 'Expense updated successfully' });
    } catch (err) {
        console.error('Error updating expense:', err);
        res.status(500).send(err.message);
    }
});

// DELETE expense
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        await pool.request()
            .input('id', sql.BigInt, id)
            .query('DELETE FROM expense WHERE id = @id');

        res.json({ message: 'Expense deleted successfully' });
    } catch (err) {
        console.error('Error deleting expense:', err);
        res.status(500).send(err.message);
    }
});

module.exports = router;
