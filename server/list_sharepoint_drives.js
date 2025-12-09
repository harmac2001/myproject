require('dotenv').config();
const { ClientSecretCredential } = require('@azure/identity');
require('isomorphic-fetch');

async function run() {
    const siteId = process.argv[2];
    if (!siteId) {
        console.error('Please provide a Site ID as an argument.');
        process.exit(1);
    }

    console.log(`Getting token for Site: ${siteId}...`);
    const credential = new ClientSecretCredential(
        process.env.AZURE_TENANT_ID,
        process.env.AZURE_CLIENT_ID,
        process.env.AZURE_CLIENT_SECRET
    );

    try {
        const tokenResponse = await credential.getToken('https://graph.microsoft.com/.default');
        const token = tokenResponse.token;

        console.log('Token acquired. Fetching drives...');
        const response = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/drives`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Graph API Error: ${response.status} ${response.statusText}\n${errorText}`);
        }

        const data = await response.json();
        console.log('\n--- Documents Libraries ---');
        if (data.value && data.value.length > 0) {
            data.value.forEach(drive => {
                console.log(`\nName: ${drive.name}`);
                console.log(`ID: ${drive.id}`);
                console.log(`URL: ${drive.webUrl}`);
            });
            console.log('\n---------------------------');
        } else {
            console.log('No drives found.');
        }

    } catch (err) {
        console.error('Error:', err.message);
    }
}

run();
