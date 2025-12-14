require('dotenv').config();
const { sql, poolPromise } = require('./db');

async function inspect() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM office');
        console.log(JSON.stringify(result.recordset, null, 2));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

inspect();
