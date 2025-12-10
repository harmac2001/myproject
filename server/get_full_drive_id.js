const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { getAuthenticatedClient } = require('./services/graphService');

async function getFullId() {
    const userId = 'a0520749-cccb-4744-b210-3ab39ee098f9';
    const client = getAuthenticatedClient();

    try {
        const drive = await client.api(`/users/${userId}/drive`).select('id').get();
        console.log('FULL_DRIVE_ID_START');
        console.log(drive.id);
        console.log('FULL_DRIVE_ID_END');
    } catch (err) {
        console.error(err);
    }
}

getFullId();
