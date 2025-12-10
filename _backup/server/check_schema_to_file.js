const { sql, poolPromise } = require('./db');
const fs = require('fs');

async function checkSchemas() {
    try {
        const pool = await poolPromise;
        let output = '';

        output += '--- appointment ---\n';
        const r1 = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'appointment'");
        output += r1.recordset.map(r => r.COLUMN_NAME).join('\n') + '\n';

        output += '\n--- service_provider ---\n';
        const r2 = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'service_provider'");
        output += r2.recordset.map(r => r.COLUMN_NAME).join('\n') + '\n';

        fs.writeFileSync('schema_output.txt', output);
        console.log('Schema written to schema_output.txt');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

checkSchemas();
