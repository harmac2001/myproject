const { sql, poolPromise } = require('./db');
const fs = require('fs');

async function checkServiceProviders() {
    try {
        const pool = await poolPromise;
        let output = '';

        // Check data type of is_consultant
        output += '--- Column Info for is_consultant ---\n';
        const colInfo = await pool.request().query(`
            SELECT DATA_TYPE, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'service_provider' AND COLUMN_NAME = 'is_consultant'
        `);
        output += JSON.stringify(colInfo.recordset, null, 2) + '\n';

        // Check all service providers
        output += '\n--- All Service Providers ---\n';
        const allProviders = await pool.request().query(`
            SELECT id, name, friendly_name, is_consultant
            FROM service_provider
        `);
        output += JSON.stringify(allProviders.recordset, null, 2) + '\n';

        // Check specifically where is_consultant = 1
        output += '\n--- Service Providers where is_consultant = 1 ---\n';
        const consultants = await pool.request().query(`
            SELECT id, friendly_name as name 
            FROM service_provider 
            WHERE is_consultant = 1 
            ORDER BY friendly_name
        `);
        output += 'Count: ' + consultants.recordset.length + '\n';
        output += JSON.stringify(consultants.recordset, null, 2) + '\n';

        fs.writeFileSync('service_provider_check.txt', output);
        console.log('Data written to service_provider_check.txt');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

checkServiceProviders();
