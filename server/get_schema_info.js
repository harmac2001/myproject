const { sql, poolPromise } = require('./db');

async function run() {
    try {
        const pool = await poolPromise;

        // Get Columns
        const columnsRes = await pool.request().query(`
            SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'claimant' 
            ORDER BY TABLE_NAME, COLUMN_NAME
        `);

        console.log('--- COLUMNS ---');
        console.log(JSON.stringify(columnsRes.recordset, null, 2));

        // Get Foreign Keys for claim_details
        const fkRes = await pool.request().query(`
            SELECT 
                KCU1.CONSTRAINT_NAME AS FK_CONSTRAINT_NAME, 
                KCU1.TABLE_NAME AS FK_TABLE_NAME, 
                KCU1.COLUMN_NAME AS FK_COLUMN_NAME, 
                KCU2.TABLE_NAME AS REFERENCED_TABLE_NAME, 
                KCU2.COLUMN_NAME AS REFERENCED_COLUMN_NAME 
            FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS AS RC 
            INNER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS KCU1 
                ON KCU1.CONSTRAINT_CATALOG = RC.CONSTRAINT_CATALOG 
                AND KCU1.CONSTRAINT_SCHEMA = RC.CONSTRAINT_SCHEMA 
                AND KCU1.CONSTRAINT_NAME = RC.CONSTRAINT_NAME 
            INNER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS KCU2 
                ON KCU2.CONSTRAINT_CATALOG = RC.UNIQUE_CONSTRAINT_CATALOG 
                AND KCU2.CONSTRAINT_SCHEMA = RC.UNIQUE_CONSTRAINT_SCHEMA 
                AND KCU2.CONSTRAINT_NAME = RC.UNIQUE_CONSTRAINT_NAME 
                AND KCU2.ORDINAL_POSITION = KCU1.ORDINAL_POSITION 
            WHERE KCU1.TABLE_NAME = 'claim_details'
        `);

        console.log('--- FOREIGN KEYS ---');
        console.log(JSON.stringify(fkRes.recordset, null, 2));

    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}

run();
