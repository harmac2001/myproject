const sql = require('mssql');
require('dotenv').config({ path: 'server/.env' });

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function checkAndAddColumn() {
    try {
        await sql.connect(config);
        console.log('Connected to database.');

        // Check if description column exists
        const checkQuery = `
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'invoice' AND COLUMN_NAME = 'description'
        `;
        const result = await sql.query(checkQuery);

        if (result.recordset.length > 0) {
            console.log('Column "description" already exists in table "invoice".');
        } else {
            console.log('Column "description" does not exist. Adding it...');
            const addQuery = `ALTER TABLE invoice ADD description NVARCHAR(MAX)`;
            await sql.query(addQuery);
            console.log('Column "description" added successfully.');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await sql.close();
    }
}

checkAndAddColumn();
