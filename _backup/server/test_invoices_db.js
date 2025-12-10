const { sql, poolPromise } = require('./db');
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
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT TOP 1 id FROM incident ORDER BY id DESC');

        if (result.recordset.length === 0) {
            console.log('No incidents in DB');
            process.exit(0);
        }

        const incidentId = result.recordset[0].id;
        console.log('Testing with Incident ID:', incidentId);

        console.log('Fetching invoices...');
        const invRes = await get(`http://localhost:5000/api/invoices/incident/${incidentId}`);
        console.log('Status:', invRes.status);
        console.log('Invoices:', invRes.body);

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

test();
