const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../db');

// GET appointments for an incident
router.get('/incident/:incidentId', async (req, res) => {
    try {
        const { incidentId } = req.params;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('incident_id', sql.BigInt, incidentId)
            .query(`
                SELECT 
                    a.*,
                    sp.friendly_name as consultant_name
                FROM appointment a
                LEFT JOIN service_provider sp ON a.consultant_id = sp.id
                WHERE a.incident_id = @incident_id
                ORDER BY a.appointment_date DESC
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching appointments:', err);
        res.status(500).send(err.message);
    }
});

// POST create new appointment
router.post('/', async (req, res) => {
    try {
        const {
            incident_id,
            consultant_id,
            appointment_date,
            final_survey_date,
            preliminary_report_date,
            report_delivery_date,
            invoice_proinde
        } = req.body;

        const pool = await poolPromise;

        const result = await pool.request()
            .input('incident_id', sql.BigInt, incident_id)
            .input('consultant_id', sql.BigInt, consultant_id || null)
            .input('appointment_date', sql.Date, appointment_date || null)
            .input('final_survey_date', sql.Date, final_survey_date || null)
            .input('preliminary_report_date', sql.Date, preliminary_report_date || null)
            .input('report_delivery_date', sql.Date, report_delivery_date || null)
            .input('invoice_proinde', sql.Bit, invoice_proinde ? 1 : 0)
            .input('created_date', sql.BigInt, Math.floor(Date.now() / 1000))
            .input('last_modified_date', sql.BigInt, Math.floor(Date.now() / 1000))
            .query(`
                INSERT INTO appointment (
                    incident_id, consultant_id, appointment_date, final_survey_date,
                    preliminary_report_date, report_delivery_date, invoice_proinde,
                    created_date, last_modified_date
                )
                OUTPUT INSERTED.*
                VALUES (
                    @incident_id, @consultant_id, @appointment_date, @final_survey_date,
                    @preliminary_report_date, @report_delivery_date, @invoice_proinde,
                    @created_date, @last_modified_date
                )
            `);

        res.status(201).json(result.recordset[0]);
    } catch (err) {
        console.error('Error creating appointment:', err);
        res.status(500).send(err.message);
    }
});

// PUT update appointment
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            consultant_id,
            appointment_date,
            final_survey_date,
            preliminary_report_date,
            report_delivery_date,
            invoice_proinde
        } = req.body;

        const pool = await poolPromise;

        const result = await pool.request()
            .input('id', sql.BigInt, id)
            .input('consultant_id', sql.BigInt, consultant_id || null)
            .input('appointment_date', sql.Date, appointment_date || null)
            .input('final_survey_date', sql.Date, final_survey_date || null)
            .input('preliminary_report_date', sql.Date, preliminary_report_date || null)
            .input('report_delivery_date', sql.Date, report_delivery_date || null)
            .input('invoice_proinde', sql.Bit, invoice_proinde ? 1 : 0)
            .input('last_modified_date', sql.BigInt, Math.floor(Date.now() / 1000))
            .query(`
                UPDATE appointment
                SET 
                    consultant_id = @consultant_id,
                    appointment_date = @appointment_date,
                    final_survey_date = @final_survey_date,
                    preliminary_report_date = @preliminary_report_date,
                    report_delivery_date = @report_delivery_date,
                    invoice_proinde = @invoice_proinde,
                    last_modified_date = @last_modified_date
                WHERE id = @id
            `);

        res.json({ message: 'Appointment updated successfully' });
    } catch (err) {
        console.error('Error updating appointment:', err);
        res.status(500).send(err.message);
    }
});

// DELETE appointment
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        await pool.request()
            .input('id', sql.BigInt, id)
            .query('DELETE FROM appointment WHERE id = @id');

        res.json({ message: 'Appointment deleted successfully' });
    } catch (err) {
        console.error('Error deleting appointment:', err);
        res.status(500).send(err.message);
    }
});

// DELETE all appointments for an incident
router.delete('/incident/:incidentId', async (req, res) => {
    try {
        const { incidentId } = req.params;
        const pool = await poolPromise;

        await pool.request()
            .input('incident_id', sql.BigInt, incidentId)
            .query('DELETE FROM appointment WHERE incident_id = @incident_id');

        res.json({ message: 'All appointments for incident deleted successfully' });
    } catch (err) {
        console.error('Error deleting appointments:', err);
        res.status(500).send(err.message);
    }
});

module.exports = router;
