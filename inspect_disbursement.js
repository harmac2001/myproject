require('dotenv').config({ path: './server/.env' });
const { sql, poolPromise } = require('./server/db');

async function inspect() {
    try {
        const pool = await poolPromise;

        console.log('\n--- Disbursement Columns ---');
        const cols = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'disbursement'
        `);
        cols.recordset.forEach(row => console.log(`${row.COLUMN_NAME} (${row.DATA_TYPE}) - Nullable: ${row.IS_NULLABLE}`));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

inspect();
