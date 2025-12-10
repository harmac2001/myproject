const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { sql, poolPromise } = require('./db');

async function listTables() {
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
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE'
        `);

        console.log('Tables:');
        result.recordset.forEach(row => console.log(`- ${row.TABLE_NAME}`));

        pool.close();
    } catch (err) {
        console.error('Error:', err);
    }
}

listTables();
