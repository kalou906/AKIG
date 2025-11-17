/**
 * Simplified Feedback Sentiment Classifier
 * backend/src/services/feedbackSentiment.js
 * 
 * Lightweight sentiment analysis for feedback
 * Complements the full analyzer with simple keyword-based classification
 */

/**
 * Classify sentiment based on comment keywords
 * Simple keyword matching for fast, lightweight classification
 */
function classify(comment) {
  const c = (comment || '').toLowerCase().trim();
  
  if (!c) return 'neutral';

  // Positive keywords
  const positiveKeywords = [
    'merci', 'bien', 'excellent', 'super', 'génial', 'fantastique',
    'parfait', 'magnifique', 'satisfait', 'content', 'heureux',
    'très bien', 'bon', 'agréable', 'plaisant', 'rapide',
    'efficace', 'professionnel', 'courtois', 'aimable', 'sympathique',
    'merveilleux', 'formidable', 'incroyable', 'adoré', 'aimer',
    'great', 'excellent', 'amazing', 'wonderful', 'perfect',
    'love', 'thanks', 'thank you', 'awesome'
  ];

  // Negative keywords
  const negativeKeywords = [
    'problème', 'lent', 'horrible', 'terrible', 'mauvais', 'nul',
    'pire', 'cassé', 'ne fonctionne pas', 'erreur', 'faute',
    'incompétent', 'frustré', 'en colère', 'déçu', 'problématique',
    'défaut', 'défectif', 'arrêt', 'panne', 'bug', 'bugs',
    'retard', 'tardif', 'très lent', 'trop lent', 'difficile',
    'compliqué', 'confus', 'mal', 'failure', 'issue', 'problem',
    'bad', 'terrible', 'awful', 'horrible', 'broken', 'error'
  ];

  // Intensifiers that amplify sentiment
  const intensifiers = [
    'très', 'vraiment', 'extrêmement', 'trop', 'absolument',
    'complètement', 'énormément', 'totalement', 'really', 'very',
    'extremely', 'very', 'absolutely', 'incredibly'
  ];

  // Count positive and negative keywords
  let positiveCount = 0;
  let negativeCount = 0;
  let intensifierCount = 0;

  // Check for positives
  for (const keyword of positiveKeywords) {
    if (c.includes(keyword)) {
      positiveCount++;
    }
  }

  // Check for negatives
  for (const keyword of negativeKeywords) {
    if (c.includes(keyword)) {
      negativeCount++;
    }
  }

  // Check for intensifiers
  for (const intensifier of intensifiers) {
    if (c.includes(intensifier)) {
      intensifierCount++;
    }
  }

  // Apply intensifier boost
  const boost = intensifierCount > 0 ? 1 + (intensifierCount * 0.2) : 1;
  const adjustedPositive = positiveCount * boost;
  const adjustedNegative = negativeCount * boost;

  // Determine sentiment
  if (adjustedPositive > adjustedNegative && adjustedPositive > 0) {
    return 'positive';
  } else if (adjustedNegative > adjustedPositive && adjustedNegative > 0) {
    return 'negative';
  }
  
  return 'neutral';
}

/**
 * Classify with confidence score
 * Returns sentiment + confidence (0-1)
 */
function classifyWithConfidence(comment) {
  const c = (comment || '').toLowerCase().trim();
  
  if (!c) return { sentiment: 'neutral', confidence: 0 };

  const positiveKeywords = [
    'merci', 'bien', 'excellent', 'super', 'génial', 'fantastique',
    'parfait', 'magnifique', 'satisfait', 'content', 'heureux',
    'très bien', 'bon', 'agréable', 'plaisant', 'rapide',
    'efficace', 'professionnel', 'courtois', 'aimable', 'sympathique'
  ];

  const negativeKeywords = [
    'problème', 'lent', 'horrible', 'terrible', 'mauvais', 'nul',
    'pire', 'cassé', 'ne fonctionne pas', 'erreur', 'faute',
    'incompétent', 'frustré', 'en colère', 'déçu', 'problématique'
  ];

  let positiveCount = 0;
  let negativeCount = 0;

  for (const keyword of positiveKeywords) {
    if (c.includes(keyword)) positiveCount++;
  }

  for (const keyword of negativeKeywords) {
    if (c.includes(keyword)) negativeCount++;
  }

  const total = positiveCount + negativeCount;
  const confidence = Math.min(1, total / 5); // Max confidence at 5+ keywords

  let sentiment = 'neutral';
  if (positiveCount > negativeCount && positiveCount > 0) {
    sentiment = 'positive';
  } else if (negativeCount > positiveCount && negativeCount > 0) {
    sentiment = 'negative';
  }

  return {
    sentiment,
    confidence: parseFloat(confidence.toFixed(2)),
    positiveCount,
    negativeCount
  };
}

/**
 * Quick sentiment extraction for batch processing
 */
function classifyBatch(comments) {
  return comments.map(comment => ({
    comment,
    sentiment: classify(comment)
  }));
}

/**
 * Extract key phrases from comment
 * Simple keyword extraction
 */
function extractKeyPhrases(comment) {
  const c = (comment || '').toLowerCase();
  const words = c.split(/\s+/);
  
  // Filter meaningful words (length > 3, exclude common words)
  const stopwords = [
    'le', 'la', 'les', 'de', 'du', 'des', 'et', 'ou', 'mais',
    'donc', 'car', 'qui', 'que', 'pour', 'avec', 'dans', 'par',
    'this', 'that', 'these', 'those', 'and', 'or', 'but', 'the',
    'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being'
  ];

  const phrases = words
    .filter(word => word.length > 3 && !stopwords.includes(word))
    .slice(0, 5); // Limit to 5 phrases

  return phrases;
}

/**
 * Map score (0-10) to sentiment
 */
function scoreToSentiment(score) {
  if (score >= 8) return 'positive';
  if (score >= 5) return 'neutral';
  return 'negative';
}

/**
 * Get sentiment emoji
 */
function getSentimentEmoji(sentiment) {
  const emojis = {
    positive: '😊',
    neutral: '😐',
    negative: '😔'
  };
  return emojis[sentiment] || '❓';
}

/**
 * Get sentiment color (hex)
 */
function getSentimentColor(sentiment) {
  const colors = {
    positive: '#27ae60', // Green
    neutral: '#f39c12',  // Orange
    negative: '#e74c3c'  // Red
  };
  return colors[sentiment] || '#95a5a6';
}

/**
 * Analyze and return comprehensive sentiment data
 */
function analyze(comment) {
  return {
    sentiment: classify(comment),
    ...classifyWithConfidence(comment),
    keyPhrases: extractKeyPhrases(comment),
    emoji: getSentimentEmoji(classify(comment)),
    color: getSentimentColor(classify(comment))
  };
}

module.exports = {
  classify,
  classifyWithConfidence,
  classifyBatch,
  extractKeyPhrases,
  scoreToSentiment,
  getSentimentEmoji,
  getSentimentColor,
  analyze
};
