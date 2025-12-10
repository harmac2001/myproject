const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { sql, poolPromise } = require('./db');

async function checkIncidentDetails() {
    try {
        const pool = await poolPromise;
        const id = 102924; // ID from screenshot

        console.log(`Fetching incident ${id}...`);

        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT 
                    i.*, 
                    dbo.get_reference_number(i.id) as formatted_reference,
                    s.name as vessel_name, 
                    i.status,
                    o.name as office_name
                FROM incident i
                LEFT JOIN ship s ON i.ship_id = s.id
                LEFT JOIN office o ON i.local_office_id = o.id
                WHERE i.id = @id
            `);

        if (result.recordset.length > 0) {
            const row = result.recordset[0];
            console.log('Status found:', row.status);
            console.log('Full Row Keys:', Object.keys(row));
            console.log('Full Row:', row);
        } else {
            console.log('Incident not found');
        }

    } catch (err) {
        console.error('SQL Error:', err.message);
    }
}

checkIncidentDetails();
