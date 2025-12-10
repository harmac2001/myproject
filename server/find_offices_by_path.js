const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { sql, poolPromise } = require('./db');
const { getAuthenticatedClient } = require('./services/graphService');

async function updateNewOffices() {
    const client = getAuthenticatedClient();
    const targets = [
        { name: 'Recife', path: 'PastasRec', officeId: 2 },
        { name: 'Rio', path: 'PastasRio', officeId: 5 },
        { name: 'Manaus', path: 'Manaus', officeId: 3 }
    ];
    const hostname = 'proinde.sharepoint.com';

    try {
        const pool = await poolPromise;

        for (const t of targets) {
            console.log(`\nProcessing ${t.name} (ID ${t.officeId})...`);

            // 1. Fetch IDs
            try {
                const endpoint = `/sites/${hostname}:/sites/${t.path}`;
                const site = await client.api(endpoint).select('id').get();
                const drive = await client.api(`/sites/${site.id}/drive`).select('id').get();

                console.log(`  Site ID: ${site.id}`);
                console.log(`  Drive ID: ${drive.id}`);

                // 2. Update DB
                await pool.request()
                    .input('siteId', sql.NVarChar, site.id)
                    .input('driveId', sql.NVarChar, drive.id)
                    .query(`
                        UPDATE office 
                        SET sharepoint_site_id = @siteId, sharepoint_drive_id = @driveId
                        WHERE id = ${t.officeId}
                    `);
                console.log(`  Database Updated!`);

            } catch (err) {
                console.error(`  Failed to process ${t.name}:`, err.message);
            }
        }
    } catch (err) {
        console.error('Script Error:', err);
    }
}

updateNewOffices();
