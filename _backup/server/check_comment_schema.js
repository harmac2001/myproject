const { sql, poolPromise } = require('./db');

async function checkCommentSchema() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'comment'
        `);
        console.log(JSON.stringify(result.recordset.map(r => r.COLUMN_NAME), null, 2));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

checkCommentSchema();
