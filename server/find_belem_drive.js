const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { getAuthenticatedClient } = require('./services/graphService');

async function findBelemDrive() {
    const email = 'proinde.belem@proinde.com.br';
    const client = getAuthenticatedClient();

    try {
        console.log(`Attempting to fetch Default Drive for: ${email}...`);

        // Try accessing drive directly using UPN
        const drive = await client.api(`/users/${email}/drive`)
            .select('id,webUrl,owner')
            .get();

        console.log('--- SUCCESS ---');
        console.log(`Drive Found!`);
        console.log(`Drive ID: ${drive.id}`);
        console.log(`Web URL: ${drive.webUrl}`);

        if (drive.owner && drive.owner.user) {
            console.log(`Owner ID: ${drive.owner.user.id}`);
            console.log(`Owner Name: ${drive.owner.user.displayName}`);
        } else {
            console.log('Owner info not returned (likely due to permissions), but we have the Drive ID.');
        }

    } catch (err) {
        console.error('Error:', err.message);
        if (err.statusCode === 403 || err.statusCode === 401) {
            console.error('Do not have permission to access User Drives. App likely needs "Files.Read.All" or "Files.ReadWrite.All" granted by Admin.');
        }
    }
}

findBelemDrive();
