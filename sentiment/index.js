require('dotenv').config();
const express = require('express');
const logger = require('./logger');
const expressPino = require('express-pino-logger')({ logger });
const natural = require('natural');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(expressPino);

app.post('/sentiment', async (req, res) => {
    const { sentence } = req.body;

    if (!sentence) {
        logger.error('No sentence provided');
        return res.status(400).json({ error: 'No sentence provided' });
    }

    const Analyzer = natural.SentimentAnalyzer;
    const stemmer = natural.PorterStemmer;
    const analyzer = new Analyzer('English', stemmer, 'afinn');

    try {
        const analysisResult = analyzer.getSentiment(sentence.split(' '));

        let sentiment = 'neutral';
        if (analysisResult > 0) {
            sentiment = 'positive';
        } else if (analysisResult < 0) {
            sentiment = 'negative';
        }

        logger.info(`Sentiment analysis result: ${analysisResult}`);
        return res.status(200).json({ sentimentScore: analysisResult, sentiment });
    } catch (error) {
        logger.error(`Error performing sentiment analysis: ${error}`);
        return res.status(500).json({ message: 'Error performing sentiment analysis' });
    }
});

app.listen(port, () => {
    logger.info(`Server running on port ${port}`);
});

module.exports = app;
