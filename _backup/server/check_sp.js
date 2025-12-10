const { sql, poolPromise } = require('./db');

async function run() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT id, COALESCE(friendly_name, name) as name FROM service_provider WHERE is_consultant = 0 ORDER BY COALESCE(friendly_name, name)');
        console.log(JSON.stringify(result.recordset, null, 2));
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}

run();
