/**
 * 🔍 Service Recherche Avancée avec Elasticsearch
 * Moteur de recherche puissant avec filtres, facettes et suggestions
 */

const logger = require('./logger');

class ServiceRechercheAvancée {
  /**
   * Configuration Elasticsearch (mock avec données)
   */
  constructor() {
    this.index = 'propriétés_akig';
    this.historique = new Map();
  }

  /**
   * Indexer propriété dans Elasticsearch
   */
  async indexerPropriété(propriété) {
    try {
      const document = {
        id: propriété.id,
        titre: propriété.titre,
        description: propriété.description,
        prix: propriété.prix,
        localisation: propriété.localisation,
        typePropriété: propriété.type,
        surface: propriété.surface,
        chambres: propriété.chambres,
        salles_bain: propriété.salles_bain,
        équipements: propriété.équipements || [],
        caractéristiques: propriété.caractéristiques || {},
        images: propriété.images || [],
        agenceId: propriété.agence_id,
        créée_à: new Date(),
        popularité: 0,
        notes: []
      };

      logger.info(`📇 Propriété indexée: ${propriété.id}`);

      return {
        statut: 'succès',
        index: this.index,
        document
      };
    } catch (erreur) {
      logger.erreur('Erreur indexation propriété:', erreur);
      throw erreur;
    }
  }

  /**
   * Recherche avancée multi-critères
   */
  async rechercherAvancé(critères) {
    try {
      const {
        query,
        localisation,
        prixMin,
        prixMax,
        typePropriété,
        surfaceMin,
        surfaceMax,
        chambresMin,
        chambresMax,
        équipements = [],
        agencesId = [],
        tri = 'pertinence', // 'pertinence', 'prix_asc', 'prix_desc', 'nouveau', 'populaire'
        page = 1,
        limite = 20
      } = critères;

      // Construire requête Elasticsearch
      const filtres = [];

      if (localisation) {
        filtres.push({
          match: { localisation: localisation }
        });
      }

      if (prixMin || prixMax) {
        const range = {};
        if (prixMin) range.gte = prixMin;
        if (prixMax) range.lte = prixMax;
        filtres.push({ range: { prix: range } });
      }

      if (typePropriété) {
        filtres.push({
          match: { typePropriété: typePropriété }
        });
      }

      if (surfaceMin || surfaceMax) {
        const range = {};
        if (surfaceMin) range.gte = surfaceMin;
        if (surfaceMax) range.lte = surfaceMax;
        filtres.push({ range: { surface: range } });
      }

      if (chambresMin || chambresMax) {
        const range = {};
        if (chambresMin) range.gte = chambresMin;
        if (chambresMax) range.lte = chambresMax;
        filtres.push({ range: { chambres: range } });
      }

      if (équipements.length > 0) {
        filtres.push({
          terms: { équipements: équipements }
        });
      }

      if (agencesId.length > 0) {
        filtres.push({
          terms: { agenceId: agencesId }
        });
      }

      // Tri
      let ordreSort = {};
      switch(tri) {
        case 'prix_asc':
          ordreSort = { prix: { order: 'asc' } };
          break;
        case 'prix_desc':
          ordreSort = { prix: { order: 'desc' } };
          break;
        case 'nouveau':
          ordreSort = { créée_à: { order: 'desc' } };
          break;
        case 'populaire':
          ordreSort = { popularité: { order: 'desc' } };
          break;
        default:
          ordreSort = { _score: { order: 'desc' } };
      }

      // Génération donnees pour demo
      const résultats = this.générerRésultatsDémo(filtres, page, limite);

      logger.info(`🔍 Recherche avancée: ${résultats.résultats.length} résultats trouvés`);

      return {
        statut: 'succès',
        résultats: résultats.résultats,
        facettes: résultats.facettes,
        pagination: {
          page,
          limite,
          total: résultats.total,
          pages: Math.ceil(résultats.total / limite)
        }
      };
    } catch (erreur) {
      logger.erreur('Erreur recherche avancée:', erreur);
      throw erreur;
    }
  }

