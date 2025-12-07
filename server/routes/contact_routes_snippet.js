
// POST create new contact
router.post('/contacts', async (req, res) => {
    try {
        const { name, email } = req.body;
        if (!name || name.trim() === '') {
            return res.status(400).send('Contact name is required');
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('name', sql.NVarChar, name.trim())
            .input('email', sql.NVarChar, email ? email.trim() : null)
            .query('INSERT INTO contact (name, email) OUTPUT INSERTED.id, INSERTED.name, INSERTED.email VALUES (@name, @email)');

        res.status(201).json(result.recordset[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// PUT update contact
router.put('/contacts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).send('Contact name is required');
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.BigInt, id)
            .input('name', sql.NVarChar, name.trim())
            .input('email', sql.NVarChar, email ? email.trim() : null)
            .query(`
                UPDATE contact 
                SET name = @name, email = @email
                OUTPUT INSERTED.id, INSERTED.name, INSERTED.email
                WHERE id = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).send('Contact not found');
        }

        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// GET contact usage
router.get('/contacts/:id/usage', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('id', sql.BigInt, id)
            .query(`
                SELECT 
                    i.id,
                    i.invoice_number,
                    'invoice' as type
                FROM invoice i
                WHERE i.club_contact_id = @id OR i.office_contact_id = @id
            `);

        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// PATCH reassign contact
router.patch('/contacts/:id/reassign', async (req, res) => {
    try {
        const { id } = req.params;
        const { new_contact_id } = req.body;

        if (!new_contact_id) {
            return res.status(400).send('New contact ID is required');
        }

        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // Update club_contact_id
            await transaction.request()
                .input('old_id', sql.BigInt, id)
                .input('new_id', sql.BigInt, new_contact_id)
                .query(`UPDATE invoice SET club_contact_id = @new_id WHERE club_contact_id = @old_id`);

            // Update office_contact_id
            await transaction.request()
                .input('old_id', sql.BigInt, id)
                .input('new_id', sql.BigInt, new_contact_id)
                .query(`UPDATE invoice SET office_contact_id = @new_id WHERE office_contact_id = @old_id`);

            await transaction.commit();
            res.json({ success: true });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// DELETE contact
router.delete('/contacts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        // Check usage
        const checkResult = await pool.request()
            .input('id', sql.BigInt, id)
            .query(`
                SELECT COUNT(*) as count 
                FROM invoice 
                WHERE club_contact_id = @id OR office_contact_id = @id
            `);

        if (checkResult.recordset[0].count > 0) {
            return res.status(400).json({
                error: 'Cannot delete contact',
                message: `This contact is used in ${checkResult.recordset[0].count} invoice(s). Please reassign them before deleting.`
            });
        }

        const result = await pool.request()
            .input('id', sql.BigInt, id)
            .query('DELETE FROM contact WHERE id = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).send('Contact not found');
        }

        res.status(204).send();
    } catch (err) {
        res.status(500).send(err.message);
    }
});
