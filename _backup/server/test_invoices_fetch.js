

async function testFetch() {
    try {
        // 1. Get an incident ID
        const incRes = await fetch('http://localhost:5000/api/incidents');
        const incidents = await incRes.json();
        if (incidents.length === 0) {
            console.log('No incidents found');
            return;
        }
        const incidentId = incidents[0].id;
        console.log('Testing with incident ID:', incidentId);

        // 2. Fetch invoices
        const res = await fetch(`http://localhost:5000/api/invoices/incident/${incidentId}`);
        console.log('Status:', res.status);
        const data = await res.json();
        console.log('Data type:', typeof data);
        console.log('Is array:', Array.isArray(data));
        if (Array.isArray(data)) {
            console.log('Invoices count:', data.length);
            if (data.length > 0) {
                console.log('First invoice:', data[0]);
            }
        } else {
            console.log('Data:', data);
        }
    } catch (err) {
        console.error('Error:', err);
    }
}

testFetch();
