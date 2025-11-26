require('dotenv').config({ path: './server/.env' });
const { sql, poolPromise } = require('./server/db');

async function inspect() {
    try {
        const pool = await poolPromise;

        console.log('--- Tables ---');
        const tables = await pool.request().query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE'
        `);
        tables.recordset.forEach(row => console.log(row.TABLE_NAME));

        console.log('\n--- Incident Columns ---');
        const incidentCols = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'incident'
        `);
        incidentCols.recordset.forEach(row => console.log(`${row.COLUMN_NAME} (${row.DATA_TYPE})`));

        console.log('\n--- Club Columns ---');
        try {
            const clubCols = await pool.request().query(`
                SELECT COLUMN_NAME, DATA_TYPE 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'Club'
            `);
            clubCols.recordset.forEach(row => console.log(`${row.COLUMN_NAME} (${row.DATA_TYPE})`));
        } catch (e) { console.log('Club table not found'); }

        console.log('\n--- Claim_handler Columns ---');
        try {
            const handlerCols = await pool.request().query(`
                SELECT COLUMN_NAME, DATA_TYPE 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'Claim_handler'
            `);
            handlerCols.recordset.forEach(row => console.log(`${row.COLUMN_NAME} (${row.DATA_TYPE})`));
        } catch (e) { console.log('Claim_handler table not found'); }

        console.log('\n--- Functions ---');
        const funcs = await pool.request().query(`
            SELECT ROUTINE_NAME 
            FROM INFORMATION_SCHEMA.ROUTINES 
            WHERE ROUTINE_TYPE = 'FUNCTION'
        `);
        funcs.recordset.forEach(row => console.log(row.ROUTINE_NAME));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

inspect();
