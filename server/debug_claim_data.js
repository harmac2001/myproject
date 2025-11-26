const { sql, poolPromise } = require('./db');

async function run() {
    try {
        const pool = await poolPromise;

        // Get one claim detail
        const res = await pool.request().query('SELECT TOP 1 * FROM claim_details');

        if (res.recordset.length > 0) {
            const row = res.recordset[0];
            console.log('--- Claim Detail ---');
            console.log(JSON.stringify(row, null, 2));

            console.log(`Checking ID: ${row.surrogate_claimant_id}`);
            console.log(`Directly Claimant: ${row.directly_claimant}`);

            if (row.directly_claimant) {
                // Check Trader
                console.log('Checking Trader table...');
                const trader = await pool.request().query(`SELECT * FROM trader WHERE id = ${row.surrogate_claimant_id}`);
                console.log('Trader Result:', JSON.stringify(trader.recordset, null, 2));
            } else {
                // Check Service Provider
                console.log('Checking Service Provider table...');
                const sp = await pool.request().query(`SELECT * FROM service_provider WHERE id = ${row.surrogate_claimant_id}`);
                console.log('Service Provider Result:', JSON.stringify(sp.recordset, null, 2));
            }
        } else {
            console.log('No claim details found.');
        }

    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}

run();
