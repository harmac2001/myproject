const { sql, poolPromise } = require('./db');

async function verifyIncident() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT i.id, i.local_office_id, o.name as office_name, o.id as office_id
            FROM incident i 
            JOIN office o ON i.local_office_id = o.id 
            WHERE i.id = 67557
        `);
        console.log('Incident 67557:', JSON.stringify(result.recordset[0], null, 2));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

verifyIncident();
