const { poolPromise } = require('./db');

(async () => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query("SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'fee'");
        console.table(result.recordset);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();
