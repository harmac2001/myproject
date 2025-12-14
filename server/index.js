
const express = require('express');
const cors = require('cors');
const path = require("path");

// Load env vars first
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const incidentRoutes = require('./routes/incidents');
const optionsRoutes = require('./routes/options');
const cargoRoutes = require('./routes/cargo');

const app = express();
const passport = require("passport");
const { bearerStrategy } = require("./authConfig");

// Middleware
app.use(cors());
app.use(express.json());



app.use(passport.initialize());
passport.use(bearerStrategy);

// Auth Middleware
// Auth Middleware
const authenticateUser = passport.authenticate('oauth-bearer', { session: false });

// Routes
// Public Health Check
app.get('/api/health', (req, res) => {
    res.send('Incident Management API is running');
});

// Protected Routes
app.use('/api/incidents', authenticateUser, incidentRoutes);
app.use('/api/options', authenticateUser, optionsRoutes);
app.use('/api/cargo', authenticateUser, cargoRoutes);
app.use('/api/claims', authenticateUser, require('./routes/claims'));
app.use('/api/comments', authenticateUser, require('./routes/comments'));
app.use('/api/appointments', authenticateUser, require('./routes/appointments'));
app.use('/api/expenses', authenticateUser, require('./routes/expenses'));

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
    console.log(`Server is running on port ${PORT} `);
});
// Trigger restart
