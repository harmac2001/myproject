const { sql, poolPromise } = require('./db');

async function getDefs() {
    try {
        const pool = await poolPromise;

        console.log(`\n--- get_reference_number ---`);
        const result = await pool.request().query(`
            SELECT definition 
            FROM sys.sql_modules 
            WHERE object_id = OBJECT_ID('dbo.get_reference_number')
        `);
        if (result.recordset.length > 0) {
            console.log(result.recordset[0].definition);
        } else {
            console.log('Definition not found');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

getDefs();
