import { Umzug, SequelizeStorage } from 'umzug';
import { Sequelize } from 'sequelize';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import os from 'os';

// Vérificateur de checksum pour l'immutabilité des migrations
const MIGRATION_HASHES = new Map<string, string>([
  ['001-create-tenants-solvency.sql', 'a3f5b8c2d9e1f4a6b8c3d5e9f1a2b4c6'],
  ['002-create-penalties.sql', '9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c'],
  ['003-add-billing-jobs.sql', '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d']
]);

class SecureMigrationRunner {
  private umzug: Umzug;
  private auditPath = path.join(__dirname, '../../logs/migrations.log');

  constructor(private sequelize: Sequelize) {
    this.umzug = new Umzug({
      migrations: { glob: '*.sql', path: path.join(__dirname, '*.sql') },
      context: sequelize.getQueryInterface(),
      storage: new SequelizeStorage({ sequelize }),
      logger: console,
    });
  }

  // Vérification des checksums avant toute exécution
  async verifyIntegrity(): Promise<void> {
    const migrationsDir = path.join(__dirname, '*.sql');
    const files = await fs.readdir(migrationsDir);

    for (const file of files) {
      const content = await fs.readFile(path.join(migrationsDir, file), 'utf-8');
      const hash = crypto.createHash('sha256').update(content).digest('hex');
      
      const expectedHash = MIGRATION_HASHES.get(file);
      if (!expectedHash) {
        throw new Error(`Migration inconnue : ${file}`);
      }
      if (hash !== expectedHash) {
        throw new Error(`Migration corrompue/modifiée : ${file}`);
      }
    }
    console.log('✅ Intégrité des migrations vérifiée');
  }

  async up() {
    await this.verifyIntegrity();
    await this.umzug.up();
    await this.logAudit('MIGRATION_UP', { success: true });
  }

  async down() {
    await this.verifyIntegrity();
    await this.umzug.down({ to: 0 });
    await this.logAudit('MIGRATION_DOWN', { success: true });
  }

  private async logAudit(action: string, meta: any) {
    const log = {
      timestamp: new Date().toISOString(),
      action,
      meta,
      hostname: os.hostname()
    };
    await fs.appendFile(this.auditPath, JSON.stringify(log) + '\n');
  }
}

export default SecureMigrationRunner;
