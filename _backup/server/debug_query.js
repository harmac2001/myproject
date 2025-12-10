const { sql, poolPromise } = require('./db');

async function debugQuery() {
    try {
        const pool = await poolPromise;

        console.log('Executing query...');
        const query = `
            SELECT 
                i.id, 
                i.reference_number, 
                dbo.get_reference_number(i.id) as formatted_reference,
                i.incident_date, 
                i.status, 
                i.description,
                s.name as ship_name,
                m.name as member_name
            FROM incident i
            LEFT JOIN ship s ON i.ship_id = s.id
            LEFT JOIN member m ON i.member_id = m.id
        `;

        const result = await pool.request().query(query);
        console.log('Query successful!');
        console.log('Record count:', result.recordset.length);
        if (result.recordset.length > 0) {
            console.log('First record:', result.recordset[0]);
        }
    } catch (err) {
        console.error('Query Failed:', err);
    } finally {
        process.exit();
    }
}

debugQuery();
