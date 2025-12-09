require('dotenv').config();
const { ClientSecretCredential } = require('@azure/identity');

async function run() {
    console.log('Fetching token to inspect permissions...');
    const credential = new ClientSecretCredential(
        process.env.AZURE_TENANT_ID,
        process.env.AZURE_CLIENT_ID,
        process.env.AZURE_CLIENT_SECRET
    );

    try {
        const tokenResponse = await credential.getToken('https://graph.microsoft.com/.default');
        const token = tokenResponse.token;

        // Simple JWT decode (middle part)
        const parts = token.split('.');
        if (parts.length !== 3) {
            console.log('Token is not a standard JWT.');
            return;
        }

        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        console.log('--- Token Claims ---');
        console.log('Roles:', payload.roles);
        console.log('App ID:', payload.appid);
        console.log('--------------------');

        if (!payload.roles || payload.roles.length === 0) {
            console.error('WARNING: No roles found in token. You likely need to click "Grant admin consent" in Azure Portal.');
        } else {
            console.log('Roles found. Permissions seem configured.');
        }

    } catch (err) {
        console.error('Error:', err.message);
    }
}

run();
