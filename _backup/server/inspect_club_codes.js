const { sql, poolPromise } = require('./db');

async function inspect() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT id, name, code, incident_club FROM club WHERE incident_club = 1');
        console.table(result.recordset);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

inspect();
