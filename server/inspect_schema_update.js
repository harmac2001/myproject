require('dotenv').config();
const { sql, poolPromise } = require('./db');

async function inspect() {
    try {
        const pool = await poolPromise;

        console.log('\n--- Invoice Columns ---');
        const invCols = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'invoice'
        `);
        invCols.recordset.forEach(row => console.log(`${row.COLUMN_NAME} (${row.DATA_TYPE})`));

        console.log('\n--- Expense Columns ---');
        const expCols = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'expense'
        `);
        expCols.recordset.forEach(row => console.log(`${row.COLUMN_NAME} (${row.DATA_TYPE})`));

        console.log('\n--- Fee Columns ---');
        const feeCols = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'fee'
        `);
        feeCols.recordset.forEach(row => console.log(`${row.COLUMN_NAME} (${row.DATA_TYPE})`));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

inspect();
