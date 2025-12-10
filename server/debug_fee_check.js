require('dotenv').config();
const { sql, poolPromise } = require('./db');

async function checkFee() {
    try {
        const pool = await poolPromise;
        const feeId = 178815;

        console.log(`Checking for fee ID: ${feeId}`);

        const result = await pool.request()
            .input('id', sql.BigInt, feeId)
            .query('SELECT * FROM fee WHERE id = @id');

        if (result.recordset.length > 0) {
            console.log('Fee FOUND:', result.recordset[0]);
        } else {
            console.log('Fee NOT FOUND in database.');
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

checkFee();
