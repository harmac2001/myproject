const fetch = require('node-fetch');

async function checkResponse() {
    try {
        const response = await fetch('/api/incidents?limit=1');
        const data = await response.json();
        console.log(JSON.stringify(data.data[0], null, 2));
    } catch (err) {
        console.error(err);
    }
}

checkResponse();
