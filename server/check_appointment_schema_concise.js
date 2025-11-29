const { sql, poolPromise } = require('./db');

async function checkSchemas() {
    try {
        const pool = await poolPromise;

        console.log('--- appointment ---');
        const r1 = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'appointment'");
        console.log(r1.recordset.map(r => r.COLUMN_NAME).join(', '));

        console.log('\n--- service_provider ---');
        const r2 = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'service_provider'");
        console.log(r2.recordset.map(r => r.COLUMN_NAME).join(', '));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

checkSchemas();
