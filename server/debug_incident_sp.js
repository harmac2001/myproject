const { sql, poolPromise } = require('./db');

async function run() {
    try {
        const pool = await poolPromise;
        console.log('Connected.');

        // 1. Check Incident
        const incRes = await pool.request().query("SELECT id, reference_number, local_office_id, created_date FROM incident WHERE id = 102921");
        console.log('Incident loaded:', incRes.recordset.length > 0);
        if (incRes.recordset.length > 0) {
            console.log('Incident Data:', incRes.recordset[0]);
            const officeId = incRes.recordset[0].local_office_id;

            // 2. Check Specific Office
            const offRes = await pool.request().query(`SELECT id, name, sharepoint_site_id, sharepoint_drive_id FROM office WHERE id = ${officeId}`);
            console.log('Office Data:', offRes.recordset[0]);
        } else {
            console.log('Incident ID 102921 NOT FOUND.');
        }

        // 3. Check All Offices (Summary)
        console.log('\n--- Office SharePoint Config Summary ---');
        const allOffices = await pool.request().query("SELECT id, name, sharepoint_site_id, sharepoint_drive_id FROM office");
        console.table(allOffices.recordset);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit(0);
    }
}

run();
