const { sql, poolPromise } = require('./db');

async function run() {
    try {
        const pool = await poolPromise;
        console.log('Adding SharePoint columns to office table...');

        const query = `
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'office' AND COLUMN_NAME = 'sharepoint_site_id')
            BEGIN
                ALTER TABLE office ADD sharepoint_site_id NVARCHAR(255) NULL;
                PRINT 'Added sharepoint_site_id column';
            END
            ELSE
            BEGIN
                PRINT 'sharepoint_site_id column already exists';
            END

            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'office' AND COLUMN_NAME = 'sharepoint_drive_id')
            BEGIN
                ALTER TABLE office ADD sharepoint_drive_id NVARCHAR(255) NULL;
                PRINT 'Added sharepoint_drive_id column';
            END
            ELSE
            BEGIN
                PRINT 'sharepoint_drive_id column already exists';
            END
        `;

        await pool.request().query(query);
        console.log('Schema update completed.');

    } catch (err) {
        console.error('Error updating schema:', err);
    } finally {
        process.exit(0);
    }
}

run();
