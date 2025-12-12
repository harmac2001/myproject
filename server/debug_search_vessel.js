const { poolPromise, sql } = require('./db');

async function debugSearch() {
    try {
        const pool = await poolPromise;

        // 1. Check if vessel exists
        console.log("Checking for ANY vessel with 'LONG BEACH' in name...");
        const resVessel = await pool.request().query("SELECT id, name FROM ship WHERE name LIKE '%LONG BEACH%'");
        console.log("Vessels found:", resVessel.recordset);

        if (resVessel.recordset.length === 0) {
            console.log("No vessel found with 'LONG BEACH'. Searching for 'LONG'...");
            const resLong = await pool.request().query("SELECT TOP 5 id, name FROM ship WHERE name LIKE 'LONG%'");
            console.log("Vessels starting with LONG:", resLong.recordset);
            return;
        }

        const longBeachId = resVessel.recordset[0].id; // Assuming first one is relevant

        // 2. Check incidents for this vessel (including STATUS)
        console.log(`Checking incidents for vessel ID ${longBeachId}...`);
        const resIncidents = await pool.request()
            .input('shipId', sql.Int, longBeachId)
            // Fetch status to check if it's filtered out
            .query("SELECT id, reference_number, local_office_id, status FROM incident WHERE ship_id = @shipId");

        console.log(`Incidents found for vessel ${longBeachId}:`, resIncidents.recordset);

        if (resIncidents.recordset.length === 0) {
            console.log("No incidents for this vessel. That explains why search returns nothing.");
            return;
        }

        // 3. Simulate Search Query (Lowercase 'long ')
        const searchTerm = '%long %';
        console.log(`Simulating search clause with term: '${searchTerm}'`);

        const resSearch = await pool.request()
            .input('search', sql.NVarChar, searchTerm)
            .query(`
                SELECT i.id, s.name as vessel_name
                FROM incident i
                LEFT JOIN ship s ON i.ship_id = s.id
                WHERE s.name LIKE @search
            `);

        console.log("Search results:", resSearch.recordset);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

debugSearch();
