require('dotenv').config();
const { sql, poolPromise } = require('./db');

async function inspect() {
    try {
        const pool = await poolPromise;
        console.log('\n--- Club Columns ---');
        const clubCols = await pool.request().query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'club'
        `);
        clubCols.recordset.forEach(row => console.log(row.COLUMN_NAME));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

inspect();
