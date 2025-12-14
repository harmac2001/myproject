const { sql, poolPromise } = require('./db');

async function debugMember() {
    try {
        const pool = await poolPromise;

        // 1. Get all members
        console.log('Fetching all members...');
        const result = await pool.request().query('SELECT * FROM member');
        console.log(`Found ${result.recordset.length} members.`);

        if (result.recordset.length > 0) {
            const firstMember = result.recordset[0];
            console.log('First member:', firstMember);

            // 2. Try to fetch this member by ID using the same query as the route
            console.log(`Fetching member by ID: ${firstMember.id}...`);
            const singleResult = await pool.request()
                .input('id', sql.BigInt, firstMember.id)
                .query('SELECT * FROM member WHERE id = @id');

            console.log('Single fetch result:', singleResult.recordset[0]);
        } else {
            console.log('No members found to test single fetch.');
        }

        // 3. Check schema
        console.log('Checking member table schema...');
        const schemaResult = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'member'
        `);
        console.table(schemaResult.recordset);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

debugMember();
