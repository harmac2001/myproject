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

async function checkRelatedTables() {
    try {
        await sql.connect(config);

        const tables = [
            'cargo_information_loading_port',
            'cargo_information_discharge_port',
            'cargo_information_shipper',
            'cargo_information_receiver'
        ];

        for (const table of tables) {
            console.log(`\n=== ${table} ===`);
            const columns = await sql.query`
                SELECT COLUMN_NAME, DATA_TYPE
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = ${table}
                ORDER BY ORDINAL_POSITION
            `;

            columns.recordset.forEach(col => {
                console.log(`  ${col.COLUMN_NAME} - ${col.DATA_TYPE}`);
            });
        }

        await sql.close();
    } catch (err) {
        console.error('Error:', err.message);
        await sql.close();
    }
}

checkRelatedTables();
