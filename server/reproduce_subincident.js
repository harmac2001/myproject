const fetch = require('node-fetch');

async function reproduceSubIncident() {
    // Use the ID of the incident created in the previous step (or a known valid ID)
    const parentId = 102892;

    console.log(`Attempting to create sub-incident for parent ID: ${parentId}`);

    try {
        const response = await fetch(`/api/incidents/${parentId}/subincident`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}) // Body is empty as it copies from parent
        });

        const text = await response.text();
        console.log('Create Sub-Incident Status:', response.status);
        console.log('Create Sub-Incident Response:', text);

        if (response.ok) {
            const json = JSON.parse(text);
            if (json.id) {
                console.log(`Sub-incident created with ID: ${json.id}`);
            } else {
                console.error('No ID returned in sub-incident create response!');
            }
        }
    } catch (err) {
        console.error('Fetch Error:', err);
    }
}

reproduceSubIncident();
