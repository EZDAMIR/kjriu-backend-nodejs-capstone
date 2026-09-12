// db.js
require('dotenv').config();
const { MongoClient } = require('mongodb');

const url = `${process.env.MONGO_URL}`;
const dbName = `${process.env.MONGO_DB}`;
let dbInstance = null;

async function connectToDatabase() {
    if (dbInstance) {
        return dbInstance;
    }

    const client = new MongoClient(url);

    // Connect to MongoDB.
    await client.connect();

    // Select the SecondChance database and cache the instance.
    dbInstance = client.db(dbName);

    return dbInstance;
}

module.exports = connectToDatabase;
