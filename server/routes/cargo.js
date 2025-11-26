const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { poolPromise } = require('../db');

// GET cargo information for an incident
router.get('/incident/:incidentId', async (req, res) => {
    try {
        const { incidentId } = req.params;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('incident_id', sql.BigInt, incidentId)
            .query(`
                SELECT 
                    ci.*,
                    ct.name as cargo_type_name
                FROM cargo_information ci
                LEFT JOIN cargo_type ct ON ci.cargo_type_id = ct.id
                WHERE ci.incident_id = @incident_id
            `);

        if (result.recordset.length === 0) {
            return res.json(null);
        }

        const cargo = result.recordset[0];

        // Get loading ports
        const loadingPorts = await pool.request()
            .input('incident_id', sql.BigInt, incidentId)
            .query(`
                SELECT p.id, p.name
                FROM cargo_information_loading_port cilp
                JOIN port p ON cilp.port_id = p.id
                WHERE cilp.cargo_information_id = @incident_id
            `);
        cargo.loading_ports = loadingPorts.recordset;

        // Get discharge ports
        const dischargePorts = await pool.request()
            .input('incident_id', sql.BigInt, incidentId)
            .query(`
                SELECT p.id, p.name
                FROM cargo_information_discharge_port cidp
                JOIN port p ON cidp.port_id = p.id
                WHERE cidp.cargo_information_id = @incident_id
            `);
        cargo.discharge_ports = dischargePorts.recordset;

        // Get shippers
        const shippers = await pool.request()
            .input('incident_id', sql.BigInt, incidentId)
            .query(`
                SELECT t.id, t.name
                FROM cargo_information_shipper cis
                JOIN trader t ON cis.trader_id = t.id
                WHERE cis.cargo_information_id = @incident_id
            `);
        cargo.shippers = shippers.recordset;

        // Get receivers
        const receivers = await pool.request()
            .input('incident_id', sql.BigInt, incidentId)
            .query(`
                SELECT t.id, t.name
                FROM cargo_information_receiver cir
                JOIN trader t ON cir.trader_id = t.id
                WHERE cir.cargo_information_id = @incident_id
            `);
        cargo.receivers = receivers.recordset;

        res.json(cargo);
    } catch (err) {
        console.error('Error fetching cargo information:', err);
        res.status(500).send(err.message);
    }
});

