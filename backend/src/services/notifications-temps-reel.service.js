/**
 * 🔔 Service Notifications Temps Réel
 * WebSocket pour alertes marché instantanées, mises à jour propriétés
 */

const socketIo = require('socket.io');
const logger = require('./logger');
const { Pool } = require('pg');

class ServiceNotificationsTempsRéel {
  constructor(serveur) {
    this.io = socketIo(serveur, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST']
      }
    });

    this.utilisateursSockets = new Map(); // userId -> socket.id
    this.chaînesAbonnements = new Map(); // userId -> [chaînes]
    this.alertesActives = new Map(); // alerteId -> config

    this.initialiserÉcouteurs();
  }

  /**
   * Initialiser écouteurs WebSocket
   */
  initialiserÉcouteurs() {
    this.io.on('connexion', (socket) => {
      logger.info(`📱 Connexion WebSocket: ${socket.id}`);

      socket.on('authentifier', (donnéesUtilisateur) => {
        this.authentifierSocket(socket, donnéesUtilisateur);
      });

      socket.on('sabonner', (chaîne) => {
        this.sabonnerChaîne(socket, chaîne);
      });

      socket.on('se-desabonner', (chaîne) => {
        this.seDesabonnerChaîne(socket, chaîne);
      });

      socket.on('créer-alerte', (configAlerte) => {
        this.créerAlerte(socket, configAlerte);
      });

      socket.on('supprimer-alerte', (alerteId) => {
        this.supprimerAlerte(socket, alerteId);
      });

      socket.on('demander-notification', (données) => {
        this.envoyerNotification(socket, données);
      });

      socket.on('déconnexion', () => {
        this.gérerdéconnexion(socket);
      });
    });
  }

  /**
   * Authentifier socket avec utilisateur
   */
  authentifierSocket(socket, utilisateur) {
    const { userId, nom, email } = utilisateur;

    socket.utilisateurId = userId;
    socket.nomUtilisateur = nom;
    socket.emailUtilisateur = email;

    this.utilisateursSockets.set(userId, socket.id);
    this.chaînesAbonnements.set(userId, []);

    // Rejoindre chaîne personnelle
    socket.join(`utilisateur-${userId}`);

    // Rejoindre chaîne générale
    socket.join('notifications-générales');

    socket.emit('authentification-succès', {
      message: 'Connecté au système de notifications',
      utilisateurId: userId,
      timestamp: new Date()
    });

    logger.info(`✅ Utilisateur ${userId} authentifié sur WebSocket`);

    // Envoyer notifications en attente
    this.envoyerNotificationsEnAttente(socket, userId);
  }

  /**
   * S'abonner à une chaîne de notifications
   */
  sabonnerChaîne(socket, chaîne) {
    const userId = socket.utilisateurId;

    if (!userId) {
      socket.emit('erreur', 'Non authentifié');
      return;
    }

    socket.join(chaîne);

    const chaînes = this.chaînesAbonnements.get(userId) || [];
    if (!chaînes.includes(chaîne)) {
      chaînes.push(chaîne);
      this.chaînesAbonnements.set(userId, chaînes);
    }

    socket.emit('abonnement-succès', {
      chaîne,
      message: `Abonné à ${chaîne}`
    });

    logger.info(`📌 ${userId} abonné à ${chaîne}`);
  }

  /**
   * Se désabonner d'une chaîne
   */
  seDesabonnerChaîne(socket, chaîne) {
    const userId = socket.utilisateurId;

    socket.leave(chaîne);

    const chaînes = this.chaînesAbonnements.get(userId) || [];
    const index = chaînes.indexOf(chaîne);
    if (index > -1) {
      chaînes.splice(index, 1);
    }

    socket.emit('désabonnement-succès', {
      chaîne,
      message: `Désabonné de ${chaîne}`
    });

    logger.info(`📍 ${userId} désabonné de ${chaîne}`);
  }

  /**
   * Créer alerte personnalisée (prix, new properties, etc)
   */
  async créerAlerte(socket, configAlerte) {
    try {
      const userId = socket.utilisateurId;
      const alerteId = `alerte-${Date.now()}`;

      const {
        type, // 'prix-nouveau', 'nouveau-bien', 'prix-baisse', 'marche-anomalie'
        localisation,
        prixMin,
        prixMax,
        typePropriété,
        chambresMin,
        fréquence = 'instantanée'
      } = configAlerte;

      // Enregistrer alerte
      this.alertesActives.set(alerteId, {
        userId,
        type,
        localisation,
        prixMin,
        prixMax,
        typePropriété,
        chambresMin,
        fréquence,
        créeeLe: new Date(),
        dernièreVérification: new Date()
      });

      socket.emit('alerte-créée', {
        alerteId,
        message: `Alerte créée: ${type} à ${localisation}`,
        config: configAlerte
      });

      logger.info(`🚨 Alerte créée ${alerteId} pour ${userId}`);

      // Vérifier immédiatement
      this.vérifierAlerte(alerteId, userId);
    } catch (erreur) {
      logger.erreur('Erreur création alerte:', erreur);
      socket.emit('erreur', 'Erreur création alerte');
    }
  }

  /**
   * Vérifier alerte et envoyer notif si match
   */
  async vérifierAlerte(alerteId, userId) {
    try {
      const alerte = this.alertesActives.get(alerteId);
      if (!alerte) return;

      const pool = new Pool({ connectionString: process.env.DATABASE_URL });

      let requête = `
        SELECT 
          id, titre, prix, surface, chambres, localisation,
          type_propriété, créée_à
        FROM propriétés
        WHERE statut = 'DISPONIBLE'
          AND localisation = $1
          AND créée_à > $2
      `;

      const paramètres = [
        alerte.localisation,
        alerte.dernièreVérification
      ];

      if (alerte.prixMin) {
        requête += ` AND prix >= $${paramètres.length + 1}`;
        paramètres.push(alerte.prixMin);
      }

      if (alerte.prixMax) {
        requête += ` AND prix <= $${paramètres.length + 1}`;
        paramètres.push(alerte.prixMax);
      }

      if (alerte.typePropriété) {
        requête += ` AND type_propriété = $${paramètres.length + 1}`;
        paramètres.push(alerte.typePropriété);
      }

      if (alerte.chambresMin) {
        requête += ` AND chambres >= $${paramètres.length + 1}`;
        paramètres.push(alerte.chambresMin);
      }

      const résultat = await pool.query(requête, paramètres);
      await pool.end();

      // Envoyer notification pour chaque propriété trouvée
      résultat.rows.forEach(propriété => {
        this.io.to(`utilisateur-${userId}`).emit('alerte-déclenchée', {
          alerteId,
          type: alerte.type,
          propriété,
          message: `🎯 Nouvelle propriété correspondant à votre alerte: ${propriété.titre}`,
          timestamp: new Date()
        });
      });

      // Mettre à jour dernière vérification
      alerte.dernièreVérification = new Date();
      this.alertesActives.set(alerteId, alerte);

      if (résultat.rows.length > 0) {
        logger.info(`📬 ${résultat.rows.length} notifications envoyées pour ${alerteId}`);
      }
    } catch (erreur) {
      logger.erreur('Erreur vérification alerte:', erreur);
    }
  }

  /**
   * Supprimer alerte
   */
  supprimerAlerte(socket, alerteId) {
    const userId = socket.utilisateurId;
    const alerte = this.alertesActives.get(alerteId);

    if (alerte && alerte.userId === userId) {
      this.alertesActives.delete(alerteId);
      socket.emit('alerte-supprimée', { alerteId });
      logger.info(`🗑️ Alerte supprimée: ${alerteId}`);
    } else {
      socket.emit('erreur', 'Alerte non trouvée');
    }
  }

  /**
   * Envoyer notification manuelle
   */
  envoyerNotification(socket, données) {
    const { titre, message, type = 'info', destinataires = [] } = données;

    const notification = {
      id: `notif-${Date.now()}`,
      titre,
      message,
      type,
      créeeLe: new Date(),
      lue: false
    };

    if (destinataires.length === 0) {
      this.io.emit('notification', notification);
    } else {
      destinataires.forEach(userId => {
        this.io.to(`utilisateur-${userId}`).emit('notification', notification);
      });
    }

    logger.info(`📨 Notification envoyée: ${titre}`);
  }

  /**
   * Envoyer notifications en attente
   */
  async envoyerNotificationsEnAttente(socket, userId) {
    try {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });

      const requête = `
        SELECT id, titre, message, type, créée_à
        FROM notifications
        WHERE utilisateur_id = $1
          AND lue = false
        ORDER BY créée_à DESC
        LIMIT 20
      `;

      const résultat = await pool.query(requête, [userId]);
      await pool.end();

      résultat.rows.forEach(notif => {
        socket.emit('notification-en-attente', notif);
      });

      if (résultat.rows.length > 0) {
        logger.info(`📬 ${résultat.rows.length} notifications en attente envoyées`);
      }
    } catch (erreur) {
      logger.erreur('Erreur notifications en attente:', erreur);
    }
  }

  /**
   * Diffuser propriété nouvelle en temps réel
   */
  diffuserNouvellePropriété(propriété) {
    const { localisation, type_propriété, prix } = propriété;

    // Diffuser à tous abonnés de la localisation
    this.io.to(`localisation-${localisation}`).emit('nouvelle-propriété', {
      propriété,
      message: `✨ Nouvelle propriété à ${localisation}: ${propriété.titre}`,
      timestamp: new Date()
    });

    // Diffuser aux utilisateurs avec alertes correspondantes
    this.alertesActives.forEach((alerte, alerteId) => {
      const match = 
        alerte.localisation === localisation &&
        (!alerte.typePropriété || alerte.typePropriété === type_propriété) &&
        (!alerte.prixMin || prix >= alerte.prixMin) &&
        (!alerte.prixMax || prix <= alerte.prixMax);

      if (match) {
        this.io.to(`utilisateur-${alerte.userId}`).emit('alerte-déclenchée', {
          alerteId,
          type: 'nouvelle-propriété',
          propriété,
          message: `🎯 Nouvelle propriété correspondant à votre recherche!`,
          timestamp: new Date()
        });
      }
    });

    logger.info(`🌟 Nouvelle propriété diffusée: ${propriété.titre}`);
  }

  /**
   * Diffuser mise à jour prix
   */
  diffuserMàjPrix(propriétéId, ancienPrix, nouveauPrix) {
    const pourcentageChange = ((nouveauPrix - ancienPrix) / ancienPrix) * 100;

    this.io.emit('mise-à-jour-prix', {
      propriétéId,
      ancienPrix,
      nouveauPrix,
      pourcentageChange,
      message: `💰 Prix modifié: ${pourcentageChange > 0 ? '+' : ''}${pourcentageChange.toFixed(1)}%`,
      timestamp: new Date()
    });

    logger.info(`💵 Prix mis à jour: Propriété ${propriétéId}`);
  }

  /**
   * Diffuser alerte marché (anomalies)
   */
  diffuserAlerteMarchéAnomalie(localisation, type, données) {
    this.io.to(`localisation-${localisation}`).emit('alerte-marché', {
      localisation,
      type,
      données,
      message: `⚠️ Anomalie marché détectée à ${localisation}`,
      timestamp: new Date()
    });

    logger.info(`🚨 Alerte marché: ${type} à ${localisation}`);
  }

  /**
   * Diffuser notification de vente
   */
  diffuserVente(propriété) {
    this.io.emit('propriété-vendue', {
      propriété,
      message: `✅ Propriété vendue: ${propriété.titre}`,
      timestamp: new Date()
    });

    logger.info(`🏠 Propriété vendue: ${propriété.titre}`);
  }

  /**
   * Gérer déconnexion
   */
  gérerdéconnexion(socket) {
    const userId = socket.utilisateurId;

    if (userId) {
      this.utilisateursSockets.delete(userId);
      logger.info(`📴 Utilisateur ${userId} déconnecté`);
    }
  }

  /**
   * Obtenir statistiques connexions
   */
  obtenirStatistiques() {
    return {
      utilisateurs: this.utilisateursSockets.size,
      alertesActives: this.alertesActives.size,
      connexions: Object.keys(this.io.sockets.sockets).length
    };
  }

  /**
   * Vérifier toutes alertes (à appeler périodiquement)
   */
  vérifierToutesAlertes() {
    this.alertesActives.forEach((alerte, alerteId) => {
      // Vérifier selon fréquence
      const intervalleVérif = alerte.fréquence === 'horaire' ? 3600000 : 300000; // 1h ou 5min

      const tempsSinceCheck = Date.now() - alerte.dernièreVérification.getTime();
      if (tempsSinceCheck > intervalleVérif) {
        this.vérifierAlerte(alerteId, alerte.userId);
      }
    });
  }
}

module.exports = ServiceNotificationsTempsRéel;
