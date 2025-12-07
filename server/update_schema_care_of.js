require('dotenv').config();
const { sql, poolPromise } = require('./db');

async function addCareOfColumns() {
    try {
        const pool = await poolPromise;

        // Check if columns exist
        const checkQuery = `
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'invoice' AND COLUMN_NAME IN ('care_of_id', 'care_of_details')
        `;
        const checkResult = await pool.request().query(checkQuery);
        const existingColumns = checkResult.recordset.map(row => row.COLUMN_NAME);

        if (!existingColumns.includes('care_of_id')) {
            console.log('Adding care_of_id column...');
            await pool.request().query(`
                ALTER TABLE invoice ADD care_of_id BIGINT NULL;
                ALTER TABLE invoice ADD CONSTRAINT FK_invoice_care_of_club FOREIGN KEY (care_of_id) REFERENCES club(id);
            `);
        } else {
            console.log('care_of_id column already exists.');
        }

        if (!existingColumns.includes('care_of_details')) {
            console.log('Adding care_of_details column...');
            await pool.request().query(`
                ALTER TABLE invoice ADD care_of_details NVARCHAR(MAX) NULL;
            `);
        } else {
            console.log('care_of_details column already exists.');
        }

        console.log('Schema update complete.');
    } catch (err) {
        console.error('Error updating schema:', err);
    } finally {
        process.exit();
    }
}

addCareOfColumns();