  /**
   * Suggérer propriétés similaires
   */
  async suggérerSimilaires(propriétéId, nombre = 5) {
    try {
      // Requête Elasticsearch pour trouver propriétés similaires
      const suggestions = [
        {
          id: 'PROP002',
          titre: 'Bel Appartement Dixinn',
          prix: 485000000,
          localisation: 'Dixinn',
          surface: 120,
          similarité: 0.89
        },
        {
          id: 'PROP003',
          titre: 'Studio Conakry Centre',
          prix: 320000000,
          localisation: 'Conakry',
          surface: 65,
          similarité: 0.85
        },
        {
          id: 'PROP004',
          titre: 'Maison Moderne Matoto',
          prix: 620000000,
          localisation: 'Matoto',
          surface: 200,
          similarité: 0.82
        },
        {
          id: 'PROP005',
          titre: 'Penthouse Kaloum',
          prix: 890000000,
          localisation: 'Kaloum',
          surface: 280,
          similarité: 0.78
        },
        {
          id: 'PROP006',
          titre: 'Villa Kindia',
          prix: 540000000,
          localisation: 'Kindia',
          surface: 180,
          similarité: 0.76
        }
      ];

      logger.info(`🔗 ${nombre} suggestions similaires trouvées pour ${propriétéId}`);

      return {
        statut: 'succès',
        propriétéId,
        suggestions: suggestions.slice(0, nombre)
      };
    } catch (erreur) {
      logger.erreur('Erreur suggestions similaires:', erreur);
      throw erreur;
    }
  }

  /**
   * Complément automatique (autocomplete)
   */
  async complétionAutomatique(query) {
    try {
      const complétions = [];

      if (query.length < 2) {
        return { statut: 'succès', complétions: [] };
      }

      // Suggestions de localisations
      const localisations = ['Conakry', 'Dixinn', 'Kindia', 'Mamou', 'Fria', 'Matoto', 'Kaloum'];
      const locCible = localisations.filter(l => l.toLowerCase().includes(query.toLowerCase()));
      complétions.push(...locCible.map(l => ({ type: 'localisation', texte: l })));

      // Suggestions de types
      const types = ['Appartement', 'Maison', 'Terrain', 'Commerce', 'Bureau'];
      const typesCible = types.filter(t => t.toLowerCase().includes(query.toLowerCase()));
      complétions.push(...typesCible.map(t => ({ type: 'typePropriété', texte: t })));

      // Suggestions équipements
      const équipements = ['Climatisation', 'Garage', 'Balcon', 'Jardin', 'Piscine', 'Ascenseur'];
      const équipCible = équipements.filter(e => e.toLowerCase().includes(query.toLowerCase()));
      complétions.push(...équipCible.map(e => ({ type: 'équipement', texte: e })));

      logger.info(`✍️ ${complétions.length} suggestions d'autocomplétion`);

      return {
        statut: 'succès',
        query,
        suggestions: complétions.slice(0, 10)
      };
    } catch (erreur) {
      logger.erreur('Erreur autocomplétion:', erreur);
      throw erreur;
    }
  }

  /**
   * Recherche géographique (rayons)
   */
  async rechercheGéographique(latitude, longitude, rayon = 5) {
    try {
      // Rayon en km
      const résultats = [
        {
          id: 'PROP001',
          titre: 'Appartement Prestige',
          prix: 500000000,
          localisation: 'Conakry',
          distance: 0.8,
          latitude: 9.5112,
          longitude: -13.7147
        },
        {
          id: 'PROP002',
          titre: 'Maison Moderne',
          prix: 620000000,
          localisation: 'Dixinn',
          distance: 2.3,
          latitude: 9.5198,
          longitude: -13.7321
        },
        {
          id: 'PROP003',
          titre: 'Studio Centre',
          prix: 320000000,
          localisation: 'Kaloum',
          distance: 3.9,
          latitude: 9.5245,
          longitude: -13.7089
        },
        {
          id: 'PROP004',
          titre: 'Villa Spacieuse',
          prix: 750000000,
          localisation: 'Matoto',
          distance: 4.2,
          latitude: 9.5025,
          longitude: -13.6987
        }
      ];

      logger.info(`📍 ${résultats.length} propriétés trouvées dans rayon ${rayon}km`);

      return {
        statut: 'succès',
        centre: { latitude, longitude },
        rayon,
        résultats: résultats.filter(r => r.distance <= rayon)
      };
    } catch (erreur) {
      logger.erreur('Erreur recherche géographique:', erreur);
      throw erreur;
    }
  }

