const { sql, poolPromise } = require('./db');
const { createIncidentFolder } = require('./services/graphService');

async function run() {
    try {
        const pool = await poolPromise;
        console.log('Connected to DB.');

        // 1. Get the specific incident mentioned by user (or latest)
        // User said: "0664/25/GD/IAL"
        // Let's search by formatting or just take top 1 DESC
        const incRes = await pool.request().query("SELECT TOP 1 * FROM incident ORDER BY id DESC");

        if (incRes.recordset.length === 0) {
            console.log('No incidents found.');
            return;
        }

        const inc = incRes.recordset[0];
        console.log('Latest Incident:', {
            id: inc.id,
            ref: inc.reference_number,
            year: inc.reference_year,
            formatted: `0664/25/GD/IAL` // Assuming this matches for now, or we decode reference
        });

        // 2. Get Ship Name
        let vesselName = 'Unknown';
        if (inc.ship_id) {
            const shipRes = await pool.request().query(`SELECT name FROM ship WHERE id = ${inc.ship_id}`);
            if (shipRes.recordset.length > 0) vesselName = shipRes.recordset[0].name;
        }
        console.log('Vessel Name:', vesselName);

        // 3. Construct Folder Name logic (copied from route)
        // Logic: "0664/25/GD/IAL" -> "066425GDIAL" ? No, user said 0664/25/GD/IAL
        // My code was: replace / with nothing?
        // Wait, user said "0664/25/GD/IAL".
        // Code: formattedRef.replace(/\//g, '') --> "066425GDIAL"
        // Split logic: parts[0] + parts[1] + parts[2]
        // If ref is "0664/25/GD/IAL", parts are [0664, 25, GD, IAL]
        // Result: "066425GD"

        // Let's fetch the actual formatted reference from DB function if possible, or simulate
        const refRes = await pool.request().query(`SELECT dbo.get_reference_number(${inc.id}) as formatted_reference`);
        const formattedRef = refRes.recordset[0]?.formatted_reference || 'N/A';
        console.log('Formatted Ref from DB:', formattedRef);

        let refPart = formattedRef.replace(/\//g, '');
        const parts = formattedRef.split('/');
        if (parts.length >= 3) {
            refPart = parts[0] + parts[1] + parts[2];
        }

        const sanitizedVessel = vesselName.replace(/[\\/:*?"<>|]/g, '').trim();
        const folderName = `${refPart} - ${sanitizedVessel}`;

        console.log('Target Folder Name:', folderName);
        console.log('Target Year Folder:', inc.reference_year);

        // 4. Get Office Config
        const offRes = await pool.request().query(`SELECT sharepoint_site_id, sharepoint_drive_id FROM office WHERE id = ${inc.local_office_id}`);
        const config = offRes.recordset[0];
        console.log('Office Config:', config);

        if (config && config.sharepoint_site_id && config.sharepoint_drive_id) {
            console.log('Attempting to create folder now...');
            // Try creating it
            await createIncidentFolder(config.sharepoint_site_id, config.sharepoint_drive_id, folderName, inc.reference_year);
            console.log('Folder creation executed without error (check SharePoint).');
        } else {
            console.log('Missing configuration for office.');
        }

    } catch (err) {
        console.error('ERROR:', err);
        // show full stack
        if (err.response) {
            console.error('Graph Error Body:', await err.response.text().catch(() => ''));
        }
    } finally {
        process.exit(0);
    }
}

run();
