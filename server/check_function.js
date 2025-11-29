const { sql, poolPromise } = require('./db');

async function checkFunction() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT OBJECT_DEFINITION (OBJECT_ID('dbo.get_reference_number')) as definition
        `);
        const fs = require('fs');
        fs.writeFileSync('function_def.sql', result.recordset[0].definition);
        console.log('Function definition written to function_def.sql');
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkFunction();
