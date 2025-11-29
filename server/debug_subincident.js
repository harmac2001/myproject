const { sql, poolPromise } = require('./db');

async function debug() {
    try {
        const pool = await poolPromise;

        // 1. Get the latest incident ID
        const latestResult = await pool.request().query('SELECT TOP 1 * FROM incident ORDER BY id DESC');
        if (latestResult.recordset.length === 0) {
            console.log('No incidents found.');
            return;
        }

        const incident = latestResult.recordset[0];
        console.log('Latest Incident:', incident);

        // 2. Try to call get_reference_number
        console.log('Testing get_reference_number...');
        try {
            const refResult = await pool.request()
                .input('id', sql.Int, incident.id)
                .query('SELECT dbo.get_reference_number(@id) as formatted_reference');
            console.log('Reference Number Result:', refResult.recordset[0]);
        } catch (err) {
            console.error('Error calling get_reference_number:', err.message);
        }

        // 3. Try the full query used in the route
        console.log('Testing full route query...');
        try {
            const fullResult = await pool.request()
                .input('id', sql.Int, incident.id)
                .query('SELECT *, dbo.get_reference_number(id) as formatted_reference FROM incident WHERE id = @id');
            console.log('Full Query Result:', fullResult.recordset[0]);
        } catch (err) {
            console.error('Error executing full query:', err.message);
        }

    } catch (err) {
        console.error('Global Error:', err);
    } finally {
        // Close connection
        // sql.close(); // poolPromise reuses connection, maybe don't close if we want to keep it alive for app, but this is a script.
        process.exit();
    }
}

debug();
