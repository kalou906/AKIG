/**
 * Sentiment Analyzer Service
 * src/services/sentiment.analyzer.js
 * 
 * Analyse le sentiment des commentaires et extrait les mots-clés
 */

// Dictionnaire de mots positifs
const POSITIVE_WORDS = {
  fr: [
    'excellent', 'super', 'fantastique', 'génial', 'merveilleux', 'parfait',
    'très bien', 'magnifique', 'extraordinaire', 'fabuleux', 'formidable',
    'impressionnant', 'incroyable', 'sensationnel', 'remarquable', 'décent',
    'bien', 'bon', 'agréable', 'plaisant', 'satisfait', 'content', 'heureux',
    'merci', 'grateful', 'apprécier', 'aimer', 'adorer', 'efficace', 'rapide',
    'professionnel', 'courtois', 'aimable', 'serviable', 'attentif', 'sympathique'
  ],
  en: [
    'excellent', 'great', 'fantastic', 'wonderful', 'amazing', 'perfect',
    'very good', 'marvelous', 'outstanding', 'fabulous', 'awesome',
    'impressive', 'incredible', 'sensational', 'remarkable', 'good',
    'nice', 'pleasant', 'satisfied', 'happy', 'thank', 'grateful',
    'appreciate', 'love', 'adore', 'efficient', 'fast', 'professional',
    'polite', 'kind', 'helpful', 'attentive', 'friendly'
  ],
  ar: [
    'ممتاز', 'رائع', '멋진', 'مذهل', 'مثالي', 'عظيم', 'رئيسي', 'مدهش',
    'رائع جدا', 'جميل', 'ممتازة', 'جيد', 'لطيف', 'مريح', 'سعيد',
    'شكراً', 'أقدر', 'أحب', 'كفاية', 'سريع', 'احترافي', 'لطيف'
  ]
};

// Dictionnaire de mots négatifs
const NEGATIVE_WORDS = {
  fr: [
    'horrible', 'terrible', 'mauvais', 'nul', 'pire', 'dégeulass', 'honteux',
    'catastrophe', 'problème', 'souci', 'difficulté', 'lenteur', 'retard',
    'incompétent', 'malhonnête', 'triste', 'déçu', 'frustré', 'en colère',
    'problématique', 'défectif', 'cassé', 'ne fonctionne pas', 'erreur',
    'erreurs', 'faute', 'fautive', 'malheureusement', 'malheuresement',
    'perte', 'vol', 'arnaquer', 'arnaque', 'fraude', 'faux', 'mensonge',
    'incomplet', 'insuffisant', 'décevant', 'ennuyeux', 'fastidieux'
  ],
  en: [
    'horrible', 'terrible', 'bad', 'awful', 'worst', 'disgusting', 'shameful',
    'disaster', 'problem', 'issue', 'difficulty', 'slow', 'late', 'delay',
    'incompetent', 'dishonest', 'sad', 'disappointed', 'frustrated', 'angry',
    'problematic', 'defective', 'broken', 'does not work', 'error',
    'errors', 'mistake', 'loss', 'theft', 'scam', 'fraud', 'fake', 'lie',
    'incomplete', 'insufficient', 'disappointing', 'boring', 'tedious'
  ],
  ar: [
    'مريع', 'سيء', 'سوء', 'سيء جدا', 'الأسوأ', 'كريه', 'مخزي',
    'كارثة', 'مشكلة', 'قضية', 'صعوبة', 'بطيء', 'متأخر', 'تأخير',
    'غير كفء', 'غير أمين', 'حزين', 'مخيب للآمال', 'محبط', 'غاضب',
    'إشكالي', 'معيب', 'مكسور', 'لا يعمل', 'خطأ', 'أخطاء', 'غلطة'
  ]
};

// Mots d'intensité
const INTENSITY_WORDS = {
  fr: {
    'très': 1.5,
    'vraiment': 1.5,
    'extrêmement': 2.0,
    'trop': 1.3,
    'complètement': 1.5,
    'absolument': 1.8,
    'totalement': 1.5,
    'énormément': 1.8,
  },
  en: {
    'very': 1.5,
    'really': 1.5,
    'extremely': 2.0,
    'too': 1.3,
    'completely': 1.5,
    'absolutely': 1.8,
    'totally': 1.5,
    'incredibly': 1.8,
  }
};

// Mots de négation
const NEGATION_WORDS = {
  fr: ['pas', 'non', 'jamais', 'aucun', 'rien'],
  en: ['not', 'no', 'never', 'none', 'nothing'],
  ar: ['لا', 'لم', 'لن', 'ليس']
};

class SentimentAnalyzer {
  /**
   * Analyse le sentiment du texte
   */
  static analyzeSentiment(text, language = 'fr') {
    if (!text) return { sentiment: 'neutral', score: 0, confidence: 0 };

    const normalizedText = this.normalizeText(text);
    const words = normalizedText.split(/\s+/);
    
    let sentimentScore = 0;
    let positiveCount = 0;
    let negativeCount = 0;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      
      // Check for intensifiers
      let intensity = 1;
      if (i > 0) {
        const previousWord = words[i - 1];
        if (INTENSITY_WORDS[language] && INTENSITY_WORDS[language][previousWord]) {
          intensity = INTENSITY_WORDS[language][previousWord];
        }
      }

      // Check for negations
      let isNegated = false;
      if (i > 0) {
        const previousWord = words[i - 1];
        if (NEGATION_WORDS[language]?.includes(previousWord)) {
          isNegated = true;
        }
      }

      // Analyze word
      const positiveWords = POSITIVE_WORDS[language] || POSITIVE_WORDS.en;
      const negativeWords = NEGATIVE_WORDS[language] || NEGATIVE_WORDS.en;

      if (positiveWords.includes(word)) {
        const value = intensity;
        sentimentScore += isNegated ? -value : value;
        positiveCount++;
      } else if (negativeWords.includes(word)) {
        const value = -intensity;
        sentimentScore += isNegated ? -value : value;
        negativeCount++;
      }
    }

