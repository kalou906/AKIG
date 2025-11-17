/**
 * 💬 Service Chatbot IA Conversationnel
 * Assistant immobilier IA pour analyses, conseils, recherche
 */

const { Pool } = require('pg');
const logger = require('./logger');

class ServiceChatbotIA {
  /**
   * Traiter message utilisateur et générer réponse IA
   */
  static async traiterMessageUtilisateur(message, contexte = {}) {
    try {
      const {
        utilisateurId,
        localisation,
        budget,
        historique = []
      } = contexte;

      // Analyser intention message
      const intention = this.analyserIntention(message);
      
      // Générer réponse basée sur intention
      let réponse;

      switch (intention.type) {
        case 'RECHERCHE_PROPRIÉTÉ':
          réponse = await this.traiterRecherchePropriété(message, localisation, budget);
          break;

        case 'ANALYSE_PRIX':
          réponse = await this.traiterAnalysePrix(message, localisation);
          break;

        case 'CONSEIL_INVESTISSEMENT':
          réponse = await this.traiterConseilInvestissement(message, budget);
          break;

        case 'TENDANCES_MARCHÉ':
          réponse = await this.traiterTendancesMarché(message, localisation);
          break;

        case 'COMPARAISON_PROPRIÉTÉS':
          réponse = await this.traiterComparaison(message, historique);
          break;

        case 'CONTACT_AGENT':
          réponse = await this.traiterContactAgent(message, localisation);
          break;

        case 'FAQ':
          réponse = this.traiterFAQ(message);
          break;

        default:
          réponse = this.générerRéponseGénérale(message);
      }

      // Enregistrer conversation
      await this.enregistrerConversation({
        utilisateurId,
        message,
        réponse,
        intention: intention.type,
        timestamp: new Date()
      });

      return {
        succès: true,
        intention: intention.type,
        confiance: intention.confiance,
        réponse,
        actions: réponse.actions || [],
        timestamp: new Date()
      };
    } catch (erreur) {
      logger.erreur('Erreur chatbot:', erreur);
      return {
        succès: false,
        erreur: 'Erreur traitement message',
        réponse: 'Je suis désolé, je n\'ai pas pu traiter votre demande. Pouvez-vous réessayer?'
      };
    }
  }

  /**
   * Analyser intention du message
   */
  static analyserIntention(message) {
    const messageLower = message.toLowerCase();

    const intentions = [
      {
        type: 'RECHERCHE_PROPRIÉTÉ',
        motsCles: ['chercher', 'trouver', 'recherche', 'appartement', 'maison', 'propriété'],
        confiance: 0.9
      },
      {
        type: 'ANALYSE_PRIX',
        motsCles: ['prix', 'cher', 'coûte', 'valeur', 'estimation', 'estime'],
        confiance: 0.85
      },
      {
        type: 'CONSEIL_INVESTISSEMENT',
        motsCles: ['investir', 'rendement', 'profit', 'placement', 'retour', 'conseil'],
        confiance: 0.9
      },
      {
        type: 'TENDANCES_MARCHÉ',
        motsCles: ['tendance', 'marché', 'évolution', 'baisse', 'hausse', 'situation'],
        confiance: 0.85
      },
      {
        type: 'COMPARAISON_PROPRIÉTÉS',
        motsCles: ['comparer', 'différence', 'vs', 'plutôt', 'meilleur', 'préféré'],
        confiance: 0.9
      },
      {
        type: 'CONTACT_AGENT',
        motsCles: ['agent', 'agence', 'contacter', 'appeler', 'parler', 'commercial'],
        confiance: 0.9
      },
      {
        type: 'FAQ',
        motsCles: ['comment', 'quoi', 'pourquoi', 'aide', 'question', 'faq'],
        confiance: 0.8
      }
    ];

    for (const intention of intentions) {
      if (intention.motsCles.some(mot => messageLower.includes(mot))) {
        return intention;
      }
    }

    return { type: 'GÉNÉRAL', confiance: 0.5 };
  }

  /**
   * Traiter recherche de propriété
   */
  static async traiterRecherchePropriété(message, localisation, budget) {
    try {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });

      // Extraire paramètres du message
      const prixMax = this.extraireNombre(message, /(\d+)\s*(millions|GNF)/i) || budget;
      const chambresMin = this.extraireNombre(message, /(\d+)\s*chambres/i) || 1;

      const requête = `
        SELECT 
          id, titre, prix, surface, chambres, 
          localisation, type_propriété, description
        FROM propriétés
        WHERE statut = 'DISPONIBLE'
          AND localisation ILIKE $1
          AND prix <= $2
          AND chambres >= $3
        ORDER BY prix ASC
        LIMIT 5
      `;

