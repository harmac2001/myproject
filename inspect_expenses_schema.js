require('dotenv').config({ path: './server/.env' });
const { sql, poolPromise } = require('./server/db');

async function inspect() {
    try {
        const pool = await poolPromise;

        const tablesToCheck = ['account_chart', 'expense', 'service_provider'];

        for (const tableName of tablesToCheck) {
            console.log(`\n--- ${tableName} Columns ---`);
            try {
                const cols = await pool.request().query(`
                    SELECT COLUMN_NAME, DATA_TYPE 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_NAME = '${tableName}'
                `);
                if (cols.recordset.length === 0) {
                    console.log(`Table '${tableName}' not found or has no columns.`);
                } else {
                    cols.recordset.forEach(row => console.log(`${row.COLUMN_NAME} (${row.DATA_TYPE})`));
                }
            } catch (e) {
                console.log(`Error checking table ${tableName}:`, e.message);
            }
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

inspect();
