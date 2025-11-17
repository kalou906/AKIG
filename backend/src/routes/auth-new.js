/**
 * 🔑 Routes API - Authentification & Autorisation
 */

const express = require('express');
const router = express.Router();
const AuthService = require('../services/AuthService');
const { authMiddleware } = require('../middleware/auth-rbac');

let authService;

const useAuthService = (req, res, next) => {
  if (!authService && req.app.get('authService')) {
    authService = req.app.get('authService');
  }
  next();
};

router.use(useAuthService);

/**
 * POST /api/auth/register
 * Créer un nouveau compte utilisateur
 */
router.post('/register', async (req, res) => {
  try {
    const result = await authService.register(req.body);
    res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    console.error('❌ Erreur register:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/auth/login
 * Authentifier un utilisateur
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email et mot de passe requis' });
    }

    const result = await authService.login(email, password);
    res.status(result.success ? 200 : 401).json(result);
  } catch (error) {
    console.error('❌ Erreur login:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/auth/logout
 * Déconnexion
 */
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const result = await authService.logout(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('❌ Erreur logout:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/auth/refresh
 * Rafraîchir token
 */
router.post('/refresh', authMiddleware, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const newToken = authService.refreshToken(token);
    
    if (!newToken) {
      return res.status(401).json({ success: false, error: 'Token invalide' });
    }

    res.json({ success: true, token: newToken });
  } catch (error) {
    console.error('❌ Erreur refresh:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/auth/change-password
 * Changer le mot de passe
 */
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Anciens et nouveaux mots de passe requis' });
    }

    const result = await authService.changePassword(req.user.id, oldPassword, newPassword);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('❌ Erreur change password:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/auth/me
 * Obtenir les informations du utilisateur connecté
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    res.json({ success: true, user: req.user });
  } catch (error) {
    console.error('❌ Erreur GET /auth/me:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
