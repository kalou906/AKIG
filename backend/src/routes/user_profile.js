/**
 * Routes de Gestion des Profils Utilisateurs
 * 
 * GET    /profile              - Récupérer profil courant
 * PATCH  /profile              - Mettre à jour profil
 * POST   /password/change      - Changer mot de passe
 * PATCH  /preferences          - Mettre à jour préférences
 * GET    /stats                - Obtenir statistiques
 * DELETE /account              - Supprimer compte
 * GET    /:id                  - Récupérer utilisateur (admin)
 * GET                          - Lister utilisateurs (admin)
 */

const express = require('express');
const router = express.Router();
const UserService = require('../services/UserService');
const { authMiddleware } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');

/**
 * GET /profile
 * Récupérer profil de l'utilisateur courant
 */
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const profile = await UserService.getUserProfile(userId);

    res.json({
      success: true,
      message: 'Profil récupéré',
      data: profile
    });

  } catch (error) {
    console.error('[UserRoutes] Erreur GET profile:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur récupération profil',
      error: error.message
    });
  }
});

/**
 * PATCH /profile
 * Mettre à jour profil utilisateur
 */
router.patch('/profile', authMiddleware, validateRequest({
  body: {
    email: { type: 'string', required: false },
    nom: { type: 'string', required: false },
    prenom: { type: 'string', required: false },
    telephone: { type: 'string', required: false },
    adresse: { type: 'string', required: false },
    code_postal: { type: 'string', required: false },
    ville: { type: 'string', required: false },
    pays: { type: 'string', required: false },
    profession: { type: 'string', required: false },
    entreprise: { type: 'string', required: false },
    date_naissance: { type: 'string', required: false },
    bio: { type: 'string', required: false }
  }
}), async (req, res) => {
  try {
    const userId = req.user.id;

    const updatedProfile = await UserService.updateUserProfile(userId, req.body);

    res.json({
      success: true,
      message: 'Profil mis à jour',
      data: updatedProfile
    });

  } catch (error) {
    console.error('[UserRoutes] Erreur PATCH profile:', error);
    res.status(error.message.includes('invalide') ? 400 : 500).json({
      success: false,
      message: 'Erreur mise à jour profil',
      error: error.message
    });
  }
});

/**
 * POST /password/change
 * Changer le mot de passe
 */
router.post('/password/change', authMiddleware, validateRequest({
  body: {
    currentPassword: { type: 'string', required: true },
    newPassword: { type: 'string', required: true },
    confirmPassword: { type: 'string', required: true }
  }
}), async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Vérifier que les mots de passe correspondent
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Les mots de passe ne correspondent pas'
      });
    }

    const result = await UserService.changePassword(userId, currentPassword, newPassword);

    res.json({
      success: true,
      message: 'Mot de passe changé avec succès',
      data: result.data
    });

  } catch (error) {
    console.error('[UserRoutes] Erreur POST password/change:', error);
    res.status(error.message.includes('incorrect') ? 401 : 400).json({
      success: false,
      message: 'Erreur changement mot de passe',
      error: error.message
    });
  }
});

/**
 * PATCH /preferences
 * Mettre à jour les préférences utilisateur
 */
router.patch('/preferences', authMiddleware, validateRequest({
  body: {
    langue: { type: 'string', required: false },
    timezone: { type: 'string', required: false },
    notifications_actives: { type: 'boolean', required: false },
    theme: { type: 'string', required: false },
    email_notifications: { type: 'boolean', required: false },
    sms_notifications: { type: 'boolean', required: false }
  }
}), async (req, res) => {
  try {
    const userId = req.user.id;

    const preferences = await UserService.updatePreferences(userId, req.body);

    res.json({
      success: true,
      message: 'Préférences mises à jour',
      data: preferences
    });

  } catch (error) {
    console.error('[UserRoutes] Erreur PATCH preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur mise à jour préférences',
      error: error.message
    });
  }
});

/**
 * GET /stats
 * Récupérer statistiques utilisateur
 */
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await UserService.getUserStats(userId);

    res.json({
      success: true,
      message: 'Statistiques récupérées',
      data: stats
    });

  } catch (error) {
    console.error('[UserRoutes] Erreur GET stats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur récupération statistiques',
      error: error.message
    });
  }
});

/**
 * DELETE /account
 * Supprimer le compte utilisateur
 */
router.delete('/account', authMiddleware, validateRequest({
  body: {
    password: { type: 'string', required: true }
  }
}), async (req, res) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;

    const result = await UserService.deleteUserAccount(userId, password);

    // Invalider le token courant
    res.json({
      success: true,
      message: 'Compte supprimé',
      data: result.data
    });

  } catch (error) {
    console.error('[UserRoutes] Erreur DELETE account:', error);
    res.status(error.message.includes('incorrect') ? 401 : 500).json({
      success: false,
      message: 'Erreur suppression compte',
      error: error.message
    });
  }
});

/**
 * GET /:id
 * Récupérer profil utilisateur (admin)
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    // TODO: Vérifier rôle admin
    // if (req.user.role !== 'admin') {
    //   return res.status(403).json({ success: false, message: 'Accès refusé' });
    // }

    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'ID utilisateur invalide'
      });
    }

    const profile = await UserService.getUserProfile(userId);

    res.json({
      success: true,
      message: 'Profil récupéré',
      data: profile
    });

  } catch (error) {
    console.error('[UserRoutes] Erreur GET /:id:', error);
    res.status(error.message.includes('non trouvé') ? 404 : 500).json({
      success: false,
      message: 'Erreur récupération profil',
      error: error.message
    });
  }
});

/**
 * GET /
 * Lister les utilisateurs (admin)
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    // TODO: Vérifier rôle admin
    // if (req.user.role !== 'admin') {
    //   return res.status(403).json({ success: false, message: 'Accès refusé' });
    // }

    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
      statut: req.query.statut,
      search: req.query.search
    };

    const result = await UserService.listUsers(filters);

    res.json({
      success: true,
      message: 'Utilisateurs récupérés',
      data: result.users,
      pagination: result.pagination
    });

  } catch (error) {
    console.error('[UserRoutes] Erreur GET /:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur listage utilisateurs',
      error: error.message
    });
  }
});

module.exports = router;
