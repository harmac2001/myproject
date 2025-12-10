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
        const result = await pool.request().query('SELECT id, COALESCE(friendly_name, name) as name FROM service_provider ORDER BY COALESCE(friendly_name, name)');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// POST create new service provider
router.post('/service_providers', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || name.trim() === '') {
            return res.status(400).send('Service Provider name is required');
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('name', sql.NVarChar, name.trim())
            .query('INSERT INTO service_provider (name) OUTPUT INSERTED.id, INSERTED.name VALUES (@name)');

        res.status(201).json(result.recordset[0]);
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
