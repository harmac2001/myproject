// const fetch = require('node-fetch');

async function testCreateInvoice() {
    try {
        const response = await fetch('http://localhost:5000/api/invoices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                incident_id: 45666,
                other_information: 'Test invoice'
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Success:', JSON.stringify(data, null, 2));
        } else {
            const text = await response.text();
            console.log('Error:', response.status, text);
        }
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

testCreateInvoice();
