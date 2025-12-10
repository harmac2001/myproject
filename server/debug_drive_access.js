const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { getAuthenticatedClient } = require('./services/graphService');

async function debugDrive() {
    // The ID we updated
    const driveId = 'b!fnAm8QH-60qJy8ApZdryo3_wFrkDtVxEnZLY-x5e4oz';
    const userId = 'a0520749-cccb-4744-b210-3ab39ee098f9'; // Owner ID from Step 869

    const client = getAuthenticatedClient();

    console.log(`Debug Drive Access`);
    console.log(`Drive ID: ${driveId} (Length: ${driveId.length})`);
    console.log(`User ID: ${userId}`);

    // 1. Check Drive Metadata via /drives/{id}
    try {
        console.log('\n--- Test 1: GET /drives/{id} ---');
        const meta = await client.api(`/drives/${driveId}`).get();
        console.log('Success! Drive Type:', meta.driveType);
        console.log('Web URL:', meta.webUrl);
    } catch (err) {
        console.error('Test 1 Failed:', err.message);
    }

    // 2. Check Drive Root via /drives/{id}/root
    try {
        console.log('\n--- Test 2: GET /drives/{id}/root/children (Top 1) ---');
        const root = await client.api(`/drives/${driveId}/root/children`).top(1).get();
        console.log('Success! Found items:', root.value.length);
        if (root.value.length > 0) console.log('First item:', root.value[0].name);
    } catch (err) {
        console.error('Test 2 Failed:', err.message);
    }

    // 3. Fallback Test: Check via /users/{id}/drive
    try {
        console.log('\n--- Test 3: GET /users/{userId}/drive ---');
        const userDrive = await client.api(`/users/${userId}/drive`).get();
        console.log('Success! ID from User route:', userDrive.id);
        console.log('Match?', driveId === userDrive.id);
    } catch (err) {
        console.error('Test 3 Failed:', err.message);
    }
}

debugDrive();
