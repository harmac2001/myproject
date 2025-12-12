const { poolPromise } = require('./db');

async function debugOffices() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT id, name FROM office');
        console.log("Offices:", result.recordset);
    } catch (err) {
        console.error("Error:", err);
    } // No exit to allow pool to close naturally or hangs? usually process.exit is better.
    process.exit();
}

debugOffices();
