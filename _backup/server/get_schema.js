const { sql, poolPromise } = require('./db');

async function getSchema() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'incident'
        `);
        const fs = require('fs');
        fs.writeFileSync('schema.json', JSON.stringify(result.recordset, null, 2));
        console.log('Schema written to schema.json');
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

getSchema();
