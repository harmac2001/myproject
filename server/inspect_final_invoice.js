require('dotenv').config();
const { sql, poolPromise } = require('./db');

async function inspect() {
    try {
        const pool = await poolPromise;

        console.log('\n--- Invoice Columns ---');
        const invCols = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'invoice' AND COLUMN_NAME = 'final_invoice'
        `);

        if (invCols.recordset.length > 0) {
            console.log('Column found:', invCols.recordset[0]);
        } else {
            console.log('Column final_invoice NOT found in invoice table.');
            // List all columns to be sure
            const allCols = await pool.request().query(`
                SELECT COLUMN_NAME, DATA_TYPE 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'invoice'
            `);
            allCols.recordset.forEach(row => console.log(`${row.COLUMN_NAME} (${row.DATA_TYPE})`));
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

inspect();
