const { sql, poolPromise } = require('./db');
const fs = require('fs');

async function checkSchemas() {
    try {
        const pool = await poolPromise;
        let output = '';

        // Check ship table
        output += `\n=== SHIP TABLE SCHEMA ===\n`;
        const shipSchema = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'ship'
            ORDER BY ORDINAL_POSITION
        `);
        output += JSON.stringify(shipSchema.recordset, null, 2) + '\n';

        output += `\n--- Sample ship record ---\n`;
        const shipSample = await pool.request().query(`SELECT TOP 1 * FROM ship`);
        output += JSON.stringify(shipSample.recordset, null, 2) + '\n';

        // Check service_provider table
        output += `\n=== SERVICE_PROVIDER TABLE SCHEMA ===\n`;
        const spSchema = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'service_provider'
            ORDER BY ORDINAL_POSITION
        `);
        output += JSON.stringify(spSchema.recordset, null, 2) + '\n';

        output += `\n--- Sample service_provider record ---\n`;
        const spSample = await pool.request().query(`SELECT TOP 1 * FROM service_provider`);
        output += JSON.stringify(spSample.recordset, null, 2) + '\n';

        fs.writeFileSync('entity_schemas.txt', output);
        console.log('Schema information written to entity_schemas.txt');

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        process.exit();
    }
}

checkSchemas();