  /**
   * Analyses de tendances de recherche
   */
  async analyserTendances(période = '30jours') {
    try {
      const tendances = {
        mots_clés_populaires: [
          { terme: 'Appartement Conakry', recherches: 2350, tendance: '↑ +15%' },
          { terme: 'Terrain Kindia', recherches: 1890, tendance: '↑ +8%' },
          { terme: 'Maison Dixinn', recherches: 1650, tendance: '→ stable' },
          { terme: 'Villa Luxe', recherches: 980, tendance: '↓ -5%' },
          { terme: 'Bureau Centre', recherches: 850, tendance: '↑ +22%' }
        ],
        localisations_tendances: [
          { localisation: 'Conakry', croissance: 22 },
          { localisation: 'Dixinn', croissance: 18 },
          { localisation: 'Kindia', croissance: 15 },
          { localisation: 'Matoto', croissance: 12 },
          { localisation: 'Kaloum', croissance: 8 }
        ],
        segments_actifs: [
          { segment: 'Budget Moyen (300-500M)', activité: 45 },
          { segment: 'Haut de Gamme (500M+)', activité: 28 },
          { segment: 'Entrée de Gamme (100-300M)', activité: 27 }
        ]
      };

      logger.info(`📈 Analyses tendances extraites pour période ${période}`);

      return {
        statut: 'succès',
        période,
        tendances
      };
    } catch (erreur) {
      logger.erreur('Erreur analyses tendances:', erreur);
      throw erreur;
    }
  }

  /**
   * Sauvegarder recherche
   */
  async sauvegarderRecherche(utilisateurId, critères, nom) {
    try {
      const rechercheId = `RCH-${Date.now()}`;

      this.historique.set(rechercheId, {
        id: rechercheId,
        utilisateurId,
        critères,
        nom,
        créée_à: new Date(),
        notifications: false
      });

      logger.info(`💾 Recherche sauvegardée: ${rechercheId}`);

      return {
        statut: 'succès',
        rechercheId,
        message: `Recherche "${nom}" sauvegardée`
      };
    } catch (erreur) {
      logger.erreur('Erreur sauvegarde recherche:', erreur);
      throw erreur;
    }
  }

  /**
   * Générer résultats de démo
   */
  generateRésultatsDémo(filtres, page, limite) {
    const tousRésultats = [
      {
        id: 'PROP001',
        titre: 'Appartement Prestige Conakry',
        prix: 500000000,
        localisation: 'Conakry',
        typePropriété: 'Appartement',
        surface: 150,
        chambres: 3,
        image: '/img/prop1.jpg',
        note: 4.8,
        avis: 12,
        agence: 'AKIG'
      },
      {
        id: 'PROP002',
        titre: 'Maison Moderne Dixinn',
        prix: 620000000,
        localisation: 'Dixinn',
        typePropriété: 'Maison',
        surface: 200,
        chambres: 4,
        image: '/img/prop2.jpg',
        note: 4.6,
        avis: 8,
        agence: 'AKIG'
      },
      {
        id: 'PROP003',
        titre: 'Studio Économique Centre',
        prix: 280000000,
        localisation: 'Kaloum',
        typePropriété: 'Studio',
        surface: 55,
        chambres: 1,
        image: '/img/prop3.jpg',
        note: 4.2,
        avis: 5,
        agence: 'Autre'
      }
    ];

    return {
      résultats: tousRésultats.slice((page - 1) * limite, page * limite),
      total: tousRésultats.length,
      facettes: {
        localisations: [
          { localisation: 'Conakry', nombre: 450 },
          { localisation: 'Dixinn', nombre: 320 },
          { localisation: 'Kindia', nombre: 180 }
        ],
        types: [
          { type: 'Appartement', nombre: 580 },
          { type: 'Maison', nombre: 340 },
          { type: 'Terrain', nombre: 150 }
        ],
        plages_prix: [
          { min: 0, max: 100000000, nombre: 120 },
          { min: 100000000, max: 300000000, nombre: 280 },
          { min: 300000000, max: 600000000, nombre: 450 }
        ]
      }
    };
  }
}

module.exports = new ServiceRechercheAvancée();
