const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { sql, poolPromise } = require('./db');
const { listIncidentFiles } = require('./services/graphService');

async function testBelemDocs() {
    const incidentId = 102817; // Belem Incident 252/25/NS

    try {
        const pool = await new sql.ConnectionPool({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            server: process.env.DB_SERVER,
            database: process.env.DB_NAME,
            options: {
                encrypt: false,
                trustServerCertificate: true,
                enableArithAbort: true
            }
        }).connect();

        console.log(`Fetching details for Incident ${incidentId}...`);
        const incRes = await pool.request()
            .input('id', sql.Int, incidentId)
            .query(`
                SELECT i.id, i.reference_year, i.local_office_id, i.ship_id,
                       dbo.get_reference_number(i.id) as formatted_reference,
                       s.name as vessel_name,
                       o.sharepoint_site_id, o.sharepoint_drive_id
                FROM incident i
                LEFT JOIN ship s ON i.ship_id = s.id
                LEFT JOIN office o ON i.local_office_id = o.id
                WHERE i.id = @id
            `);

        const inc = incRes.recordset[0];
        console.log('Incident Data:', {
            ref: inc.formatted_reference,
            vessel: inc.vessel_name,
            driveId: inc.sharepoint_drive_id
        });

        if (!inc.sharepoint_drive_id) {
            console.error('No Drive ID configured!');
            return;
        }

        // Reconstruct Folder Name
        const formattedRef = inc.formatted_reference || '';
        let refPart = formattedRef.replace(/\//g, '');
        const parts = formattedRef.split('/');
        if (parts.length >= 3) {
            refPart = parts[0] + parts[1] + parts[2];
        }

        let vesselName = inc.vessel_name || 'Unknown Vessel';
        const sanitizedVessel = vesselName.replace(/[\\/:*?"<>|]/g, '').trim();
        const folderName = `${refPart} - ${sanitizedVessel}`;

        console.log(`Target Folder: ${folderName}`);
        console.log('Listing files...');

        const result = await listIncidentFiles(
            inc.sharepoint_site_id,
            inc.sharepoint_drive_id,
            folderName,
            inc.reference_year,
            'BELEM/Pastas (BELEM)'
        );

        console.log('--- SUCCESS ---');
        console.log('Folder URL:', result.folderUrl);
        console.log(`Files Found: ${result.files.length}`);
        result.files.forEach(f => console.log(`- ${f.name}`));

        pool.close();
    } catch (err) {
        console.error('Error:', err.message);
        if (err.statusCode) console.error('Status Code:', err.statusCode);
    }
}

testBelemDocs();
