const { sql, poolPromise } = require('./db');

async function run() {
    try {
        const pool = await poolPromise;

        const query = `
            ALTER FUNCTION [dbo].[get_reference_number](@input_id bigint)
            RETURNS varchar(20)
            BEGIN
                RETURN
                    (SELECT CONCAT(dbo.format_number(incident.reference_number), '/',
                                   RTRIM(RIGHT(CONVERT(char(4), incident.reference_year), 2)),
                                   '/', club.code, '/',
                                   claim_handler.code,
                                   IIF(incident.reference_sub_number > 0,
                                       CONCAT('-', RTRIM(CONVERT(char, incident.reference_sub_number))), '')
                                ) AS incident_reference_number
                     FROM incident
                              LEFT OUTER JOIN claim_handler ON claim_handler.id = incident.handler_id
                              LEFT OUTER JOIN club ON club.id = incident.club_id
                     WHERE incident.id = @input_id);
            END
        `;

        await pool.request().query(query);
        console.log('Function updated successfully.');

    } catch (err) {
        console.error('Error updating function:', err);
    } finally {
        process.exit();
    }
}

run();