      const résultat = await pool.query(requête, [
        localisation ? `%${localisation}%` : '%',
        prixMax || 1000000000,
        chambresMin
      ]);

      await pool.end();

      if (résultat.rows.length === 0) {
        return {
          texte: `Je n'ai pas trouvé de propriété correspondant à vos critères. Voulez-vous modifier votre recherche?`,
          suggestions: ['budget plus élevé', 'moins de chambres', 'autre localisation'],
          actions: ['modifier_recherche']
        };
      }

      const listePropriétés = résultat.rows
        .map(p => `• ${p.titre} (${p.prix / 1000000}M GNF, ${p.chambres} chambres)`)
        .join('\n');

      return {
        texte: `J'ai trouvé ${résultat.rows.length} propriété(s) correspondant à vos critères:\n\n${listePropriétés}\n\nVoulez-vous plus de détails sur l'une d'elles?`,
        propriétés: résultat.rows,
        actions: ['afficher_détails', 'afficher_sur_carte', 'contacter_agent']
      };
    } catch (erreur) {
      logger.erreur('Erreur recherche propriété:', erreur);
      return { texte: 'Erreur lors de la recherche.' };
    }
  }

  /**
   * Traiter analyse de prix
   */
  static async traiterAnalysePrix(message, localisation) {
    try {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });

      const requête = `
        SELECT 
          ROUND(AVG(prix), 0) as prix_moyen,
          ROUND(MIN(prix), 0) as prix_min,
          ROUND(MAX(prix), 0) as prix_max,
          ROUND(AVG(prix / surface), 0) as prix_m2_moyen,
          COUNT(*) as nombre_propriétés
        FROM propriétés
        WHERE localisation ILIKE $1
          AND créée_à >= maintenant() - INTERVAL '3 mois'
      `;

      const résultat = await pool.query(requête, [
        localisation ? `%${localisation}%` : '%'
      ]);

      await pool.end();

      const stats = résultat.rows[0];

      return {
        texte: `📊 Analyse du marché à ${localisation}:\n\n` +
          `• Prix moyen: ${(stats.prix_moyen / 1000000).toFixed(1)}M GNF\n` +
          `• Gamme: ${(stats.prix_min / 1000000).toFixed(1)}M - ${(stats.prix_max / 1000000).toFixed(1)}M GNF\n` +
          `• Prix par m²: ${stats.prix_m2_moyen} GNF/m²\n` +
          `• Propriétés analysées: ${stats.nombre_propriétés}`,
        statistiques: stats,
        actions: ['voir_tendances', 'chercher_propriété']
      };
    } catch (erreur) {
      logger.erreur('Erreur analyse prix:', erreur);
      return { texte: 'Erreur lors de l\'analyse des prix.' };
    }
  }

  /**
   * Traiter conseil d'investissement
   */
  static async traiterConseilInvestissement(message, budget) {
    try {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });

      const requête = `
        SELECT 
          p.id, p.titre, p.prix, p.surface, p.localisation,
          COUNT(CASE WHEN l.statut = 'LOUÉ' THEN 1 END) as demandes_location,
          ROUND(AVG(l.loyer), 0) as loyer_moyen
        FROM propriétés p
        LEFT JOIN locations l ON p.id = l.propriété_id
        WHERE p.prix <= $1
          AND p.statut = 'DISPONIBLE'
        GROUP BY p.id, p.titre, p.prix, p.surface, p.localisation
        ORDER BY 
          (COUNT(CASE WHEN l.statut = 'LOUÉ' THEN 1 END) * 100.0) DESC,
          p.prix ASC
        LIMIT 3
      `;

      const résultat = await pool.query(requête, [budget || 1000000000]);
      await pool.end();

      if (résultat.rows.length === 0) {
        return {
          texte: 'Je recommande d\'augmenter votre budget pour trouver les meilleures opportunités d\'investissement.',
          actions: ['voir_opportunités_budget_plus_élevé']
        };
      }

      const recommandations = résultat.rows
        .map(p => `• ${p.titre}: ${(p.prix / 1000000).toFixed(1)}M GNF (Loyer estimé: ${(p.loyer_moyen || 0).toFixed(0)} GNF/mois)`)
        .join('\n');

      return {
        texte: `💡 Voici mes meilleures recommandations d'investissement:\n\n${recommandations}\n\nCes propriétés offrent un bon rendement potentiel.`,
        propriétés: résultat.rows,
        actions: ['analyser_rendement', 'contacter_agent']
      };
    } catch (erreur) {
      logger.erreur('Erreur conseil investissement:', erreur);
      return { texte: 'Erreur lors de la génération des conseils.' };
    }
  }

  /**
   * Traiter tendances marché
   */
  static async traiterTendancesMarché(message, localisation) {
    const tendances = {
      'Conakry': {
        direction: 'HAUSSE',
        pourcentage: 8.5,
        raison: 'Forte demande, offre limitée'
      },
      'Dixinn': {
        direction: 'STABLE',
        pourcentage: 0.2,
        raison: 'Marché équilibré'
      },
      'Kindia': {
        direction: 'BAISSE',
        pourcentage: -3.2,
        raison: 'Saturation du marché'
      }
    };

    const tendance = tendances[localisation] || {
      direction: 'STABLE',
      pourcentage: 0,
      raison: 'Données insuffisantes'
    };

    const flèche = tendance.direction === 'HAUSSE' ? '📈' : tendance.direction === 'BAISSE' ? '📉' : '➡️';

    return {
      texte: `${flèche} Tendance à ${localisation}:\n\n` +
        `• Direction: ${tendance.direction}\n` +
        `• Variation: ${tendance.pourcentage > 0 ? '+' : ''}${tendance.pourcentage}%\n` +
        `• Raison: ${tendance.raison}`,
      tendance,
      actions: ['chercher_bonnes_affaires', 'analyser_marché']
    };
  }

  /**
   * Traiter comparaison propriétés
   */
  static async traiterComparaison(message, historique) {
    if (historique.length < 2) {
      return {
        texte: 'Vous devez d\'abord consulter au moins 2 propriétés pour les comparer.',
        actions: ['chercher_propriété']
      };
    }

    return {
      texte: 'Comparaison généré des 2 dernières propriétés consultées.',
      comparaison: {
        propriété1: historique[0],
        propriété2: historique[1]
      },
      actions: ['afficher_comparaison_détaillée']
    };
  }

  /**
   * Traiter demande de contact agent
   */
  static async traiterContactAgent(message, localisation) {
    return {
      texte: `Je vais vous mettre en contact avec un agent immobilier spécialisé à ${localisation}. Un de nos conseillers vous contactera très bientôt.`,
      actions: ['envoyer_demande_contact'],
      formulaire: {
        nom: '',
        email: '',
        téléphone: '',
        message: message
      }
    };
  }

  /**
   * Traiter FAQ
   */
  static traiterFAQ(message) {
    const faqs = {
      'comment acheter': 'Pour acheter une propriété: 1) Créez un compte 2) Explorez les annonces 3) Prenez contact avec l\'agent 4) Effectuez les démarches légales.',
      'comment louer': 'Pour louer une propriété: 1) Créez un profil locataire 2) Postulez aux annonces 3) Attendez approbation du propriétaire 4) Signez le bail.',
      'frais': 'Les frais immobiliers varient de 3% à 5% du prix d\'achat selon le type de bien et la transaction.',
      'documents': 'Documents nécessaires: pièce d\'identité, justificatif de revenus, références, et certificat de domicile.',
      'garantie': 'Nous vérifions tous les bien et garantissons l\'authenticité des propriétés listées.'
    };

    for (const [clé, réponse] of Object.entries(faqs)) {
      if (message.toLowerCase().includes(clé)) {
        return {
          texte: réponse,
          actions: ['plus_questions', 'contacter_support']
        };
      }
    }

    return {
      texte: 'Je ne suis pas sûr de votre question. Pouvez-vous reformuler?',
      actions: ['contacter_support']
    };
  }

  /**
   * Générer réponse générale
   */
  static générerRéponseGénérale(message) {
    return {
      texte: `Merci pour votre message. Comment puis-je vous aider?\n\n` +
        `Je peux vous aider avec:\n` +
        `• Recherche de propriété\n` +
        `• Analyse des prix\n` +
        `• Conseils d'investissement\n` +
        `• Tendances du marché\n` +
        `• Contact avec un agent`,
      actions: ['voir_options']
    };
  }

  /**
   * Extraire nombre du message
   */
  static extraireNombre(message, regex) {
    const match = message.match(regex);
    return match ? parseInt(match[1]) : null;
  }

  /**
   * Enregistrer conversation
   */
  static async enregistrerConversation(données) {
    try {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });

      const requête = `
        INSERT INTO conversations_chatbot 
        (utilisateur_id, message, réponse, intention, créée_à)
        VALUES ($1, $2, $3, $4, $5)
      `;

      await pool.query(requête, [
        données.utilisateurId,
        données.message,
        JSON.stringify(données.réponse),
        données.intention,
        données.timestamp
      ]);

      await pool.end();
    } catch (erreur) {
      logger.warn('Erreur enregistrement conversation:', erreur);
    }
  }
}

module.exports = ServiceChatbotIA;
