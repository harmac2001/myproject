const { sql, poolPromise } = require('./db');
const fs = require('fs');

async function checkSchema() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                COLUMN_NAME, 
                DATA_TYPE, 
                CHARACTER_MAXIMUM_LENGTH, 
                IS_NULLABLE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'incident'
        `);

        console.log(JSON.stringify(result.recordset, null, 2));
        fs.writeFileSync('incident_schema.json', JSON.stringify(result.recordset, null, 2));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

checkSchema();
