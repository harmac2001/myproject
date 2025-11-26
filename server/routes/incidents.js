const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../db');

// GET all incidents with optional search, filter, and pagination
router.get('/', async (req, res) => {
    try {
        const { search, status, office, page = 1, limit = 10 } = req.query;
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
            .query('SELECT *, dbo.get_reference_number(id) as formatted_reference FROM incident WHERE id = @id');

        if (result.recordset.length === 0) {
            return res.status(404).send('Incident not found');
        }

        res.json(result.recordset[0]);
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

        // Generate reference number based on current year and local_office_id
        const current_year = new Date().getFullYear();

        const refResult = await pool.request()
            .input('year', sql.Int, current_year)
            .input('office_id', sql.Int, local_office_id)
            .query('SELECT ISNULL(MAX(reference_number), 0) + 1 as next_ref FROM incident WHERE reference_year = @year AND local_office_id = @office_id');

        const next_ref = refResult.recordset[0].next_ref;

        await pool.request()
            .input('reference_number', sql.Int, next_ref)
            .input('reference_year', sql.Int, current_year)
            .input('reference_sub_number', sql.Int, 0)
            .input('incident_date', sql.Date, incident_date)
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
            .input('closing_date', sql.Date, closing_date)
            .input('estimated_disposal_date', sql.Date, estimated_disposal_date)
            .input('berthing_date', sql.Date, berthing_date)
            .input('voyage_and_leg', sql.NVarChar, voyage_and_leg)
            .input('club_reference', sql.NVarChar, club_reference)
            .input('reporting_date', sql.Date, reporting_date)
            .input('time_bar_date', sql.Date, time_bar_date)
            .input('latest_report_date', sql.Date, latest_report_date)
            .input('next_review_date', sql.Date, next_review_date)
            .query(`
                INSERT INTO incident (
                    reference_number, reference_year, reference_sub_number, incident_date, status, description, 
                    ship_id, member_id, owner_id, club_id, handler_id,
                    local_office_id, type_id, reporter_id, local_agent_id, place_id,
                    closing_date, estimated_disposal_date, berthing_date, voyage_and_leg,
                    club_reference, reporting_date, time_bar_date, latest_report_date, next_review_date
                )
                VALUES (
                    @reference_number, @reference_year, @reference_sub_number, @incident_date, @status, @description, 
                    @ship_id, @member_id, @owner_id, @club_id, @handler_id,
                    @local_office_id, @type_id, @reporter_id, @local_agent_id, @place_id,
                    @closing_date, @estimated_disposal_date, @berthing_date, @voyage_and_leg,
                    @club_reference, @reporting_date, @time_bar_date, @latest_report_date, @next_review_date
                )
            `);

        res.status(201).send({ message: 'Incident created successfully' });
    } catch (err) {
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

        await pool.request()
            .input('id', sql.Int, id)
            .input('incident_date', sql.Date, incident_date)
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
            .input('closing_date', sql.Date, closing_date)
            .input('estimated_disposal_date', sql.Date, estimated_disposal_date)
            .input('berthing_date', sql.Date, berthing_date)
            .input('voyage_and_leg', sql.NVarChar, voyage_and_leg)
            .input('club_reference', sql.NVarChar, club_reference)
            .input('reporting_date', sql.Date, reporting_date)
            .input('time_bar_date', sql.Date, time_bar_date)
            .input('latest_report_date', sql.Date, latest_report_date)
            .input('next_review_date', sql.Date, next_review_date)
            .query(`
                UPDATE incident 
                SET incident_date = @incident_date,
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
                    next_review_date = @next_review_date
                WHERE id = @id
            `);

        res.json({ message: 'Incident updated successfully' });
    } catch (err) {
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
