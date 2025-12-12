const { poolPromise, sql } = require('./db');

async function debugFullQuery() {
    try {
        const pool = await poolPromise;
        const search = "long"; // Simulate "long" search
        const status = "All";
        const office = "1"; // Santos
        const offset = 0;
        const limit = 20;

        const request = pool.request();
        let whereClause = 'WHERE 1=1';

        // 1. Status Filter
        if (status && status !== 'All') {
            whereClause += ` AND i.status = @status`;
            request.input('status', sql.NVarChar, status);
        }

        // 2. Office Filter
        const officeIds = office ? String(office).split(',').map(id => parseInt(id)).filter(id => !isNaN(id)) : [];
        if (officeIds.length > 0) {
            whereClause += ` AND i.local_office_id IN (${officeIds.join(',')})`;
        } else {
            whereClause += ` AND 1=0`;
        }

        // 3. Search Filter (Simulate IncidentList.jsx logic)
        // Hardcoded "Vessel" scope based on screenshot
        const searchScope = 'Vessel';
        const searchTerm = `%${search}%`; // Note: checking logic WITHOUT trim first
        request.input('search', sql.NVarChar, searchTerm);

        if (searchScope === 'Reference Number') {
            whereClause += ` AND (dbo.get_reference_number(i.id) LIKE @search OR CAST(i.reference_number AS VARCHAR) LIKE @search)`;
        } else if (searchScope === 'Vessel') {
            whereClause += ` AND s.name LIKE @search`;
        } else {
            whereClause += ` AND (dbo.get_reference_number(i.id) LIKE @search OR ... )`;
        }

        const query = `
            SELECT 
                i.id, 
                i.reference_number, 
                i.reference_year,
                dbo.get_reference_number(i.id) as formatted_reference,
                s.name as ship_name, 
                i.status,
                i.incident_date,
                (CASE WHEN i.reference_year < 100 THEN i.reference_year + 2000 ELSE i.reference_year END) as sort_year
            FROM incident i
            LEFT JOIN ship s ON i.ship_id = s.id
            LEFT JOIN office o ON i.local_office_id = o.id
            ${whereClause}
            ORDER BY (CASE WHEN i.reference_year < 100 THEN i.reference_year + 2000 ELSE i.reference_year END) DESC, i.reference_number DESC
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `;

        request.input('offset', sql.Int, offset);
        request.input('limit', sql.Int, limit);

        console.log("Executing Query...");
        const result = await request.query(query);

        console.log(`Found ${result.recordset.length} records.`);
        console.log("Top 10 Results:");
        result.recordset.slice(0, 10).forEach(r => {
            console.log(`${r.formatted_reference} | Year: ${r.reference_year} (Sort: ${r.sort_year}) | Vessel: ${r.ship_name} | Status: ${r.status}`);
        });

    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

debugFullQuery();
