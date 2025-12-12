const http = require('http');

// Simulating the browser's request: "long+b" (space encoded as plus)
const search = 'long+b';
const offices = '1,2,3,4,5,7';

const url = `http://localhost:5000/api/incidents?search=${search}&search_scope=Vessel&status=All&office=${offices}&page=1&limit=20`;

console.log(`Fetching: ${url}`);

http.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log(`Status Code: ${res.statusCode}`);
        try {
            const json = JSON.parse(data);
            console.log(`Total Records: ${json.total}`);
            console.log(`Data Length: ${json.data ? json.data.length : 'undefined'}`);
        } catch (e) {
            console.error('Error parsing JSON:', e.message);
            console.log('Raw Data:', data);
        }
    });

}).on('error', (err) => {
    console.error('Error: ' + err.message);
});
