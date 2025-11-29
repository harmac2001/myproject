const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: true, // Changed to true
        trustServerCertificate: true,
        enableArithAbort: true,
        connectTimeout: 15000 // Add timeout
    }
};

async function checkConnection() {
    console.log('Testing connection to:', config.server);
    try {
        const pool = await new sql.ConnectionPool(config).connect();
        console.log('Connected successfully!');
        const result = await pool.request().query('SELECT @@VERSION as version');
        console.log('Version:', result.recordset[0].version);
        pool.close();
    } catch (err) {
        console.error('Connection Failed:', err);
    }
}

checkConnection();
