const { sql, poolPromise } = require('./db');

async function checkSchema() {
    try {
        const pool = await poolPromise;

        const tables = ['disbursement', 'disbursement_type'];

        for (const table of tables) {
            console.log(`\n--- ${table} ---`);
            const result = await pool.request().query(`
                SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = '${table}'
            `);
            result.recordset.forEach(col => {
                console.log(`${col.COLUMN_NAME} (${col.DATA_TYPE})`);
            });
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

checkSchema();
