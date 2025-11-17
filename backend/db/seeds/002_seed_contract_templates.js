/**
 * Seed data for contract templates
 * Initializes contract templates with variables
 */

module.exports = {
  seed: async (pool) => {
    // Check if templates already exist
    const result = await pool.query('SELECT COUNT(*) FROM akig_contract_templates');
    if (parseInt(result.rows[0].count) > 0) {
      console.log('✅ Contract templates already seeded, skipping...');
      return;
    }

    const templates = [
      {
        type: 'location',
        titre: 'Contrat de Location',
        contenu: `CONTRAT DE LOCATION
        
Entre les soussignés:
- Propriétaire: {{nom_proprietaire}}
- Adresse: {{adresse_proprietaire}}
- Locataire: {{nom_locataire}}
- Adresse: {{adresse_locataire}}

Article 1 - Objet du Contrat
Le propriétaire loue au locataire le bien immobilier situé à {{adresse_bien}}.

Article 2 - Durée
La durée du contrat est de {{duree}} mois à compter du {{date_debut}}.

Article 3 - Loyer
Le loyer mensuel est fixé à {{montant_loyer}} GNF, payable le {{jour_paiement}} de chaque mois.

Article 4 - Dépôt de Garantie
Un dépôt de garantie de {{montant_depot}} GNF est demandé.

Fait à {{lieu}}, le {{date_signature}}`,
        version: '1.0',
        actif: true,
      },
      {
        type: 'gerance',
        titre: 'Contrat de Gérance',
        contenu: `CONTRAT DE GÉRANCE
        
Entre les soussignés:
- Propriétaire: {{nom_proprietaire}}
- Gestionnaire: {{nom_gestionnaire}}

Article 1 - Objet
Le propriétaire confie la gestion du bien immobilier à {{adresse_bien}} au gestionnaire.

Article 2 - Responsabilités du Gestionnaire
Le gestionnaire s'engage à:
- Collecter les loyers
- Entretenir le bien
- Gérer les litiges
- Remettre les comptes mensuels

Article 3 - Commission
La commission de gestion est fixée à {{pourcentage_commission}}% du loyer collecté.

Fait à {{lieu}}, le {{date_signature}}`,
        version: '1.0',
        actif: true,
      },
      {
        type: 'audition',
        titre: 'Rapport d\'Audition',
        contenu: `RAPPORT D'AUDITION IMMOBILIÈRE
        
Date: {{date_rapport}}
Propriété: {{adresse_bien}}
Auditeur: {{nom_auditeur}}

1. État Général du Bien
{{etat_general}}

2. Conformité Administrative
{{conformite_admin}}

3. Travaux Recommandés
{{travaux_recommandes}}

4. Évaluation Estimée
Valeur estimée: {{valeur_estimee}} GNF

Observations:
{{observations}}`,
        version: '1.0',
        actif: true,
      },
      {
        type: 'reference',
        titre: 'Attestation de Référence',
        contenu: `ATTESTATION DE RÉFÉRENCE
        
Je soussigné(e) {{nom_proprietaire}}, propriétaire du bien situé à {{adresse_bien}},
atteste par la présente que:

Locataire: {{nom_locataire}}
Période de location: {{date_debut}} à {{date_fin}}
Montant du loyer: {{montant_loyer}} GNF

Le(la) locataire a payé régulièrement son loyer et entretenu le bien conformément aux conditions du contrat.

Comportement: {{comportement}}
Respect des clauses: {{respect_clauses}}

Recommandation: {{recommandation}}

Fait à {{lieu}}, le {{date_signature}}
Signature: ________________________`,
        version: '1.0',
        actif: true,
      },
    ];

    for (const template of templates) {
      await pool.query(
        `INSERT INTO akig_contract_templates (type, titre, contenu, version, actif)
         VALUES ($1, $2, $3, $4, $5)`,
        [template.type, template.titre, template.contenu, template.version, template.actif]
      );
    }

    console.log('✅ Seeded contract templates data');
  },
};
