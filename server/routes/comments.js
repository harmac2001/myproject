const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../db');

// GET comments for an incident
router.get('/:incidentId', async (req, res) => {
    try {
        const { incidentId } = req.params;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('incidentId', sql.BigInt, incidentId)
            .query(`
                SELECT * FROM comment 
                WHERE incident_id = @incidentId 
                ORDER BY created_date DESC
            `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// POST create new comment
router.post('/', async (req, res) => {
    try {
        const { incident_id, subject, comment_text } = req.body;
        const pool = await poolPromise;

        await pool.request()
            .input('incident_id', sql.BigInt, incident_id)
            .input('subject', sql.NVarChar, subject)
            .input('comment_text', sql.NVarChar, comment_text)
            .query(`
                INSERT INTO comment (incident_id, subject, comment_text, created_date, last_modified_date)
                VALUES (@incident_id, @subject, @comment_text, DATEDIFF(SECOND,'1970-01-01', GETUTCDATE()), DATEDIFF(SECOND,'1970-01-01', GETUTCDATE()))
            `);

        res.status(201).json({ message: 'Comment created successfully' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// PUT update comment
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { subject, comment_text } = req.body;
        const pool = await poolPromise;

        await pool.request()
            .input('id', sql.BigInt, id)
            .input('subject', sql.NVarChar, subject)
            .input('comment_text', sql.NVarChar, comment_text)
            .query(`
                UPDATE comment 
                SET subject = @subject, 
                    comment_text = @comment_text,
                    last_modified_date = DATEDIFF(SECOND,'1970-01-01', GETUTCDATE())
                WHERE id = @id
            `);

        res.json({ message: 'Comment updated successfully' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// DELETE comment
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        await pool.request()
            .input('id', sql.BigInt, id)
            .query('DELETE FROM comment WHERE id = @id');

        res.json({ message: 'Comment deleted successfully' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

module.exports = router;
