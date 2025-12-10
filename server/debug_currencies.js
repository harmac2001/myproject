require('dotenv').config();
const { sql, poolPromise } = require('./db');

async function listCurrencies() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM currency');
        console.log('Currencies:', result.recordset);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

listCurrencies();
