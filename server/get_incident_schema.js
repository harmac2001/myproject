const { sql, poolPromise } = require('./db');

async function getSchema() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT COLUMN_NAME, IS_NULLABLE, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'incident'
        `);
        const nonNullable = result.recordset.filter(c => c.IS_NULLABLE === 'NO');
        console.log(JSON.stringify(nonNullable, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

getSchema();
