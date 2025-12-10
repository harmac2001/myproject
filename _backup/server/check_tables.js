const { sql, poolPromise } = require('./db');

async function checkTables() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE'
            ORDER BY TABLE_NAME
        `);
        result.recordset.forEach(row => console.log(row.TABLE_NAME));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkTables();
