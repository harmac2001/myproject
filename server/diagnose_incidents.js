const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { sql, poolPromise } = require('./db');

async function diagnoseIncidents() {
    try {
        const pool = await poolPromise;
        const request = pool.request();

        const page = 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        // Replicate logic from incidents.js
        let query = `
            SELECT 
                i.id, 
                i.reference_number, 
                dbo.get_reference_number(i.id) as formatted_reference,
                s.name as vessel_name, 
                i.description, 
                i.status, 
                o.name as office_name,
                i.created_date,
                (SELECT COUNT(*) FROM incident i
                 LEFT JOIN ship s ON i.ship_id = s.id
                 LEFT JOIN office o ON i.local_office_id = o.id
                 WHERE 1=1
        `;

        // No filters for this test
        // query += ` AND i.status = @status`; 

        query += `) as total_count FROM incident i
            LEFT JOIN ship s ON i.ship_id = s.id
            LEFT JOIN office o ON i.local_office_id = o.id
            WHERE 1=1`;

        // No filters

        query += `
            ORDER BY i.created_date DESC
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `;

        request.input('offset', sql.Int, parseInt(offset));
        request.input('limit', sql.Int, parseInt(limit));

        console.log('--- Executing SQL ---');
        console.log(query);
        console.log('---------------------');

        const result = await request.query(query);

        console.log(`Rows returned: ${result.recordset.length}`);
        if (result.recordset.length > 0) {
            console.log('First row:', result.recordset[0]);
        } else {
            console.log('No rows found.');
        }

    } catch (err) {
        console.error('SQL Error:', err.message);
    }
}

diagnoseIncidents();