    // Normalize score
    const maxScore = Math.max(positiveCount, negativeCount, 1);
    const normalizedScore = Math.max(-1, Math.min(1, sentimentScore / maxScore));

    // Determine sentiment
    let sentiment;
    let confidence;

    if (normalizedScore > 0.2) {
      sentiment = 'positive';
      confidence = Math.min(1, Math.abs(normalizedScore));
    } else if (normalizedScore < -0.2) {
      sentiment = 'negative';
      confidence = Math.min(1, Math.abs(normalizedScore));
    } else {
      sentiment = 'neutral';
      confidence = 1 - Math.abs(normalizedScore);
    }

    return {
      sentiment,
      score: normalizedScore,
      confidence,
      positiveCount,
      negativeCount,
    };
  }

  /**
   * Extrait les mots-clés du texte
   */
  static extractKeywords(text, language = 'fr', maxKeywords = 10) {
    if (!text) return [];

    const normalizedText = this.normalizeText(text);
    const words = normalizedText.split(/\s+/);

    // Stopwords communs
    const stopwords = {
      fr: ['le', 'la', 'les', 'de', 'du', 'des', 'et', 'ou', 'mais', 'donc', 'car', 'comme', 'si', 'que', 'qui', 'quoi', 'où', 'quand', 'pourquoi', 'comment', 'un', 'une', 'des', 'à', 'en', 'au', 'aux', 'par', 'pour', 'sur', 'dans', 'avec', 'sans', 'sous', 'entre', 'vers', 'après', 'avant', 'pendant', 'chez', 'jusqu', 'trop', 'beaucoup', 'peu', 'très', 'bien', 'mal', 'oui', 'non', 'pas'],
      en: ['the', 'a', 'an', 'and', 'or', 'but', 'so', 'for', 'if', 'that', 'this', 'what', 'which', 'who', 'when', 'where', 'why', 'how', 'is', 'was', 'are', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'in', 'on', 'at', 'to', 'from', 'with', 'by', 'about', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once'],
      ar: ['ال', 'و', 'في', 'من', 'إلى', 'هو', 'هي', 'أن', 'على', 'كان', 'كانت']
    };

    const stops = stopwords[language] || stopwords.en;
    const wordFreq = {};

    words.forEach(word => {
      if (word.length > 3 && !stops.includes(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });

    // Sort by frequency
    const keywords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxKeywords)
      .map(([word]) => word);

    return keywords;
  }

  /**
   * Normalise le texte
   */
  static normalizeText(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .trim();
  }

  /**
   * Obtient le sentiment NPS (Net Promoter Score)
   */
  static getNPSCategory(score) {
    if (score >= 9) return 'promoter';
    if (score >= 7) return 'passive';
    return 'detractor';
  }

  /**
   * Calcule le NPS sur une collection
   */
  static calculateNPS(scores) {
    if (scores.length === 0) return 0;

    const promoters = scores.filter(s => s >= 9).length;
    const detractors = scores.filter(s => s <= 6).length;

    return Math.round(((promoters - detractors) / scores.length) * 100);
  }

  /**
   * Analyse le sentiment en batch
   */
  static analyzeSentimentBatch(texts, language = 'fr') {
    return texts.map(text => this.analyzeSentiment(text, language));
  }

  /**
   * Génère un résumé d'analyse
   */
  static generateSummary(feedbackList) {
    if (feedbackList.length === 0) {
      return {
        totalFeedback: 0,
        averageScore: 0,
        sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
        nps: 0,
        topKeywords: [],
        topIssues: [],
        topCompliments: [],
      };
    }

    const scores = feedbackList.map(f => f.score);
    const sentiments = feedbackList.map(f => f.sentiment);
    const allKeywords = feedbackList
      .flatMap(f => f.keywords || [])
      .filter(Boolean);

    const keywordFreq = {};
    allKeywords.forEach(keyword => {
      keywordFreq[keyword] = (keywordFreq[keyword] || 0) + 1;
    });

    const sentimentBreakdown = {
      positive: sentiments.filter(s => s === 'positive').length,
      neutral: sentiments.filter(s => s === 'neutral').length,
      negative: sentiments.filter(s => s === 'negative').length,
    };

    return {
      totalFeedback: feedbackList.length,
      averageScore: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2),
      sentimentBreakdown,
      nps: this.calculateNPS(scores),
      topKeywords: Object.entries(keywordFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([keyword, freq]) => ({ keyword, frequency: freq })),
      topIssues: feedbackList
        .filter(f => f.sentiment === 'negative')
        .slice(0, 5)
        .map(f => ({ id: f.id, comment: f.comment, score: f.score })),
      topCompliments: feedbackList
        .filter(f => f.sentiment === 'positive')
        .slice(0, 5)
        .map(f => ({ id: f.id, comment: f.comment, score: f.score })),
    };
  }
}

function analyzeSentiment(text, language = 'fr') {
  return SentimentAnalyzer.analyzeSentiment(text, language);
}

function extractKeywords(text, language = 'fr', maxKeywords = 10) {
  return SentimentAnalyzer.extractKeywords(text, language, maxKeywords);
}

module.exports = {
  SentimentAnalyzer,
  analyzeSentiment,
  extractKeywords,
};
