const { sql, poolPromise } = require('./db');

async function listOffices() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT id, name FROM office ORDER BY id
        `);
        result.recordset.forEach(r => {
            console.log(`${r.id}: ${r.name}`);
        });
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

listOffices();
