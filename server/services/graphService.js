require('isomorphic-fetch');
const { Client } = require('@microsoft/microsoft-graph-client');
const { ClientSecretCredential } = require('@azure/identity');

// Initialize the Graph Client with Client Secret Credential
// Requires AZURE_TENANT_ID, AZURE_CLIENT_ID, and AZURE_CLIENT_SECRET in .env
const getAuthenticatedClient = () => {
    if (!process.env.AZURE_TENANT_ID || !process.env.AZURE_CLIENT_ID || !process.env.AZURE_CLIENT_SECRET) {
        throw new Error('Azure AD credentials are not configured in environment variables.');
    }

    const credential = new ClientSecretCredential(
        process.env.AZURE_TENANT_ID,
        process.env.AZURE_CLIENT_ID,
        process.env.AZURE_CLIENT_SECRET
    );

    const client = Client.initWithMiddleware({
        authProvider: {
            getAccessToken: async () => {
                const token = await credential.getToken('https://graph.microsoft.com/.default');
                return token.token;
            }
        }
    });

    return client;
};

// Function to create a folder in a specific drive
const createFolder_v1 = async (driveId, parentId, folderName) => {
    const client = getAuthenticatedClient();

    const driveItem = {
        name: folderName,
        folder: {},
        '@microsoft.graph.conflictBehavior': 'rename'
    };

    // If parentId is 'root', use /drives/{drive-id}/root/children
    // Else use /drives/{drive-id}/items/{parent-id}/children
    const endpoint = parentId === 'root'
        ? `/drives/${driveId}/root/children`
        : `/drives/${driveId}/items/${parentId}/children`;

    return await client.api(endpoint).post(driveItem);
};

// Function to create a folder by Site ID and Drive ID
// If specific parent path is needed, logic can be extended
// Helper to ensure a folder exists (create if not found, return ID)
const ensureFolder = async (client, driveId, parentId, folderName) => {
    try {
        // Strategy: Try to get by path first, as it's cleaner than filtering
        // Standard path syntax: /drives/{driveId}/items/{parentId}:/{childName}
        // Special case for root: /drives/{driveId}/root:/{childName}

        let pathUrl;
        if (parentId === 'root') {
            pathUrl = `/drives/${driveId}/root:/${folderName}`;
        } else {
            pathUrl = `/drives/${driveId}/items/${parentId}:/${folderName}`;
        }

        try {
            const existing = await client.api(pathUrl).get();
            return existing.id;
        } catch (getErr) {
            if (getErr.statusCode !== 404) {
                // If it's not a 404, it's a real error
                throw getErr;
            }
            // If 404, proceed to create
        }

        // 2. Create if not exists
        const driveItem = {
            name: folderName,
            folder: {},
            '@microsoft.graph.conflictBehavior': 'rename'
        };

        const createEndpoint = parentId === 'root'
            ? `/drives/${driveId}/root/children`
            : `/drives/${driveId}/items/${parentId}/children`;

        const createRes = await client.api(createEndpoint).post(driveItem);
        return createRes.id;

    } catch (err) {
        throw err;
    }
};

// Function to create a folder by Site ID and Drive ID
// Supports optional year subfolder structure
const createIncidentFolder = async (siteId, driveId, folderName, year) => {
    try {
        const client = getAuthenticatedClient();

        let parentId = 'root';

        // If year is provided, ensure Year folder exists
        if (year) {
            parentId = await ensureFolder(client, driveId, 'root', year.toString());
        }

        // Create Incident Folder inside the parent (Year or Root)
        const driveItem = {
            name: folderName,
            folder: {},
            '@microsoft.graph.conflictBehavior': 'rename' // Rename if exists to avoid error
        };

        const endpoint = `/drives/${driveId}/items/${parentId}/children`;

        const result = await client.api(endpoint).post(driveItem);
        return result;

    } catch (error) {
        if (error.code === 'nameAlreadyExists') {
            console.log(`Folder ${folderName} already exists.`);
            return null;
        }
        console.error('SharePoint Create Error:', error.message);
        throw error;
    }
};

// Function to list files in the incident folder
// Reconstructs the path based on logic: Year/Foldername
const listIncidentFiles = async (siteId, driveId, folderName, year) => {
    try {
        const client = getAuthenticatedClient();

        // 1. Construct Path to Folder
        // Path: /drives/{driveId}/root:/{year}/{folderName}

        let folderEndpoint;
        if (year) {
            folderEndpoint = `/drives/${driveId}/root:/${year}/${folderName}`;
        } else {
            folderEndpoint = `/drives/${driveId}/root:/${folderName}`;
        }

        console.log(`[GraphService] Fetching folder metadata from: ${folderEndpoint}`);

        // 2. Get Folder Metadata (to get webUrl)
        const folderResponse = await client.api(folderEndpoint)
            .select('id,webUrl')
            .get();

        const folderUrl = folderResponse.webUrl;
        const folderId = folderResponse.id;

        // 3. List Children using Folder ID
        const childrenEndpoint = `/drives/${driveId}/items/${folderId}/children`;
        console.log(`[GraphService] Listing files from ID: ${folderId}`);

        const childrenResponse = await client.api(childrenEndpoint)
            .select('id,name,webUrl,lastModifiedDateTime,size,file,folder')
            .get();

        return {
            folderUrl: folderUrl,
            files: childrenResponse.value
        };

    } catch (error) {
        if (error.statusCode === 404) {
            console.log('[GraphService] Folder not found for listing.');
            return { folderUrl: null, files: [] };
        }
        console.error('SharePoint List Error:', error.message);
        throw error;
    }
};

module.exports = {
    getAuthenticatedClient,
    createIncidentFolder,
    listIncidentFiles
};
