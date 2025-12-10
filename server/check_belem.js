const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { sql, poolPromise } = require('./db');

async function checkBelem() {
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

        console.log('Connected to SQL Server');
        const result = await pool.request().query(`
            SELECT id, name, location, sharepoint_site_id, sharepoint_drive_id 
            FROM office 
            WHERE location LIKE '%Belem%' OR name LIKE '%Belem%'
        `);
        console.log('Belem Office:', result.recordset);
        pool.close();
    } catch (err) {
        console.error('Error:', err);
    }
}

checkBelem();
