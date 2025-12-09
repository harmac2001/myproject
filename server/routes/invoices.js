const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../db');

// GET check if invoices exist for incident
router.get('/check-exists/:incidentId', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('incident_id', sql.BigInt, req.params.incidentId)
            .query('SELECT COUNT(*) as count FROM invoice WHERE incident_id = @incident_id');

        res.json({ exists: result.recordset[0].count > 0, count: result.recordset[0].count });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// GET all invoices for an incident
router.get('/incident/:incidentId', async (req, res) => {
    try {
        const { incidentId } = req.params;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('incident_id', sql.BigInt, incidentId)
            .query(`
                SELECT i.*, 
                       o.name as office_name, 
                       b.name as bank_name, b.iban, b.swift_code,
                       cl.code as club_code,
                       cc.name as club_contact_name, cc.email as club_contact_email,
                       oc.name as office_contact_name, oc.email as office_contact_email,
                       o.code as office_code,
                       m.name as member_name, m.line1 as member_line1, m.line2 as member_line2, m.line3 as member_line3, m.line4 as member_line4, m.vat_number as member_vat,
                       (SELECT ISNULL(SUM(f.cost * f.quantity), 0) FROM fee f WHERE f.invoice_id = i.id AND f.contractor_id IS NOT NULL) as correspondent_fees_total,
                       (
                           (SELECT ISNULL(SUM(d.gross_amount), 0) FROM disbursement d WHERE d.invoice_id = i.id) +
                           (SELECT ISNULL(SUM(f.cost * f.quantity), 0) FROM fee f WHERE f.invoice_id = i.id AND f.third_party_contractor_id IS NOT NULL)
                       ) as expenses_total
                FROM invoice i
                LEFT JOIN incident inc ON i.incident_id = inc.id
                LEFT JOIN office o ON inc.local_office_id = o.id
                LEFT JOIN bank b ON i.bank_id = b.id
                LEFT JOIN club cl ON inc.club_id = cl.id
                LEFT JOIN contact cc ON i.club_contact_id = cc.id
                LEFT JOIN contact oc ON i.office_contact_id = oc.id
                LEFT JOIN member m ON inc.member_id = m.id
                WHERE i.incident_id = @incident_id
                ORDER BY i.invoice_date DESC, i.id DESC
            `);

        const invoices = result.recordset.map(inv => {
            const paddedNum = (inv.invoice_number || '').toString().padStart(4, '0');
            const yearSuffix = (inv.invoice_year || '').toString().slice(-2);
            const clubCode = inv.club_code || '';
            // Only format if we have a number
            const formattedNumber = inv.invoice_number ? `${paddedNum}${yearSuffix}${clubCode}` : '';

            // Calculate total
            const invoice_total = (Number(inv.correspondent_fees_total) || 0) + (Number(inv.expenses_total) || 0);

            return {
                ...inv,
                formatted_invoice_number: formattedNumber,
                invoice_total
            };
        });

        res.json(invoices);
    } catch (err) {
        console.error('Error fetching invoices:', err);
        res.status(500).send(err.message);
    }
});

// GET single invoice by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.BigInt, id)
            .query(`
                SELECT i.*, 
                    o.name as office_name, 
                    o.line1 as office_line1, o.line2 as office_line2, o.line3 as office_line3, o.line4 as office_line4,
                    o.telephone as office_phone, o.email as office_email,
                    o.registration as office_registration, o.vat_number as office_vat,
                    b.name as bank_name, b.iban, b.swift_code, b.account as account_number, b.sort_code,
                    b.line1 as bank_line1, b.line2 as bank_line2, b.line3 as bank_line3, b.line4 as bank_line4,
                    cl.code as club_code,
                    cc.name as club_contact_name, cc.email as club_contact_email,
                    oc.name as office_contact_name, oc.email as office_contact_email,
                    o.code as office_code,
                    inc.voyage_and_leg as voyage_number, inc.incident_date, inc.description as incident_description,
                    dbo.get_reference_number(inc.id) as supplier_reference, inc.club_reference,
                    p.name as place_of_incident,
                    s.name as vessel_name,
                    m.name as member_name, m.line1 as member_line1, m.line2 as member_line2, m.line3 as member_line3, m.line4 as member_line4, m.vat_number as member_vat,
                    i.care_of_id, i.care_of_details,
                    cocl.name as care_of_club_name, cocl.line1 as care_of_club_line1, cocl.line2 as care_of_club_line2, cocl.line3 as care_of_club_line3, cocl.line4 as care_of_club_line4, cocl.vat_number as care_of_club_vat,
                    (SELECT ISNULL(SUM(f.cost * f.quantity), 0) FROM fee f WHERE f.invoice_id = i.id AND f.contractor_id IS NOT NULL) as correspondent_fees_total,
                    (
                        (SELECT ISNULL(SUM(d.gross_amount), 0) FROM disbursement d WHERE d.invoice_id = i.id) +
                        (SELECT ISNULL(SUM(f.cost * f.quantity), 0) FROM fee f WHERE f.invoice_id = i.id AND f.third_party_contractor_id IS NOT NULL)
                    ) as expenses_total
                FROM invoice i
                LEFT JOIN incident inc ON i.incident_id = inc.id
                LEFT JOIN office o ON inc.local_office_id = o.id
                LEFT JOIN bank b ON i.bank_id = b.id
                LEFT JOIN club cl ON inc.club_id = cl.id
                LEFT JOIN club cocl ON i.care_of_id = cocl.id
                LEFT JOIN contact cc ON i.club_contact_id = cc.id
                LEFT JOIN contact oc ON i.office_contact_id = oc.id
                LEFT JOIN port p ON inc.place_id = p.id
                LEFT JOIN member m ON inc.member_id = m.id
                LEFT JOIN ship s ON inc.ship_id = s.id
                WHERE i.id = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).send('Invoice not found');
        }

        const inv = result.recordset[0];
        const paddedNum = (inv.invoice_number || '').toString().padStart(4, '0');
        const yearSuffix = (inv.invoice_year || '').toString().slice(-2);
        const clubCode = inv.club_code || '';
        const formattedNumber = inv.invoice_number ? `${paddedNum}${yearSuffix}${clubCode}` : '';
        const invoice_total = (Number(inv.correspondent_fees_total) || 0) + (Number(inv.expenses_total) || 0);

        res.json({
            ...inv,
            formatted_invoice_number: formattedNumber,
            invoice_total
        });
    } catch (err) {
        console.error('Error fetching invoice:', err);
        res.status(500).send(err.message);
    }
});

// POST Create new invoice
router.post('/', async (req, res) => {
    try {
        const { incident_id, covered_from, covered_to, club_contact_id, office_contact_id, other_information, recipient_details } = req.body;
        const pool = await poolPromise;

        // Fetch member details if recipient_details is not provided
        let initialRecipientDetails = recipient_details;
        if (!initialRecipientDetails) {
            const memberResult = await pool.request()
                .input('incident_id', sql.BigInt, incident_id)
                .query(`
                    SELECT m.name, m.line1, m.line2, m.line3, m.line4, m.vat_number
                    FROM incident i
                    JOIN member m ON i.member_id = m.id
                    WHERE i.id = @incident_id
                `);

            if (memberResult.recordset.length > 0) {
                const m = memberResult.recordset[0];
                console.log('Member found for recipient details:', m);
                initialRecipientDetails = [
                    m.name,
                    m.line1,
                    m.line2,
                    m.line3,
                    m.line4,
                    m.vat_number ? `VAT: ${m.vat_number}` : null
                ].filter(val => val && val.trim() !== '').join('\n');
                console.log('Formatted Recipient Details:', initialRecipientDetails);
            } else {
                console.log('No member found for incident:', incident_id);
            }
        }

        // Get office_id from incident to find default bank
        const incidentResult = await pool.request()
            .input('id', sql.BigInt, incident_id)
            .query('SELECT local_office_id as office_id FROM incident WHERE id = @id');

        const officeId = incidentResult.recordset[0]?.office_id;

        // Get default bank for office (if any)
        let bankId = null;
        if (officeId) {
            const bankResult = await pool.request()
                .input('office_id', sql.BigInt, officeId)
                .query('SELECT TOP 1 id FROM bank WHERE office_id = @office_id');
            bankId = bankResult.recordset[0]?.id;
        }

        const createResult = await pool.request()
            .input('incident_id', sql.BigInt, incident_id)
            .input('bank_id', sql.BigInt, bankId)
            .input('invoice_date', sql.Date, new Date())
            .input('created_date', sql.BigInt, Date.now())
            .input('covered_from', sql.Date, covered_from || null)
            .input('covered_to', sql.Date, covered_to || null)
            .input('club_contact_id', sql.BigInt, club_contact_id || null)
            .input('office_contact_id', sql.BigInt, office_contact_id || null)
            .input('other_information', sql.VarChar, other_information || null)
            .input('recipient_details', sql.NVarChar, initialRecipientDetails || null)
            .query(`
                INSERT INTO invoice (incident_id, bank_id, invoice_date, created_date, covered_from, covered_to, club_contact_id, office_contact_id, other_information, recipient_details)
                OUTPUT INSERTED.*
                VALUES (@incident_id, @bank_id, @invoice_date, @created_date, @covered_from, @covered_to, @club_contact_id, @office_contact_id, @other_information, @recipient_details)
            `);

        // Fetch full details
        const result = await pool.request()
            .input('id', sql.BigInt, createResult.recordset[0].id)
            .query(`
                SELECT i.*, 
                       o.name as office_name, 
                       b.name as bank_name, b.iban, b.swift_code,
                       cl.code as club_code,
                       cc.name as club_contact_name, cc.email as club_contact_email,
                       oc.name as office_contact_name, oc.email as office_contact_email,
                       m.name as member_name, m.line1 as member_line1, m.line2 as member_line2, m.line3 as member_line3, m.line4 as member_line4, m.vat_number as member_vat
                FROM invoice i
                LEFT JOIN incident inc ON i.incident_id = inc.id
                LEFT JOIN office o ON inc.local_office_id = o.id
                LEFT JOIN bank b ON i.bank_id = b.id
                LEFT JOIN club cl ON inc.club_id = cl.id
                LEFT JOIN contact cc ON i.club_contact_id = cc.id
                LEFT JOIN contact oc ON i.office_contact_id = oc.id
                LEFT JOIN member m ON inc.member_id = m.id
                WHERE i.id = @id
            `);

        const inv = result.recordset[0];
        const paddedNum = (inv.invoice_number || '').toString().padStart(4, '0');
        const yearSuffix = (inv.invoice_year || '').toString().slice(-2);
        const clubCode = inv.club_code || '';
        const formattedNumber = inv.invoice_number ? `${paddedNum}${yearSuffix}${clubCode}` : '';

        res.status(201).json({ ...inv, formatted_invoice_number: formattedNumber });
    } catch (err) {
        console.error('Error creating invoice:', err);
        res.status(500).send(err.message);
    }
});

// PUT Update invoice details
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { bank_id, invoice_date, covered_from, covered_to, club_contact_id, office_contact_id, other_information, recipient_details, final_invoice } = req.body;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('id', sql.BigInt, id)
            .input('bank_id', sql.BigInt, bank_id)
            .input('invoice_date', sql.Date, invoice_date)
            .input('covered_from', sql.Date, covered_from || null)
            .input('covered_to', sql.Date, covered_to || null)
            .input('club_contact_id', sql.BigInt, club_contact_id || null)
            .input('office_contact_id', sql.BigInt, office_contact_id || null)
            .input('other_information', sql.VarChar, other_information || null)
            .input('recipient_details', sql.NVarChar, recipient_details || null)
            .input('final_invoice', sql.Bit, final_invoice ? 1 : 0)
            .query(`
                UPDATE invoice
                SET bank_id = @bank_id, 
                    invoice_date = @invoice_date,
                    covered_from = @covered_from,
                    covered_to = @covered_to,
                    club_contact_id = @club_contact_id,
                    office_contact_id = @office_contact_id,
                    other_information = @other_information,
                    recipient_details = @recipient_details,
                    final_invoice = @final_invoice
                WHERE id = @id
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).send('Invoice not found');
        }

        // Return updated invoice
        const updatedResult = await pool.request()
            .input('id', sql.BigInt, id)
            .query(`
                SELECT i.*, 
                       o.name as office_name, 
                       b.name as bank_name, b.iban, b.swift_code,
                       cl.code as club_code,
                       cc.name as club_contact_name, cc.email as club_contact_email,
                       oc.name as office_contact_name, oc.email as office_contact_email,
                       m.name as member_name, m.line1 as member_line1, m.line2 as member_line2, m.line3 as member_line3, m.line4 as member_line4, m.vat_number as member_vat
                FROM invoice i
                LEFT JOIN incident inc ON i.incident_id = inc.id
                LEFT JOIN office o ON inc.local_office_id = o.id
                LEFT JOIN bank b ON i.bank_id = b.id
                LEFT JOIN club cl ON inc.club_id = cl.id
                LEFT JOIN contact cc ON i.club_contact_id = cc.id
                LEFT JOIN contact oc ON i.office_contact_id = oc.id
                LEFT JOIN member m ON inc.member_id = m.id
                WHERE i.id = @id
            `);

        const inv = updatedResult.recordset[0];
        const paddedNum = (inv.invoice_number || '').toString().padStart(4, '0');
        const yearSuffix = (inv.invoice_year || '').toString().slice(-2);
        const clubCode = inv.club_code || '';
        const formattedNumber = inv.invoice_number ? `${paddedNum}${yearSuffix}${clubCode}` : '';

        res.json({ ...inv, formatted_invoice_number: formattedNumber });
    } catch (err) {
        console.error('Error updating invoice:', err);
        res.status(500).send(err.message);
    }
});

