const express = require('express');
const router = express.Router();

/**
 * GET /api/feedback
 * Récupère tous les feedbacks
 */
router.get('/', async (req, res) => {
  try {
    res.json({ message: 'Feedback route - Liste' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/feedback
 * Crée un nouveau feedback
 */
router.post('/', async (req, res) => {
  try {
    res.status(201).json({ message: 'Feedback créé', id: 1 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/feedback/:id
 * Récupère un feedback spécifique
 */
router.get('/:id', async (req, res) => {
  try {
    res.json({ message: 'Feedback détail', id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
