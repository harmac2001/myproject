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

async function getCargoSchema() {
    try {
        await sql.connect(config);

        // Get all cargo-related tables
        const tables = await sql.query`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE' 
            AND TABLE_NAME LIKE '%cargo%'
            ORDER BY TABLE_NAME
        `;

        console.log('=== CARGO TABLES ===\n');

        for (const table of tables.recordset) {
            console.log(`\n--- ${table.TABLE_NAME} ---`);

            const columns = await sql.query`
                SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, CHARACTER_MAXIMUM_LENGTH
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = ${table.TABLE_NAME}
                ORDER BY ORDINAL_POSITION
            `;

            columns.recordset.forEach(col => {
                const nullable = col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
                const length = col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : '';
                console.log(`  ${col.COLUMN_NAME} - ${col.DATA_TYPE}${length} ${nullable}`);
            });
        }

        await sql.close();
    } catch (err) {
        console.error('Error:', err.message);
        await sql.close();
    }
}

getCargoSchema();
