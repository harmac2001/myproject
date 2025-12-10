const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        connectTimeout: 30000 // 30 seconds
    }
};

console.log('Attempting to connect to database...');
console.log(`Server: ${config.server}`);
console.log(`Database: ${config.database}`);
console.log(`User: ${config.user}`);

async function testConnection() {
    try {
        const pool = await new sql.ConnectionPool(config).connect();
        console.log('Successfully connected to SQL Server!');

        const result = await pool.request().query('SELECT @@VERSION as version');
        console.log('SQL Server Version:', result.recordset[0].version);

        await pool.close();
        process.exit(0);
    } catch (err) {
        console.error('Connection Failed!');
        console.error('Error Code:', err.code);
        console.error('Error Message:', err.message);
        console.error('Full Error:', err);
        process.exit(1);
    }
}

testConnection();
