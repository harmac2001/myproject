const { sql, poolPromise } = require('./db');

async function checkCount() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT COUNT(*) as count FROM office');
        console.log('Incident Count:', result.recordset[0].count);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

checkCount();
