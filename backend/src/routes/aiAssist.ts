// ============================================================================
// AI Assist Route (aiAssist.ts)
// File: src/routes/aiAssist.ts
// Purpose: AI-powered search suggestions with scope filtering and audit logging
// ============================================================================

import express from 'express';
import { requireAuth, requirePerm, audit } from '../middlewares/authz';

const router = express.Router();

/**
 * POST /api/ai/assist
 * AI-powered search suggestions
 * Requires: ai.assist permission
 * Returns: Filtered suggestions based on user scope and role
 *
 * @example
 * POST /api/ai/assist
 * { prompt: "Show overdue contracts over 1 million" }
 * Response: { suggestions: [...] }
 */
router.post('/assist', requireAuth, requirePerm('ai.assist'), async (req: any, res: any) => {
  try {
    const { prompt, context } = req.body;
    const user = req.user;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'BAD_INPUT', message: 'prompt required' });
    }

    // Parse natural language prompt
    const parsedFilters = parsePrompt(prompt);

    // Apply scope-based filtering
    const scopeFilters: any = {};
    if (user.roles?.includes('PROPRIETAIRE')) {
      scopeFilters.owner_id = user.owner_id;
    }
    if (user.roles?.includes('LOCATAIRE')) {
      scopeFilters.tenant_id = user.tenant_id;
    }

    // Combine parsed filters with scope
    const finalFilters = { ...parsedFilters, ...scopeFilters };

    // Generate suggestions based on parsed content
    const suggestions = generateSuggestions(prompt, finalFilters, user.roles || []);

    // Audit the search
    await audit(req, 'AI_SEARCH', `search:${parsedFilters.resource || 'general'}`, {
      prompt: prompt.substring(0, 100),
      suggestionCount: suggestions.length,
      roleApplied: user.roles?.[0] || 'UNKNOWN'
    });

    res.json({
      ok: true,
      suggestions,
      filters: finalFilters,
      appliedRoles: user.roles || []
    });
  } catch (error: any) {
    await audit(req, 'AI_SEARCH_ERROR', 'ai', { error: error.message });
    res.status(500).json({
      error: 'SEARCH_ERROR',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal error'
    });
  }
});

/**
 * Parse natural language prompt and extract filters
 * Handles French and English keywords
 */
function parsePrompt(prompt: string): any {
  const p = String(prompt || '').toLowerCase();
  const filters: any = {};

  // Status filters
  if (
    p.includes('impay') ||
    p.includes('overdue') ||
    p.includes('retard') ||
    p.includes('arrears')
  ) {
    filters.status = 'overdue';
  }

  if (p.includes('payé') || p.includes('paid') || p.includes('payment received')) {
    filters.status = 'paid';
  }

  // Payment method filters
  if (p.includes('orange') || p.includes('orange money') || p.includes('om')) {
    filters.payment_method = 'orange_money';
  }

  if (p.includes('virement') || p.includes('transfer') || p.includes('bank')) {
    filters.payment_method = 'bank_transfer';
  }

  if (p.includes('espèces') || p.includes('cash')) {
    filters.payment_method = 'cash';
  }

  // Amount filters
  const amountMatch = p.match(/>?\s*(\d+)\s*(million|m)?/);
  if (amountMatch) {
    const amount = Number(amountMatch[1]);
    const multiplier = amountMatch[2] === 'million' || amountMatch[2] === 'm' ? 1_000_000 : 1;
    filters.min_amount = amount * multiplier;
  }

  // Time period filters
  if (p.includes('ce mois') || p.includes('this month') || p.includes('current month')) {
    filters.period = 'current_month';
  }

  if (p.includes('ce trimestre') || p.includes('this quarter')) {
    filters.period = 'current_quarter';
  }

  if (p.includes('cette année') || p.includes('this year')) {
    filters.period = 'current_year';
  }

  // Year extraction
  const yearMatch = p.match(/\b(20\d{2}|202[0-5])\b/);
  if (yearMatch) {
    filters.year = Number(yearMatch[1]);
  }

  // Location/Region filters
  if (p.includes('dakar')) filters.region = 'Dakar';
  if (p.includes('kaolack')) filters.region = 'Kaolack';
  if (p.includes('matam')) filters.region = 'Matam';
  if (p.includes('saint-louis')) filters.region = 'Saint-Louis';
  if (p.includes('kolda')) filters.region = 'Kolda';

  // Resource type detection
  if (p.includes('contrat') || p.includes('contract')) {
    filters.resource = 'contracts';
  } else if (p.includes('paiement') || p.includes('payment')) {
    filters.resource = 'payments';
  } else if (p.includes('locataire') || p.includes('tenant')) {
    filters.resource = 'tenants';
  }

  return filters;
}

