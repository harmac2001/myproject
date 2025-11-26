const { sql, poolPromise } = require('./db');

async function run() {
    try {
        const pool = await poolPromise;

        console.log('Uppercasing Ports...');
        await pool.request().query('UPDATE port SET name = UPPER(name)');

        console.log('Uppercasing Traders...');
        await pool.request().query('UPDATE trader SET name = UPPER(name)');

        console.log('Done!');
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}

run();
