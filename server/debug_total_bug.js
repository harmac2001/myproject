const { poolPromise } = require('./db');
const sql = require('mssql');

async function debugTotal() {
    try {
        const pool = await poolPromise;
        const request = pool.request();

        const search = "long"; // As per user screenshot
        const searchTerm = `%${search}%`; // trimmed or not
        const status = 'All';
        const office = '1';

        let whereClause = 'WHERE 1=1';

        // Filters (Simplified version of incidents.js logic)
        // Office
        whereClause += ` AND i.local_office_id IN (1)`;

        // Search
        request.input('search', sql.NVarChar, searchTerm);
        whereClause += ` AND s.name LIKE @search`;

        const query = `
            SELECT 
                i.id, 
                s.name as ship_name,
                (SELECT COUNT(*) FROM incident i
                 LEFT JOIN ship s ON i.ship_id = s.id
                 LEFT JOIN office o ON i.local_office_id = o.id
                 ${whereClause}
                ) as total_count 
            FROM incident i
            LEFT JOIN ship s ON i.ship_id = s.id
            LEFT JOIN office o ON i.local_office_id = o.id
            ${whereClause}
            ORDER BY i.id DESC
            OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY
        `;

        console.log("Query:", query);
        const result = await request.query(query);
        console.log("Records Found:", result.recordset.length);
        if (result.recordset.length > 0) {
            console.log("First Record:", result.recordset[0]);
            console.log("Total Count from Subquery:", result.recordset[0].total_count);
        } else {
            console.log("No records found.");
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

debugTotal();
