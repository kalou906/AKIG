/**
 * Sentiment Test Endpoint
 * backend/src/routes/test.js
 * 
 * Testing endpoints for development
 */

const express = require('express');
const feedbackSentiment = require('../services/feedbackSentiment');

const router = express.Router();

/**
 * POST /api/test/sentiment
 * Test sentiment classification
 */
router.post('/sentiment', (req, res) => {
  try {
    const { comment } = req.body;

    if (!comment) {
      return res.status(400).json({
        success: false,
        message: 'Comment is required'
      });
    }

    const result = feedbackSentiment.analyze(comment);

    res.json({
      success: true,
      data: {
        comment,
        sentiment: result.sentiment,
        emoji: result.emoji,
        confidence: result.confidence,
        positiveCount: result.positiveCount,
        negativeCount: result.negativeCount,
        keyPhrases: result.keyPhrases,
        color: result.color
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/test/sentiment-batch
 * Test batch sentiment classification
 */
router.post('/sentiment-batch', (req, res) => {
  try {
    const { comments } = req.body;

    if (!Array.isArray(comments)) {
      return res.status(400).json({
        success: false,
        message: 'Comments must be an array'
      });
    }

    const results = comments.map(comment => {
      const result = feedbackSentiment.analyze(comment);
      return {
        comment,
        sentiment: result.sentiment,
        emoji: result.emoji,
        confidence: result.confidence
      };
    });

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/test/health
 * Health check
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Test API is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

module.exports = router;
