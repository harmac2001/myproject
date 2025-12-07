// const fetch = require('node-fetch');

async function testDuplication() {
    try {
        // 1. Create Invoice
        console.log('Creating invoice...');
        const createRes = await fetch('http://localhost:5000/api/invoices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                incident_id: 45666,
                other_information: 'Test Duplication'
            })
        });

        if (!createRes.ok) {
            console.error('Create failed:', await createRes.text());
            return;
        }

        const invoice = await createRes.json();
        console.log('Created Invoice ID:', invoice.id);
        console.log('Initial Recipient Details:', JSON.stringify(invoice.recipient_details));

        // 2. Update Invoice (First Edit)
        console.log('Updating invoice (First Edit)...');
        const updateRes1 = await fetch(`http://localhost:5000/api/invoices/${invoice.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...invoice,
                recipient_details: 'Updated Text 1'
            })
        });

        if (!updateRes1.ok) {
            console.error('Update 1 failed:', await updateRes1.text());
            return;
        }

        const updated1 = await updateRes1.json();
        console.log('After Update 1:', JSON.stringify(updated1.recipient_details));

        // 3. Update Invoice (Second Edit)
        console.log('Updating invoice (Second Edit)...');
        const updateRes2 = await fetch(`http://localhost:5000/api/invoices/${invoice.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...updated1,
                recipient_details: 'Updated Text 2'
            })
        });

        if (!updateRes2.ok) {
            console.error('Update 2 failed:', await updateRes2.text());
            return;
        }

        const updated2 = await updateRes2.json();
        console.log('After Update 2:', JSON.stringify(updated2.recipient_details));

    } catch (err) {
        console.error('Error:', err);
    }
}

testDuplication();
