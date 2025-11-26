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
        const result = await pool.request().query('SELECT id, friendly_name as name FROM service_provider WHERE is_consultant = 1 ORDER BY friendly_name');
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
