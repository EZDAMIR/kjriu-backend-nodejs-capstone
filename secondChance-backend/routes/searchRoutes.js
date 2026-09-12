const express = require('express');
const router = express.Router();
const connectToDatabase = require('../models/db');
require('dotenv').config();

// Search SecondChance items. This router is mounted at /api/secondchance/search.
router.get('/', async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection(process.env.MONGO_COLLECTION || 'secondChanceItems');

        const query = {};

        if (req.query.name && req.query.name.trim() !== '') {
            query.name = { $regex: req.query.name.trim(), $options: 'i' };
        }

        // Filter by category when provided.
        if (req.query.category) {
            query.category = req.query.category;
        }

        if (req.query.condition) {
            query.condition = req.query.condition;
        }

        if (req.query.age_years) {
            query.age_years = { $lte: parseInt(req.query.age_years, 10) };
        }

        const gifts = await collection.find(query).toArray();
        res.json(gifts);
    } catch (e) {
        next(e);
    }
});

module.exports = router;
