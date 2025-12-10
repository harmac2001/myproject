const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { getAuthenticatedClient } = require('./services/graphService');

async function checkSubfolder() {
    const driveId = 'b!fnAm8QH-60qJy8ApZdryo3_wFrkDtVxEnZLY-x5e4ozBxPKWd0uHTLFqPkGyDTUz';
    const client = getAuthenticatedClient();
    const subpath = 'BELEM/Pastas (BELEM)';

    try {
        console.log(`Checking path: ${subpath}...`);
        // Get metadata for this specific path
        const item = await client.api(`/drives/${driveId}/root:/${subpath}`)
            .select('id,name,folder,webUrl')
            .get();

        console.log('Folder Found!');
        console.log(`ID: ${item.id}`);
        console.log(`WebURL: ${item.webUrl}`);

        // List children to verify access
        const children = await client.api(`/drives/${driveId}/items/${item.id}/children`)
            .top(5)
            .select('name')
            .get();

        console.log('Children (Top 5):');
        children.value.forEach(c => console.log(`- ${c.name}`));

    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkSubfolder();
