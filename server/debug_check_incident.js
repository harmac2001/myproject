const { poolPromise } = require('./db');

async function checkIncident() {
    try {
        const pool = await poolPromise;
        // Find vessel first
        const vesselRes = await pool.request().query("SELECT id, name FROM ship WHERE name LIKE '%LONG BEACH%'");
        if (vesselRes.recordset.length === 0) {
            console.log("Vessel LONG BEACH not found");
            return;
        }
        const shipId = vesselRes.recordset[0].id;
        console.log(`Vessel Found: ${vesselRes.recordset[0].name} (ID: ${shipId})`);

        // Find incidents
        const res = await pool.request().query(`
            SELECT i.id, i.reference_number, i.reference_year, i.local_office_id, i.status 
            FROM incident i 
            WHERE i.ship_id = ${shipId}
        `);
        console.log("Incidents for this vessel:", res.recordset);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

checkIncident();
