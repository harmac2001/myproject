const fetch = require('node-fetch');

async function checkApi() {
    try {
        const response = await fetch('http://localhost:5000/api/options/claim_handlers');
        const data = await response.json();
        console.log('First 5 items:');
        console.log(data.slice(0, 5));
    } catch (err) {
        console.error(err);
    }
}

checkApi();
