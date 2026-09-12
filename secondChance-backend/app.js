/*jshint esversion: 8 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const pinoHttp = require('pino-http');
const logger = require('./logger');

const connectToDatabase = require('./models/db');
const authRoutes = require('./routes/authRoutes');
const secondChanceItemsRoutes = require('./routes/secondChanceItemsRoutes');
const searchRoutes = require('./routes/searchRoutes');

const app = express();
const port = process.env.PORT || 3060;

app.use(cors());
app.use(express.json());
app.use(pinoHttp({ logger }));
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB once when the service starts.
connectToDatabase()
    .then(() => logger.info('Connected to DB'))
    .catch((e) => logger.error({ err: e }, 'Failed to connect to DB'));

// API routes.
app.use('/api/auth', authRoutes);
app.use('/api/secondchance/items', secondChanceItemsRoutes);
app.use('/api/secondchance/search', searchRoutes);

app.get('/', (req, res) => {
    res.send('Inside the server');
});

// Global error handler.
app.use((err, req, res, next) => {
    logger.error({ err }, 'Unhandled request error');
    res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(port, () => {
    logger.info(`Server running on port ${port}`);
});

module.exports = app;
