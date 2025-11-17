/**
 * Sentiment Classifier Tester
 * backend/test-sentiment.js
 * 
 * Quick test script for sentiment classification
 */

const feedbackSentiment = require('./src/services/feedbackSentiment');

const testComments = [
  // Positive
  "Excellent service, très rapide et professionnel!",
  "Merci beaucoup pour votre aide, c'est parfait!",
  "Service remarquable, je suis très satisfait",
  "C'est vraiment génial, l'équipe est sympathique",
  "Adoré ! Excellent en tous points",
  
  // Negative
  "Problème constant, très lent et incompétent",
  "Horrible service, pire que jamais",
  "Ne fonctionne pas correctement, cassé et lent",
  "Très déçu, mauvais support et retards",
  "Frustrant et problématique, vraiment nul",
  
  // Neutral
  "C'est un service standard",
  "Rien de particulier à signaler",
  "Service normal, pas de commentaire spécial",
  "C'est comme prévu",
  "OK"
];

console.log('🧪 SENTIMENT CLASSIFICATION TEST\n');
console.log('=' .repeat(80));

testComments.forEach((comment, index) => {
  const result = feedbackSentiment.analyze(comment);
  console.log(`\n${index + 1}. "${comment}"`);
  console.log(`   Sentiment: ${result.emoji} ${result.sentiment.toUpperCase()}`);
  console.log(`   Confidence: ${(result.confidence * 100).toFixed(0)}%`);
  console.log(`   Keywords: ${result.keyPhrases.join(', ') || '(none)'}`);
  console.log(`   Color: ${result.color}`);
});

console.log('\n' + '='.repeat(80));
console.log('\n📊 BATCH PROCESSING TEST\n');

const batchResults = feedbackSentiment.classifyBatch([
  "Parfait!",
  "Problème majeur",
  "Neutre"
]);

batchResults.forEach(({ comment, sentiment }) => {
  console.log(`"${comment}" → ${sentiment}`);
});

console.log('\n' + '='.repeat(80));
console.log('\n🔢 SCORE TO SENTIMENT TEST\n');

[1, 4, 5, 7, 10].forEach(score => {
  const sentiment = feedbackSentiment.scoreToSentiment(score);
  const emoji = feedbackSentiment.getSentimentEmoji(sentiment);
  console.log(`Score ${score}/10 → ${emoji} ${sentiment}`);
});

console.log('\n' + '='.repeat(80));
console.log('✅ Tests completed!\n');
