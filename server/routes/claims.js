const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../db');

// GET claim details for an incident
router.get('/:incidentId', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('incidentId', sql.BigInt, req.params.incidentId)
            .query('SELECT * FROM claim_details WHERE incident_id = @incidentId');

        if (result.recordset.length > 0) {
            res.json(result.recordset[0]);
        } else {
            res.json(null);
        }
    } catch (err) {
        console.error('Error fetching claim details:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST/PUT create or update claim details
router.post('/:incidentId', async (req, res) => {
    try {
        const { incidentId } = req.params;
        const {
            received_date,
            complete_date,
            directly_claimant,
            surrogate_claimant_id,
            claimant_reference,
            loss_type_id,
            loss_cause_id,
            amount,
            currency_id,
            settlement_amount,
            settlement_currency_id,
            description
        } = req.body;

        const pool = await poolPromise;

        // Check if exists
        const check = await pool.request()
            .input('incidentId', sql.BigInt, incidentId)
            .query('SELECT incident_id FROM claim_details WHERE incident_id = @incidentId');

        if (check.recordset.length > 0) {
            // Update
            await pool.request()
                .input('incidentId', sql.BigInt, incidentId)
                .input('received_date', sql.Date, received_date || null)
                .input('complete_date', sql.Date, complete_date || null)
                .input('directly_claimant', sql.Bit, directly_claimant ? 1 : 0)
                .input('surrogate_claimant_id', sql.BigInt, surrogate_claimant_id || null)
                .input('claimant_reference', sql.VarChar, claimant_reference || null)
                .input('loss_type_id', sql.BigInt, loss_type_id || null)
                .input('loss_cause_id', sql.BigInt, loss_cause_id || null)
                .input('amount', sql.Numeric(19, 2), amount || null)
                .input('currency_id', sql.BigInt, currency_id || null)
                .input('settlement_amount', sql.Numeric(19, 2), settlement_amount || null)
                .input('settlement_currency_id', sql.BigInt, settlement_currency_id || null)
                .input('description', sql.VarChar(sql.MAX), description || null)
                .query(`
                    UPDATE claim_details SET
                        received_date = @received_date,
                        complete_date = @complete_date,
                        directly_claimant = @directly_claimant,
                        surrogate_claimant_id = @surrogate_claimant_id,
                        claimant_reference = @claimant_reference,
                        loss_type_id = @loss_type_id,
                        loss_cause_id = @loss_cause_id,
                        amount = @amount,
                        currency_id = @currency_id,
                        settlement_amount = @settlement_amount,
                        settlement_currency_id = @settlement_currency_id,
                        description = @description,
                        last_modified_date = DATEDIFF(SECOND,'1970-01-01', GETUTCDATE())
                    WHERE incident_id = @incidentId
                `);
        } else {
            // Insert
            await pool.request()
                .input('incidentId', sql.BigInt, incidentId)
                .input('received_date', sql.Date, received_date || null)
                .input('complete_date', sql.Date, complete_date || null)
                .input('directly_claimant', sql.Bit, directly_claimant ? 1 : 0)
                .input('surrogate_claimant_id', sql.BigInt, surrogate_claimant_id || null)
                .input('claimant_reference', sql.VarChar, claimant_reference || null)
                .input('loss_type_id', sql.BigInt, loss_type_id || null)
                .input('loss_cause_id', sql.BigInt, loss_cause_id || null)
                .input('amount', sql.Numeric(19, 2), amount || null)
                .input('currency_id', sql.BigInt, currency_id || null)
                .input('settlement_amount', sql.Numeric(19, 2), settlement_amount || null)
                .input('settlement_currency_id', sql.BigInt, settlement_currency_id || null)
                .input('description', sql.VarChar(sql.MAX), description || null)
                .query(`
                    INSERT INTO claim_details (
                        incident_id, received_date, complete_date, directly_claimant, 
                        surrogate_claimant_id, claimant_reference, loss_type_id, 
                        loss_cause_id, amount, currency_id, settlement_amount, 
                        settlement_currency_id, description, created_date, last_modified_date
                    ) VALUES (
                        @incidentId, @received_date, @complete_date, @directly_claimant,
                        @surrogate_claimant_id, @claimant_reference, @loss_type_id,
                        @loss_cause_id, @amount, @currency_id, @settlement_amount,
                        @settlement_currency_id, @description, 
                        DATEDIFF(SECOND,'1970-01-01', GETUTCDATE()),
                        DATEDIFF(SECOND,'1970-01-01', GETUTCDATE())
                    )
                `);
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Error saving claim details:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE claim details
router.delete('/:incidentId', async (req, res) => {
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('incidentId', sql.BigInt, req.params.incidentId)
            .query('DELETE FROM claim_details WHERE incident_id = @incidentId');

        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting claim details:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
