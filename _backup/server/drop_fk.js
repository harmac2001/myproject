const { sql, poolPromise } = require('./db');

async function run() {
    try {
        const pool = await poolPromise;

        console.log('Dropping Foreign Key FKd0jxeehettag0h4i0ey5l9kp7...');

        await pool.request().query(`
            ALTER TABLE claim_details 
            DROP CONSTRAINT FKd0jxeehettag0h4i0ey5l9kp7
        `);

        console.log('Foreign Key dropped successfully.');

    } catch (err) {
        console.error('Error dropping FK:', err);
    }
    process.exit(0);
}

run();
