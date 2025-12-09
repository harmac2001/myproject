const http = require('http');

function fetchJson(path) {
    return new Promise((resolve, reject) => {
        http.get(`http://localhost:5000${path}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    console.error('Error parsing JSON for', path, data);
                    resolve(null);
                }
            });
        }).on('error', reject);
    });
}

(async () => {
    try {
        // 1. Get an invoice ID
        console.log('Fetching invoices for incident 102899 (or any available)...');
        // Let's try to get ALL invoices to find one. API?
        // Assuming we can get invoices for a known incident or just list from DB via direct query if needed.
        // Let's rely on `test_invoices_fetch.js` logic or similar.
        // Actually, easier to use db.js to find one.

        const { poolPromise } = require('./db');
        const pool = await poolPromise;

        const result = await pool.request().query('SELECT TOP 1 id FROM invoice WHERE (SELECT COUNT(*) FROM fee WHERE invoice_id = invoice.id) > 0 ORDER BY id DESC');
        if (result.recordset.length === 0) {
            console.log('No invoices with fees found in DB.');
            // Try to find one with disbursements
            const result2 = await pool.request().query('SELECT TOP 1 id FROM invoice WHERE (SELECT COUNT(*) FROM disbursement WHERE invoice_id = invoice.id) > 0 ORDER BY id DESC');
            if (result2.recordset.length > 0) {
                const invoiceId = result2.recordset[0].id;
                console.log(`Inspecting Invoice ID (with disbs): ${invoiceId}`);
                await inspectInvoice(invoiceId);
                process.exit(0);
            }

            console.log('No invoices with fees OR disbursements found in DB.');
            process.exit(0);
        }

        const invoiceId = result.recordset[0].id;
        console.log(`Inspecting Invoice ID (with fees): ${invoiceId}`);
        await inspectInvoice(invoiceId);
        process.exit(0);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();

async function inspectInvoice(invoiceId) {
    // 2. Fetch Invoice
    const invoice = await fetchJson(`/api/invoices/${invoiceId}`);
    console.log('\n--- INVOICE ---');
    console.log(JSON.stringify(invoice, null, 2));

    // 3. Fetch Fees
    const fees = await fetchJson(`/api/invoices/${invoiceId}/fees`);
    console.log('\n--- FEES ---');
    console.log(JSON.stringify(fees, null, 2));

    // 4. Fetch Disbursements
    const disbursements = await fetchJson(`/api/invoices/${invoiceId}/disbursements`);
    console.log('\n--- DISBURSEMENTS ---');
    console.log(JSON.stringify(disbursements, null, 2));
}
