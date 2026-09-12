const express = require('express');
const multer = require('multer');
const fs = require('fs');
const router = express.Router();
const connectToDatabase = require('../models/db');
const logger = require('../logger');

const directoryPath = 'public/images';
fs.mkdirSync(directoryPath, { recursive: true });

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, directoryPath);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
});

const upload = multer({ storage });

// GET /api/secondchance/items
router.get('/', async (req, res, next) => {
    logger.info('/api/secondchance/items called');
    try {
        const db = await connectToDatabase();
        const collection = db.collection('secondChanceItems');
        const secondChanceItems = await collection.find({}).toArray();
        res.json(secondChanceItems);
    } catch (e) {
        logger.error({ err: e }, 'Failed to list SecondChance items');
        next(e);
    }
});

// POST /api/secondchance/items with an optional uploaded file.
router.post('/', upload.single('file'), async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection('secondChanceItems');

        const lastItem = await collection.find({}).sort({ id: -1 }).limit(1).next();
        const nextId = lastItem && !Number.isNaN(parseInt(lastItem.id, 10))
            ? (parseInt(lastItem.id, 10) + 1).toString()
            : '1';

        const secondChanceItem = {
            ...req.body,
            id: nextId,
            date_added: Math.floor(Date.now() / 1000),
        };

        if (req.file) {
            secondChanceItem.image = req.file.filename;
        }

        const result = await collection.insertOne(secondChanceItem);
        res.status(201).json({ ...secondChanceItem, _id: result.insertedId });
    } catch (e) {
        next(e);
    }
});

// GET /api/secondchance/items/:id
router.get('/:id', async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection('secondChanceItems');
        const secondChanceItem = await collection.findOne({ id: req.params.id });

        if (!secondChanceItem) {
            return res.status(404).json({ error: 'SecondChance item not found' });
        }

        res.json(secondChanceItem);
    } catch (e) {
        next(e);
    }
});

// PUT /api/secondchance/items/:id
router.put('/:id', async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection('secondChanceItems');
        const id = req.params.id;

        const existingItem = await collection.findOne({ id });
        if (!existingItem) {
            return res.status(404).json({ error: 'SecondChance item not found' });
        }

        const updates = {
            ...req.body,
            updatedAt: new Date(),
        };

        if (updates.age_days !== undefined) {
            updates.age_days = Number(updates.age_days);
            updates.age_years = Number((updates.age_days / 365).toFixed(1));
        }

        const updatedItem = await collection.findOneAndUpdate(
            { id },
            { $set: updates },
            { returnDocument: 'after' }
        );

        res.json(updatedItem);
    } catch (e) {
        next(e);
    }
});

// DELETE /api/secondchance/items/:id
router.delete('/:id', async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection('secondChanceItems');
        const id = req.params.id;

        const existingItem = await collection.findOne({ id });
        if (!existingItem) {
            return res.status(404).json({ error: 'SecondChance item not found' });
        }

        await collection.deleteOne({ id });
        res.json({ deleted: 'success' });
    } catch (e) {
        next(e);
    }
});

module.exports = router;
