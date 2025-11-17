/**
 * 🏘️  Service Secteurs Conakry - AKIG
 * 
 * Gestion des 5 communes de Conakry avec:
 * - Localisation GPS
 * - Niveaux de prix par quartier
 * - Caractéristiques de marché
 * - Images quartiers
 */

class GuineaSectorsService {
  constructor() {
    this.SECTORS = {
      'kaloum': {
        id: 'kaloum',
        name: 'Kaloum',
        common: 'Kaloum',
        description: 'Centre administratif et commercial de Conakry',
        priceLevel: 'PREMIUM',
        priceMultiplier: 1.5, // +50% par rapport à base
        characteristics: [
          'Centre-ville',
          'Commerces importants',
          'Administrations',
          'Hôtels de luxe',
          'Restaurants',
          'Banques'
        ],
        demographics: {
          population: 'Classe moyenne-supérieure',
          density: 'Très élevée',
          development: 'Mature'
        },
        coordinates: {
          lat: 9.5411,
          lng: -13.7317
        },
        averagePrices: {
          studio: 2500000,      // GNF
          t2: 4000000,
          t3: 6000000,
          t4: 8500000,
          villa: 15000000
        },
        neighborhoods: [
          'Plateau',
          'Bellevue',
          'Kaloum Centre',
          'Port',
          'Corniche'
        ],
        amenities: ['Commerces', 'Bureaux', 'Restaurants', 'Hôtels', 'Banques', 'Pharmacies'],
        riskLevel: 'Faible',
        recommendedFor: ['Bureaux', 'Commerces', 'Résidence de prestige'],
        icon: '🏢'
      },

      'matam': {
        id: 'matam',
        name: 'Matam',
        common: 'Matam',
        description: 'Quartier résidentiel haut-standing de Conakry',
        priceLevel: 'HAUT',
        priceMultiplier: 1.3, // +30% par rapport à base
        characteristics: [
          'Résidentiel',
          'Villas de prestige',
          'Environnement calme',
          'Expatriés',
          'Hommes d\'affaires'
        ],
        demographics: {
          population: 'Haute bourgeoisie, expatriés',
          density: 'Moyenne',
          development: 'Très développé'
        },
        coordinates: {
          lat: 9.5500,
          lng: -13.7500
        },
        averagePrices: {
          studio: 1500000,
          t2: 2500000,
          t3: 4000000,
          t4: 6000000,
          villa: 10000000
        },
        neighborhoods: [
          'Almamya',
          'Boulbinet',
          'Coléah',
          'Kipé',
          'Mansare'
        ],
        amenities: ['Écoles', 'Restaurants', 'Clubs', 'Pharmacies', 'Supermarchés'],
        riskLevel: 'Très faible',
        recommendedFor: ['Résidences de prestige', 'Villas', 'Expatriés'],
        icon: '🏰'
      },

      'dixinn': {
        id: 'dixinn',
        name: 'Dixinn',
        common: 'Dixinn',
        description: 'Secteur mixte résidentiel et commercial en développement',
        priceLevel: 'MOYEN',
        priceMultiplier: 1.0, // Référence
        characteristics: [
          'Résidentiel-commercial',
          'En développement rapide',
          'Prix modérés',
          'Écoles, universités',
          'Accès transports'
        ],
        demographics: {
          population: 'Classe moyenne, étudiants',
          density: 'Moyenne-haute',
          development: 'En croissance'
        },
        coordinates: {
          lat: 9.5300,
          lng: -13.7100
        },
        averagePrices: {
          studio: 800000,
          t2: 1300000,
          t3: 2000000,
          t4: 3000000,
          villa: 5000000
        },
        neighborhoods: [
          'Hamdallaye',
          'Camayenne',
          'Dar-es-Salam',
          'Kindia',
          'Soumaïa'
        ],
        amenities: ['Universités', 'Écoles', 'Transports', 'Commerces', 'Cliniques'],
        riskLevel: 'Faible',
        recommendedFor: ['Étudiants', 'Résidences', 'Petits commerces'],
        icon: '🏘️'
      },

      'mafanco': {
        id: 'mafanco',
        name: 'Mafanco',
        common: 'Mafanco',
        description: 'Quartier accessible et en rapide expansion',
        priceLevel: 'ACCESSIBLE',
        priceMultiplier: 0.85, // -15% par rapport à base
        characteristics: [
          'Quartier populaire',
          'Expansion rapide',
          'Prix abordables',
          'Commerces de proximité',
          'Accès routier facile'
        ],
        demographics: {
          population: 'Classe moyenne-basse, familles',
          density: 'Élevée',
          development: 'En croissance'
        },
        coordinates: {
          lat: 9.5200,
          lng: -13.7300
        },
        averagePrices: {
          studio: 500000,
          t2: 900000,
          t3: 1400000,
          t4: 2100000,
          villa: 3500000
        },
        neighborhoods: [
          'Mafanco Centre',
          'Lambanyi',
          'Bambeto',
          'Sonfonia',
          'Gbessia'
        ],
        amenities: ['Marché', 'Écoles', 'Transports', 'Petits commerces', 'Pharmacies'],
        riskLevel: 'Moyen',
        recommendedFor: ['Résidences familiales', 'Petits commerces', 'Investisseurs'],
        icon: '🏗️'
      },

      'ratoma': {
        id: 'ratoma',
        name: 'Ratoma',
        common: 'Ratoma',
        description: 'Quartier populaire avec potentiel d\'investissement',
        priceLevel: 'BUDGET',
        priceMultiplier: 0.70, // -30% par rapport à base
        characteristics: [
          'Quartier populaire',
          'Fort potentiel',
          'Prix très accessibles',
          'Densité élevée',
          'En développement'
        ],
        demographics: {
          population: 'Classes populaires',
          density: 'Très élevée',
          development: 'En développement'
        },
        coordinates: {
          lat: 9.5100,
          lng: -13.7400
        },
        averagePrices: {
          studio: 300000,
          t2: 550000,
          t3: 850000,
          t4: 1300000,
          villa: 2500000
        },
        neighborhoods: [
          'Ratoma Centre',
          'Madina',
          'Taasso',
          'Hafia',
          'Bambéto'
        ],
        amenities: ['Marché important', 'Écoles', 'Transports', 'Commerces'],
        riskLevel: 'Moyen-Élevé',
        recommendedFor: ['Locatif populaire', 'Potentiel d\'appréciation', 'Investisseurs'],
        icon: '🏪'
      }
    };
  }

