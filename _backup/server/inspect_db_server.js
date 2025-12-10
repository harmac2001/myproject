const { sql, poolPromise } = require('./db');
const fs = require('fs');

async function inspect() {
    try {
        const pool = await poolPromise;
        let output = '';

        output += '--- Incident Columns ---\n';
        const incidentCols = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'incident'
        `);
        incidentCols.recordset.forEach(row => output += `${row.COLUMN_NAME} (${row.DATA_TYPE})\n`);

        output += '\n--- Functions ---\n';
        const funcs = await pool.request().query(`
            SELECT ROUTINE_NAME 
            FROM INFORMATION_SCHEMA.ROUTINES 
            WHERE ROUTINE_TYPE = 'FUNCTION'
        `);
        funcs.recordset.forEach(row => output += `${row.ROUTINE_NAME}\n`);

        fs.writeFileSync('schema_info.txt', output);
        console.log('Schema info written to schema_info.txt');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

inspect();
