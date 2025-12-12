const http = require('http');

// Simulating the user's state: "long b", Vessel scope, All statuses, Multiple offices (Santos=1, others=2,3,4,5)
const offices = '1,2,3,4,5';
const search = 'long%20b'; // URL encoded "long b"
// Try both encoded and raw space if needed, but http.get expects encoded usually? 
// actually raw string in path might work or fail depending on node version, safe to encode.

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
            if (json.data && json.data.length > 0) {
                console.log('First Record:', json.data[0].formatted_reference, json.data[0].ship_name);
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
