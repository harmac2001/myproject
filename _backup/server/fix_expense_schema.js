require('dotenv').config();
const { sql, poolPromise } = require('./db');

async function fixSchema() {
    try {
        const pool = await poolPromise;

        console.log('Altering account_id to be NULLABLE...');
        await pool.request().query('ALTER TABLE expense ALTER COLUMN account_id INT NULL');
        console.log('account_id altered.');

        console.log('Altering service_provider_id to be NULLABLE...');
        await pool.request().query('ALTER TABLE expense ALTER COLUMN service_provider_id BIGINT NULL');
        console.log('service_provider_id altered.');

        // Also checking office_id, if it fails we might need to fix it too
        console.log('Altering office_id to be NULLABLE...');
        await pool.request().query('ALTER TABLE expense ALTER COLUMN office_id BIGINT NULL');
        console.log('office_id altered.');

        console.log('Altering payment_plan_id to be NULLABLE...');
        await pool.request().query('ALTER TABLE expense ALTER COLUMN payment_plan_id BIGINT NULL');
        console.log('payment_plan_id altered.');

    } catch (err) {
        console.error('Error altering schema:', err);
    } finally {
        process.exit();
    }
}

fixSchema();
