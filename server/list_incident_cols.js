const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { sql, poolPromise } = require('./db');

async function listIncidentColumns() {
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

        const result = await pool.request()
            .input('tableName', sql.NVarChar, 'incident')
            .query(`
                SELECT COLUMN_NAME, DATA_TYPE 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = @tableName
            `);

        console.log('Incident Columns:');
        result.recordset.forEach(row => console.log(`- ${row.COLUMN_NAME} (${row.DATA_TYPE})`));

        pool.close();
    } catch (err) {
        console.error('Error:', err);
    }
}

listIncidentColumns();
