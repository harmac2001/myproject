const express = require('express');
const app = express();
const optionsRouter = require('./routes/options');

app.use('/api/options', optionsRouter);

console.log('Inspecting /api/options routes:');
optionsRouter.stack.forEach(r => {
    if (r.route && r.route.path) {
        console.log(`${Object.keys(r.route.methods).join(', ').toUpperCase()} ${r.route.path}`);
    }
});
