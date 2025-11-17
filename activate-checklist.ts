#!/usr/bin/env node

/**
 * Checklist d'activation du système de préavis - Version interactive
 * Exécuter: npx ts-node activate-checklist.ts
 */

import * as fs from 'fs';
import * as readline from 'readline';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

interface ChecklistItem {
  id: string;
  phase: number;
  title: string;
  description: string;
  completed: boolean;
  critical: boolean;
}

const checklist: ChecklistItem[] = [
  // Phase 1
  {
    id: 'db_created',
    phase: 1,
    title: 'PostgreSQL DB créée',
    description: 'Vérifier: psql -l | grep akig',
    completed: false,
    critical: true,
  },
  {
    id: 'schema_applied',
    phase: 1,
    title: 'Schéma SQL appliqué',
    description: 'Vérifier: npm run migrate',
    completed: false,
    critical: true,
  },
  {
    id: 'test_data_loaded',
    phase: 1,
    title: 'Données de test chargées',
    description: 'Vérifier: SELECT COUNT(*) FROM contracts;',
    completed: false,
    critical: false,
  },
  {
    id: 'env_complete',
    phase: 1,
    title: 'Variables d\'environnement',
    description: 'Vérifier: .env contient DATABASE_URL, JWT_SECRET, API_KEYS',
    completed: false,
    critical: true,
  },

  // Phase 2
  {
    id: 'twilio_setup',
    phase: 2,
    title: 'Twilio SMS configuré',
    description: 'Vérifier: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER',
    completed: false,
    critical: true,
  },
  {
    id: 'whatsapp_setup',
    phase: 2,
    title: 'Meta WhatsApp configuré',
    description: 'Vérifier: WHATSAPP_BUSINESS_ACCOUNT_ID, WHATSAPP_ACCESS_TOKEN',
    completed: false,
    critical: true,
  },
  {
    id: 'email_setup',
    phase: 2,
    title: 'SendGrid Email configuré',
    description: 'Vérifier: SPF, DKIM, DMARC DNS records',
    completed: false,
    critical: true,
  },
  {
    id: 'sentry_setup',
    phase: 2,
    title: 'Sentry intégré',
    description: 'Vérifier: SENTRY_DSN, alertes configurées',
    completed: false,
    critical: false,
  },

  // Phase 3
  {
    id: 'test_contracts',
    phase: 3,
    title: 'Contrats de test créés',
    description: 'Créer: 5+ contrats de test avec différents types',
    completed: false,
    critical: true,
  },
  {
    id: 'legal_params',
    phase: 3,
    title: 'Paramètres légaux configurés',
    description: 'Par juridiction: durée préavis, jours ouvrables, proration',
    completed: false,
    critical: true,
  },
  {
    id: 'message_templates',
    phase: 3,
    title: 'Templates de messages',
    description: 'FR + EN + locales, SMS/Email/WhatsApp/Letter',
    completed: false,
    critical: true,
  },

  // Phase 4 - Tests
  {
    id: 'test_create_notice',
    phase: 4,
    title: 'Test: Créer préavis',
    description: 'Tester 3 scénarios: autorisé, refusé, dates correctes',
    completed: false,
    critical: true,
  },
  {
    id: 'test_send_sms',
    phase: 4,
    title: 'Test: Envoyer SMS',
    description: 'Envoyer SMS à 3 numéros réels, vérifier délivrance',
    completed: false,
    critical: true,
  },
  {
    id: 'test_send_email',
    phase: 4,
    title: 'Test: Envoyer Email',
    description: 'Envoyer Email à 3 addresses réelles, vérifier PDF',
    completed: false,
    critical: true,
  },

  // Phase 5 - Navigateurs
  {
    id: 'test_chrome',
    phase: 5,
    title: 'Test: Chrome',
    description: 'Tous formulaires, responsive, charts, exports',
    completed: false,
    critical: true,
  },
  {
    id: 'test_firefox',
    phase: 5,
    title: 'Test: Firefox',
    description: 'UI, formulaires, performance',
    completed: false,
    critical: true,
  },
  {
    id: 'test_mobile',
    phase: 5,
    title: 'Test: Mobile',
    description: 'iPhone et Android, touches, performance',
    completed: false,
    critical: true,
  },

  // Phase 6 - Performance
  {
    id: 'perf_dashboard',
    phase: 6,
    title: 'Performance: Dashboard',
    description: 'Charge en <300ms, refresh alertes <100ms',
    completed: false,
    critical: true,
  },

  // Phase 7 - Sécurité
  {
    id: 'sec_https',
    phase: 7,
    title: 'Sécurité: HTTPS',
    description: 'Certificate valide, SSL Rating A+',
    completed: false,
    critical: true,
  },
  {
    id: 'sec_gdpr',
    phase: 7,
    title: 'Conformité: RGPD',
    description: 'Consentements, droit à l\'oubli, export données',
    completed: false,
    critical: true,
  },

  // Phase 8 - Documentation
  {
    id: 'doc_readme',
    phase: 8,
    title: 'Documentation: README',
    description: 'Architecture, setup, deployment',
    completed: false,
    critical: true,
  },
  {
    id: 'training',
    phase: 8,
    title: 'Formation: Team',
    description: '2 sessions: 1 managers, 1 agents',
    completed: false,
    critical: true,
  },

  // Phase 9 - Monitoring
  {
    id: 'monitoring_sentry',
    phase: 9,
    title: 'Monitoring: Sentry',
    description: 'Alertes P1 errors, erreurs par navigateur',
    completed: false,
    critical: true,
  },
  {
    id: 'monitoring_backups',
    phase: 9,
    title: 'Monitoring: Backups',
    description: 'Quotidiens, testés, récupération rapide',
    completed: false,
    critical: true,
  },

  // Phase 10 - Lancement
  {
    id: 'launch_canary',
    phase: 10,
    title: 'Lancement: Canary 10%',
    description: 'Jour 1, monitoring étroit, rollback possible',
    completed: false,
    critical: true,
  },
];

