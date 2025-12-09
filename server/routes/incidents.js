const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../db');
const { createIncidentFolder, listIncidentFiles } = require('../services/graphService');
// ... imports ...

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
            // If not configured, maybe try defaults or return empty
            // For now return empty with special flag?
            return res.json({ files: [], message: 'SharePoint not configured for this office.' });
        }

        // 2. Reconstruct Folder Name
        // Logic must match POST: [RefPart] - [SanitizedVessel]
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
        const result = await listIncidentFiles(
            inc.sharepoint_site_id,
            inc.sharepoint_drive_id,
            folderName,
            inc.reference_year
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
        // Debug logging
        const fs = require('fs');
        fs.appendFileSync('server_debug.log', `[GET /] Params: ${JSON.stringify({ search, status, office, page, limit })}\n`);

        const offset = (page - 1) * limit;
        const pool = await poolPromise;
        const request = pool.request();

        console.log('Query Params:', { search, search_scope: req.query.search_scope, status, office });

        let query = `
            SELECT 
                i.id, 
                i.reference_number, 
                dbo.get_reference_number(i.id) as formatted_reference,
                i.incident_date, 
                i.status, 
                i.description,
                i.ship_id,
                i.member_id,
                i.club_id,
                i.handler_id,
                i.local_office_id,
                i.type_id,
                i.reporter_id,
                i.local_agent_id,
                i.place_id,
                i.closing_date,
                i.estimated_disposal_date,
                i.berthing_date,
                i.voyage_and_leg,
                i.club_reference,
                i.reporting_date,
                i.time_bar_date,
                i.latest_report_date,
                i.next_review_date,
                i.created_date,
                i.last_modified_date,
                s.name as ship_name,
                m.name as member_name,
                p.name as place_name,
                o.location as office_location,
                t.name as type_name,
                manager.name as manager_name,
                COUNT(*) OVER() as TotalCount
            FROM incident i
            LEFT JOIN ship s ON i.ship_id = s.id
            LEFT JOIN member m ON i.member_id = m.id
            LEFT JOIN member manager ON i.owner_id = manager.id
            LEFT JOIN port p ON i.place_id = p.id
            LEFT JOIN office o ON i.local_office_id = o.id
            LEFT JOIN incident_type t ON i.type_id = t.id
            WHERE 1=1
        `;

        // Search logic
        if (search) {
            const scope = req.query.search_scope || 'All';

            console.log('=== SEARCH DEBUG ===');
            console.log('Search term:', search);
            console.log('Search scope from query:', req.query.search_scope);
            console.log('Scope being used:', scope);
            console.log('==================');

            if (scope === 'All') {
                console.log('Using ALL scope');
                query += ` AND (
                    i.description LIKE @search OR 
                    dbo.get_reference_number(i.id) LIKE @search OR
                    i.club_reference LIKE @search OR
                    EXISTS (SELECT 1 FROM ship s WHERE s.id = i.ship_id AND s.name LIKE @search) OR
                    EXISTS (SELECT 1 FROM member m WHERE m.id = i.member_id AND m.name LIKE @search)
                )`;
            } else {
                console.log('Using specific scope:', scope);
                switch (scope) {
                    case 'B/L Number':
                        query += ` AND EXISTS (SELECT 1 FROM cargo_information ci WHERE ci.incident_id = i.id AND ci.bill_of_lading_number LIKE @search)`;
                        break;
                    case 'Claimant':
                        // Assuming claimant name is in claimant table linked via claim_details.surrogate_claimant_id
                        query += ` AND EXISTS (SELECT 1 FROM claim_details cd JOIN claimant c ON cd.surrogate_claimant_id = c.id WHERE cd.incident_id = i.id AND c.name LIKE @search)`;
                        break;
                    case 'Claimant Ref. Number':
                        query += ` AND EXISTS (SELECT 1 FROM claim_details cd WHERE cd.incident_id = i.id AND cd.claimant_reference LIKE @search)`;
                        break;
                    case 'Client Reference Number':
                        query += ` AND i.club_reference LIKE @search`;
                        break;
                    case 'Comments':
                        query += ` AND EXISTS (SELECT 1 FROM comment c WHERE c.incident_id = i.id AND c.description LIKE @search)`;
                        break;
                    case 'Container Number':
                        query += ` AND EXISTS (SELECT 1 FROM cargo_information ci WHERE ci.incident_id = i.id AND ci.container_number LIKE @search)`;
                        break;
                    case 'Description of Cargo':
                        query += ` AND EXISTS (SELECT 1 FROM cargo_information ci WHERE ci.incident_id = i.id AND ci.description LIKE @search)`;
                        break;
                    case 'Description of Claim':
                        query += ` AND EXISTS (SELECT 1 FROM claim_details cd WHERE cd.incident_id = i.id AND cd.description LIKE @search)`;
                        break;
                    case 'Description of Incident':
                        query += ` AND i.description LIKE @search`;
                        break;
                    case 'Members and Managers':
                        query += ` AND (
                            EXISTS (SELECT 1 FROM member m WHERE m.id = i.member_id AND m.name LIKE @search) OR
                            EXISTS (SELECT 1 FROM member m WHERE m.id = i.owner_id AND m.name LIKE @search)
                        )`;
                        break;
                    case 'Reference Number':
                        query += ` AND dbo.get_reference_number(i.id) LIKE @search`;
                        break;
                    case 'Vessel':
                        console.log('Adding Vessel-specific query');
                        query += ` AND EXISTS (SELECT 1 FROM ship s WHERE s.id = i.ship_id AND s.name LIKE @search)`;
                        break;
                }
            }
            request.input('search', sql.NVarChar, `%${search}%`);
        }

        if (status && status !== 'All') {
            query += ` AND i.status = @status`;
            request.input('status', sql.NVarChar, status);
        }

        if (office) {
            // office param is expected to be comma-separated IDs: "1,2,3"
            const officeIds = office.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));

            if (officeIds.length > 0) {
                query += ` AND i.local_office_id IN (${officeIds.join(',')})`;
            } else {
                // Office param provided but no valid IDs (e.g. empty string or invalid), return no results
                return res.json({ data: [], total: 0, page: parseInt(page), limit: parseInt(limit) });
            }
        } else {
            // No office selected, return no results as per requirement
            return res.json({ data: [], total: 0, page: parseInt(page), limit: parseInt(limit) });
        }

        if (req.query.filter_field && req.query.filter_value) {
            const field = req.query.filter_field;
            const value = req.query.filter_value;

            switch (field) {
                case 'Cargo Type':
                    query += ` AND EXISTS (SELECT 1 FROM cargo_information ci WHERE ci.incident_id = i.id AND ci.cargo_type_id = @filter_val)`;
                    request.input('filter_val', sql.Int, value);
                    break;
                case 'Claim Handler':
                    query += ` AND i.handler_id = @filter_val`;
                    request.input('filter_val', sql.Int, value);
                    break;
                case 'Client':
                    query += ` AND i.club_id = @filter_val`;
                    request.input('filter_val', sql.Int, value);
                    break;
                case 'Consultant':
                    query += ` AND EXISTS (SELECT 1 FROM appointment a WHERE a.incident_id = i.id AND a.consultant_id = @filter_val)`;
                    request.input('filter_val', sql.Int, value);
                    break;
                case 'Incident Reported By':
                    query += ` AND i.reporter_id = @filter_val`;
                    request.input('filter_val', sql.Int, value);
                    break;
                case 'Place of Incident':
                    query += ` AND i.place_id = @filter_val`;
                    request.input('filter_val', sql.Int, value);
                    break;
                case 'Port of Discharge':
                    query += ` AND EXISTS (SELECT 1 FROM cargo_information ci JOIN cargo_information_discharge_port cidp ON ci.id = cidp.cargo_information_id WHERE ci.incident_id = i.id AND cidp.port_id = @filter_val)`;
                    request.input('filter_val', sql.Int, value);
                    break;
                case 'Port of Loading':
                    query += ` AND EXISTS (SELECT 1 FROM cargo_information ci JOIN cargo_information_loading_port cilp ON ci.id = cilp.cargo_information_id WHERE ci.incident_id = i.id AND cilp.port_id = @filter_val)`;
                    request.input('filter_val', sql.Int, value);
                    break;
                case 'Local Agent':
                    query += ` AND i.local_agent_id = @filter_val`;
                    request.input('filter_val', sql.Int, value);
                    break;
                case 'Loss Cause':
                    query += ` AND EXISTS (SELECT 1 FROM claim_details cd WHERE cd.incident_id = i.id AND cd.loss_cause_id = @filter_val)`;
                    request.input('filter_val', sql.Int, value);
                    break;
                case 'Loss Type':
                    query += ` AND EXISTS (SELECT 1 FROM claim_details cd WHERE cd.incident_id = i.id AND cd.loss_type_id = @filter_val)`;
                    request.input('filter_val', sql.Int, value);
                    break;
                case 'Members/Managers':
                    query += ` AND (i.member_id = @filter_val OR i.owner_id = @filter_val)`;
                    request.input('filter_val', sql.Int, value);
                    break;
                case 'Status':
                    query += ` AND i.status = @filter_val`;
                    request.input('filter_val', sql.NVarChar, value);
                    break;
                case 'Receiver/Shipper':
                    query += ` AND EXISTS (SELECT 1 FROM cargo_information ci JOIN cargo_information_receiver cir ON ci.id = cir.cargo_information_id WHERE ci.incident_id = i.id AND cir.trader_id = @filter_val)`;
                    request.input('filter_val', sql.Int, value);
                    break;
                case 'Type of Incident':
                    query += ` AND i.type_id = @filter_val`;
                    request.input('filter_val', sql.Int, value);
                    break;
                case 'Vessel':
                    query += ` AND i.ship_id = @filter_val`;
                    request.input('filter_val', sql.Int, value);
                    break;
            }
        }

        query += ` ORDER BY i.reference_year DESC, i.reference_number DESC, i.reference_sub_number DESC
                   OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;

        request.input('offset', sql.Int, offset);
        request.input('limit', sql.Int, limit);

        const result = await request.query(query);

        const total = result.recordset.length > 0 ? result.recordset[0].TotalCount : 0;

        res.json({
            data: result.recordset,
            total,
            page: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (err) {
        res.status(500).send(err.message);
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
                SELECT i.*, dbo.get_reference_number(i.id) as formatted_reference, c.code as club_code
                FROM incident i
                LEFT JOIN club c ON i.club_id = c.id
                WHERE i.id = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).send('Incident not found');
        }

        res.json(result.recordset[0]);
    } catch (err) {
        const fs = require('fs');
        fs.appendFileSync('server_debug.log', `Error fetching incident ${req.params.id}: ${err.message}\nStack: ${err.stack}\n`);
        res.status(500).send(err.message);
    }
});

// GET incident for printing (with joined names)
router.get('/:id/print', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        const query = `
            SELECT 
                i.*,
                dbo.get_reference_number(i.id) as formatted_reference,
                s.name as ship_name,
                p.name as place_name,
                o.location as office_name,
                c.name as club_name,
                m.name as member_name,
                ow.name as owner_name,
                it.name as type_name,
                r.name as reporter_name,
                a.name as agent_name,
                ch.name as handler_name
            FROM incident i
            LEFT JOIN ship s ON i.ship_id = s.id
            LEFT JOIN port p ON i.place_id = p.id
            LEFT JOIN office o ON i.local_office_id = o.id
            LEFT JOIN club c ON i.club_id = c.id
            LEFT JOIN member m ON i.member_id = m.id
            LEFT JOIN member ow ON i.owner_id = ow.id
            LEFT JOIN incident_type it ON i.type_id = it.id
            LEFT JOIN reporter r ON i.reporter_id = r.id
            LEFT JOIN agent a ON i.local_agent_id = a.id
            LEFT JOIN claim_handler ch ON i.handler_id = ch.id
            WHERE i.id = @id
        `;

        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(query);

        if (result.recordset.length === 0) {
            return res.status(404).send('Incident not found');
        }

        const incidentData = result.recordset[0];

        // Fetch Cargo Information
        const cargoResult = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT ci.*, ct.name as cargo_type_name
                FROM cargo_information ci
                LEFT JOIN cargo_type ct ON ci.cargo_type_id = ct.id
                WHERE ci.incident_id = @id
            `);
        incidentData.cargo = cargoResult.recordset;

        // Fetch Claim Details
        const claimResult = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT cd.*, 
                    lt.name as loss_type_name,
                    lc.name as loss_cause_name,
                    c.name as claimant_name
                FROM claim_details cd
                LEFT JOIN loss_type lt ON cd.loss_type_id = lt.id
                LEFT JOIN loss_cause lc ON cd.loss_cause_id = lc.id
                LEFT JOIN claimant c ON cd.surrogate_claimant_id = c.id
                WHERE cd.incident_id = @id
            `);
        incidentData.claims = claimResult.recordset;

        // Fetch Comments
        const commentsResult = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM comment WHERE incident_id = @id ORDER BY created_date DESC');
        incidentData.comments = commentsResult.recordset;

        res.json(incidentData);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// POST create new incident
router.post('/', async (req, res) => {
    try {
        const {
            incident_date, status, description, ship_id, member_id, owner_id, club_id, handler_id,
            local_office_id, type_id, reporter_id, local_agent_id, place_id,
            closing_date, estimated_disposal_date, berthing_date, voyage_and_leg,
            club_reference, reporting_date, time_bar_date, latest_report_date, next_review_date
        } = req.body;
        const pool = await poolPromise;
        const fs = require('fs');

        if (!reporter_id) {
            return res.status(400).send('Reported By is required');
        }

        if (!berthing_date) {
            return res.status(400).send('Arrival Date (Berthing Date) is required');
        }

        // Check if this is a sub-incident (reference_number and reference_year provided)
        let next_ref, next_sub_ref, ref_year;

        if (req.body.reference_number && req.body.reference_year) {
            // Sub-incident: Use provided ref number and year, calculate next sub-ref
            next_ref = req.body.reference_number;
            ref_year = req.body.reference_year;

            const subRefResult = await pool.request()
                .input('year', sql.Int, ref_year)
                .input('ref_num', sql.Int, next_ref)
                .query('SELECT ISNULL(MAX(reference_sub_number), 0) + 1 as next_sub_ref FROM incident WHERE reference_year = @year AND reference_number = @ref_num');

            next_sub_ref = subRefResult.recordset[0].next_sub_ref;
            fs.appendFileSync('server_debug.log', `Creating sub-incident. Ref: ${next_ref}/${ref_year}, Next Sub-Ref: ${next_sub_ref}\n`);
        } else {
            // New Incident: Generate new reference number
            ref_year = new Date().getFullYear();
            const refResult = await pool.request()
                .input('year', sql.Int, ref_year)
                .input('office_id', sql.Int, local_office_id)
                .query('SELECT ISNULL(MAX(reference_number), 0) + 1 as next_ref FROM incident WHERE reference_year = @year AND local_office_id = @office_id');

            next_ref = refResult.recordset[0].next_ref;
            next_sub_ref = 0; // Main incidents have sub-ref 0
            fs.appendFileSync('server_debug.log', `Creating new incident. Next Ref: ${next_ref}\n`);
        }

        const insertResult = await pool.request()
            .input('reference_number', sql.Int, next_ref)
            .input('reference_year', sql.Int, ref_year)
            .input('reference_sub_number', sql.Int, next_sub_ref)
            .input('incident_date', sql.Date, incident_date || null)
            .input('status', sql.NVarChar, status)
            .input('description', sql.NVarChar, description)
            .input('ship_id', sql.Int, ship_id)
            .input('member_id', sql.Int, member_id)
            .input('owner_id', sql.Int, owner_id)
            .input('club_id', sql.Int, club_id)
            .input('handler_id', sql.Int, handler_id)
            .input('local_office_id', sql.Int, local_office_id)
            .input('type_id', sql.Int, type_id)
            .input('reporter_id', sql.Int, reporter_id)
            .input('local_agent_id', sql.Int, local_agent_id)
            .input('place_id', sql.Int, place_id)
            .input('closing_date', sql.Date, closing_date || null)
            .input('estimated_disposal_date', sql.Date, estimated_disposal_date || null)
            .input('berthing_date', sql.Date, berthing_date || null)
            .input('voyage_and_leg', sql.NVarChar, voyage_and_leg)
            .input('club_reference', sql.NVarChar, club_reference)
            .input('reporting_date', sql.Date, reporting_date || null)
            .input('time_bar_date', sql.Date, time_bar_date || null)
            .input('latest_report_date', sql.Date, latest_report_date || null)
            .input('next_review_date', sql.Date, next_review_date || null)
            .input('now', sql.BigInt, Date.now())
            .query(`
                INSERT INTO incident (
                    reference_number, reference_year, reference_sub_number, incident_date, status, description, 
                    ship_id, member_id, owner_id, club_id, handler_id,
                    local_office_id, type_id, reporter_id, local_agent_id, place_id,
                    closing_date, estimated_disposal_date, berthing_date, voyage_and_leg,
                    club_reference, reporting_date, time_bar_date, latest_report_date, next_review_date,
                    created_date, last_modified_date
                )
                VALUES (
                    @reference_number, @reference_year, @reference_sub_number, @incident_date, @status, @description, 
                    @ship_id, @member_id, @owner_id, @club_id, @handler_id,
                    @local_office_id, @type_id, @reporter_id, @local_agent_id, @place_id,
                    @closing_date, @estimated_disposal_date, @berthing_date, @voyage_and_leg,
                    @club_reference, @reporting_date, @time_bar_date, @latest_report_date, @next_review_date,
                    @now, @now
                );
                SELECT SCOPE_IDENTITY() AS id;
            `);

        const newIncidentId = insertResult.recordset[0].id;

        // --- SharePoint Integration ---
        try {
            // Get formatted reference for the new incident
            const refRes = await pool.request()
                .input('id', sql.Int, newIncidentId)
                .query('SELECT dbo.get_reference_number(@id) as formatted_reference');

            const formattedRef = refRes.recordset[0]?.formatted_reference || `${next_ref}/${ref_year}`;

            // Get SharePoint config for the office
            const spConfigRes = await pool.request()
                .input('officeId', sql.Int, local_office_id)
                .query('SELECT sharepoint_site_id, sharepoint_drive_id FROM office WHERE id = @officeId');

            if (spConfigRes.recordset.length > 0) {
                const spConfig = spConfigRes.recordset[0];
                const siteId = spConfig.sharepoint_site_id || process.env.DEFAULT_SHAREPOINT_SITE_ID;
                const driveId = spConfig.sharepoint_drive_id || process.env.DEFAULT_SHAREPOINT_DRIVE_ID;

                if (siteId && driveId) {
                    // Logic: "0286/23/STD/ROAM" -> "028623STD"
                    // Part 1: Reference
                    let refPart = formattedRef.replace(/\//g, '');
                    const parts = formattedRef.split('/');
                    if (parts.length >= 3) {
                        refPart = parts[0] + parts[1] + parts[2];
                    }

                    // Part 2: Vessel Name
                    let vesselName = 'Unknown Vessel';
                    try {
                        const shipRes = await pool.request()
                            .input('shipId', sql.Int, ship_id)
                            .query('SELECT name FROM ship WHERE id = @shipId');
                        if (shipRes.recordset.length > 0) {
                            vesselName = shipRes.recordset[0].name;
                        }
                    } catch (shipErr) {
                        console.error('[SharePoint] Error fetching ship name:', shipErr);
                    }

                    // Sanitize Vessel Name (remove invalid chars for folders: \ / : * ? " < > |)
                    const sanitizedVessel = vesselName.replace(/[\\/:*?"<>|]/g, '').trim();

                    const folderName = `${refPart} - ${sanitizedVessel}`;

                    console.log(`[SharePoint] Creating folder: ${folderName} in Site: ${siteId}`);

                    // Run async, don't block response? 
                    // To ensure it happens, we await it.
                    try {
                        const yearToUse = ref_year; // Use the year collected/generated earlier in the POST route
                        await createIncidentFolder(siteId, driveId, folderName, yearToUse);
                        console.log('[SharePoint] Folder created successfully.');
                    } catch (spErr) {
                        console.error('[SharePoint] Failed to create folder:', spErr.message);
                    }
                } else {
                    console.log('[SharePoint] Configuration missing for this office. Skipping.');
                }
            }
        } catch (err) {
            console.error('[SharePoint] Integration error:', err);
        }
        // ------------------------------

        res.status(201).send({ message: 'Incident created successfully', id: newIncidentId });
    } catch (err) {
        const fs = require('fs');
        fs.appendFileSync('server_debug.log', `Error creating incident: ${err.message}\nStack: ${err.stack}\n`);
        res.status(500).send(err.message);
    }
});

// PUT update incident
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            incident_date, status, description, ship_id, member_id, owner_id, club_id, handler_id,
            local_office_id, type_id, reporter_id, local_agent_id, place_id,
            closing_date, estimated_disposal_date, berthing_date, voyage_and_leg,
            club_reference, reporting_date, time_bar_date, latest_report_date, next_review_date
        } = req.body;
        const pool = await poolPromise;

        if (!reporter_id) {
            return res.status(400).send('Reported By is required');
        }

        if (!berthing_date) {
            return res.status(400).send('Arrival Date (Berthing Date) is required');
        }

        await pool.request()
            .input('id', sql.Int, id)
            .input('incident_date', sql.Date, incident_date || null)
            .input('status', sql.NVarChar, status)
            .input('description', sql.NVarChar, description)
            .input('ship_id', sql.Int, ship_id)
            .input('member_id', sql.Int, member_id)
            .input('owner_id', sql.Int, owner_id)
            .input('club_id', sql.Int, club_id)
            .input('handler_id', sql.Int, handler_id)
            .input('local_office_id', sql.Int, local_office_id)
            .input('type_id', sql.Int, type_id)
            .input('reporter_id', sql.Int, reporter_id)
            .input('local_agent_id', sql.Int, local_agent_id)
            .input('place_id', sql.Int, place_id)
            .input('closing_date', sql.Date, closing_date || null)
            .input('estimated_disposal_date', sql.Date, estimated_disposal_date || null)
            .input('berthing_date', sql.Date, berthing_date || null)
            .input('voyage_and_leg', sql.NVarChar, voyage_and_leg)
            .input('club_reference', sql.NVarChar, club_reference)
            .input('reporting_date', sql.Date, reporting_date || null)
            .input('time_bar_date', sql.Date, time_bar_date || null)
            .input('latest_report_date', sql.Date, latest_report_date || null)
            .input('next_review_date', sql.Date, next_review_date || null)
            .input('last_modified_date', sql.BigInt, Date.now())
            .query(`
                UPDATE incident
                SET 
                    incident_date = @incident_date,
                    status = @status,
                    description = @description,
                    ship_id = @ship_id,
                    member_id = @member_id,
                    owner_id = @owner_id,
                    club_id = @club_id,
                    handler_id = @handler_id,
                    local_office_id = @local_office_id,
                    type_id = @type_id,
                    reporter_id = @reporter_id,
                    local_agent_id = @local_agent_id,
                    place_id = @place_id,
                    closing_date = @closing_date,
                    estimated_disposal_date = @estimated_disposal_date,
                    berthing_date = @berthing_date,
                    voyage_and_leg = @voyage_and_leg,
                    club_reference = @club_reference,
                    reporting_date = @reporting_date,
                    time_bar_date = @time_bar_date,
                    latest_report_date = @latest_report_date,
                    next_review_date = @next_review_date,
                    last_modified_date = @last_modified_date
                WHERE id = @id
            `);

        res.json({ message: 'Incident updated successfully' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// PATCH update vessel for incident (for vessel reassignment)
router.patch('/:id/reassign-vessel', async (req, res) => {
    try {
        const { id } = req.params;
        const { newVesselId } = req.body;
        const pool = await poolPromise;

        console.log(`[PATCH /reassign-vessel] Incident ID: ${id}, New Vessel ID: ${newVesselId}`);

        if (!newVesselId) {
            console.error('[PATCH /reassign-vessel] Error: New vessel ID is required');
            return res.status(400).send('New vessel ID is required');
        }

        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('ship_id', sql.Int, newVesselId)
            .input('last_modified_date', sql.BigInt, Date.now())
            .query(`
                UPDATE incident
                SET 
                    ship_id = @ship_id,
                    last_modified_date = @last_modified_date
                WHERE id = @id
            `);

        console.log(`[PATCH /reassign-vessel] Rows affected: ${result.rowsAffected[0]}`);

        if (result.rowsAffected[0] === 0) {
            console.error(`[PATCH /reassign-vessel] Incident ${id} not found`);
            return res.status(404).send('Incident not found');
        }

        console.log(`[PATCH /reassign-vessel] Successfully reassigned incident ${id} to vessel ${newVesselId}`);
        res.json({ message: 'Vessel reassigned successfully' });
    } catch (err) {
        console.error('[PATCH /reassign-vessel] Error:', err.message);
        console.error('[PATCH /reassign-vessel] Stack:', err.stack);
        res.status(500).send(err.message);
    }
});

// PATCH update member for incident (for member reassignment)
router.patch('/:id/reassign-member', async (req, res) => {
    try {
        const { id } = req.params;
        const { newMemberId } = req.body;
        const pool = await poolPromise;

        console.log(`[PATCH /reassign-member] Incident ID: ${id}, New Member ID: ${newMemberId}`);

        if (!newMemberId) {
            console.error('[PATCH /reassign-member] Error: New member ID is required');
            return res.status(400).send('New member ID is required');
        }

        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('member_id', sql.Int, newMemberId)
            .input('last_modified_date', sql.BigInt, Date.now())
            .query(`
                UPDATE incident
                SET 
                    member_id = @member_id,
                    last_modified_date = @last_modified_date
                WHERE id = @id
            `);

        console.log(`[PATCH /reassign-member] Rows affected: ${result.rowsAffected[0]}`);

        if (result.rowsAffected[0] === 0) {
            console.error(`[PATCH /reassign-member] Incident ${id} not found`);
            return res.status(404).send('Incident not found');
        }

        console.log(`[PATCH /reassign-member] Successfully reassigned incident ${id} to member ${newMemberId}`);
        res.json({ message: 'Member reassigned successfully' });
    } catch (err) {
        console.error('[PATCH /reassign-member] Error:', err.message);
        console.error('[PATCH /reassign-member] Stack:', err.stack);
        res.status(500).send(err.message);
    }
});

// PATCH update manager for incident (for manager reassignment)
router.patch('/:id/reassign-manager', async (req, res) => {
    try {
        const { id } = req.params;
        const { newManagerId } = req.body;
        const pool = await poolPromise;

        console.log(`[PATCH /reassign-manager] Incident ID: ${id}, New Manager ID: ${newManagerId}`);

        if (!newManagerId) {
            console.error('[PATCH /reassign-manager] Error: New manager ID is required');
            return res.status(400).send('New manager ID is required');
        }

        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('owner_id', sql.Int, newManagerId)
            .input('last_modified_date', sql.BigInt, Date.now())
            .query(`
                UPDATE incident
                SET 
                    owner_id = @owner_id,
                    last_modified_date = @last_modified_date
                WHERE id = @id
            `);

        console.log(`[PATCH /reassign-manager] Rows affected: ${result.rowsAffected[0]}`);

        if (result.rowsAffected[0] === 0) {
            console.error(`[PATCH /reassign-manager] Incident ${id} not found`);
            return res.status(404).send('Incident not found');
        }

        console.log(`[PATCH /reassign-manager] Successfully reassigned incident ${id} to manager ${newManagerId}`);
        res.json({ message: 'Manager reassigned successfully' });
    } catch (err) {
        console.error('[PATCH /reassign-manager] Error:', err.message);
        console.error('[PATCH /reassign-manager] Stack:', err.stack);
        res.status(500).send(err.message);
    }
});

// PATCH update agent for incident (for agent reassignment)
router.patch('/:id/reassign-agent', async (req, res) => {
    try {
        const { id } = req.params;
        const { newAgentId } = req.body;
        const pool = await poolPromise;

        console.log(`[PATCH /reassign-agent] Incident ID: ${id}, New Agent ID: ${newAgentId}`);

        if (!newAgentId) {
            console.error('[PATCH /reassign-agent] Error: New agent ID is required');
            return res.status(400).send('New agent ID is required');
        }

        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('local_agent_id', sql.Int, newAgentId)
            .input('last_modified_date', sql.BigInt, Date.now())
            .query(`
                UPDATE incident
                SET 
                    local_agent_id = @local_agent_id,
                    last_modified_date = @last_modified_date
                WHERE id = @id
            `);

        console.log(`[PATCH /reassign-agent] Rows affected: ${result.rowsAffected[0]}`);

        if (result.rowsAffected[0] === 0) {
            console.error(`[PATCH /reassign-agent] Incident ${id} not found`);
            return res.status(404).send('Incident not found');
        }

        console.log(`[PATCH /reassign-agent] Successfully reassigned incident ${id} to agent ${newAgentId}`);
        res.json({ message: 'Agent reassigned successfully' });
    } catch (err) {
        console.error('[PATCH /reassign-agent] Error:', err.message);
        console.error('[PATCH /reassign-agent] Stack:', err.stack);
        res.status(500).send(err.message);
    }
});

// POST create sub-incident
router.post('/:id/subincident', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        const fs = require('fs');
        fs.appendFileSync('server_debug.log', `\n[${new Date().toISOString()}] Creating sub-incident for ID: ${id}\n`);

        // 1. Get current incident data
        const currentIncidentResult = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM incident WHERE id = @id');

        if (currentIncidentResult.recordset.length === 0) {
            fs.appendFileSync('server_debug.log', `Incident ${id} not found\n`);
            return res.status(404).send('Incident not found');
        }

        const currentIncident = currentIncidentResult.recordset[0];
        fs.appendFileSync('server_debug.log', `Found parent incident: ${JSON.stringify(currentIncident)}\n`);

        // 2. Get next sub-reference number
        const refResult = await pool.request()
            .input('year', sql.Int, currentIncident.reference_year)
            .input('ref_num', sql.Int, currentIncident.reference_number)
            .query('SELECT ISNULL(MAX(reference_sub_number), 0) + 1 as next_sub_ref FROM incident WHERE reference_year = @year AND reference_number = @ref_num');

        const next_sub_ref = refResult.recordset[0].next_sub_ref;
        fs.appendFileSync('server_debug.log', `Calculated next_sub_ref: ${next_sub_ref}\n`);

        // 3. Insert new incident with copied data and new sub-reference
        fs.appendFileSync('server_debug.log', `Attempting to insert sub-incident...\n`);
        const insertResult = await pool.request()
            .input('reference_number', sql.Int, currentIncident.reference_number)
            .input('reference_year', sql.Int, currentIncident.reference_year)
            .input('reference_sub_number', sql.Int, next_sub_ref)
            .input('incident_date', sql.Date, currentIncident.incident_date)
            .input('status', sql.NVarChar, currentIncident.status)
            .input('description', sql.NVarChar, currentIncident.description)
            .input('ship_id', sql.Int, currentIncident.ship_id)
            .input('member_id', sql.Int, currentIncident.member_id)
            .input('owner_id', sql.Int, currentIncident.owner_id)
            .input('club_id', sql.Int, currentIncident.club_id)
            .input('handler_id', sql.Int, currentIncident.handler_id)
            .input('local_office_id', sql.Int, currentIncident.local_office_id)
            .input('type_id', sql.Int, currentIncident.type_id)
            .input('reporter_id', sql.Int, currentIncident.reporter_id)
            .input('local_agent_id', sql.Int, currentIncident.local_agent_id)
            .input('place_id', sql.Int, currentIncident.place_id)
            .input('closing_date', sql.Date, currentIncident.closing_date)
            .input('estimated_disposal_date', sql.Date, currentIncident.estimated_disposal_date)
            .input('berthing_date', sql.Date, currentIncident.berthing_date)
            .input('voyage_and_leg', sql.NVarChar, currentIncident.voyage_and_leg)
            .input('club_reference', sql.NVarChar, currentIncident.club_reference)
            .input('reporting_date', sql.Date, currentIncident.reporting_date)
            .input('time_bar_date', sql.Date, currentIncident.time_bar_date)
            .input('latest_report_date', sql.Date, currentIncident.latest_report_date)
            .input('latest_report_date', sql.Date, currentIncident.latest_report_date)
            .input('next_review_date', sql.Date, currentIncident.next_review_date)
            .input('now', sql.BigInt, Date.now())
            .query(`
                INSERT INTO incident (
                    reference_number, reference_year, reference_sub_number, incident_date, status, description, 
                    ship_id, member_id, owner_id, club_id, handler_id,
                    local_office_id, type_id, reporter_id, local_agent_id, place_id,
                    closing_date, estimated_disposal_date, berthing_date, voyage_and_leg,
                    club_reference, reporting_date, time_bar_date, latest_report_date, next_review_date,
                    created_date, last_modified_date
                )
                VALUES (
                    @reference_number, @reference_year, @reference_sub_number, @incident_date, @status, @description, 
                    @ship_id, @member_id, @owner_id, @club_id, @handler_id,
                    @local_office_id, @type_id, @reporter_id, @local_agent_id, @place_id,
                    @closing_date, @estimated_disposal_date, @berthing_date, @voyage_and_leg,
                    @club_reference, @reporting_date, @time_bar_date, @latest_report_date, @next_review_date,
                    @now, @now
                );
                SELECT SCOPE_IDENTITY() AS id;
            `);

        const newIncidentId = insertResult.recordset[0].id;
        fs.appendFileSync('server_debug.log', `Sub-incident created with ID: ${newIncidentId}\n`);

        res.status(201).json({
            message: 'Sub-incident created successfully',
            id: newIncidentId
        });

    } catch (err) {
        try {
            const fs = require('fs');
            fs.appendFileSync('server_debug.log', `Error creating sub-incident: ${err.message}\nStack: ${err.stack}\n`);
        } catch (logErr) {
            console.error('Failed to write to log:', logErr);
        }
        console.error('Error creating sub-incident:', err);
        res.status(500).send(err.message);
    }
});

// DELETE incident
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM incident WHERE id = @id');

        res.json({ message: 'Incident deleted successfully' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

module.exports = router;
