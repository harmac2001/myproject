const { sql, poolPromise } = require('./db');

async function checkSchemas() {
    try {
        const pool = await poolPromise;
        const tables = ['appointment', 'service_provider'];

        for (const table of tables) {
            console.log(`\n--- Schema for ${table} ---`);
            const result = await pool.request().query(`
                SELECT COLUMN_NAME, DATA_TYPE 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = '${table}'
            `);
            console.log(JSON.stringify(result.recordset, null, 2));
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

checkSchemas();
