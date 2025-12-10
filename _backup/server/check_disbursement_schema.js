const { sql, poolPromise } = require('./db');

async function checkSchema() {
    try {
        const pool = await poolPromise;

        console.log('Checking disbursement_type table...');
        const typeResult = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'disbursement_type'
        `);
        if (typeResult.recordset.length > 0) {
            console.log('disbursement_type columns:', typeResult.recordset);
        } else {
            console.log('disbursement_type table does not exist.');
        }

        console.log('Checking disbursement table...');
        const disbResult = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'disbursement'
        `);
        if (disbResult.recordset.length > 0) {
            console.log('disbursement columns:', disbResult.recordset);
        } else {
            console.log('disbursement table does not exist.');
        }

    } catch (err) {
        console.error('Error checking schema:', err);
    } finally {
        process.exit();
    }
}

checkSchema();
