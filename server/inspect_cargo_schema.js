const sql = require('mssql');
const { poolPromise } = require('./db');

async function inspect() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                COLUMN_NAME, 
                DATA_TYPE 
            FROM 
                INFORMATION_SCHEMA.COLUMNS 
            WHERE 
                TABLE_NAME = 'cargo_information'
        `);
        console.table(result.recordset);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

inspect();
