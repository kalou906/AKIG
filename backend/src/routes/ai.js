const router = require('express').Router();

router.post('/assist', async (req, res) => {
  try {
    const { prompt, context } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Simple keyword extraction and filter suggestion logic
    const promptLower = prompt.toLowerCase();
    const filters = {};

    // Extract keywords
    if (
      promptLower.includes('impay') ||
      promptLower.includes('retard') ||
      promptLower.includes('dû')
    ) {
      filters.status = 'overdue';
    }

    if (promptLower.includes('matam')) {
      filters.agency = 'Matam';
    }

    if (promptLower.includes('actif') || promptLower.includes('en cours')) {
      filters.status = 'active';
    }

    // Generate contextual suggestions based on domain
    const domain = context?.domain || 'tenants';
    const suggestions = [];

    if (domain === 'tenants') {
      if (Object.keys(filters).length > 0) {
        suggestions.push({
          title: 'Filtrer les locataires',
          description: `Afficher les locataires correspondant aux critères détectés`,
          filters,
          action: { label: 'Appliquer' },
        });
      }

      suggestions.push({
        title: 'Top loyers élevés',
        description: 'Afficher les locataires avec loyer > 5 000 000 GNF',
        filters: { minRent: 5000000 },
        action: { label: 'Afficher' },
      });

      suggestions.push({
        title: 'Contacts récents',
        description: 'Locataires contactés cette semaine',
        filters: { sortBy: 'lastContact', sortOrder: 'desc' },
        action: { label: 'Voir' },
      });
    } else if (domain === 'contracts') {
      if (Object.keys(filters).length > 0) {
        suggestions.push({
          title: 'Filtrer les contrats',
          description: 'Afficher les contrats correspondant aux critères',
          filters,
          action: { label: 'Appliquer' },
        });
      }

      suggestions.push({
        title: 'Contrats expirant bientôt',
        description: 'Contrats avec échéance dans les 30 jours',
        filters: { status: 'expiring_soon' },
        action: { label: 'Voir' },
      });
    }

    res.json({ suggestions });
  } catch (error) {
    console.error('AI assist error:', error);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

module.exports = router;
