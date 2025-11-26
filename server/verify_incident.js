const { poolPromise } = require('./db');

async function verifyIncident() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT TOP 1 * 
            FROM incident 
            ORDER BY id DESC
        `);
        console.log(JSON.stringify(result.recordset[0], null, 2));
    } catch (err) {
        console.error(err);
    }
}

verifyIncident();
