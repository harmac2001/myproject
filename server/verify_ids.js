const { sql, poolPromise } = require('./db');

async function verifyIDs() {
    try {
        const pool = await poolPromise;

        // Check Invoice 67557
        const resInvoice = await pool.request().query(`
            SELECT i.id, i.incident_id, inc.local_office_id, o.name as office_name
            FROM invoice i
            JOIN incident inc ON i.incident_id = inc.id
            JOIN office o ON inc.local_office_id = o.id
            WHERE i.id = 67557
        `);
        console.log('Invoice 67557:', JSON.stringify(resInvoice.recordset[0], null, 2));

        // Check Incident 67557 (again)
        const resIncident = await pool.request().query(`
            SELECT i.id, i.local_office_id, o.name as office_name
            FROM incident i 
            JOIN office o ON i.local_office_id = o.id 
            WHERE i.id = 67557
        `);
        console.log('Incident 67557:', JSON.stringify(resIncident.recordset[0], null, 2));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

verifyIDs();
