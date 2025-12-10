const { sql, poolPromise } = require('./db');

async function checkData() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT TOP 10 id, code, name 
            FROM claim_handler
        `);
        console.log('ID | Code | Name');
        result.recordset.forEach(row => {
            console.log(`${row.id} | ${row.code} | ${row.name === null ? 'NULL' : (row.name === '' ? 'EMPTY' : row.name)}`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkData();
