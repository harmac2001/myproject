require('dotenv').config();
const { sql, poolPromise } = require('./db');

async function checkIncident(id) {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT id, reference_number, created_date, last_modified_date 
                FROM incident 
                WHERE id = @id
            `);

        console.log('Incident Data:', result.recordset[0]);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

// ID from screenshot URL
checkIncident(102915);
