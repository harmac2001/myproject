const { sql, poolPromise } = require('./db');

async function inspectContact() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'contact'
        `);
        console.log(result.recordset);
    } catch (err) {
        console.error(err);
    }
}

inspectContact();
