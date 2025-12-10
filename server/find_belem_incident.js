const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { sql, poolPromise } = require('./db');

async function findBelemIncident() {
    try {
        const pool = await new sql.ConnectionPool({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            server: process.env.DB_SERVER,
            database: process.env.DB_NAME,
            options: {
                encrypt: false,
                trustServerCertificate: true,
                enableArithAbort: true
            }
        }).connect();

        const result = await pool.request().query(`
            SELECT TOP 5 i.id, dbo.get_reference_number(i.id) as ref, i.local_office_id 
            FROM incident i
            WHERE i.local_office_id = 4
            ORDER BY i.id DESC
        `);

        console.log('Belem Incidents:', result.recordset);
        pool.close();
    } catch (err) {
        console.error('Error:', err);
    }
}

findBelemIncident();
