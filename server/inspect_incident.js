const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

async function inspectIncident() {
    try {
        await sql.connect(config);
        const result = await sql.query`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'incident'
        `;
        console.log(result.recordset.map(row => row.COLUMN_NAME));
    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

inspectIncident();
