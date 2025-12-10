const { sql, poolPromise } = require('./db');
const fs = require('fs');

async function checkRelatedSchemas() {
    try {
        const pool = await poolPromise;
        const tables = ['cargo_information', 'claim_details', 'cargo_type', 'loss_type', 'loss_cause', 'claimant'];

        for (const table of tables) {
            console.log(`\n--- Schema for ${table} ---`);
            const result = await pool.request().query(`
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = '${table}'
            `);
            console.log(result.recordset.map(r => r.COLUMN_NAME).join(', '));
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

checkRelatedSchemas();
