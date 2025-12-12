const express = require('express');
const cors = require('cors');
const { poolPromise } = require('./db');
const incidentRoutes = require('./routes/incidents');
const optionsRoutes = require('./routes/options');
const cargoRoutes = require('./routes/cargo');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/incidents', incidentRoutes);
app.use('/api/options', optionsRoutes);
app.use('/api/cargo', cargoRoutes);
app.use('/api/claims', require('./routes/claims'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/invoices', require('./routes/invoices'));

// Health Check
app.get('/', (req, res) => {
    res.send('Incident Management API is running');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
// Trigger restart - Attempt 4
