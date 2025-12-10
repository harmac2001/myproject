const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { sql, poolPromise } = require('./db');

async function checkType() {
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

        const result = await pool.request().query('SELECT local_office_id FROM incident WHERE id = 102817');
        const id = result.recordset[0].local_office_id;

        console.log('Value:', id);
        console.log('Type:', typeof id);
        console.log('Strict Match (id === 4):', id === 4);

        pool.close();
    } catch (err) {
        console.error('Error:', err);
    }
}

checkType();
