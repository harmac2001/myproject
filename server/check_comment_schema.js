const { sql, poolPromise } = require('./db');

async function checkSchema() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                TABLE_NAME, 
                COLUMN_NAME, 
                DATA_TYPE, 
                CHARACTER_MAXIMUM_LENGTH,
                IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'comment'
        `);
        console.log(JSON.stringify(result.recordset, null, 2));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        // Close connection if needed, but for this script we can just exit
        process.exit();
    }
}

checkSchema();
