const { sql, poolPromise } = require('./db');

async function inspect() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT id, name, code, incident_club 
            FROM club 
            WHERE id IN (91, 92, 98, 99)
        `);
        console.table(result.recordset);

        // Also check what the query with code='NS' returns (incident_club=1)
        const resultNS = await pool.request().query(`
            SELECT id, name, code, incident_club 
            FROM club 
            WHERE code = 'NS' AND incident_club = 1
        `);
        console.log('--- Query with code=NS AND incident_club=1 ---');
        console.table(resultNS.recordset);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }

}

inspect();
