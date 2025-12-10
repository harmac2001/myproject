const { sql, poolPromise } = require('./db');

async function checkCargoSchema() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'cargo_information'
        `);
        console.log(JSON.stringify(result.recordset.map(r => r.COLUMN_NAME), null, 2));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

checkCargoSchema();
