const { poolPromise } = require('./db');

async function checkOffices() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query("SELECT id, name, location FROM office");
        console.log("Offices:", res.recordset);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

checkOffices();
