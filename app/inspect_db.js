require('dotenv').config();
const sql = require('mssql');

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: false, // Usually false for direct IP unless configured otherwise
        trustServerCertificate: true
    }
};

async function connectAndQuery() {
    try {
        await sql.connect(config);
        console.log("Connected to SQL Server!");

        const result = await sql.query`SELECT table_name FROM information_schema.tables WHERE table_type = 'BASE TABLE'`;
        console.log("Tables found:");
        console.table(result.recordset);

        process.exit(0);
    } catch (err) {
        console.error("Database connection failed:", err);
        process.exit(1);
    }
}

connectAndQuery();
