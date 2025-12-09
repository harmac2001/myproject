const { sql, poolPromise } = require('./db');

async function update() {
    try {
        const pool = await poolPromise;

        // Update 92, 98, 99 to have code 'NS' and make sure incident_club = 1
        const result = await pool.request().query(`
            UPDATE club 
            SET code = 'NS', incident_club = 1 
            WHERE id IN (92, 98, 99)
        `);

        console.log(`Updated ${result.rowsAffected[0]} clubs.`);

        // Verify
        const resultCheck = await pool.request().query(`
            SELECT id, name, code, incident_club 
            FROM club 
            WHERE code = 'NS' AND incident_club = 1
        `);
        console.table(resultCheck.recordset);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

update();
