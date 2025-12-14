const http = require('http');

const createFee = (type, data) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/invoices/fees',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': JSON.stringify(data).length
            }
        };

        const req = http.request(options, res => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                if (res.statusCode === 201) {
                    console.log(`[SUCCESS] ${type} created:`, body);
                    resolve();
                } else {
                    console.error(`[ERROR] ${type} failed (${res.statusCode}):`, body);
                    reject();
                }
            });
        });

        req.on('error', error => {
            console.error(error);
            reject();
        });

        req.write(JSON.stringify(data));
        req.end();
    });
};

(async () => {
    // Correspondent Fee
    await createFee('Correspondent Fee', {
        invoice_id: 98532,
        contractor_id: 52,
        third_party_contractor_id: null,
        fee_date: '2025-01-01',
        work_performed: 'Test Correspondent Fee',
        quantity: 1,
        unit: 'Fixed',
        cost: 100
    });

    // Third Party Payment
    // First get a service provider ID
    const { poolPromise } = require('./db');
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT TOP 1 id FROM service_provider');
        const providerId = result.recordset[0]?.id;

        if (providerId) {
            await createFee('Third Party Payment', {
                invoice_id: 98532,
                contractor_id: null,
                third_party_contractor_id: providerId,
                fee_date: '2025-01-01',
                work_performed: 'Test Third Party Payment',
                quantity: 1,
                unit: 'Fixed',
                cost: 200
            });
        } else {
            console.log('No service provider found, skipping third party test');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();
