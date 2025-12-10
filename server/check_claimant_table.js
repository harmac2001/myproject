const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const sql = require('mssql');

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

async function checkTables() {
    try {
        const pool = await new sql.ConnectionPool(config).connect();
        console.log('Connected to SQL Server');

        const result = await pool.request().query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_NAME = 'claimant'
        `);
        console.log('Claimant table found:', result.recordset);

        if (result.recordset.length > 0) {
            const columns = await pool.request().query(`
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'claimant'
            `);
            console.log('Columns:', columns.recordset);
        }

        pool.close();
    } catch (err) {
        console.error('Error:', err);
    }
}

checkTables();
