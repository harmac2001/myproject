require('dotenv').config();
const { ClientSecretCredential } = require('@azure/identity');

async function run() {
    console.log('Testing authentication...');
    const credential = new ClientSecretCredential(
        process.env.AZURE_TENANT_ID,
        process.env.AZURE_CLIENT_ID,
        process.env.AZURE_CLIENT_SECRET
    );

    try {
        console.log('Requesting token...');
        const token = await credential.getToken('https://graph.microsoft.com/.default');
        console.log('Token received successfully!');
        console.log('Token expires on:', token.expiresOnTimestamp);
    } catch (err) {
        console.error('Authentication Failed:', err.message);
        console.error('Details:', JSON.stringify(err, null, 2));
    }
}

run();
