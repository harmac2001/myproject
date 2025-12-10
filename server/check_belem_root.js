const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { getAuthenticatedClient } = require('./services/graphService');

async function checkRoot() {
    const driveId = 'b!fnAm8QH-60qJy8ApZdryo3_wFrkDtVxEnZLY-x5e4ozBxPKWd0uHTLFqPkGyDTUz';
    const client = getAuthenticatedClient();

    try {
        console.log('Listing Root of Belem Drive...');
        const root = await client.api(`/drives/${driveId}/root/children`)
            .select('id,name,folder,webUrl')
            .get();

        console.log('Items found:', root.value.length);
        root.value.forEach(i => {
            console.log(`- ${i.name} (${i.folder ? 'Folder' : 'File'})`);
        });

    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkRoot();
