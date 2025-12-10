const http = require('http');

const incidentId = 102915;

const req = http.get(`http://localhost:5000/api/invoices/check-exists/${incidentId}`, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Body: ${data}`);
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});
