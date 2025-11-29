const http = require('http');

const url = 'http://localhost:5000/api/options/consultants';

console.log(`Testing ${url}...`);

http.get(url, (res) => {
    const { statusCode } = res;

    if (statusCode !== 200) {
        console.error(`Request Failed. Status Code: ${statusCode}`);
        res.resume();
        return;
    }

    res.setEncoding('utf8');
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
        try {
            const parsedData = JSON.parse(rawData);
            console.log('Success!');
            console.log('Count:', parsedData.length);
            console.log('First 5 consultants:');
            console.log(JSON.stringify(parsedData.slice(0, 5), null, 2));
        } catch (e) {
            console.error(e.message);
        }
    });
}).on('error', (e) => {
    console.error(`Got error: ${e.message}`);
});
