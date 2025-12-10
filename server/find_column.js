const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { sql, poolPromise } = require('./db');

async function findTableByColumn() {
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
            .input('columnName', sql.NVarChar, 'status_name')
            .query(`
                SELECT TABLE_NAME, COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE COLUMN_NAME = @columnName
            `);

        console.log('Matches:');
        result.recordset.forEach(row => console.log(`- Table: ${row.TABLE_NAME}, Column: ${row.COLUMN_NAME}`));

        pool.close();
    } catch (err) {
        console.error('Error:', err);
    }
}

findTableByColumn();
