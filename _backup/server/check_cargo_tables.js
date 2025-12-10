const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

async function getCargoTables() {
    try {
        await sql.connect(config);

        // Get cargo-related tables
        const tables = await sql.query`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME LIKE '%cargo%' 
            ORDER BY TABLE_NAME
        `;

        console.log('=== Cargo Tables ===');
        console.log(JSON.stringify(tables.recordset, null, 2));

        // Get columns for each table
        for (const table of tables.recordset) {
            const columns = await sql.query`
                SELECT COLUMN_NAME, DATA_TYPE 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = ${table.TABLE_NAME}
                ORDER BY ORDINAL_POSITION
            `;
            console.log(`\n=== ${table.TABLE_NAME} Columns ===`);
            console.log(JSON.stringify(columns.recordset, null, 2));
        }

        await sql.close();
    } catch (err) {
        console.error('Error:', err);
        await sql.close();
    }
}

getCargoTables();
