const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { getAuthenticatedClient } = require('./services/graphService');

async function findNewOffices() {
    const client = getAuthenticatedClient();
    const queries = ['PastasRec', 'PastasRio', 'Manaus'];

    for (const q of queries) {
        try {
            console.log(`\n--- Searching for Site: "${q}" ---`);
            const sites = await client.api(`/sites?search=${q}`)
                .select('id,displayName,webUrl')
                .get();

            if (sites.value.length === 0) {
                console.log('No sites found.');
            } else {
                for (const s of sites.value) {
                    console.log(`Site: ${s.displayName}`);
                    console.log(`  ID: ${s.id}`);
                    console.log(`  URL: ${s.webUrl}`);

                    // Try to get default drive
                    try {
                        const drive = await client.api(`/sites/${s.id}/drive`)
                            .select('id,webUrl')
                            .get();
                        console.log(`  Default Drive ID: ${drive.id}`);
                    } catch (dErr) {
                        console.log(`  Could not fetch default drive: ${dErr.message}`);
                    }
                }
            }
        } catch (err) {
            console.error(`Error searching for ${q}:`, err.message);
        }
    }
}

findNewOffices();
