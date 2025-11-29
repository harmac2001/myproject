const http = require('http');

function testPrintEndpoint() {
    const incidentId = 102899;
    const url = `http://localhost:5000/api/incidents/${incidentId}/print`;

    console.log(`Testing ${url}...`);

    http.get(url, (res) => {
        const { statusCode } = res;
        const contentType = res.headers['content-type'];

        let error;
        if (statusCode !== 200) {
            error = new Error('Request Failed.\n' +
                `Status Code: ${statusCode}`);
        } else if (!/^application\/json/.test(contentType)) {
            error = new Error('Invalid content-type.\n' +
                `Expected application/json but received ${contentType}`);
        }

        if (error) {
            console.error(error.message);
            // Consume response data to free up memory
            res.resume();
            return;
        }

        res.setEncoding('utf8');
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
            try {
                const parsedData = JSON.parse(rawData);
                console.log('Success! Data received:');
                console.log('ID:', parsedData.id);
                console.log('Cargo:', parsedData.cargo ? `Array(${parsedData.cargo.length})` : 'undefined');
                console.log('Claims:', parsedData.claims ? `Array(${parsedData.claims.length})` : 'undefined');
                console.log('Comments:', parsedData.comments ? `Array(${parsedData.comments.length})` : 'undefined');
            } catch (e) {
                console.error(e.message);
            }
        });
    }).on('error', (e) => {
        console.error(`Got error: ${e.message}`);
    });
}

testPrintEndpoint();
