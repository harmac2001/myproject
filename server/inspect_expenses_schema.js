require('dotenv').config();
const { sql, poolPromise } = require('./db');

async function inspect() {
    try {
        const pool = await poolPromise;

        const tablesToCheck = ['dollar_rate'];

        for (const tableName of tablesToCheck) {
            console.log(`\n--- ${tableName} Columns ---`);
            try {
                const cols = await pool.request().query(`
                    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_NAME = '${tableName}'
                `);
                if (cols.recordset.length === 0) {
                    console.log(`Table '${tableName}' not found or has no columns.`);
                } else {
                    cols.recordset.forEach(row => console.log(`${row.COLUMN_NAME} (${row.DATA_TYPE}) - Nullable: ${row.IS_NULLABLE} - Default: ${row.COLUMN_DEFAULT}`));
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
