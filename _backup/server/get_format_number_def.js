const { sql, poolPromise } = require('./db');
const fs = require('fs');

async function getDef() {
    try {
        const pool = await poolPromise;

        const result = await pool.request().query(`
            SELECT OBJECT_DEFINITION(OBJECT_ID('dbo.get_reference_number')) as def
        `);

        if (result.recordset.length > 0) {
            fs.writeFileSync('format_number_def.sql', result.recordset[0].def);
            console.log('Definition written to format_number_def.sql');
        } else {
            console.log('Definition not found');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

getDef();
