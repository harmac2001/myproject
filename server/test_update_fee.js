require('isomorphic-fetch');

const BASE_URL = 'http://localhost:5000/api';

async function testUpdateFee() {
    try {
        console.log('--- Starting Fee Update Verification ---');

        // 1. Fetch an incident to get a valid ID
        console.log('Fetching incidents...');
        const incidentsRes = await fetch(`${BASE_URL}/incidents?limit=1`);
        if (!incidentsRes.ok) throw new Error(`Failed to fetch incidents: ${incidentsRes.status}`);
        const incidentsData = await incidentsRes.json();

        if (!incidentsData.data || incidentsData.data.length === 0) {
            console.error('No incidents found. Cannot run test.');
            process.exit(1);
        }

        const incidentId = incidentsData.data[0].id;
        console.log(`Using Incident ID: ${incidentId}`);

        // 2. Fetch invoices for this incident
        console.log('Fetching invoices...');
        const invoicesRes = await fetch(`${BASE_URL}/invoices/incident/${incidentId}`);
        if (!invoicesRes.ok) throw new Error(`Failed to fetch invoices: ${invoicesRes.status}`);
        const invoices = await invoicesRes.json();

        let invoiceId;
        if (invoices.length > 0) {
            invoiceId = invoices[0].id;
            console.log(`Using existing Invoice ID: ${invoiceId}`);
        } else {
            console.log('No invoices found, creating one...');
            const createInvRes = await fetch(`${BASE_URL}/invoices`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    incident_id: incidentId,
                    covered_from: new Date().toISOString().split('T')[0],
                    covered_to: new Date().toISOString().split('T')[0],
                    club_contact_id: null,
                    office_contact_id: null
                })
            });
            if (!createInvRes.ok) throw new Error(`Failed to create invoice: ${createInvRes.status}`);
            const newInvoice = await createInvRes.json();
            invoiceId = newInvoice.id;
            console.log(`Created new Invoice ID: ${invoiceId}`);
        }

        // 3. Create a dummy fee
        console.log('Creating dummy fee...');
        const createFeeRes = await fetch(`${BASE_URL}/invoices/fees`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                invoice_id: invoiceId,
                fee_date: new Date().toISOString().split('T')[0],
                work_performed: 'Test Fee Info',
                quantity: 1,
                unit: 'Fixed Amount',
                cost: 100,
                contractor_id: null,
                third_party_contractor_id: null
            })
        });

        if (!createFeeRes.ok) {
            const txt = await createFeeRes.text();
            throw new Error(`Failed to create fee: ${createFeeRes.status} ${txt}`);
        }

        const fee = await createFeeRes.json();
        console.log(`Fee created ID: ${fee.id}`);

        // 4. Update the fee
        console.log('Updating fee...');
        const updateRes = await fetch(`${BASE_URL}/invoices/fees/${fee.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                invoice_id: invoiceId,
                fee_date: new Date().toISOString().split('T')[0],
                work_performed: 'Updated Fee Info',
                quantity: 2,
                unit: 'Hourly Rate',
                cost: 150,
                contractor_id: null,
                third_party_contractor_id: null
            })
        });

        if (!updateRes.ok) {
            const txt = await updateRes.text();
            throw new Error(`Failed to update fee: ${updateRes.status} ${txt}`);
        }

        console.log('Fee updated successfully.');

        // 5. Cleanup
        console.log('Deleting dummy fee...');
        await fetch(`${BASE_URL}/invoices/fees/${fee.id}`, { method: 'DELETE' });
        console.log('Fee deleted.');

        console.log('--- Verification Passed ---');

    } catch (err) {
        console.error('Test failed:', err);
        process.exit(1);
    }
}

testUpdateFee();
