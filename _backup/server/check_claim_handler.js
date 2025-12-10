const { sql, poolPromise } = require('./db');

async function checkColumns() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'claim_handler'
        `);
        const columns = result.recordset.map(row => row.COLUMN_NAME);
        console.log(columns.join(', '));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkColumns();
