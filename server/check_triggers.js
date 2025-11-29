const { sql, poolPromise } = require('./db');
const fs = require('fs');

async function checkTriggers() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                sysobjects.name AS trigger_name, 
                USER_NAME(sysobjects.uid) AS trigger_owner, 
                s.name AS table_name, 
                OBJECTPROPERTY(sysobjects.id, 'ExecIsUpdateTrigger') AS isupdate, 
                OBJECTPROPERTY(sysobjects.id, 'ExecIsDeleteTrigger') AS isdelete, 
                OBJECTPROPERTY(sysobjects.id, 'ExecIsInsertTrigger') AS isinsert, 
                OBJECTPROPERTY(sysobjects.id, 'ExecIsAfterTrigger') AS isafter, 
                OBJECTPROPERTY(sysobjects.id, 'ExecIsInsteadOfTrigger') AS isinsteadof, 
                OBJECTPROPERTY(sysobjects.id, 'ExecIsTriggerDisabled') AS [disabled] 
            FROM sysobjects 
            INNER JOIN sysobjects s ON sysobjects.parent_obj = s.id 
            WHERE sysobjects.type = 'TR' AND s.name = 'incident'
        `);

        let output = 'Triggers on incident table:\n';
        if (result.recordset.length === 0) {
            output += 'No triggers found.\n';
        } else {
            result.recordset.forEach(row => {
                output += JSON.stringify(row, null, 2) + '\n';
            });
        }

        fs.writeFileSync('trigger_check.txt', output);
        console.log(output);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkTriggers();
