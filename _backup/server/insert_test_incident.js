const { sql, poolPromise } = require('./db');

console.error('Error inserting incident:', err);
process.exit(1);
    }
}

insertTestIncident();
