const { sql, poolPromise } = require('./db');

async function checkSchema() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT COLUMN_NAME, IS_NULLABLE, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'incident'
        `);
        const fs = require('fs');
        const lines = result.recordset.map(row => `${row.COLUMN_NAME}: ${row.IS_NULLABLE} (${row.DATA_TYPE})`);
        fs.writeFileSync('schema_dump.txt', lines.join('\n'));
        console.log('Schema written to schema_dump.txt');
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkSchema();
