const fetch = require('node-fetch');

async function checkIncident() {
    try {
        const response = await fetch('http://localhost:5000/api/incidents/102867');
        const data = await response.json();
        console.log('Formatted Reference:', data.formatted_reference);
        console.log('Reference Number:', data.reference_number);
        console.log('Full Data:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

checkIncident();
