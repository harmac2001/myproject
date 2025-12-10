const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../db');
const { createIncidentFolder, listIncidentFiles } = require('../services/graphService');

// GET incident documents from SharePoint
router.get('/:id/documents', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        // 1. Fetch Incident & Ship & Office Details
        const incRes = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT i.id, i.reference_year, i.local_office_id, i.ship_id,
                       dbo.get_reference_number(i.id) as formatted_reference,
                       s.name as vessel_name,
                       o.sharepoint_site_id, o.sharepoint_drive_id
                FROM incident i
                LEFT JOIN ship s ON i.ship_id = s.id
                LEFT JOIN office o ON i.local_office_id = o.id
                WHERE i.id = @id
            `);

        if (incRes.recordset.length === 0) {
            return res.status(404).send('Incident not found');
        }

        const inc = incRes.recordset[0];

        if (!inc.sharepoint_site_id || !inc.sharepoint_drive_id) {
            return res.json({ files: [], message: 'SharePoint not configured for this office.' });
        }

        // 2. Reconstruct Folder Name
        const formattedRef = inc.formatted_reference || '';
        let refPart = formattedRef.replace(/\//g, '');
        const parts = formattedRef.split('/');
        if (parts.length >= 3) {
            refPart = parts[0] + parts[1] + parts[2];
        }

        let vesselName = inc.vessel_name || 'Unknown Vessel';
        const sanitizedVessel = vesselName.replace(/[\\/:*?"<>|]/g, '').trim();
        const folderName = `${refPart} - ${sanitizedVessel}`;

        // 3. List Files
        let rootFolderPath = '';
        if (inc.local_office_id == 4) {
            rootFolderPath = 'BELEM/Pastas (BELEM)';
        } else if (inc.local_office_id == 3) {
            rootFolderPath = 'Pastas (MANAUS)';
        }

        const result = await listIncidentFiles(
            inc.sharepoint_site_id,
            inc.sharepoint_drive_id,
            folderName,
            inc.reference_year,
            rootFolderPath
        );

        res.json({ files: result.files, folderUrl: result.folderUrl });

    } catch (err) {
        console.error('Error fetching documents:', err.message);
        res.status(500).send(err.message);
    }
});

// GET all incidents with optional search, filter, and pagination
router.get('/', async (req, res) => {
    try {
        const { search, status, office, page = 1, limit = 10 } = req.query;

        const offset = (page - 1) * limit;
        const pool = await poolPromise;
        const request = pool.request();

        let query = `
            SELECT 
                i.id, 
                i.reference_number, 
                dbo.get_reference_number(i.id) as formatted_reference,
                s.name as ship_name, 
                i.description, 
                i.status, 
                i.incident_date,
                i.created_date,
                o.name as office_name,
                o.location as office_location,
                p.name as place_name,
                it.name as type_name,
                m.name as member_name,
                c.name as manager_name,
                (SELECT COUNT(*) FROM incident i
                 LEFT JOIN ship s ON i.ship_id = s.id
                 LEFT JOIN office o ON i.local_office_id = o.id
                 LEFT JOIN port p ON i.place_id = p.id
                 LEFT JOIN incident_type it ON i.type_id = it.id
                 LEFT JOIN member m ON i.member_id = m.id
                 LEFT JOIN club c ON i.club_id = c.id
                 WHERE 1=1
        `;

        // 1. Status Filter
        if (status && status !== 'All') {
            query += ` AND i.status = @status`;
            request.input('status', sql.NVarChar, status);
        }

        // 2. Office Filter (CSV of IDs)
        if (office && office.length > 0) {
            // Check if office contains comma
            const officeIds = String(office).split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
            if (officeIds.length > 0) {
                query += ` AND i.local_office_id IN (${officeIds.join(',')})`;
            }
        }

        // 3. Search Filter
        if (search) {
            const searchScope = req.query.search_scope || 'All';
            const searchTerm = `%${search}%`;
            request.input('search', sql.NVarChar, searchTerm);

            if (searchScope === 'Reference Number') {
                query += ` AND (dbo.get_reference_number(i.id) LIKE @search OR CAST(i.reference_number AS VARCHAR) LIKE @search)`;
            } else if (searchScope === 'Vessel') {
                query += ` AND s.name LIKE @search`;
            } else {
                // Default 'All' search
                query += ` AND (
                    dbo.get_reference_number(i.id) LIKE @search OR 
                    CAST(i.reference_number AS VARCHAR) LIKE @search OR 
                    s.name LIKE @search OR
                    i.description LIKE @search OR
                    m.name LIKE @search OR
                    c.name LIKE @search
                 )`;
            }
        }

        // Close total_count subquery
        query += `) as total_count 
            FROM incident i
            LEFT JOIN ship s ON i.ship_id = s.id
            LEFT JOIN office o ON i.local_office_id = o.id
            LEFT JOIN port p ON i.place_id = p.id
            LEFT JOIN incident_type it ON i.type_id = it.id
            LEFT JOIN member m ON i.member_id = m.id
            LEFT JOIN club c ON i.club_id = c.id
            WHERE 1=1`;

        // REPEAT FILTERS FOR MAIN QUERY
        if (status && status !== 'All') {
            query += ` AND i.status = @status`;
        }
        if (office && office.length > 0) {
            const officeIds = String(office).split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
            if (officeIds.length > 0) {
                query += ` AND i.local_office_id IN (${officeIds.join(',')})`;
            }
        }
        if (search) {
            const searchScope = req.query.search_scope || 'All';
            if (searchScope === 'Reference Number') {
                query += ` AND (dbo.get_reference_number(i.id) LIKE @search OR CAST(i.reference_number AS VARCHAR) LIKE @search)`;
            } else if (searchScope === 'Vessel') {
                query += ` AND s.name LIKE @search`;
            } else {
                query += ` AND (
                    dbo.get_reference_number(i.id) LIKE @search OR 
                    CAST(i.reference_number AS VARCHAR) LIKE @search OR 
                    s.name LIKE @search OR
                    i.description LIKE @search OR
                    m.name LIKE @search OR
                    c.name LIKE @search
                 )`;
            }
        }

        query += `
            ORDER BY i.reference_year DESC, i.reference_number DESC, i.reference_sub_number ASC, i.local_office_id ASC
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `;

        request.input('offset', sql.Int, parseInt(offset));
        request.input('limit', sql.Int, parseInt(limit));

        const result = await request.query(query);

        res.json({
            data: result.recordset,
            total: result.recordset.length > 0 ? result.recordset[0].total_count : 0,
            page: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (err) {
        console.error('Error fetching incidents:', err.message);
        res.status(500).send('Server Error');
    }
});

// GET incident details for print (same as GET /:id for now)
router.get('/:id/print', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT 
                    i.*, 
                    dbo.get_reference_number(i.id) as formatted_reference,
                    s.name as vessel_name, 
                    o.name as office_name,
                    c.code as club_code
                FROM incident i
                LEFT JOIN ship s ON i.ship_id = s.id
                LEFT JOIN office o ON i.local_office_id = o.id
                LEFT JOIN club c ON i.club_id = c.id
                WHERE i.id = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).send('Incident not found');
        }

        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error fetching incident for print:', err.message);
        res.status(500).send('Server Error');
    }
});

// GET single incident by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT 
                    i.*, 
                    dbo.get_reference_number(i.id) as formatted_reference,
                    s.name as vessel_name, 
                    o.name as office_name,
                    c.code as club_code
                FROM incident i
                LEFT JOIN ship s ON i.ship_id = s.id
                LEFT JOIN office o ON i.local_office_id = o.id
                LEFT JOIN club c ON i.club_id = c.id
                WHERE i.id = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).send('Incident not found');
        }

        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error fetching incident:', err.message);
        res.status(500).send('Server Error');
    }
});

// CREATE a new incident
router.post('/', async (req, res) => {
    try {
        const { ship_id, local_office_id, description, status } = req.body;
        const pool = await poolPromise; // Use the exported poolPromise

        // Validation: Check if ship_id exists
        const shipCheck = await pool.request()
            .input('shipId', sql.Int, ship_id)
            .query('SELECT id, name FROM ship WHERE id = @shipId');

        if (shipCheck.recordset.length === 0) {
            return res.status(400).send('Invalid Ship ID');
        }

        const vesselName = shipCheck.recordset[0].name;

        // Validation: Check if local_office_id exists
        const officeCheck = await pool.request()
            .input('officeId', sql.Int, local_office_id)
            .query('SELECT id, sharepoint_site_id, sharepoint_drive_id FROM office WHERE id = @officeId');

        if (officeCheck.recordset.length === 0) {
            return res.status(400).send('Invalid Office ID');
        }

        const office = officeCheck.recordset[0];

        // START TRANSACTION
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // 1. Insert Incident
            const insertResult = await transaction.request()
                .input('ship_id', sql.Int, ship_id)
                .input('local_office_id', sql.Int, local_office_id)
                .input('description', sql.NVarChar, description)
                // Use default 'Open' if not provided
                .input('status', sql.NVarChar, status || 'Open')
                .query(`
                    INSERT INTO incident (ship_id, local_office_id, description, status)
                    OUTPUT INSERTED.id, INSERTED.reference_year
                    VALUES (@ship_id, @local_office_id, @description, @status)
                `);

            const newIncidentId = insertResult.recordset[0].id;
            const refYear = insertResult.recordset[0].reference_year;

            // 2. Get Formatted Reference using Function
            const refResult = await transaction.request()
                .input('id', sql.Int, newIncidentId)
                .query('SELECT dbo.get_reference_number(@id) as ref');

            const formattedRef = refResult.recordset[0].ref;

            // 3. Create SharePoint Folder (Background Task - Don't block response?)
            // Ideally, we should do this. But for now, let's await it to ensure it works.
            if (office.sharepoint_site_id && office.sharepoint_drive_id) {
                // Clean up names for folder creation
                // 0256/24/SM/MRA -> 025624SMMRA
                // But typically folders are "Reference - Vessel"
                // Let's adopt a standard: "[RefPart] - [VesselName]"

                // Remove slashes for folder prefix
                let refPart = formattedRef.replace(/\//g, '');
                const parts = formattedRef.split('/');
                if (parts.length >= 3) {
                    refPart = parts[0] + parts[1] + parts[2];
                }

                const folderName = `${refPart} - ${vesselName.replace(/[\\/:*?"<>|]/g, '')}`;

                console.log(`Creating SharePoint Folder: ${folderName}`);
                await createIncidentFolder(
                    office.sharepoint_site_id,
                    office.sharepoint_drive_id,
                    folderName,
                    refYear // Pass year to organize in year subfolders
                );
            }

            await transaction.commit();
            res.status(201).json({ id: newIncidentId, message: 'Incident created successfully' });

        } catch (err) {
            await transaction.rollback();
            throw err;
        }

    } catch (err) {
        console.error('Error creating incident:', err.message);
        res.status(500).send('Server Error');
    }
});

// UPDATE an incident
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { ship_id, local_office_id, description, status } = req.body;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('ship_id', sql.Int, ship_id)
            .input('local_office_id', sql.Int, local_office_id)
            .input('description', sql.NVarChar, description)
            .input('status', sql.NVarChar, status)
            .query(`
                UPDATE incident 
                SET ship_id = @ship_id, 
                    local_office_id = @local_office_id, 
                    description = @description, 
                    status = @status
                WHERE id = @id
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).send('Incident not found');
        }

        res.json({ message: 'Incident updated successfully' });
    } catch (err) {
        console.error('Error updating incident:', err.message);
        res.status(500).send('Server Error');
    }
});

// DELETE an incident
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM incident WHERE id = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).send('Incident not found');
        }

        res.json({ message: 'Incident deleted successfully' });
    } catch (err) {
        console.error('Error deleting incident:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
