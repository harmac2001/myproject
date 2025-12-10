const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { sql, poolPromise } = require('./db');

async function verifyConfig() {
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
            SELECT id, name, sharepoint_site_id, sharepoint_drive_id 
            FROM office 
            WHERE id IN (2, 3, 5)
        `);

        console.log('Office Configuration:');
        result.recordset.forEach(o => {
            const hasSite = !!o.sharepoint_site_id;
            const hasDrive = !!o.sharepoint_drive_id;
            console.log(`[${o.id}] ${o.name}: S=${hasSite}, D=${hasDrive}`);
        });

        pool.close();
    } catch (err) {
        console.error('Error:', err);
    }
}

verifyConfig();
