const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { getAuthenticatedClient } = require('./services/graphService');

async function findIds() {
    const client = getAuthenticatedClient();

    // 1. Try Sites First (often easier permissions)
    try {
        console.log('\n--- SITES (Search "Proinde" or "Belem") ---');
        // Search for sites matching 'Proinde'
        const sites = await client.api('/sites?search=Proinde')
            .select('id,displayName,webUrl')
            .get();

        sites.value.forEach(s => {
            console.log(`Site: ${s.displayName} - ID: ${s.id} - URL: ${s.webUrl}`);
        });

    } catch (err) {
        console.error('Error fetching Sites:', err.message);
    }

    // 2. Try to find a user named 'Belem'
    try {
        console.log('\n--- USERS (Search "Belem") ---');
        // Filter users by name match
        const users = await client.api('/users')
            .filter("startswith(displayName, 'Belem') or startswith(userPrincipalName, 'belem')")
            .select('id,displayName,userPrincipalName,mail')
            .get();

        if (users.value.length === 0) {
            console.log('No users found matching "Belem". Try searching by display name manually?');
        } else {
            users.value.forEach(u => {
                console.log(`User: ${u.displayName} (${u.userPrincipalName}) - ID: ${u.id}`);
            });
        }
    } catch (err) {
        console.error('Error fetching Users:', err.message);
    }
}

findIds();
