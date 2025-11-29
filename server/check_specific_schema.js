const { sql, poolPromise } = require('./db');
const fs = require('fs');

async function checkSchema() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT COLUMN_NAME, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'incident' AND COLUMN_NAME IN ('reporter_id', 'owner_id', 'berthing_date')
        `);

        let output = 'Column Nullability:\n';
        result.recordset.forEach(row => {
            output += `${row.COLUMN_NAME}: ${row.IS_NULLABLE}\n`;
        });

        fs.writeFileSync('schema_check.txt', output);
        console.log(output);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkSchema();
