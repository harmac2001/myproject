require('dotenv').config();
const { sql, poolPromise } = require('./db');

async function checkIncidents() {
    try {
        const pool = await poolPromise;
        console.log('Connected to DB');

        // 1. Simple count
        const countResult = await pool.request().query('SELECT COUNT(*) as count FROM incident');
        console.log('Total incidents:', countResult.recordset[0].count);

        // 2. Run the actual query (simplified)
        // I will copy the query columns from incidents.js as closely as possible
        const query = `
            SELECT TOP 1
                i.id, 
                i.created_date,
                i.last_modified_date
            FROM incident i
        `;
        const result = await pool.request().query(query);
        if (result.recordset.length > 0) {
            console.log('Sample incident dates:', result.recordset[0]);
        } else {
            console.log('No incidents returned by TOP 1 query');
        }

    } catch (err) {
        console.error('Error executing query:', err);
    } finally {
        // We won't exit strictly to see if it hangs, but usually we should.
        process.exit();
    }
}

checkIncidents();
