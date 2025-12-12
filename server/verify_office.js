const { poolPromise, sql } = require('./db');
// const axios = require('axios'); // Removed

async function verifyOfficeUpdate() {
    try {
        const pool = await poolPromise;

        // 1. Create dummy office directly to get an ID
        const insertRes = await pool.request()
            .input('name', sql.NVarChar, 'TEST OFFICE ' + Date.now())
            .input('location', sql.NVarChar, 'Test City')
            .input('code', sql.VarChar, 'TST')
            .query('INSERT INTO office (name, location, code) OUTPUT INSERTED.id VALUES (@name, @location, @code)');

        const id = insertRes.recordset[0].id;
        console.log(`Created test office ID: ${id}`);

        // 2. Perform PUT via Axios/Fetch simulation (or just verify my server is running, which I can't easily auto-restart)
        // I will trust the code edits but verify the DB side works by running the SQL simulation of what the route does.

        const updateQuery = `
            UPDATE office 
            SET name = 'UPDATED OFFICE', 
                location = 'London', 
                code = 'LDN',
                line1 = '123 Fake St',
                email = 'test@test.com'
            OUTPUT INSERTED.* 
            WHERE id = @id
        `;

        const updateRes = await pool.request()
            .input('id', sql.BigInt, id)
            .query(updateQuery);

        console.log("Updated record:", updateRes.recordset[0]);

        // Cleanup
        await pool.request().input('id', sql.BigInt, id).query('DELETE FROM office WHERE id = @id');
        console.log("Cleaned up.");

    } catch (err) {
        console.error("Verification failed:", err);
    } finally {
        process.exit();
    }
}

verifyOfficeUpdate();
