require('dotenv').config();
const { sql, poolPromise } = require('./db');

async function checkColumns() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'invoice'
        `);
        console.log('Invoice Columns:', result.recordset.map(row => row.COLUMN_NAME));
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

checkColumns();
