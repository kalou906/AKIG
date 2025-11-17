/**
 * Contract Engine Examples
 * Demonstrates usage of the contract generation engine
 */

import {
  generateContract,
  parseTemplate,
  validateVariables,
  compileTemplate,
  ContractEngine,
  getEngine,
} from './contractEngine';

// ============================================
// Example 1: Simple contract generation
// ============================================
export function example1_simple() {
  const template = `
CONTRAT DE LOCATION

Locataire: {{client.nom}}
Adresse: {{client.adresse}}
Loyer: {{contrat.loyer}} GNF
Début: {{contrat.date_debut}}
Fin: {{contrat.date_fin}}
  `;

  const variables = {
    client: {
      nom: 'TENSA STERENIHAST',
      adresse: 'Matam, Conakry',
    },
    contrat: {
      loyer: '7 390 000 GNF',
      date_debut: '01/11/2025',
      date_fin: '31/10/2026',
    },
  };

  return generateContract(template, variables);
}

// ============================================
// Example 2: Parse and validate template
// ============================================
export function example2_parseValidate() {
  const template = `
Nom: {{akig.nom}}
Email: {{akig.email}}
Client: {{client.nom}}
Loyer: {{contrat.loyer}}
  `;

  // Parse template
  const { variables } = parseTemplate(template);
  console.log('Variables found:', variables);
  // Output: ['akig.nom', 'akig.email', 'client.nom', 'contrat.loyer']

  // Validate
  const context = {
    akig: { nom: 'AKIG', email: 'contact@akig.gn' },
    client: { nom: 'John Doe' },
    // Missing: contrat.loyer
  };

  const validation = validateVariables(template, context);
  console.log('Validation:', validation);
  // Output: { valid: false, missing: ['contrat.loyer'], extra: [] }
}

// ============================================
// Example 3: Compiled template (high performance)
// ============================================
export function example3_compiled() {
  const template = `
Locataire: {{nom}}
Téléphone: {{tel}}
Adresse: {{adresse}}
  `;

  // Compile once
  const render = compileTemplate(template);

  // Use many times with different data
  const result1 = render({
    nom: 'John Doe',
    tel: '+224 620 00 00 00',
    adresse: 'Conakry',
  });

  const result2 = render({
    nom: 'Jane Smith',
    tel: '+224 621 11 11 11',
    adresse: 'Kindia',
  });

  return { result1, result2 };
}

// ============================================
// Example 4: Contract Engine for multiple templates
// ============================================
export function example4_engine() {
  const engine = new ContractEngine({
    strict: true,
    cache: true,
    throwOnMissing: false,
  });

  // Register templates
  engine.registerTemplate(
    'location',
    `
CONTRAT DE LOCATION

Propriétaire: {{agency.nom}}
Locataire: {{client.nom}}
Adresse: {{property.address}}
Loyer mensuel: {{contract.monthly_rent}}
Durée: {{contract.duration}} mois
Date début: {{contract.start_date}}
  `
  );

  engine.registerTemplate(
    'gerance',
    `
CONTRAT DE GERANCE

Gestionnaire: {{agency.nom}}
Propriétaire: {{owner.nom}}
Propriété: {{property.address}}
Commission: {{contract.commission}}%
  `
  );

  // Render template
  const context = {
    agency: { nom: 'AKIG' },
    client: { nom: 'TENSA STERENIHAST' },
    property: { address: 'Matam, Conakry' },
    contract: {
      monthly_rent: '7 390 000',
      duration: '12',
      start_date: '01/11/2025',
    },
  };

  const result = engine.render('location', context);
  console.log(result);

  // Validate
  const validation = engine.validate('location', context);
  console.log('Validation:', validation);

  // Get stats
  console.log('Stats:', engine.getStats());
}

// ============================================
// Example 5: Global engine instance
// ============================================
export function example5_globalEngine() {
  const engine = getEngine({
    cache: true,
    strict: false,
  });

  // Register template
  engine.registerTemplate(
    'invoice',
    `
FACTURE

Agence: {{akig.nom}}
RCCM: {{akig.rccm}}
Email: {{akig.email}}

Client: {{client.nom}}
Téléphone: {{client.tel}}

Montant: {{invoice.amount}}
Date: {{invoice.date}}
  `
  );

  // Use it
  const context = {
    akig: {
      nom: 'AKIG',
      rccm: 'GC-KAL/072.037/2017',
      email: 'aikg224@gmail.com',
    },
    client: {
      nom: 'TENSA STERENIHAST',
      tel: '+224 620 00 00 00',
    },
    invoice: {
      amount: '7 390 000 GNF',
      date: '26/10/2025',
    },
  };

  return engine.render('invoice', context);
}

// ============================================
// Example 6: Strict mode with error handling
// ============================================
export function example6_strictMode() {
  const template = 'Client: {{nom}}; Loyer: {{loyer}}';

  try {
    // Missing variables will throw error
    generateContract(
      template,
      { nom: 'John' }, // Missing: loyer
      { strict: true, throwOnMissing: true }
    );
  } catch (error) {
    console.error('Strict mode error:', error);
  }
}

// ============================================
// Example 7: Complex nested variables
// ============================================
export function example7_nested() {
  const template = `
INFORMATIONS AGENCE
Nom: {{agency.name}}
Adresse: {{agency.address.street}}
Ville: {{agency.address.city}}
Téléphone: {{agency.contacts.phone.main}}
  `;

  const context = {
    agency: {
      name: 'AKIG',
      address: {
        street: 'Immeuble DIABY Nassouroulaye',
        city: 'Conakry',
      },
      contacts: {
        phone: {
          main: '+224 620 90 91 93',
          secondary: '+224 623 96 80 23',
        },
      },
    },
  };

  return generateContract(template, context);
}

// ============================================
// Note: For React component usage, see ContractEngineDemo.tsx
// ============================================

export default {
  example1_simple,
  example2_parseValidate,
  example3_compiled,
  example4_engine,
  example5_globalEngine,
  example6_strictMode,
  example7_nested,
};