// PUT Register Invoice
router.put('/:id/register', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        // Check mandatory fields
        const checkResult = await pool.request()
            .input('id', sql.BigInt, id)
            .query('SELECT covered_from, covered_to, club_contact_id, office_contact_id FROM invoice WHERE id = @id');

        if (checkResult.recordset.length === 0) {
            return res.status(404).send('Invoice not found');
        }

        const inv = checkResult.recordset[0];
        if (!inv.covered_from || !inv.covered_to || !inv.club_contact_id || !inv.office_contact_id) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Mandatory fields missing: Covering Period, Recipient Contact, or Origin Contact.'
            });
        }

        // Generate next invoice number (simplified logic for now)
        const year = new Date().getFullYear();

        // Find max invoice number for current year
        const maxResult = await pool.request()
            .input('year', sql.Int, year)
            .query('SELECT MAX(CAST(invoice_number as INT)) as max_num FROM invoice WHERE invoice_year = @year');

        const nextNum = (maxResult.recordset[0].max_num || 0) + 1;
        const paddedNum = nextNum.toString().padStart(4, '0'); // e.g., 0123

        const result = await pool.request()
            .input('id', sql.BigInt, id)
            .input('invoice_number', sql.VarChar, paddedNum)
            .input('invoice_year', sql.Int, year)
            .query(`
                UPDATE invoice
                SET invoice_number = @invoice_number, invoice_year = @invoice_year
                WHERE id = @id
            `);

        res.json({ message: 'Invoice registered', invoice_number: paddedNum, invoice_year: year });
    } catch (err) {
        console.error('Error registering invoice:', err);
        res.status(500).send(err.message);
    }
});