/**
 * Generate AI suggestions based on parsed filters
 */
function generateSuggestions(
  prompt: string,
  filters: any,
  roles: string[]
): Array<{ title: string; description: string; filters: any; icon: string }> {
  const suggestions: Array<{ title: string; description: string; filters: any; icon: string }> = [];

  // Overdue payments suggestion
  if (filters.status === 'overdue') {
    suggestions.push({
      title: 'Contrats en retard',
      description: `Affiche les contrats avec impayés ${filters.min_amount ? `supérieurs à ${filters.min_amount}` : ''}`,
      filters: {
        status: 'overdue',
        ...(filters.min_amount && { min_arrears: filters.min_amount }),
        ...(filters.year && { year: filters.year }),
        ...(filters.region && { region: filters.region })
      },
      icon: '⏰'
    });

    // Collection priority suggestion
    if (roles.includes('COMPTA') || roles.includes('PDG')) {
      suggestions.push({
        title: 'Priorisation recouvrement',
        description: 'Contrats triés par montant d\'impayés décroissant',
        filters: {
          status: 'overdue',
          sortBy: 'arrears_desc',
          ...(filters.min_amount && { min_arrears: filters.min_amount })
        },
        icon: '📊'
      });
    }
  }

  // Payment method suggestions
  if (filters.payment_method) {
    const methodLabel: Record<string, string> = {
      orange_money: 'Orange Money',
      bank_transfer: 'Virement',
      cash: 'Espèces'
    };

    suggestions.push({
      title: `Paiements ${methodLabel[filters.payment_method] || 'par ' + filters.payment_method}`,
      description: `Transactions effectuées via ${methodLabel[filters.payment_method]}`,
      filters: {
        payment_method: filters.payment_method,
        ...(filters.period && { period: filters.period })
      },
      icon: '💳'
    });
  }

  // Time period suggestions
  if (filters.period || filters.year) {
    const periodLabel: Record<string, string> = {
      current_month: 'ce mois',
      current_quarter: 'ce trimestre',
      current_year: 'cette année'
    };

    suggestions.push({
      title: `Rapports ${periodLabel[filters.period] || filters.year}`,
      description: `Données pour la période sélectionnée`,
      filters: {
        ...(filters.period && { period: filters.period }),
        ...(filters.year && { year: filters.year })
      },
      icon: '📅'
    });
  }

  // Region-based suggestion
  if (filters.region) {
    if (roles.includes('AGENT') || roles.includes('PDG')) {
      suggestions.push({
        title: `Contrats - ${filters.region}`,
        description: `Tous les contrats dans la région ${filters.region}`,
        filters: {
          region: filters.region
        },
        icon: '📍'
      });
    }
  }

  // Default suggestions if no specific filters matched
  if (suggestions.length === 0) {
    suggestions.push({
      title: 'Tous les contrats',
      description: 'Afficher la liste complète des contrats',
      filters: {},
      icon: '📋'
    });

    if (roles.includes('COMPTA') || roles.includes('PDG')) {
      suggestions.push({
        title: 'Rapport financier',
        description: 'Vue d\'ensemble des paiements et impayés',
        filters: { resource: 'payments' },
        icon: '💰'
      });
    }
  }

  return suggestions;
}

export default router;