  /**
   * Récupérer tous les secteurs
   */
  getAllSectors() {
    return Object.values(this.SECTORS);
  }

  /**
   * Récupérer un secteur par ID
   */
  getSectorById(id) {
    return this.SECTORS[id.toLowerCase()];
  }

  /**
   * Récupérer secteur par nom
   */
  getSectorByName(name) {
    return Object.values(this.SECTORS).find(
      s => s.name.toLowerCase() === name.toLowerCase()
    );
  }

  /**
   * Appliquer multiplicateur de prix pour un secteur
   */
  applyPriceMultiplier(basePrice, sectorId) {
    const sector = this.getSectorById(sectorId);
    if (!sector) return basePrice;
    return Math.round(basePrice * sector.priceMultiplier);
  }

  /**
   * Obtenir tous les quartiers d'un secteur
   */
  getNeighborhoods(sectorId) {
    const sector = this.getSectorById(sectorId);
    return sector ? sector.neighborhoods : [];
  }

  /**
   * Filtrer secteurs par niveau de prix
   */
  filterByPriceLevel(priceLevel) {
    return Object.values(this.SECTORS).filter(
      s => s.priceLevel === priceLevel
    );
  }

  /**
   * Obtenir secteurs triés par prix
   */
  getSectorsSortedByPrice(ascending = true) {
    const multipliers = Object.values(this.SECTORS)
      .map(s => ({ ...s, avgPrice: s.averagePrices.t3 }))
      .sort((a, b) => ascending 
        ? a.avgPrice - b.avgPrice 
        : b.avgPrice - a.avgPrice
      );
    return multipliers;
  }

  /**
   * Recommander secteur selon critères
   */
  recommendSectors(criteria) {
    let results = Object.values(this.SECTORS);

    if (criteria.budget) {
      results = results.filter(s => {
        const avgPrice = s.averagePrices.t3;
        return avgPrice <= criteria.budget;
      });
    }

    if (criteria.type) {
      results = results.filter(s =>
        s.recommendedFor.includes(criteria.type)
      );
    }

    if (criteria.minRisk) {
      const riskOrder = ['Très faible', 'Faible', 'Moyen', 'Moyen-Élevé', 'Élevé'];
      results = results.filter(s =>
        riskOrder.indexOf(s.riskLevel) <= riskOrder.indexOf(criteria.minRisk)
      );
    }

    return results.sort((a, b) => b.priceMultiplier - a.priceMultiplier);
  }

  /**
   * Exporter données pour base de données
   */
  getSectorsForDatabase() {
    return Object.values(this.SECTORS).map(s => ({
      sector_id: s.id,
      sector_name: s.name,
      description: s.description,
      price_level: s.priceLevel,
      price_multiplier: s.priceMultiplier,
      latitude: s.coordinates.lat,
      longitude: s.coordinates.lng,
      average_price_t3: s.averagePrices.t3,
      neighborhoods: JSON.stringify(s.neighborhoods),
      amenities: JSON.stringify(s.amenities),
      characteristics: JSON.stringify(s.characteristics),
      metadata: JSON.stringify(s)
    }));
  }
}

module.exports = new GuineaSectorsService();