// GET Fees for invoice
router.get('/:id/fees', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('invoice_id', sql.BigInt, id)
            .query(`
                SELECT f.*, 
                       c.name as contractor_name,
                       sp.name as service_provider_name
                FROM fee f
                LEFT JOIN contractor c ON f.contractor_id = c.id
                LEFT JOIN service_provider sp ON f.third_party_contractor_id = sp.id
                WHERE f.invoice_id = @invoice_id
                ORDER BY f.fee_date
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching fees:', err);
        res.status(500).send(err.message);
    }
});

// POST Add Fee
router.post('/fees', async (req, res) => {
    try {
        const { invoice_id, contractor_id, third_party_contractor_id, fee_date, work_performed, quantity, unit, cost } = req.body;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('invoice_id', sql.BigInt, invoice_id)
            .input('contractor_id', sql.BigInt, contractor_id || null)
            .input('third_party_contractor_id', sql.BigInt, third_party_contractor_id || null)
            .input('fee_date', sql.Date, fee_date)
            .input('work_performed', sql.VarChar, work_performed)
            .input('quantity', sql.Decimal(18, 2), quantity)
            .input('unit', sql.VarChar, unit)
            .input('cost', sql.Decimal(18, 2), cost)
            .input('third_party', sql.Int, third_party_contractor_id ? 1 : 0)
            .query(`
                INSERT INTO fee (invoice_id, contractor_id, third_party_contractor_id, fee_date, work_performed, quantity, unit, cost, third_party)
                OUTPUT INSERTED.*
                VALUES (@invoice_id, @contractor_id, @third_party_contractor_id, @fee_date, @work_performed, @quantity, @unit, @cost, @third_party)
            `);

        res.status(201).json(result.recordset[0]);
    } catch (err) {
        console.error('Error adding fee:', err);
        res.status(500).send(err.message);
    }
});

// DELETE Fee
router.delete('/fees/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        await pool.request()
            .input('id', sql.BigInt, id)
            .query('DELETE FROM fee WHERE id = @id');

        res.json({ message: 'Fee deleted' });
    } catch (err) {
        console.error('Error deleting fee:', err);
        res.status(500).send(err.message);
    }
});

// GET Disbursements for invoice
router.get('/:id/disbursements', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('invoice_id', sql.BigInt, id)
            .query(`
                SELECT d.*, dt.name as type_name
                FROM disbursement d
                LEFT JOIN disbursement_type dt ON d.type_id = dt.id
                WHERE d.invoice_id = @invoice_id
                ORDER BY d.id
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching disbursements:', err);
        res.status(500).send(err.message);
    }
});

