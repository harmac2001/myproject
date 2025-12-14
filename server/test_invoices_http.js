const http = require('http');

function get(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(data) });
                } catch (e) {
                    console.log('Raw body:', data);
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

async function test() {
    try {
        console.log('Fetching incidents...');
        const incRes = await get('http://localhost:5000/api/incidents');
        console.log('Incidents response:', incRes);
        if (!Array.isArray(incRes.body)) {
            console.log('Body is not array:', incRes.body);
            return;
        }
        if (incRes.body.length === 0) {
            console.log('No incidents found');
            return;
        }
        const incidentId = incRes.body[0].id;
        console.log('Incident ID:', incidentId);

        console.log('Fetching invoices...');
        const invRes = await get(`http://localhost:5000/api/invoices/incident/${incidentId}`);
        console.log('Status:', invRes.status);
        console.log('Invoices:', invRes.body);
    } catch (err) {
        console.error('Error:', err);
    }
}

test();
