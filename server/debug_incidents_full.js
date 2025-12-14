require('dotenv').config();
const { sql, poolPromise } = require('./db');

async function checkFullQuery() {
    try {
        const pool = await poolPromise;
        console.log('Connected to DB');

        const query = `
            SELECT TOP 10
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

        const result = await pool.request().query(query);
        console.log('Query successful. Rows:', result.recordset.length);
        if (result.recordset.length > 0) {
            console.log('Sample Row:', result.recordset[0]);
        }

    } catch (err) {
        console.error('Error executing FULL query:', err);
    } finally {
        process.exit();
    }
}

checkFullQuery();
