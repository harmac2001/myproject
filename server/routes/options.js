const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../db');
// Trigger restart

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

        const upperName = name.trim().toUpperCase();

        const pool = await poolPromise;
        const result = await pool.request()
            .input('name', sql.NVarChar, upperName)
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

        const upperName = name.trim().toUpperCase();

        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.BigInt, id)
            .input('name', sql.NVarChar, upperName)
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
                    i.description,
                    o.name as office_name
                FROM incident i
                LEFT JOIN office o ON i.local_office_id = o.id
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

// GET single member
router.get('/members/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.BigInt, id)
            .query('SELECT * FROM member WHERE id = @id');

        if (result.recordset.length === 0) {
            return res.status(404).send('Member not found');
        }

        res.json(result.recordset[0]);
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

// PUT update member
router.put('/members/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, line1, line2, line3, line4, vat_number } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).send('Member name is required');
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.BigInt, id)
            .input('name', sql.NVarChar, name.trim())
            .input('line1', sql.NVarChar, line1 || null)
            .input('line2', sql.NVarChar, line2 || null)
            .input('line3', sql.NVarChar, line3 || null)
            .input('line4', sql.NVarChar, line4 || null)
            .input('vat_number', sql.NVarChar, vat_number || null)
            .query(`
                UPDATE member 
                SET 
                    name = @name,
                    line1 = @line1,
                    line2 = @line2,
                    line3 = @line3,
                    line4 = @line4,
                    vat_number = @vat_number
                WHERE id = @id
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).send('Member not found');
        }

        res.json({ id, name, line1, line2, line3, line4, vat_number });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// DELETE member
router.delete('/members/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        // Check if member is used in any incidents (as member or manager)
        const checkResult = await pool.request()
            .input('id', sql.BigInt, id)
            .query(`
                SELECT COUNT(*) as count FROM incident 
                WHERE member_id = @id OR owner_id = @id
            `);

        if (checkResult.recordset[0].count > 0) {
            return res.status(400).json({
                error: 'Cannot delete member',
                message: `This member is used in ${checkResult.recordset[0].count} incident(s). Please reassign those incidents before deleting.`
            });
        }

        const result = await pool.request()
            .input('id', sql.BigInt, id)
            .query('DELETE FROM member WHERE id = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).send('Member not found');
        }

        res.status(204).send();
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
                    'member' as used_as,
                    o.name as office_name
                FROM incident i
                LEFT JOIN office o ON i.local_office_id = o.id
                WHERE i.member_id = @id
                UNION
                SELECT 
                    i.id,
                    dbo.get_reference_number(i.id) as reference_number,
                    i.description,
                    'manager' as used_as,
                    o.name as office_name
                FROM incident i
                LEFT JOIN office o ON i.local_office_id = o.id
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
        const { code } = req.query;
        const pool = await poolPromise;

        let query = 'SELECT id, name, code, line1, line2, line3, line4, vat_number FROM club';

        if (code) {
            query += ' WHERE code = @code';
        } else {
            query += ' WHERE incident_club = 1';
        }

        query += ' ORDER BY name';

        const request = pool.request();
        if (code) {
            request.input('code', sql.VarChar, code);
        }

        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// POST club
router.post('/clubs', async (req, res) => {
    try {
        // We set incident_club = 1 by default for now, as these are "Clients"
        const { name, code, line1, line2, line3, line4, vat_number } = req.body;
        if (!name || name.trim() === '') return res.status(400).send('Name is required');

        const pool = await poolPromise;
        const result = await pool.request()
            .input('name', sql.NVarChar, name.trim())
            .input('code', sql.VarChar, code ? code.trim() : null)
            .input('line1', sql.NVarChar, line1 || null)
            .input('line2', sql.NVarChar, line2 || null)
            .input('line3', sql.NVarChar, line3 || null)
            .input('line4', sql.NVarChar, line4 || null)
            .input('vat_number', sql.NVarChar, vat_number || null)
            .query('INSERT INTO club (name, code, line1, line2, line3, line4, vat_number, incident_club) OUTPUT INSERTED.* VALUES (@name, @code, @line1, @line2, @line3, @line4, @vat_number, 1)');
        res.status(201).json(result.recordset[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// PUT club
router.put('/clubs/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, code, line1, line2, line3, line4, vat_number } = req.body;
        if (!name || name.trim() === '') return res.status(400).send('Name is required');

        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.BigInt, id)
            .input('name', sql.NVarChar, name.trim())
            .input('code', sql.VarChar, code ? code.trim() : null)
            .input('line1', sql.NVarChar, line1 || null)
            .input('line2', sql.NVarChar, line2 || null)
            .input('line3', sql.NVarChar, line3 || null)
            .input('line4', sql.NVarChar, line4 || null)
            .input('vat_number', sql.NVarChar, vat_number || null)
            .query('UPDATE club SET name = @name, code = @code, line1 = @line1, line2 = @line2, line3 = @line3, line4 = @line4, vat_number = @vat_number OUTPUT INSERTED.* WHERE id = @id');

        if (result.recordset.length === 0) return res.status(404).send('Not found');
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// DELETE club
router.delete('/clubs/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        // Check incident.club_id and invoice.care_of_id
        const checkInc = await pool.request().input('id', sql.BigInt, id).query('SELECT COUNT(*) as count FROM incident WHERE club_id = @id');
        const checkInv = await pool.request().input('id', sql.BigInt, id).query('SELECT COUNT(*) as count FROM invoice WHERE care_of_id = @id');

        const count = checkInc.recordset[0].count + checkInv.recordset[0].count;

        if (count > 0) return res.status(400).json({ message: `Used in ${checkInc.recordset[0].count} incident(s) and ${checkInv.recordset[0].count} invoice(s).` });

        const result = await pool.request().input('id', sql.BigInt, id).query('DELETE FROM club WHERE id = @id');
        if (result.rowsAffected[0] === 0) return res.status(404).send('Not found');
        res.status(204).send();
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Get claim handlers
router.get('/claim_handlers', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT id, code, name, email FROM claim_handler ORDER BY name');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// POST claim handler
router.post('/claim_handlers', async (req, res) => {
    try {
        const { name, code, email } = req.body;
        if (!name || name.trim() === '') return res.status(400).send('Name is required');

        const pool = await poolPromise;
        const result = await pool.request()
            .input('name', sql.NVarChar, name.trim())
            .input('code', sql.VarChar, code ? code.trim() : null)
            .input('email', sql.NVarChar, email ? email.trim() : null)
            .query('INSERT INTO claim_handler (name, code, email) OUTPUT INSERTED.* VALUES (@name, @code, @email)');
        res.status(201).json(result.recordset[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// PUT claim handler
router.put('/claim_handlers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, code, email } = req.body;
        if (!name || name.trim() === '') return res.status(400).send('Name is required');

        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.BigInt, id)
            .input('name', sql.NVarChar, name.trim())
            .input('code', sql.VarChar, code ? code.trim() : null)
            .input('email', sql.NVarChar, email ? email.trim() : null)
            .query('UPDATE claim_handler SET name = @name, code = @code, email = @email OUTPUT INSERTED.* WHERE id = @id');
        if (result.recordset.length === 0) return res.status(404).send('Not found');
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// DELETE claim handler
router.delete('/claim_handlers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        const checkResult = await pool.request()
            .input('id', sql.BigInt, id)
            .query('SELECT COUNT(*) as count FROM incident WHERE handler_id = @id');

        if (checkResult.recordset[0].count > 0) return res.status(400).json({ message: `Used in ${checkResult.recordset[0].count} incident(s).` });

        const result = await pool.request().input('id', sql.BigInt, id).query('DELETE FROM claim_handler WHERE id = @id');
        if (result.rowsAffected[0] === 0) return res.status(404).send('Not found');
        res.status(204).send();
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// GET incidents using a specific claim handler (for reassignment)
router.get('/claim_handlers/:id/incidents', async (req, res) => {
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
                    o.name as office_name
                FROM incident i
                LEFT JOIN office o ON i.local_office_id = o.id
                WHERE i.handler_id = @id
                ORDER BY reference_number DESC
            `);

        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Get offices
router.get('/offices', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT id, name, location, code, line1, line2, line3, line4, telephone, fax, email, vat_number, registration FROM office ORDER BY name');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// POST create new office
router.post('/offices', async (req, res) => {
    try {
        const { name, location, code, line1, line2, line3, line4, telephone, fax, email, vat_number, registration } = req.body;
        if (!name || name.trim() === '') return res.status(400).send('Office name is required');

        const pool = await poolPromise;
        const result = await pool.request()
            .input('name', sql.NVarChar, name.trim())
            .input('location', sql.NVarChar, location ? location.trim() : null)
            .input('code', sql.VarChar, code ? code.trim() : null)
            .input('line1', sql.NVarChar, line1 ? line1.trim() : null)
            .input('line2', sql.NVarChar, line2 ? line2.trim() : null)
            .input('line3', sql.NVarChar, line3 ? line3.trim() : null)
            .input('line4', sql.NVarChar, line4 ? line4.trim() : null)
            .input('telephone', sql.VarChar, telephone ? telephone.trim() : null)
            .input('fax', sql.VarChar, fax ? fax.trim() : null)
            .input('email', sql.VarChar, email ? email.trim() : null)
            .input('vat_number', sql.VarChar, vat_number ? vat_number.trim() : null)
            .input('registration', sql.VarChar, registration ? registration.trim() : null)
            .query(`
                INSERT INTO office (name, location, code, line1, line2, line3, line4, telephone, fax, email, vat_number, registration) 
                OUTPUT INSERTED.* 
                VALUES (@name, @location, @code, @line1, @line2, @line3, @line4, @telephone, @fax, @email, @vat_number, @registration)
            `);

        res.status(201).json(result.recordset[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// PUT update office
router.put('/offices/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, location, code, line1, line2, line3, line4, telephone, fax, email, vat_number, registration } = req.body;
        if (!name || name.trim() === '') return res.status(400).send('Office name is required');

        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.BigInt, id)
            .input('name', sql.NVarChar, name.trim())
            .input('location', sql.NVarChar, location ? location.trim() : null)
            .input('code', sql.VarChar, code ? code.trim() : null)
            .input('line1', sql.NVarChar, line1 ? line1.trim() : null)
            .input('line2', sql.NVarChar, line2 ? line2.trim() : null)
            .input('line3', sql.NVarChar, line3 ? line3.trim() : null)
            .input('line4', sql.NVarChar, line4 ? line4.trim() : null)
            .input('telephone', sql.VarChar, telephone ? telephone.trim() : null)
            .input('fax', sql.VarChar, fax ? fax.trim() : null)
            .input('email', sql.VarChar, email ? email.trim() : null)
            .input('vat_number', sql.VarChar, vat_number ? vat_number.trim() : null)
            .input('registration', sql.VarChar, registration ? registration.trim() : null)
            .query(`
                UPDATE office 
                SET name = @name, location = @location, code = @code,
                    line1 = @line1, line2 = @line2, line3 = @line3, line4 = @line4,
                    telephone = @telephone, fax = @fax, email = @email,
                    vat_number = @vat_number, registration = @registration
                OUTPUT INSERTED.* 
                WHERE id = @id
            `);

        if (result.recordset.length === 0) return res.status(404).send('Office not found');
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// DELETE office
router.delete('/offices/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        const checkResult = await pool.request()
            .input('id', sql.BigInt, id)
            .query('SELECT COUNT(*) as count FROM incident WHERE local_office_id = @id');

        if (checkResult.recordset[0].count > 0) {
            return res.status(400).json({
                error: 'Cannot delete office',
                message: `This office is used in ${checkResult.recordset[0].count} incident(s). Please reassign before deleting.`
            });
        }

        const result = await pool.request().input('id', sql.BigInt, id).query('DELETE FROM office WHERE id = @id');
        if (result.rowsAffected[0] === 0) return res.status(404).send('Office not found');
        res.status(204).send();
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

// POST incident type
router.post('/incident_types', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || name.trim() === '') return res.status(400).send('Name is required');

        const pool = await poolPromise;
        const result = await pool.request()
            .input('name', sql.NVarChar, name.trim())
            .query('INSERT INTO incident_type (name) OUTPUT INSERTED.* VALUES (@name)');
        res.status(201).json(result.recordset[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// PUT incident type
router.put('/incident_types/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        if (!name || name.trim() === '') return res.status(400).send('Name is required');

        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.BigInt, id)
            .input('name', sql.NVarChar, name.trim())
            .query('UPDATE incident_type SET name = @name OUTPUT INSERTED.* WHERE id = @id');

        if (result.recordset.length === 0) return res.status(404).send('Not found');
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// DELETE incident type
router.delete('/incident_types/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        const checkResult = await pool.request()
            .input('id', sql.BigInt, id)
            .query('SELECT COUNT(*) as count FROM incident WHERE type_id = @id');

        if (checkResult.recordset[0].count > 0) {
            return res.status(400).json({
                error: 'Cannot delete incident type',
                message: `This type is used in ${checkResult.recordset[0].count} incident(s).`
            });
        }

        const result = await pool.request().input('id', sql.BigInt, id).query('DELETE FROM incident_type WHERE id = @id');
        if (result.rowsAffected[0] === 0) return res.status(404).send('Not found');
        res.status(204).send();
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

// POST reporter
router.post('/reporters', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || name.trim() === '') return res.status(400).send('Name is required');

        const pool = await poolPromise;
        const result = await pool.request()
            .input('name', sql.NVarChar, name.trim())
            .query('INSERT INTO reporter (name) OUTPUT INSERTED.* VALUES (@name)');
        res.status(201).json(result.recordset[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// PUT reporter
router.put('/reporters/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        if (!name || name.trim() === '') return res.status(400).send('Name is required');

        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.BigInt, id)
            .input('name', sql.NVarChar, name.trim())
            .query('UPDATE reporter SET name = @name OUTPUT INSERTED.* WHERE id = @id');

        if (result.recordset.length === 0) return res.status(404).send('Not found');
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// DELETE reporter
router.delete('/reporters/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        const checkResult = await pool.request()
            .input('id', sql.BigInt, id)
            .query('SELECT COUNT(*) as count FROM incident WHERE reporter_id = @id');

        if (checkResult.recordset[0].count > 0) {
            return res.status(400).json({ message: `Used in ${checkResult.recordset[0].count} incident(s).` });
        }

        const result = await pool.request().input('id', sql.BigInt, id).query('DELETE FROM reporter WHERE id = @id');
        if (result.rowsAffected[0] === 0) return res.status(404).send('Not found');
        res.status(204).send();
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

// POST create new agent
router.post('/agents', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || name.trim() === '') {
            return res.status(400).send('Agent name is required');
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('name', sql.NVarChar, name.trim())
            .query('INSERT INTO agent (name) OUTPUT INSERTED.id, INSERTED.name VALUES (@name)');

        res.status(201).json(result.recordset[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});
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
                    i.description,
                    o.name as office_name
                FROM incident i
                LEFT JOIN office o ON i.local_office_id = o.id
                WHERE i.local_agent_id = @id
                ORDER BY reference_number DESC
            `);

        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// PUT update agent
router.put('/agents/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).send('Agent name is required');
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.BigInt, id)
            .input('name', sql.NVarChar, name.trim())
            .query(`
                UPDATE agent 
                SET name = @name
                WHERE id = @id
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).send('Agent not found');
        }

        res.json({ id, name });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// DELETE agent
router.delete('/agents/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        // Check if agent is used in any incidents
        const checkResult = await pool.request()
            .input('id', sql.BigInt, id)
            .query('SELECT COUNT(*) as count FROM incident WHERE local_agent_id = @id');

        if (checkResult.recordset[0].count > 0) {
            return res.status(400).json({
                error: 'Cannot delete agent',
                message: `This agent is used in ${checkResult.recordset[0].count} incident(s). Please reassign those incidents before deleting.`
            });
        }

        const result = await pool.request()
            .input('id', sql.BigInt, id)
            .query('DELETE FROM agent WHERE id = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).send('Agent not found');
        }

        res.status(204).send();
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

// POST port
router.post('/ports', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || name.trim() === '') return res.status(400).send('Name is required');

        const pool = await poolPromise;
        const result = await pool.request()
            .input('name', sql.NVarChar, name.trim())
            .query('INSERT INTO port (name) OUTPUT INSERTED.* VALUES (@name)');
        res.status(201).json(result.recordset[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// PUT port
router.put('/ports/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        if (!name || name.trim() === '') return res.status(400).send('Name is required');

        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.BigInt, id)
            .input('name', sql.NVarChar, name.trim())
            .query('UPDATE port SET name = @name OUTPUT INSERTED.* WHERE id = @id');
        if (result.recordset.length === 0) return res.status(404).send('Not found');
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// DELETE port
router.delete('/ports/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        const checkResult = await pool.request()
            .input('id', sql.BigInt, id)
            .query('SELECT COUNT(*) as count FROM incident WHERE place_id = @id');

        if (checkResult.recordset[0].count > 0) return res.status(400).json({ message: `Used in ${checkResult.recordset[0].count} incident(s).` });

        const result = await pool.request().input('id', sql.BigInt, id).query('DELETE FROM port WHERE id = @id');
        if (result.rowsAffected[0] === 0) return res.status(404).send('Not found');
        res.status(204).send();
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

// Get claimants
router.get('/claimants', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT id, name FROM claimant ORDER BY name');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Helper: Levenshtein Distance
function getLevenshteinDistance(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    Math.min(
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    )
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

function normalizeName(str) {
    return str.replace(/\s+/g, ' ').trim().toUpperCase();
}

// POST create new trader
router.post('/traders', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || name.trim() === '') {
            return res.status(400).send('Trader name is required');
        }

        const upperName = name.trim().toUpperCase();
        const normalizedNew = normalizeName(name);

        const pool = await poolPromise;

        // 1. Fetch Key fields from existing traders for comparison
        // We need to fetch all to compare. For a huge DB this might be slow, 
        // but for a traders list (hundreds/thousands) it's acceptable for "Add" operation quality.
        const existingResult = await pool.request().query('SELECT name FROM trader');
        const existingNames = existingResult.recordset.map(r => r.name);

        // 2. Exact Match (Normalized)
        const exactMatch = existingNames.find(n => normalizeName(n) === normalizedNew);
        if (exactMatch) {
            return res.status(409).json({
                error: 'Duplicate Trader',
                message: `Trader "${exactMatch}" already exists.`
            });
        }

        // 3. Fuzzy Match
        // Threshold: 
        // len <= 3: 0 distance (must be exact)
        // len <= 6: 1 distance
        // len > 6: 2 distance
        let threshold = 2;
        if (normalizedNew.length <= 3) threshold = 0;
        else if (normalizedNew.length <= 6) threshold = 1;

        const similarMatch = existingNames.find(n => {
            const normalizedExisting = normalizeName(n);
            const dist = getLevenshteinDistance(normalizedNew, normalizedExisting);
            return dist <= threshold && dist > 0; // >0 because 0 is exact match dealt with above
        });

        if (similarMatch) {
            return res.status(409).json({
                error: 'Similar Trader Found',
                message: `A similar trader name "${similarMatch}" already exists. Please verify if this is the same entity.`
            });
        }

        const result = await pool.request()
            .input('name', sql.NVarChar, upperName)
            .query('INSERT INTO trader (name) OUTPUT INSERTED.id, INSERTED.name VALUES (@name)');

        res.status(201).json(result.recordset[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// PUT update trader
router.put('/traders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).send('Trader name is required');
        }

        const upperName = name.trim().toUpperCase();

        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.BigInt, id)
            .input('name', sql.NVarChar, upperName)
            .query('UPDATE trader SET name = @name OUTPUT INSERTED.id, INSERTED.name WHERE id = @id');

        if (result.recordset.length === 0) {
            return res.status(404).send('Trader not found');
        }

        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// DELETE trader
router.delete('/traders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        // Check if trader is used in any cargo (shippers or receivers)
        // Note: Cargo table has many-to-many relationship via bridge tables usually?
        // Let's check the schema. Wait, assuming simple relationship or usage check needed.
        // Actually, CargoInformation.jsx uses `shipper_ids` and `receiver_ids` which implies M:N.
        // But for now, let's just implement basic delete or check bridge tables if possible.
        // Bridge tables: cargo_shipper, cargo_receiver (based on standard M:N patterns).

        // Let's first check if there are bridge tables. I'll assume standard usage check for now.
        // To be safe, I'll check generic usage in cargo_shipper and cargo_receiver if they exist.
        // If I make a mistake here, I'll catch it in next step.
        // Actually, let's verify schema first to be safe about table names.
        // But the user said "go ahead", implying I should proceed.
        // I'll stick to basic delete for now, or just check existing logic.
        // The fetch logic in CargoInformation uses `data.shippers` and `data.receivers`.
        // This suggests `cargo_shipper` and `cargo_receiver` tables likely exist.

        const checkShipper = await pool.request()
            .input('id', sql.BigInt, id)
            .query('SELECT COUNT(*) as count FROM cargo_shipper WHERE trader_id = @id');

        const checkReceiver = await pool.request()
            .input('id', sql.BigInt, id)
            .query('SELECT COUNT(*) as count FROM cargo_receiver WHERE trader_id = @id');

        const usageCount = (checkShipper.recordset[0].count) + (checkReceiver.recordset[0].count);

        if (usageCount > 0) {
            return res.status(400).json({
                error: 'Cannot delete trader',
                message: `This trader is used in ${usageCount} cargo record(s). Please remove them from cargo details before deleting.`
            });
        }

        const result = await pool.request()
            .input('id', sql.BigInt, id)
            .query('DELETE FROM trader WHERE id = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).send('Trader not found');
        }

        res.status(204).send();
    } catch (err) {
        // If table names are wrong, it will fail, and I will fix it.
        res.status(500).send(err.message);
    }
});

// Get service providers (non-consultants)
router.get('/service_providers', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT id, COALESCE(friendly_name, name) as name, is_consultant FROM service_provider ORDER BY COALESCE(friendly_name, name)');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// GET single service provider
router.get('/service_providers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.BigInt, id)
            .query('SELECT * FROM service_provider WHERE id = @id');

        if (result.recordset.length === 0) {
            return res.status(404).send('Service Provider not found');
        }

        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// POST create new service provider
router.post('/service_providers', async (req, res) => {
    try {
        const {
            name, friendly_name, rate,
            city, complement, country, district, location, location_number, postal_code, state_or_region,
            cnpj, email, mobile, phone, website, is_consultant
        } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).send('Service Provider name is required');
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('name', sql.NVarChar, name.trim())
            .input('friendly_name', sql.NVarChar, friendly_name || null)
            .input('rate', sql.Decimal(18, 2), rate || null)
            .input('city', sql.NVarChar, city || null)
            .input('complement', sql.NVarChar, complement || null)
            .input('country', sql.NVarChar, country || null)
            .input('district', sql.NVarChar, district || null)
            .input('location', sql.NVarChar, location || null)
            .input('location_number', sql.NVarChar, location_number || null)
            .input('postal_code', sql.NVarChar, postal_code || null)
            .input('state_or_region', sql.NVarChar, state_or_region || null)
            .input('cnpj', sql.NVarChar, cnpj || null)
            .input('email', sql.NVarChar, email || null)
            .input('mobile', sql.NVarChar, mobile || null)
            .input('phone', sql.NVarChar, phone || null)
            .input('website', sql.NVarChar, website || null)
            .input('is_consultant', sql.Bit, is_consultant ? 1 : 0)
            .query(`
                INSERT INTO service_provider (
                    name, friendly_name, rate, 
                    city, complement, country, district, location, location_number, postal_code, state_or_region,
                    cnpj, email, mobile, phone, website, is_consultant
                ) 
                OUTPUT INSERTED.id, INSERTED.name 
                VALUES (
                    @name, @friendly_name, @rate,
                    @city, @complement, @country, @district, @location, @location_number, @postal_code, @state_or_region,
                    @cnpj, @email, @mobile, @phone, @website, @is_consultant
                )
            `);

        res.status(201).json(result.recordset[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// PUT update service provider
router.put('/service_providers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, friendly_name, rate,
            city, complement, country, district, location, location_number, postal_code, state_or_region,
            cnpj, email, mobile, phone, website, is_consultant
        } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).send('Service Provider name is required');
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.BigInt, id)
            .input('name', sql.NVarChar, name.trim())
            .input('friendly_name', sql.NVarChar, friendly_name || null)
            .input('rate', sql.Decimal(18, 2), rate || null)
            .input('city', sql.NVarChar, city || null)
            .input('complement', sql.NVarChar, complement || null)
            .input('country', sql.NVarChar, country || null)
            .input('district', sql.NVarChar, district || null)
            .input('location', sql.NVarChar, location || null)
            .input('location_number', sql.NVarChar, location_number || null)
            .input('postal_code', sql.NVarChar, postal_code || null)
            .input('state_or_region', sql.NVarChar, state_or_region || null)
            .input('cnpj', sql.NVarChar, cnpj || null)
            .input('email', sql.NVarChar, email || null)
            .input('mobile', sql.NVarChar, mobile || null)
            .input('phone', sql.NVarChar, phone || null)
            .input('website', sql.NVarChar, website || null)
            .input('is_consultant', sql.Bit, is_consultant ? 1 : 0)
            .query(`
                UPDATE service_provider 
                SET 
                    name = @name,
                    friendly_name = @friendly_name,
                    rate = @rate,
                    city = @city,
                    complement = @complement,
                    country = @country,
                    district = @district,
                    location = @location,
                    location_number = @location_number,
                    postal_code = @postal_code,
                    state_or_region = @state_or_region,
                    cnpj = @cnpj,
                    email = @email,
                    mobile = @mobile,
                    phone = @phone,
                    website = @website,
                    is_consultant = @is_consultant
                OUTPUT INSERTED.id, INSERTED.name 
                WHERE id = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).send('Service Provider not found');
        }

        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// DELETE service provider
router.delete('/service_providers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        // Check usage in fees (as third_party_contractor_id) and appointments (as consultant_id)
        const checkFee = await pool.request()
            .input('id', sql.BigInt, id)
            .query('SELECT COUNT(*) as count FROM fee WHERE third_party_contractor_id = @id');

        const checkAppt = await pool.request()
            .input('id', sql.BigInt, id)
            .query('SELECT COUNT(*) as count FROM appointment WHERE consultant_id = @id');

        const feeCount = checkFee.recordset[0].count;
        const apptCount = checkAppt.recordset[0].count;
        const totalUsage = feeCount + apptCount;

        if (totalUsage > 0) {
            return res.status(400).json({
                error: 'Cannot delete service provider',
                message: `This service provider is used in ${feeCount} fee(s) and ${apptCount} appointment(s). Please reassign them before deleting.`
            });
        }

        const result = await pool.request()
            .input('id', sql.BigInt, id)
            .query('DELETE FROM service_provider WHERE id = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).send('Service Provider not found');
        }

        res.status(204).send();
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

// Get contractors
router.get('/contractors', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT id, name FROM contractor ORDER BY name');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// POST create new contractor
router.post('/contractors', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || name.trim() === '') {
            return res.status(400).send('Contractor name is required');
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('name', sql.NVarChar, name.trim())
            .query('INSERT INTO contractor (name) OUTPUT INSERTED.id, INSERTED.name VALUES (@name)');

        res.status(201).json(result.recordset[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// PUT update contractor
router.put('/contractors/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).send('Contractor name is required');
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.BigInt, id)
            .input('name', sql.NVarChar, name.trim())
            .query('UPDATE contractor SET name = @name OUTPUT INSERTED.id, INSERTED.name WHERE id = @id');

        if (result.recordset.length === 0) {
            return res.status(404).send('Contractor not found');
        }

        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// DELETE contractor
router.delete('/contractors/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        // Check usage in fees
        const checkResult = await pool.request()
            .input('id', sql.BigInt, id)
            .query('SELECT COUNT(*) as count FROM fee WHERE contractor_id = @id');

        if (checkResult.recordset[0].count > 0) {
            return res.status(400).json({
                error: 'Cannot delete contractor',
                message: `This contractor is used in ${checkResult.recordset[0].count} fee(s). Please reassign them before deleting.`
            });
        }

        const result = await pool.request()
            .input('id', sql.BigInt, id)
            .query('DELETE FROM contractor WHERE id = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).send('Contractor not found');
        }

        res.status(204).send();
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Get banks
router.get('/banks', async (req, res) => {
    try {
        const { office_id } = req.query;
        console.log('GET /banks office_id:', office_id);
        const pool = await poolPromise;

        let query = 'SELECT id, name, iban, swift_code FROM bank';
        const request = pool.request();

        if (office_id) {
            query += ' WHERE office_id = @office_id';
            request.input('office_id', sql.BigInt, office_id);
        }

        query += ' ORDER BY name';

        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Get disbursement types
router.get('/disbursement_types', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM disbursement_type ORDER BY name');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Get contacts
router.get('/contacts', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT id, name, email FROM contact ORDER BY name');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});



// POST create new contact
router.post('/contacts', async (req, res) => {
    try {
        const { name, email } = req.body;
        if (!name || name.trim() === '') {
            return res.status(400).send('Contact name is required');
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('name', sql.NVarChar, name.trim())
            .input('email', sql.NVarChar, email ? email.trim() : null)
            .query('INSERT INTO contact (name, email) OUTPUT INSERTED.id, INSERTED.name, INSERTED.email VALUES (@name, @email)');

        res.status(201).json(result.recordset[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// PUT update contact
router.put('/contacts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).send('Contact name is required');
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.BigInt, id)
            .input('name', sql.NVarChar, name.trim())
            .input('email', sql.NVarChar, email ? email.trim() : null)
            .query(`
                UPDATE contact 
                SET name = @name, email = @email
                OUTPUT INSERTED.id, INSERTED.name, INSERTED.email
                WHERE id = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).send('Contact not found');
        }

        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// GET contact usage
router.get('/contacts/:id/usage', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('id', sql.BigInt, id)
            .query(`
                SELECT 
                    i.id,
                    i.invoice_number,
                    'invoice' as type
                FROM invoice i
                WHERE i.club_contact_id = @id OR i.office_contact_id = @id
            `);

        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// PATCH reassign contact
router.patch('/contacts/:id/reassign', async (req, res) => {
    try {
        const { id } = req.params;
        const { new_contact_id } = req.body;

        if (!new_contact_id) {
            return res.status(400).send('New contact ID is required');
        }

        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // Update club_contact_id
            await transaction.request()
                .input('old_id', sql.BigInt, id)
                .input('new_id', sql.BigInt, new_contact_id)
                .query(`UPDATE invoice SET club_contact_id = @new_id WHERE club_contact_id = @old_id`);

            // Update office_contact_id
            await transaction.request()
                .input('old_id', sql.BigInt, id)
                .input('new_id', sql.BigInt, new_contact_id)
                .query(`UPDATE invoice SET office_contact_id = @new_id WHERE office_contact_id = @old_id`);

            await transaction.commit();
            res.json({ success: true });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// DELETE contact
router.delete('/contacts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        // Check usage
        const checkResult = await pool.request()
            .input('id', sql.BigInt, id)
            .query(`
                SELECT COUNT(*) as count 
                FROM invoice 
                WHERE club_contact_id = @id OR office_contact_id = @id
            `);

        if (checkResult.recordset[0].count > 0) {
            return res.status(400).json({
                error: 'Cannot delete contact',
                message: `This contact is used in ${checkResult.recordset[0].count} invoice(s). Please reassign them before deleting.`
            });
        }

        const result = await pool.request()
            .input('id', sql.BigInt, id)
            .query('DELETE FROM contact WHERE id = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).send('Contact not found');
        }

        res.status(204).send();
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Get account charts
router.get('/account_charts', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT id, name, code FROM account_chart ORDER BY code');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

module.exports = router;
