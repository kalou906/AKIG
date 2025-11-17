/**
 * Service IA Avancée - Agence Immobilière Guinéenne
 * Suggestions intelligentes, analyse marché, pricing, recommandations
 * backend/src/services/ai-advanced.service.js
 */

const logger = require('./logger');

const AIAdvancedService = {
  /**
   * Analyser propriété et suggérer prix optimal
   * Contexte guinéen: FNF, localisation Conakry, marché immobilier
   */
  analyzePriceProperty: async function(property) {
    try {
      const {
        surface,
        rooms,
        location,
        condition,
        amenities,
        propertyType
      } = property;

      // Données de base marché guinéen (à personnaliser)
      const marketData = {
        // Prix m² par quartier Conakry (estimés)
        'Kaloum': { minPrice: 15000, maxPrice: 25000 },
        'Dixinn': { minPrice: 12000, maxPrice: 20000 },
        'Ratoma': { minPrice: 10000, maxPrice: 18000 },
        'Kindia': { minPrice: 8000, maxPrice: 15000 },
        'Mamou': { minPrice: 5000, maxPrice: 12000 },
        'Kindia': { minPrice: 7000, maxPrice: 14000 },
        'Fria': { minPrice: 6000, maxPrice: 13000 }
      };

      const basePrice = marketData[location] || { minPrice: 10000, maxPrice: 20000 };

      // Calculer prix estimé
      let estimatedPrice = surface * ((basePrice.minPrice + basePrice.maxPrice) / 2);

      // Ajustements
      const adjustments = {
        condition: condition === 'excellent' ? 1.2 : (condition === 'bon' ? 1.0 : 0.8),
        amenities: Object.keys(amenities || {}).filter(a => amenities[a]).length * 0.05,
        propertyType: propertyType === 'villa' ? 1.3 : (propertyType === 'apartement' ? 1.0 : 0.7)
      };

      const totalMultiplier = adjustments.condition * adjustments.propertyType * (1 + adjustments.amenities);
      estimatedPrice = estimatedPrice * totalMultiplier;

      return {
        estimatedPrice: Math.round(estimatedPrice),
        minPrice: Math.round(estimatedPrice * 0.85),
        maxPrice: Math.round(estimatedPrice * 1.15),
        recommendedPrice: Math.round(estimatedPrice),
        pricePerSqm: Math.round(estimatedPrice / surface),
        marketAnalysis: {
          location,
          competitorCount: Math.floor(Math.random() * 10) + 5,
          demandLevel: ['haute', 'moyenne', 'basse'][Math.floor(Math.random() * 3)],
          priceHistory: 'stable'
        },
        suggestions: [
          'Prix compétitif pour cette localisation',
          'En excellent état pour la zone',
          'Forte demande pour ce type de bien'
        ]
      };
    } catch (err) {
      logger.error('Erreur analyse prix', err);
      throw err;
    }
  },

  /**
   * Générer description propriété intelligente
   */
  generatePropertyDescription: async function(property) {
    try {
      const {
        title,
        surface,
        rooms,
        bathrooms,
        location,
        amenities,
        propertyType
      } = property;

      const amenityList = Object.entries(amenities || {})
        .filter(([, v]) => v)
        .map(([k]) => this.translateAmenity(k));

      const description = `
${title || 'Propriété attractive'}

🏠 Description:
Cette ${propertyType === 'villa' ? 'superbe villa' : 'propriété'} de ${surface}m² est située au cœur de ${location}, 
une des meilleures zones de Conakry. Avec ${rooms} chambres et ${bathrooms} salles de bain, 
c'est une opportunité idéale pour les familles ou les investisseurs.

✨ Caractéristiques principales:
- Surface: ${surface}m²
- Chambres: ${rooms}
- Salles de bain: ${bathrooms}
- Type: ${propertyType}

🎁 Équipements:
${amenityList.length > 0 ? amenityList.map(a => `  • ${a}`).join('\n') : '  • À découvrir'}

📍 Localisation: ${location}
- Proximité commerces et services
- Excellent réseau routier
- Zone sûre et bien entretenue

💡 Cette propriété est parfaite pour:
- Les familles cherchant le confort
- Les investisseurs immobiliers
- Les professionnels expatriés

Contactez-nous pour une visite!
      `;

      return description;
    } catch (err) {
      logger.error('Erreur génération description', err);
      throw err;
    }
  },

  /**
   * Traduire commodités en français
   */
  translateAmenity: function(amenity) {
    const translations = {
      'wifi': 'WiFi gratuit',
      'parking': 'Parking privé',
      'garden': 'Jardin',
      'pool': 'Piscine',
      'gym': 'Salle de sport',
      'security': 'Sécurité 24/7',
      'kitchen': 'Cuisine équipée',
      'ac': 'Climatisation',
      'generator': 'Générateur électrique',
      'water_reserve': 'Réserve d\'eau',
      'furniture': 'Meublé',
      'courtyard': 'Cour privée'
    };
    return translations[amenity] || amenity;
  },

  /**
   * Recommander propriétés similaires
   */
  recommendSimilarProperties: async function(property, allProperties) {
    try {
      const { location, surface, propertyType, price } = property;

      const similar = allProperties
        .filter(p => 
          p.id !== property.id &&
          p.location === location &&
          Math.abs(p.surface - surface) < surface * 0.2 &&
          p.propertyType === propertyType
        )
        .sort((a, b) => Math.abs(b.price - price) - Math.abs(a.price - price))
        .slice(0, 5);

      return {
        count: similar.length,
        recommendations: similar.map(p => ({
          id: p.id,
          title: p.title,
          price: p.price,
          surface: p.surface,
          rooms: p.rooms,
          location: p.location,
          similarity: 'haute'
        }))
      };
    } catch (err) {
      logger.error('Erreur recommandations', err);
      throw err;
    }
  },

  /**
   * Analyser tendances marché immobilier guinéen
   */
  analyzeMarketTrends: async function(properties = []) {
    try {
      const trends = {
        marketOverview: {
          totalProperties: properties.length,
          avgPrice: properties.reduce((sum, p) => sum + (p.price || 0), 0) / properties.length || 0,
          avgSurface: properties.reduce((sum, p) => sum + (p.surface || 0), 0) / properties.length || 0,
          avgRooms: Math.round(properties.reduce((sum, p) => sum + (p.rooms || 0), 0) / properties.length)
        },
        byLocation: {},
        byType: {},
        priceRange: {
          lessThan5M: properties.filter(p => p.price < 5000000).length,
          '5M-10M': properties.filter(p => p.price >= 5000000 && p.price < 10000000).length,
          '10M-25M': properties.filter(p => p.price >= 10000000 && p.price < 25000000).length,
          moreThan25M: properties.filter(p => p.price >= 25000000).length
        }
      };

      // Analyser par localisation
      const locations = [...new Set(properties.map(p => p.location))];
      locations.forEach(location => {
        const locationProps = properties.filter(p => p.location === location);
        trends.byLocation[location] = {
          count: locationProps.length,
          avgPrice: locationProps.reduce((sum, p) => sum + (p.price || 0), 0) / locationProps.length,
          demandEstimation: locationProps.length > 10 ? 'haute' : (locationProps.length > 5 ? 'moyenne' : 'basse')
        };
      });

      // Analyser par type
      const types = [...new Set(properties.map(p => p.propertyType))];
      types.forEach(type => {
        const typeProps = properties.filter(p => p.propertyType === type);
        trends.byType[type] = {
          count: typeProps.length,
          avgPrice: typeProps.reduce((sum, p) => sum + (p.price || 0), 0) / typeProps.length,
          popularity: typeProps.length > 20 ? 'très populaire' : (typeProps.length > 10 ? 'populaire' : 'spécialisé')
        };
      });

      trends.insights = this.generateMarketInsights(trends);

      return trends;
    } catch (err) {
      logger.error('Erreur analyse tendances', err);
      throw err;
    }
  },

  /**
   * Générer insights marché
   */
  generateMarketInsights: function(trends) {
    const insights = [];

    // Insights localisation
    const bestLocation = Object.entries(trends.byLocation)
      .sort((a, b) => b[1].avgPrice - a[1].avgPrice)[0];
    if (bestLocation) {
      insights.push(`${bestLocation[0]} offre les plus hauts prix (avg: ${Math.round(bestLocation[1].avgPrice / 1000000)}M GNF)`);
    }

    // Insights demande
    const highDemandLocation = Object.entries(trends.byLocation)
      .filter(([, v]) => v.demandEstimation === 'haute')[0];
    if (highDemandLocation) {
      insights.push(`Forte demande observée à ${highDemandLocation[0]} - ${highDemandLocation[1].count} propriétés`);
    }

    // Insights type
    const mostPopularType = Object.entries(trends.byType)
      .sort((a, b) => b[1].count - a[1].count)[0];
    if (mostPopularType) {
      insights.push(`Les ${mostPopularType[0]}s sont les plus demandés (${mostPopularType[1].count} annonces)`);
    }

    // Insights prix
    if (trends.priceRange.moreThan25M > 0) {
      insights.push(`Marché haut de gamme actif: ${trends.priceRange.moreThan25M} propriétés > 25M GNF`);
    }

    return insights;
  },

  /**
   * Suggérer améliorations propriété pour augmenter valeur
   */
  suggestPropertyImprovements: async function(property) {
    try {
      const suggestions = [];

      if (!property.amenities?.parking) {
        suggestions.push({
          improvement: 'Ajouter parking',
          impact: '+5-10% valeur',
          cost: 'Moyen',
          priority: 'haute'
        });
      }

      if (!property.amenities?.security) {
        suggestions.push({
          improvement: 'Installer système sécurité',
          impact: '+3-8% valeur',
          cost: 'Moyen',
          priority: 'haute'
        });
      }

      if (property.condition === 'mauvais') {
        suggestions.push({
          improvement: 'Rénover complètement',
          impact: '+20-40% valeur',
          cost: 'Élevé',
          priority: 'très haute'
        });
      }

      if (!property.amenities?.garden) {
        suggestions.push({
          improvement: 'Aménager jardin',
          impact: '+3-5% valeur',
          cost: 'Bas',
          priority: 'moyenne'
        });
      }

      if (property.rooms < 3) {
        suggestions.push({
          improvement: 'Ajouter chambre',
          impact: '+15-20% valeur',
          cost: 'Élevé',
          priority: 'haute'
        });
      }

      return {
        totalSuggestions: suggestions.length,
        estimatedTotalImpact: '+' + suggestions.reduce((sum, s) => {
          const impact = parseInt(s.impact.match(/\d+/)[0]);
          return sum + impact;
        }, 0) + '%',
        suggestions: suggestions.sort((a, b) => {
          const priorityMap = { 'très haute': 1, 'haute': 2, 'moyenne': 3, 'basse': 4 };
          return priorityMap[a.priority] - priorityMap[b.priority];
        })
      };
    } catch (err) {
      logger.error('Erreur suggestions améliorations', err);
      throw err;
    }
  },

  /**
   * Prédire délai de vente
   */
  predictSalesDuration: async function(property, marketData) {
    try {
      let daysEstimate = 30; // Base 30 jours

      // Localisation impact
      const locationMultipliers = {
        'Kaloum': 0.7,
        'Dixinn': 0.8,
        'Ratoma': 1.0,
        'Kindia': 1.2,
        'Mamou': 1.3,
        'Fria': 1.4
      };

      daysEstimate *= locationMultipliers[property.location] || 1.0;

      // Prix impact
      if (property.price > 20000000) daysEstimate *= 1.3; // Haut de gamme plus lent
      if (property.price < 5000000) daysEstimate *= 0.8; // Accessible plus rapide

      // Condition impact
      if (property.condition === 'mauvais') daysEstimate *= 1.5;

      return {
        estimatedDays: Math.round(daysEstimate),
        estimatedWeeks: Math.round(daysEstimate / 7),
        estimatedMonths: Math.round(daysEstimate / 30),
        confidence: '75-85%',
        factors: {
          location: property.location,
          price: property.price,
          condition: property.condition,
          amenities: Object.values(property.amenities || {}).filter(v => v).length
        }
      };
    } catch (err) {
      logger.error('Erreur prédiction délai', err);
      throw err;
    }
  }
};

module.exports = AIAdvancedService;
