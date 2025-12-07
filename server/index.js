const express = require('express');
const cors = require('cors');
const incidentRoutes = require('./routes/incidents');
const optionsRoutes = require('./routes/options');
const cargoRoutes = require('./routes/cargo');

const app = express();
const path = require("path");

require("dotenv").config();

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

// Health Check
app.get('/api/health', (req, res) => {
    res.send('Incident Management API is running');
});

// Serve os arquivos estáticos do React após a build
// Verifica se estamos em produção para servir a pasta correta
if (process.env.NODE_ENV === "production") {
    // Aponta para a pasta dist criada pelo Vite dentro de client
    app.use(express.static(path.join(__dirname, "../client/dist")));

    // Qualquer rota que não seja API será redirecionada para o index.html do React
    app.get("*", (req, res) => {
        res.sendFile(path.join(__dirname, "../client/dist", "index.html"));
    });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
// Trigger restart
