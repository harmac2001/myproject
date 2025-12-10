const { sql, poolPromise } = require('./db');

async function fixSchema() {
    try {
        const pool = await poolPromise;
        await pool.request().query(`
            ALTER TABLE incident ALTER COLUMN berthing_date DATE NULL
        `);
        console.log('Successfully altered berthing_date to allow NULLs');
    } catch (err) {
        console.error('Error altering schema:', err);
    } finally {
        process.exit();
    }
}

fixSchema();
