const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { sql, poolPromise } = require('./db');

async function checkIncident() {
    try {
        const pool = await poolPromise;
        const id = 102868;

        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT i.id, i.club_id, c.name as club_name, c.code as club_code
                FROM incident i
                LEFT JOIN club c ON i.club_id = c.id
                WHERE i.id = @id
            `);

        console.log('Incident Data:', result.recordset[0]);
    } catch (err) {
        console.error('SQL Error:', err);
    }
}

checkIncident();
