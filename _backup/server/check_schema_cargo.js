const { sql, poolPromise } = require('./db');

async function run() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME IN ('cargo_information', 'trader')
            ORDER BY TABLE_NAME, COLUMN_NAME
        `);
        console.log(JSON.stringify(result.recordset, null, 2));
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}

run();
