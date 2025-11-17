import { Sequelize } from 'sequelize';
import SecureMigrationRunner from '../src/migrations/runner';

async function runMigrations() {
  const sequelize = new Sequelize(process.env.DATABASE_URL!, {
    dialect: 'postgres',
    logging: false,
    pool: { min: 0, max: 5 }
  });

  const runner = new SecureMigrationRunner(sequelize);
  const command = process.argv[2];

  if (command === 'up') {
    await runner.up();
    process.exit(0);
  } else if (command === 'down') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Migration down interdite en production');
    }
    await runner.down();
    process.exit(0);
  } else {
    throw new Error('Commande invalide : up | down');
  }
}

runMigrations().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
