const { poolPromise, sql } = require('./db');

async function checkGaps() {
    try {
        const pool = await poolPromise;
        // Check for 25
        const res25 = await pool.request().query('SELECT count(*) as count FROM incident WHERE reference_year = 25');
        console.log(`Count for Year 25: ${res25.recordset[0].count}`);

        // Check for 2025
        const res2025 = await pool.request().query('SELECT count(*) as count FROM incident WHERE reference_year = 2025');
        console.log(`Count for Year 2025: ${res2025.recordset[0].count}`);

        const result = await pool.request().query(`
            SELECT id, reference_number, reference_year, local_office_id 
            FROM incident 
            WHERE reference_year IN (25, 2025)
            ORDER BY reference_number DESC
        `);

        console.log(`Total incidents in Year 25: ${result.recordset.length}`);

        const refs = result.recordset.map(r => r.reference_number);
        console.log('First 10 refs:', refs.slice(0, 10));

        // Find gaps
        const gaps = [];
        for (let i = 0; i < refs.length - 1; i++) {
            const current = refs[i];
            const next = refs[i + 1];
            if (current - next > 1) {
                gaps.push({ from: current, to: next, missingCount: current - next - 1 });
            }
        }

        console.log('Gaps found:', gaps);

        // Check Office IDs for the records around the gap (e.g. 436 and 415)
        const gapContext = result.recordset.filter(r => r.reference_number >= 415 && r.reference_number <= 436);
        console.log('Records between 415 and 436:', gapContext);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

checkGaps();