// POST/PUT create or update cargo information
router.post('/', async (req, res) => {
    try {
        const {
            incident_id,
            bill_of_lading,
            containers,
            cargo_type_id,
            description,
            loading_port_ids,
            discharge_port_ids,
            shipper_ids,
            receiver_ids
        } = req.body;

        const pool = await poolPromise;

        // Check if cargo already exists
        const existing = await pool.request()
            .input('incident_id', sql.BigInt, incident_id)
            .query('SELECT * FROM cargo_information WHERE incident_id = @incident_id');

        if (existing.recordset.length > 0) {
            // Update existing
            await pool.request()
                .input('incident_id', sql.BigInt, incident_id)
                .input('bill_of_lading_number', sql.NVarChar, bill_of_lading)
                .input('container_number', sql.NVarChar, containers)
                .input('cargo_type_id', sql.BigInt, cargo_type_id)
                .input('description', sql.NVarChar, description)
                .query(`
                    UPDATE cargo_information
                    SET bill_of_lading_number = @bill_of_lading_number,
                        container_number = @container_number,
                        cargo_type_id = @cargo_type_id,
                        description = @description
                    WHERE incident_id = @incident_id
                `);
        } else {
            // Insert new
            await pool.request()
                .input('incident_id', sql.BigInt, incident_id)
                .input('bill_of_lading_number', sql.NVarChar, bill_of_lading)
                .input('container_number', sql.NVarChar, containers)
                .input('cargo_type_id', sql.BigInt, cargo_type_id)
                .input('description', sql.NVarChar, description)
                .query(`
                    INSERT INTO cargo_information (incident_id, bill_of_lading_number, container_number, cargo_type_id, description)
                    VALUES (@incident_id, @bill_of_lading_number, @container_number, @cargo_type_id, @description)
                `);
        }

        // Delete and re-insert related records
        await pool.request().input('incident_id', sql.BigInt, incident_id)
            .query('DELETE FROM cargo_information_loading_port WHERE cargo_information_id = @incident_id');
        await pool.request().input('incident_id', sql.BigInt, incident_id)
            .query('DELETE FROM cargo_information_discharge_port WHERE cargo_information_id = @incident_id');
        await pool.request().input('incident_id', sql.BigInt, incident_id)
            .query('DELETE FROM cargo_information_shipper WHERE cargo_information_id = @incident_id');
        await pool.request().input('incident_id', sql.BigInt, incident_id)
            .query('DELETE FROM cargo_information_receiver WHERE cargo_information_id = @incident_id');

        // Insert loading ports
        if (loading_port_ids && loading_port_ids.length > 0) {
            for (const portId of loading_port_ids) {
                await pool.request()
                    .input('incident_id', sql.BigInt, incident_id)
                    .input('port_id', sql.BigInt, portId)
                    .query(`
                        INSERT INTO cargo_information_loading_port (cargo_information_id, port_id)
                        VALUES (@incident_id, @port_id)
                    `);
            }
        }

        // Insert discharge ports
        if (discharge_port_ids && discharge_port_ids.length > 0) {
            for (const portId of discharge_port_ids) {
                await pool.request()
                    .input('incident_id', sql.BigInt, incident_id)
                    .input('port_id', sql.BigInt, portId)
                    .query(`
                        INSERT INTO cargo_information_discharge_port (cargo_information_id, port_id)
                        VALUES (@incident_id, @port_id)
                    `);
            }
        }

        // Insert shippers
        if (shipper_ids && shipper_ids.length > 0) {
            for (const traderId of shipper_ids) {
                await pool.request()
                    .input('incident_id', sql.BigInt, incident_id)
                    .input('trader_id', sql.BigInt, traderId)
                    .query(`
                        INSERT INTO cargo_information_shipper (cargo_information_id, trader_id)
                        VALUES (@incident_id, @trader_id)
                    `);
            }
        }

        // Insert receivers
        if (receiver_ids && receiver_ids.length > 0) {
            for (const traderId of receiver_ids) {
                await pool.request()
                    .input('incident_id', sql.BigInt, incident_id)
                    .input('trader_id', sql.BigInt, traderId)
                    .query(`
                        INSERT INTO cargo_information_receiver (cargo_information_id, trader_id)
                        VALUES (@incident_id, @trader_id)
                    `);
            }
        }

        res.status(201).json({ incident_id, message: 'Cargo information saved successfully' });
    } catch (err) {
        console.error('Error saving cargo information:', err);
        res.status(500).send(err.message);
    }
});

// DELETE cargo information
router.delete('/incident/:incidentId', async (req, res) => {
    try {
        const { incidentId } = req.params;
        const pool = await poolPromise;

        // Delete related records first
        await pool.request().input('incident_id', sql.BigInt, incidentId)
            .query('DELETE FROM cargo_information_loading_port WHERE cargo_information_id = @incident_id');
        await pool.request().input('incident_id', sql.BigInt, incidentId)
            .query('DELETE FROM cargo_information_discharge_port WHERE cargo_information_id = @incident_id');
        await pool.request().input('incident_id', sql.BigInt, incidentId)
            .query('DELETE FROM cargo_information_shipper WHERE cargo_information_id = @incident_id');
        await pool.request().input('incident_id', sql.BigInt, incidentId)
            .query('DELETE FROM cargo_information_receiver WHERE cargo_information_id = @incident_id');

        // Delete main cargo information
        await pool.request()
            .input('incident_id', sql.BigInt, incidentId)
            .query('DELETE FROM cargo_information WHERE incident_id = @incident_id');

        res.json({ message: 'Cargo information deleted successfully' });
    } catch (err) {
        console.error('Error deleting cargo information:', err);
        res.status(500).send(err.message);
    }
});

module.exports = router;