// POST Add Disbursement
router.post('/disbursements', async (req, res) => {
    try {
        const { invoice_id, type_id, comments, amount } = req.body;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('invoice_id', sql.BigInt, invoice_id)
            .input('type_id', sql.BigInt, type_id)
            .input('comments', sql.VarChar, comments || null)
            .input('gross_amount', sql.Decimal(18, 2), amount)
            .query(`
                INSERT INTO disbursement (invoice_id, type_id, comments, gross_amount, third_party)
                OUTPUT INSERTED.*
                VALUES (@invoice_id, @type_id, @comments, @gross_amount, 0)
            `);

        res.status(201).json(result.recordset[0]);
    } catch (err) {
        console.error('Error adding disbursement:', err);
        res.status(500).send(err.message);
    }
});

// DELETE Disbursement
router.delete('/disbursements/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        await pool.request()
            .input('id', sql.BigInt, id)
            .query('DELETE FROM disbursement WHERE id = @id');

        res.json({ message: 'Disbursement deleted' });
    } catch (err) {
        console.error('Error deleting disbursement:', err);
        res.status(500).send(err.message);
    }
});

// PATCH Settle Invoice
router.patch('/:id/settle', async (req, res) => {
    try {
        const { id } = req.params;
        const { settlement_date } = req.body;
        const pool = await poolPromise;

        await pool.request()
            .input('id', sql.BigInt, id)
            .input('settlement_date', sql.Date, settlement_date)
            .query('UPDATE invoice SET settlement_date = @settlement_date WHERE id = @id');

        res.json({ message: 'Invoice settled successfully' });
    } catch (err) {
        console.error('Error settling invoice:', err);
        res.status(500).send(err.message);
    }
});

