const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        connectTimeout: 30000 // 30 seconds
    }
};

async function run() {
    try {
        const pool = await new sql.ConnectionPool(config).connect();

        // Check if column exists
        const check = await pool.request().query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'invoice' AND COLUMN_NAME = 'recipient_details'
        `);

        if (check.recordset.length === 0) {
            console.log('Adding recipient_details column...');
            await pool.request().query(`
                ALTER TABLE invoice
                ADD recipient_details NVARCHAR(MAX)
            `);
            console.log('Column added.');
        } else {
            console.log('Column recipient_details already exists.');
        }

        process.exit(0);
    } catch (err) {
        console.error('Error adding column:', err);
        process.exit(1);
    }
}

run();
