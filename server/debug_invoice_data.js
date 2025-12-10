require('dotenv').config();
const { sql, poolPromise } = require('./db');

async function getInvoice() {
    try {
        const id = 10; // I will use a known ID or try to find one. The user screenshot showed 102923 but that might be incident ID.
        // Wait, the error URL was /api/invoices/incident/102923. 
        // Let's first list invoices for incident 102923 to get an invoice ID.

        const pool = await poolPromise;
        const incidentId = 102923;

        console.log(`Fetching invoices for incident ${incidentId}...`);
        const result = await pool.request()
            .input('incident_id', sql.BigInt, incidentId)
            .query('SELECT TOP 1 * FROM invoice WHERE incident_id = @incident_id');

        if (result.recordset.length === 0) {
            console.log('No invoices found for this incident.');
            process.exit(0);
        }

        const invoice = result.recordset[0];
        console.log('Found Invoice ID:', invoice.id);
        console.log('Invoice Currency ID:', invoice.currency_id);

        // Now run the GET /:id query logic to see what it returns
        // We replicate the query from the route
        console.log('Running detailed query for invoice...');
        const detailResult = await pool.request()
            .input('id', sql.BigInt, invoice.id)
            .query(`
                SELECT i.id, i.currency_id, curr.name as incident_currency_name
                FROM invoice i
                LEFT JOIN currency curr ON i.currency_id = curr.id
                WHERE i.id = @id
            `);

        console.log('Detail Result:', detailResult.recordset[0]);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

getInvoice();
