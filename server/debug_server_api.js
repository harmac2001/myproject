const http = require('http');

const url = 'http://localhost:5000/api/incidents?search=long%20b&search_scope=Vessel&status=All&office=1&page=1&limit=20';

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
            console.log(`Data Length: ${json.data.length}`);
            if (json.data.length > 0) {
                console.log('First Record Vessel:', json.data[0].ship_name);
            } else {
                console.log('No records found.');
            }
        } catch (e) {
            console.error('Error parsing JSON:', e.message);
            console.log('Raw Data:', data);
        }
    });

}).on('error', (err) => {
    console.error('Error: ' + err.message);
});
