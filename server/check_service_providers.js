const { sql, poolPromise } = require('./db');

async function checkServiceProviders() {
    try {
        const pool = await poolPromise;

        // Check data type of is_consultant
        console.log('--- Column Info for is_consultant ---');
        const colInfo = await pool.request().query(`
            SELECT DATA_TYPE, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'service_provider' AND COLUMN_NAME = 'is_consultant'
        `);
        console.log(JSON.stringify(colInfo.recordset, null, 2));

        // Check all service providers
        console.log('\n--- All Service Providers ---');
        const allProviders = await pool.request().query(`
            SELECT id, name, friendly_name, is_consultant
            FROM service_provider
        `);
        console.log(JSON.stringify(allProviders.recordset, null, 2));

        // Check specifically where is_consultant = 1
        console.log('\n--- Service Providers where is_consultant = 1 ---');
        const consultants = await pool.request().query(`
            SELECT id, friendly_name as name 
            FROM service_provider 
            WHERE is_consultant = 1 
            ORDER BY friendly_name
        `);
        console.log('Count:', consultants.recordset.length);
        console.log(JSON.stringify(consultants.recordset, null, 2));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

checkServiceProviders();
