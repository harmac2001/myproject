const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { sql, poolPromise } = require('./db');
const { getAuthenticatedClient } = require('./services/graphService');

async function updateBelem() {
    const userId = 'a0520749-cccb-4744-b210-3ab39ee098f9';

    try {
        // 1. Fetch Dynamic Drive ID
        console.log('Fetching Drive ID for user:', userId);
        const client = getAuthenticatedClient();
        const drive = await client.api(`/users/${userId}/drive`).select('id').get();
        const driveId = drive.id;
        console.log('Got Drive ID (length):', driveId.length);

        // 2. Update DB
        const pool = await new sql.ConnectionPool({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            server: process.env.DB_SERVER,
            database: process.env.DB_NAME,
            options: {
                encrypt: false,
                trustServerCertificate: true,
                enableArithAbort: true
            }
        }).connect();

        console.log('Connected to SQL Server');
        console.log(`Updating Belem Office (ID 4) with Drive ID...`);

        const result = await pool.request()
            .input('siteId', sql.NVarChar, userId) // Use User ID as Site ID placeholder
            .input('driveId', sql.NVarChar, driveId)
            .query(`
                UPDATE office 
                SET sharepoint_site_id = @siteId, sharepoint_drive_id = @driveId
                WHERE id = 4
            `);

        console.log('Update Result:', result);
        pool.close();
    } catch (err) {
        console.error('Error:', err.message);
    }
}

updateBelem();