class ChecklistManager {
  private rl: readline.Interface;

  constructor(private checklist: ChecklistItem[]) {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  displayHeader(): void {
    console.log(`
${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}
${colors.cyan}║  CHECKLIST D'ACTIVATION - SYSTÈME DE PRÉAVIS SOPHISTIQUÉ    ║${colors.reset}
${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}
    `);
  }

  displayPhaseStatus(): void {
    const phases = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const phaseNames = [
      'Configuration',
      'Services externes',
      'Contrats & Règles',
      'Tests fonctionnels',
      'Multi-navigateurs',
      'Performance',
      'Sécurité',
      'Documentation',
      'Monitoring',
      'Lancement',
    ];

    phases.forEach((phase) => {
      const items = this.checklist.filter((c) => c.phase === phase);
      const completed = items.filter((c) => c.completed).length;
      const percentage = Math.round((completed / items.length) * 100);

      const bar = this.getProgressBar(percentage, 20);
      const status =
        percentage === 100
          ? colors.green + '✓' + colors.reset
          : percentage >= 50
            ? colors.yellow + '○' + colors.reset
            : colors.red + '✗' + colors.reset;

      console.log(
        `${status} Phase ${phase}: ${phaseNames[phase - 1].padEnd(20)} [${bar}] ${percentage}%`
      );
    });
  }

  getProgressBar(percentage: number, width: number): string {
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);

    return percentage === 100
      ? colors.green + bar + colors.reset
      : percentage >= 50
        ? colors.yellow + bar + colors.reset
        : colors.red + bar + colors.reset;
  }

