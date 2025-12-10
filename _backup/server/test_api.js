const http = require('http');

const data = JSON.stringify({
    name: 'A B Maritime Inc.',
    line1: null,
    line2: null,
    line3: null,
    line4: null,
    vat_number: null
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/options/members/2',
    method: 'PUT',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
    },
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
