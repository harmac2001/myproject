require('dotenv').config();
const { sql, poolPromise } = require('./db');

async function updateInvoiceCurrency() {
    try {
        const pool = await poolPromise;
        const invoiceId = 98598; // From previous debug output
        const currencyId = 3; // USD based on list output

        console.log(`Updating invoice ${invoiceId} currency to ${currencyId}...`);

        await pool.request()
            .input('id', sql.BigInt, invoiceId)
            .input('currency_id', sql.Int, currencyId)
            .query('UPDATE invoice SET currency_id = @currency_id WHERE id = @id');

        console.log('Update complete.');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

updateInvoiceCurrency();
