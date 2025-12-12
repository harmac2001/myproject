const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../db');
const { createIncidentFolder, listIncidentFiles } = require('../services/graphService');
const ExcelJS = require('exceljs');

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

// EXPORT incidents to Excel
router.get('/export', async (req, res) => {
    try {
        const { search, status, office } = req.query;

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
                c.name as manager_name
            FROM incident i
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

        // 2. Office Filter
        const officeIds = office ? String(office).split(',').map(id => parseInt(id)).filter(id => !isNaN(id)) : [];
        if (officeIds.length > 0) {
            query += ` AND i.local_office_id IN (${officeIds.join(',')})`;
        } else {
            // Strict filter: No office selected = No data
            query += ` AND 1=0`;
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

        // Advanced Search (from main list logic - assumed same params passed)
        if (req.query.filter_field && req.query.filter_value) {
            const { filter_field, filter_value } = req.query;
            // Note: This needs implementation parity with the main GET / logic if advanced search is critical for export
            // For now, implementing basic advanced filters if they were passed
            if (filter_field === 'Vessel') {
                query += ` AND i.ship_id = @filter_val`;
                request.input('filter_val', sql.Int, filter_value);
            }
            // Add other advanced filters here if needed mirroring main route logic
            // To keep it simple for this task iteration, we focus on main filters unless explicitly requested to match advanced 100%
        }

        query += ` ORDER BY (CASE WHEN i.reference_year < 100 THEN i.reference_year + 2000 ELSE i.reference_year END) DESC, i.reference_number DESC, i.reference_sub_number ASC, i.local_office_id ASC, i.id DESC`;

        const result = await request.query(query);
        const incidents = result.recordset;

        // CREATE SQL EXCEL
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Incidents');

        worksheet.columns = [
            { header: 'Reference', key: 'formatted_reference', width: 15 },
            { header: 'Vessel', key: 'ship_name', width: 25 },
            { header: 'Date', key: 'incident_date', width: 15 },
            { header: 'Place', key: 'place_name', width: 20 },
            { header: 'Type', key: 'type_name', width: 20 },
            { header: 'Managers', key: 'manager_name', width: 25 },
            { header: 'Members', key: 'member_name', width: 25 },
            { header: 'Status', key: 'status', width: 12 },
            { header: 'Office', key: 'office_location', width: 15 },
        ];

        // Style Header
        worksheet.getRow(1).font = { bold: true };

        // Add Rows
        incidents.forEach(inc => {
            worksheet.addRow({
                formatted_reference: inc.formatted_reference,
                ship_name: inc.ship_name,
                incident_date: inc.incident_date ? new Date(inc.incident_date).toLocaleDateString('pt-BR') : '',
                place_name: inc.place_name,
                type_name: inc.type_name,
                manager_name: inc.manager_name,
                member_name: inc.member_name,
                status: inc.status,
                office_location: inc.office_location
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Incidents.xlsx');

        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        console.error('Error exporting incidents:', err);
        res.status(500).send(`Error: ${err.message}\nStack: ${err.stack}`);
    }
});

// GET all incidents with optional search, filter, and pagination
router.get('/', async (req, res) => {
    try {
        const { search, status, office, page = 1, limit = 10 } = req.query;

        const offset = (page - 1) * limit;
        const pool = await poolPromise;
        const request = pool.request();

        // Build WHERE clause once
        let whereClause = 'WHERE 1=1';

        console.log(`[DEBUG] GET /incidents params: search='${search}', scope='${req.query.search_scope}', status='${status}', office='${office}'`);

        // 1. Status Filter
        if (status && status !== 'All') {
            whereClause += ` AND i.status = @status`;
            request.input('status', sql.NVarChar, status);
        }

        // 2. Office Filter (CSV of IDs)
        const officeIds = office ? String(office).split(',').map(id => parseInt(id)).filter(id => !isNaN(id)) : [];
        if (officeIds.length > 0) {
            whereClause += ` AND i.local_office_id IN (${officeIds.join(',')})`;
        } else {
            // Strict filter: No office selected = No data
            whereClause += ` AND 1=0`;
        }

        // 3. Search Filter
        if (search) {
            const searchScope = req.query.search_scope || 'All';
            // Remove trim() to respect user input (e.g. "Long " vs "Long")
            const searchTerm = `%${search}%`;
            request.input('search', sql.NVarChar, searchTerm);

            if (searchScope === 'Reference Number') {
                whereClause += ` AND (dbo.get_reference_number(i.id) LIKE @search OR CAST(i.reference_number AS VARCHAR) LIKE @search)`;
            } else if (searchScope === 'Vessel') {
                whereClause += ` AND s.name LIKE @search`;
            } else {
                whereClause += ` AND (
                    dbo.get_reference_number(i.id) LIKE @search OR 
                    CAST(i.reference_number AS VARCHAR) LIKE @search OR 
                    s.name LIKE @search OR
                    i.description LIKE @search OR
                    m.name LIKE @search OR
                    c.name LIKE @search
                 )`;
            }
        }

        // Count Query
        const countQuery = `
            SELECT COUNT(*) as total_count
            FROM incident i
            LEFT JOIN ship s ON i.ship_id = s.id
            LEFT JOIN office o ON i.local_office_id = o.id
            LEFT JOIN port p ON i.place_id = p.id
            LEFT JOIN incident_type it ON i.type_id = it.id
            LEFT JOIN member m ON i.member_id = m.id
            LEFT JOIN club c ON i.club_id = c.id
            ${whereClause}
        `;

        // Data Query
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
                c.name as manager_name
            FROM incident i
            LEFT JOIN ship s ON i.ship_id = s.id
            LEFT JOIN office o ON i.local_office_id = o.id
            LEFT JOIN port p ON i.place_id = p.id
            LEFT JOIN incident_type it ON i.type_id = it.id
            LEFT JOIN member m ON i.member_id = m.id
            LEFT JOIN club c ON i.club_id = c.id
            ${whereClause}
            ORDER BY (CASE WHEN i.reference_year < 100 THEN i.reference_year + 2000 ELSE i.reference_year END) DESC, i.reference_number DESC, i.reference_sub_number ASC, i.local_office_id ASC, i.id DESC
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `;

        request.input('offset', sql.Int, parseInt(offset));
        request.input('limit', sql.Int, parseInt(limit));

        console.log(`[DEBUG] Query: ${query}`);

        // Execute Count
        const countResult = await request.query(countQuery);
        const total = countResult.recordset[0].total_count;

        // Execute Data
        const result = await request.query(query);
        console.log(`[DEBUG] Found ${result.recordset.length} records. Total: ${total}`);

        res.json({
            data: result.recordset,
            total: total,
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
            .input('member_id', sql.BigInt, req.body.member_id || null)
            .input('owner_id', sql.BigInt, req.body.owner_id || null)
            .input('club_id', sql.BigInt, req.body.club_id || null)
            .input('handler_id', sql.BigInt, req.body.handler_id || null)
            .input('type_id', sql.BigInt, req.body.type_id || null)
            .input('reporter_id', sql.BigInt, req.body.reporter_id || null)
            .input('local_agent_id', sql.BigInt, req.body.local_agent_id || null)
            .input('place_id', sql.BigInt, req.body.place_id || null)
            .input('incident_date', sql.Date, req.body.incident_date || null)
            .input('closing_date', sql.Date, req.body.closing_date || null)
            .input('estimated_disposal_date', sql.Date, req.body.estimated_disposal_date || null)
            .input('effective_disposal_date', sql.Date, req.body.effective_disposal_date || null)
            .input('berthing_date', sql.Date, req.body.berthing_date || null)
            .input('reporting_date', sql.Date, req.body.reporting_date || null)
            .input('time_bar_date', sql.Date, req.body.time_bar_date || null)
            .input('latest_report_date', sql.Date, req.body.latest_report_date || null)
            .input('next_review_date', sql.Date, req.body.next_review_date || null)
            .input('voyage_and_leg', sql.NVarChar, req.body.voyage_and_leg || null)
            .input('club_reference', sql.NVarChar, req.body.club_reference || null)
            .input('last_modified_date', sql.BigInt, Date.now())
            .query(`
                UPDATE incident 
                SET ship_id = @ship_id, 
                    local_office_id = @local_office_id, 
                    description = @description, 
                    status = @status,
                    member_id = @member_id,
                    owner_id = @owner_id,
                    club_id = @club_id,
                    handler_id = @handler_id,
                    type_id = @type_id,
                    reporter_id = @reporter_id,
                    local_agent_id = @local_agent_id,
                    place_id = @place_id,
                    incident_date = @incident_date,
                    closing_date = @closing_date,
                    estimated_disposal_date = @estimated_disposal_date,
                    effective_disposal_date = @effective_disposal_date,
                    berthing_date = @berthing_date,
                    reporting_date = @reporting_date,
                    time_bar_date = @time_bar_date,
                    latest_report_date = @latest_report_date,
                    next_review_date = @next_review_date,
                    voyage_and_leg = @voyage_and_leg,
                    club_reference = @club_reference,
                    last_modified_date = @last_modified_date
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

// Patch: Reassign Claim Handler
router.patch('/:id/reassign-claim-handler', async (req, res) => {
    try {
        const { id } = req.params;
        const { newHandlerId } = req.body;

        if (!newHandlerId) return res.status(400).send('New Handler ID is required');

        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.BigInt, id)
            .input('newHandlerId', sql.BigInt, newHandlerId)
            .query('UPDATE incident SET handler_id = @newHandlerId WHERE id = @id');

        res.json({ message: 'Reassigned successfully' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

module.exports = router;
