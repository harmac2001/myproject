const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../db');

// GET all ships
router.get('/ships', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT id, name FROM ship ORDER BY name');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// POST create new ship
router.post('/ships', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || name.trim() === '') {
            return res.status(400).send('Ship name is required');
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('name', sql.NVarChar, name.trim())
            .query('INSERT INTO ship (name) OUTPUT INSERTED.id, INSERTED.name VALUES (@name)');

        res.status(201).json(result.recordset[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// PUT update ship
router.put('/ships/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).send('Ship name is required');
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.BigInt, id)
            .input('name', sql.NVarChar, name.trim())
            .query('UPDATE ship SET name = @name OUTPUT INSERTED.id, INSERTED.name WHERE id = @id');

        if (result.recordset.length === 0) {
            return res.status(404).send('Ship not found');
        }

        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// DELETE ship
router.delete('/ships/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        // Check if ship is used in any incidents
        const checkResult = await pool.request()
            .input('id', sql.BigInt, id)
            .query('SELECT COUNT(*) as count FROM incident WHERE ship_id = @id');

        if (checkResult.recordset[0].count > 0) {
            return res.status(400).json({
                error: 'Cannot delete ship',
                message: `This vessel is used in ${checkResult.recordset[0].count} incident(s). Please reassign those incidents before deleting.`
            });
        }

        const result = await pool.request()
            .input('id', sql.BigInt, id)
            .query('DELETE FROM ship WHERE id = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).send('Ship not found');
        }

        res.status(204).send();
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// GET incidents using a specific ship (for reassignment)
router.get('/ships/:id/incidents', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('id', sql.BigInt, id)
            .query(`
                SELECT 
                    i.id,
                    dbo.get_reference_number(i.id) as reference_number,
                    i.description
                FROM incident i
                WHERE i.ship_id = @id
                ORDER BY i.reference_number DESC
            `);

        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// GET all members
router.get('/members', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT id, name FROM member ORDER BY name');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// POST create new member
router.post('/members', async (req, res) => {
    try {
        const { name, line1, line2, line3, line4, vat_number } = req.body;
        if (!name || name.trim() === '') {
            return res.status(400).send('Member name is required');
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('name', sql.NVarChar, name.trim())
            .input('line1', sql.NVarChar, line1 || null)
            .input('line2', sql.NVarChar, line2 || null)
            .input('line3', sql.NVarChar, line3 || null)
            .input('line4', sql.NVarChar, line4 || null)
            .input('vat_number', sql.NVarChar, vat_number || null)
            .query(`
                INSERT INTO member (name, line1, line2, line3, line4, vat_number) 
                OUTPUT INSERTED.id, INSERTED.name 
                VALUES (@name, @line1, @line2, @line3, @line4, @vat_number)
            `);

        res.status(201).json(result.recordset[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// GET incidents using a specific member (for reassignment)
router.get('/members/:id/incidents', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('id', sql.BigInt, id)
            .query(`
                SELECT 
                    i.id,
                    dbo.get_reference_number(i.id) as reference_number,
                    i.description,
                    'member' as used_as
                FROM incident i
                WHERE i.member_id = @id
                UNION
                SELECT 
                    i.id,
                    dbo.get_reference_number(i.id) as reference_number,
                    i.description,
                    'manager' as used_as
                FROM incident i
                WHERE i.owner_id = @id
                ORDER BY reference_number DESC
            `);

        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Get clubs
router.get('/clubs', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT id, name, code FROM club ORDER BY name');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Get claim handlers
router.get('/claim_handlers', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT id, code, name FROM claim_handler ORDER BY name');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Get offices
router.get('/offices', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT id, name, location FROM office ORDER BY name');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Get incident types
router.get('/incident_types', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT id, name FROM incident_type ORDER BY name');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Get reporters
router.get('/reporters', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT id, name FROM reporter ORDER BY name');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Get agents
router.get('/agents', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT id, name FROM agent ORDER BY name');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// GET incidents using a specific agent (for reassignment)
router.get('/agents/:id/incidents', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('id', sql.BigInt, id)
            .query(`
                SELECT 
                    i.id,
                    dbo.get_reference_number(i.id) as reference_number,
                    i.description
                FROM incident i
                WHERE i.local_agent_id = @id
                ORDER BY reference_number DESC
            `);

        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Get ports (for place of incident)
router.get('/ports', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT id, name FROM port ORDER BY name');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Get cargo types
router.get('/cargo_types', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT id, name FROM cargo_type ORDER BY name');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Get consultants
router.get('/consultants', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                id, 
                CASE 
                    WHEN friendly_name IS NOT NULL AND name != friendly_name 
                    THEN CONCAT(friendly_name, ' (', name, ')')
                    ELSE COALESCE(friendly_name, name)
                END as name
            FROM service_provider 
            WHERE is_consultant = 1 
            ORDER BY COALESCE(friendly_name, name)
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Get loss causes
router.get('/loss_causes', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT id, name FROM loss_cause ORDER BY name');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Get loss types
router.get('/loss_types', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT id, name FROM loss_type ORDER BY name');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Get receivers/shippers
router.get('/receivers_shippers', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT id, name FROM receiver_shipper ORDER BY name');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Get traders (for shippers and receivers)
router.get('/traders', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT id, name FROM trader ORDER BY name');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Get service providers (non-consultants)
router.get('/service_providers', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT id, COALESCE(friendly_name, name) as name FROM service_provider WHERE is_consultant = 0 ORDER BY COALESCE(friendly_name, name)');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Get currencies
router.get('/currencies', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT id, code, name FROM currency ORDER BY code');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

module.exports = router;
