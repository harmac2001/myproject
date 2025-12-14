const http = require('http');

const data = JSON.stringify({
    invoice_id: 98532,
    contractor_id: 52,
    fee_date: '2025-01-01',
    work_performed: 'Test Fee Backend',
    quantity: 1,
    unit: 'Fixed',
    cost: 100
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/invoices/fees',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, res => {
    console.log(`statusCode: ${res.statusCode}`);
    res.on('data', d => {
        process.stdout.write(d);
    });
});

req.on('error', error => {
    console.error(error);
});

req.write(data);
req.end();
