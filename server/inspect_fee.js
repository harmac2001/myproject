const { sql, poolPromise } = require('./db');

async function inspectFee() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'fee'
        `);
        console.log('Fee Columns:', result.recordset.map(r => r.COLUMN_NAME));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

inspectFee();
