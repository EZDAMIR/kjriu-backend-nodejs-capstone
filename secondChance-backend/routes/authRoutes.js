const express = require('express');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const connectToDatabase = require('../models/db');
const logger = require('../logger');

require('dotenv').config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// POST /api/auth/register
router.post(
    '/register',
    [
        body('email').isEmail().withMessage('A valid email is required'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
        body('firstName').notEmpty().withMessage('First name is required'),
        body('lastName').notEmpty().withMessage('Last name is required'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const db = await connectToDatabase();
            const collection = db.collection('users');

            const existingUser = await collection.findOne({ email: req.body.email });
            if (existingUser) {
                return res.status(400).json({ error: 'Email id already exists' });
            }

            const salt = await bcryptjs.genSalt(10);
            const passwordHash = await bcryptjs.hash(req.body.password, salt);

            const result = await collection.insertOne({
                email: req.body.email,
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                password: passwordHash,
                createdAt: new Date(),
            });

            const payload = { user: { id: result.insertedId.toString() } };
            const authtoken = jwt.sign(payload, JWT_SECRET);

            logger.info('User registered successfully');
            return res.status(201).json({ authtoken, email: req.body.email });
        } catch (e) {
            logger.error({ err: e }, 'Registration failed');
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
);

// POST /api/auth/login
router.post(
    '/login',
    [
        body('email').isEmail().withMessage('A valid email is required'),
        body('password').notEmpty().withMessage('Password is required'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const db = await connectToDatabase();
            const collection = db.collection('users');
            const user = await collection.findOne({ email: req.body.email });

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            const passwordMatches = await bcryptjs.compare(req.body.password, user.password);
            if (!passwordMatches) {
                return res.status(401).json({ error: 'Wrong password' });
            }

            const payload = { user: { id: user._id.toString() } };
            const authtoken = jwt.sign(payload, JWT_SECRET);

            logger.info('User logged in successfully');
            return res.status(200).json({
                authtoken,
                userName: user.firstName,
                userEmail: user.email,
            });
        } catch (e) {
            logger.error({ err: e }, 'Login failed');
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
);

// PUT /api/auth/update
router.put(
    '/update',
    [body('name').optional().notEmpty().withMessage('Name cannot be empty')],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const email = req.headers.email;
        if (!email) {
            return res.status(400).json({ error: 'Email not found in the request headers' });
        }

        try {
            const db = await connectToDatabase();
            const collection = db.collection('users');
            const existingUser = await collection.findOne({ email });

            if (!existingUser) {
                return res.status(404).json({ error: 'User not found' });
            }

            const updates = { updatedAt: new Date() };
            if (req.body.name !== undefined) {
                updates.firstName = req.body.name;
            }
            if (req.body.firstName !== undefined) {
                updates.firstName = req.body.firstName;
            }
            if (req.body.lastName !== undefined) {
                updates.lastName = req.body.lastName;
            }

            const updatedUser = await collection.findOneAndUpdate(
                { email },
                { $set: updates },
                { returnDocument: 'after' }
            );

            const payload = { user: { id: updatedUser._id.toString() } };
            const authtoken = jwt.sign(payload, JWT_SECRET);

            logger.info('User updated successfully');
            return res.json({ authtoken, userName: updatedUser.firstName, userEmail: updatedUser.email });
        } catch (e) {
            logger.error({ err: e }, 'User update failed');
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
);

module.exports = router;
