/**
 * API routes for AI contract suggestions
 */

const express = require('express');

const router = express.Router();

/**
 * POST /api/ai/contract-suggest
 * Generate AI suggestions for a contract based on client profile
 */
router.post('/contract-suggest', async (req, res) => {
  try {
    const { variables } = req.body;

    if (!variables) {
      return res.status(400).json({ error: 'Missing variables' });
    }

    const client = variables.client || {};
    const contract = variables.contrat || {};

    const suggestions = [];

    // ============================================
    // RISK ANALYSIS
    // ============================================

    // Check for high loan-to-income ratio
    if (client.revenu && contract.loyer) {
      const revenuMatch = client.revenu.match(/(\d+[\s.]?\d*)/);
      const loyerMatch = contract.loyer.match(/(\d+[\s.]?\d*)/);

      if (revenuMatch && loyerMatch) {
        const revenuNum = parseFloat(revenuMatch[1].replace(/[\s.]/g, ''));
        const loyerNum = parseFloat(loyerMatch[1].replace(/[\s.]/g, ''));
        const ratio = (loyerNum / revenuNum) * 100;

        if (ratio > 50) {
          suggestions.push({
            id: 'high_rent_ratio_ai',
            category: 'risk',
            severity: 'warning',
            title: 'Loyer très élevé par rapport au revenu',
            description: `Le loyer représente ${ratio.toFixed(1)}% du revenu mensuel déclaré (standard: <30%). Vérifier les sources de revenus supplémentaires.`,
            action: 'Demander justificatif supplémentaire des revenus',
          });
        }
      }
    }

    // Check for guarantor
    if (!client.garant) {
      suggestions.push({
        id: 'no_guarantor_ai',
        category: 'risk',
        severity: 'critical',
        title: 'Aucun garant spécifié',
        description: 'Un contrat sans garant augmente le risque de défaut de paiement',
        action: 'Exiger un garant solvable',
      });
    }

    // ============================================
    // DOCUMENT RECOMMENDATIONS
    // ============================================

    // Recommend document retention period
    if (contract.date_debut && contract.date_fin) {
      suggestions.push({
        id: 'doc_retention_ai',
        category: 'document',
        severity: 'info',
        title: 'Période de conservation documentaire',
        description: 'Recommandation: Conserver tous les documents 7 années minimum après fin du contrat',
        action: 'Archiver le dossier complet du contrat',
      });
    }

    // ============================================
    // PAYMENT RECOMMENDATIONS
    // ============================================

    // Suggest payment method verification
    if (!contract.mode_paiement) {
      suggestions.push({
        id: 'payment_method_ai',
        category: 'recommendation',
        severity: 'warning',
        title: 'Mode de paiement non défini',
        description:
          'Spécifier le mode de paiement (Orange Money, Virement, Espèces) facilite le suivi',
        action: 'Modes recommandés: Orange Money ou Virement bancaire',
      });
    }

    // ============================================
    // VALIDATION RECOMMENDATIONS
    // ============================================

    // Check for CNI/ID
    if (!client.cni) {
      suggestions.push({
        id: 'missing_id_ai',
        category: 'missing_info',
        severity: 'critical',
        title: 'Identité client non enregistrée',
        description: 'Le numéro CNI est indispensable pour la légalité du contrat',
        action: 'Demander copie CNI et vérifier authenticité',
      });
    }

    // Professional verification
    if (!client.profession) {
      suggestions.push({
        id: 'profession_unspecified_ai',
        category: 'missing_info',
        severity: 'info',
        title: 'Profession non spécifiée',
        description: 'Connaître la profession aide à évaluer la stabilité du revenu',
        action: 'Demander détails de la profession',
      });
    }

    // ============================================
    // DURATION ANALYSIS
    // ============================================

    if (contract.date_debut && contract.date_fin) {
      try {
        const start = new Date(contract.date_debut);
        const end = new Date(contract.date_fin);

        if (start >= end) {
          suggestions.push({
            id: 'invalid_dates_ai',
            category: 'document',
            severity: 'critical',
            title: 'Dates de contrat invalides',
            description: 'La date de fin doit être après la date de début',
            action: 'Corriger les dates du contrat',
          });
        }

        const months =
          (end.getFullYear() - start.getFullYear()) * 12 +
          (end.getMonth() - start.getMonth());

        if (months < 6) {
          suggestions.push({
            id: 'short_duration_ai',
            category: 'recommendation',
            severity: 'warning',
            title: 'Contrat très court terme',
            description: `Durée: ${months} mois. Les contrats courts peuvent être renouvelés rapidement.`,
            action: 'Vérifier si renouvellement automatique souhaité',
          });
        } else if (months > 36) {
          suggestions.push({
            id: 'long_duration_ai',
            category: 'recommendation',
            severity: 'info',
            title: 'Contrat long terme',
            description: `Durée: ${months} mois. Prévoir révision clause révision loyer.`,
            action: 'Ajouter clause révision annuelle loyer',
          });
        }
      } catch (e) {
        // Date parsing failed
      }
    }

    // ============================================
    // CAUTION ANALYSIS
    // ============================================

    if (contract.loyer && !contract.caution) {
      suggestions.push({
        id: 'no_caution_ai',
        category: 'recommendation',
        severity: 'info',
        title: 'Montant caution non défini',
        description: 'Caution recommandée: 2-3 mois de loyer pour sécuriser le contrat',
        action: 'Définir caution = 2 à 3 mois de loyer',
      });
    }

    // ============================================
    // POSITIVE FEEDBACK
    // ============================================

    if (
      suggestions.length === 0 ||
      !suggestions.some((s) => s.severity === 'critical')
    ) {
      if (
        client.nom &&
        client.tel &&
        client.cni &&
        contract.loyer &&
        contract.date_debut &&
        contract.date_fin
      ) {
        suggestions.push({
          id: 'profile_complete_ai',
          category: 'recommendation',
          severity: 'info',
          title: '✅ Profil complet',
          description: 'Tous les éléments critiques sont présents. Le contrat peut être généré.',
          action: 'Procéder à la génération et la signature du contrat',
        });
      }
    }

    res.json({ suggestions });
  } catch (error) {
    console.error('Error in contract-suggest:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