// PATCH Update Next Chasing Date
router.patch('/:id/chasing_date', async (req, res) => {
    try {
        const { id } = req.params;
        const { next_chasing_date } = req.body;
        const pool = await poolPromise;

        await pool.request()
            .input('id', sql.BigInt, id)
            .input('next_chasing_date', sql.Date, next_chasing_date)
            .query('UPDATE invoice SET next_chasing_date = @next_chasing_date WHERE id = @id');

        res.json({ message: 'Next chasing date updated successfully' });
    } catch (err) {
        console.error('Error updating next chasing date:', err);
        res.status(500).send(err.message);
    }
});

// PATCH Update Remarks
router.patch('/:id/remarks', async (req, res) => {
    try {
        const { id } = req.params;
        const { remarks } = req.body;
        const pool = await poolPromise;

        await pool.request()
            .input('id', sql.BigInt, id)
            .input('remarks', sql.VarChar, remarks)
            .query('UPDATE invoice SET remarks = @remarks WHERE id = @id');

        res.json({ message: 'Remarks updated successfully' });
    } catch (err) {
        console.error('Error updating remarks:', err);
        res.status(500).send(err.message);
    }
});
// DELETE Invoice
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        // Check if invoice is registered
        const checkResult = await pool.request()
            .input('id', sql.BigInt, id)
            .query('SELECT invoice_number FROM invoice WHERE id = @id');

        if (checkResult.recordset.length === 0) {
            return res.status(404).send('Invoice not found');
        }

        if (checkResult.recordset[0].invoice_number) {
            return res.status(400).json({ message: 'Cannot delete a registered invoice.' });
        }

        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const request = new sql.Request(transaction);
            request.input('id', sql.BigInt, id);

            // Delete dependent records first
            await request.query('DELETE FROM fee WHERE invoice_id = @id');
            await request.query('DELETE FROM disbursement WHERE invoice_id = @id');

            // Delete the invoice itself
            await request.query('DELETE FROM invoice WHERE id = @id');

            await transaction.commit();
            res.json({ message: 'Invoice deleted successfully' });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        console.error('Error deleting invoice:', err);
        res.status(500).send(err.message);
    }
});

module.exports = router;
