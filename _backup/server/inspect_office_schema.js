const { sql, poolPromise } = require('./db');

async function run() {
    try {
        const pool = await poolPromise;
        // Get column info
        const result = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'office'");
        console.log('Columns in office table:', result.recordset.map(r => r.COLUMN_NAME));

        // Get sample data
        const data = await pool.request().query("SELECT TOP 3 * FROM office");
        console.log('Sample offices:', data.recordset);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        // We can't easily close the pool with this implementation, so we just exit
        process.exit(0);
    }
}

run();
