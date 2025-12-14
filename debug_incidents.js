const { sql, poolPromise } = require('./server/db');

async function checkIncidents() {
    try {
        const pool = await poolPromise;

        // 1. Simple count
        const countResult = await pool.request().query('SELECT COUNT(*) as count FROM incident');
        console.log('Total incidents:', countResult.recordset[0].count);

        // 2. Run the actual query (simplified)
        const query = `
            SELECT TOP 1
                i.id, 
                i.created_date,
                i.last_modified_date
            FROM incident i
        `;
        const result = await pool.request().query(query);
        console.log('Sample incident dates:', result.recordset[0]);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

checkIncidents();
