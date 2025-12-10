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

async function checkCargoStructure() {
    try {
        await sql.connect(config);

        console.log('=== cargo_information columns ===');
        const columns = await sql.query`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'cargo_information'
            ORDER BY ORDINAL_POSITION
        `;

        columns.recordset.forEach(col => {
            console.log(`${col.COLUMN_NAME} - ${col.DATA_TYPE} (${col.IS_NULLABLE})`);
        });

        console.log('\n=== Sample cargo data ===');
        const sample = await sql.query`SELECT TOP 1 * FROM cargo_information`;
        console.log(JSON.stringify(sample.recordset, null, 2));

        await sql.close();
    } catch (err) {
        console.error('Error:', err.message);
        await sql.close();
    }
}

checkCargoStructure();
