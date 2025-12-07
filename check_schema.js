const { sql, poolPromise } = require('./server/db');

async function checkSchema() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'invoice'");
        console.log('Columns in invoice table:', result.recordset.map(r => r.COLUMN_NAME));
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

checkSchema();