  displayUncompleted(): void {
    const uncompleted = this.checklist.filter((c) => !c.completed);
    const critical = uncompleted.filter((c) => c.critical);

    console.log(`\n${colors.yellow}Tâches restantes:${colors.reset}`);
    console.log(`  Total: ${uncompleted.length}`);
    console.log(`  Critiques: ${colors.red}${critical.length}${colors.reset}`);

    critical.slice(0, 5).forEach((item) => {
      console.log(`    ${colors.red}[P${item.phase}]${colors.reset} ${item.title}`);
    });

    if (critical.length > 5) {
      console.log(`    ... et ${critical.length - 5} autres`);
    }
  }

  displayFinalStatus(): void {
    const allCompleted = this.checklist.every((c) => c.completed);
    const criticalCompleted = this.checklist.filter((c) => c.critical).every((c) => c.completed);

    console.log(`\n${colors.cyan}════════════════════════════════════════════════════════════${colors.reset}`);

    if (allCompleted) {
      console.log(
        `${colors.green}✓ TOUTES LES TÂCHES COMPLÉTÉES - SYSTÈME PRÊT POUR PRODUCTION${colors.reset}`
      );
    } else if (criticalCompleted) {
      console.log(
        `${colors.yellow}⚠ TÂCHES CRITIQUES COMPLÉTÉES - TÂCHES OPTIONNELLES RESTANTES${colors.reset}`
      );
    } else {
      const uncompleted = this.checklist.filter((c) => !c.completed);
      console.log(
        `${colors.red}✗ ${uncompleted.length} tâches restantes - NE PAS LANCER EN PRODUCTION${colors.reset}`
      );
    }

    console.log(`${colors.cyan}════════════════════════════════════════════════════════════${colors.reset}`);
  }

  show(): void {
    this.displayHeader();
    this.displayPhaseStatus();
    this.displayUncompleted();
    this.displayFinalStatus();

    console.log(`\nCommandes: [v]oir détails, [c]ocher tâche, [e]xporter, [q]uitter`);
    this.prompt();
  }

  private prompt(): void {
    this.rl.question('> ', (input: string) => {
      switch (input.toLowerCase()) {
        case 'v':
          this.viewDetails();
          break;
        case 'c':
          this.checkTask();
          break;
        case 'e':
          this.exportStatus();
          break;
        case 'q':
          console.log('Au revoir!');
          this.rl.close();
          process.exit(0);
          break;
        default:
          console.log('Commande non reconnue');
      }

      setTimeout(() => this.show(), 500);
    });
  }

  private viewDetails(): void {
    const uncompleted = this.checklist.filter((c) => !c.completed);
    uncompleted.forEach((item, i) => {
      console.log(`${i + 1}. [Phase ${item.phase}] ${item.title}`);
      console.log(`   ${item.description}`);
    });
  }

  private checkTask(): void {
    this.rl.question('Numéro de tâche à cocher: ', (input: string) => {
      const index = parseInt(input) - 1;
      const uncompleted = this.checklist.filter((c) => !c.completed);
      if (uncompleted[index]) {
        uncompleted[index].completed = true;
        console.log(`✓ ${uncompleted[index].title} complété`);
      }
    });
  }

  private exportStatus(): void {
    const report: any = {
      timestamp: new Date(),
      completionPercentage: Math.round(
        (this.checklist.filter((c) => c.completed).length / this.checklist.length) * 100
      ),
      phases: {},
    };

    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach((phase) => {
      const items = this.checklist.filter((c) => c.phase === phase);
      report.phases[phase] = {
        total: items.length,
        completed: items.filter((c) => c.completed).length,
        items: items.map((c) => ({ title: c.title, completed: c.completed, critical: c.critical })),
      };
    });

    fs.writeFileSync(
      `checklist-status-${new Date().toISOString().split('T')[0]}.json`,
      JSON.stringify(report, null, 2)
    );
    console.log('✓ Exporté vers checklist-status-*.json');
  }
}

// Lancer
const manager = new ChecklistManager(checklist);
manager.show();
