const { poolPromise } = require('./db');

async function debugOfficeSchema() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'local_office'
        `);
        console.log(JSON.stringify(result.recordset, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

debugOfficeSchema();
