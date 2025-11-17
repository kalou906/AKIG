/**
 * ============================================================
 * reset.ts - Réinitialiser complètement la base de données
 * Usage: npm run db:reset (depuis backend/)
 * ============================================================
 */

import * as fs from "fs";
import * as path from "path";
import { Pool } from "pg";
import * as dotenv from "dotenv";

// Charger .env
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function reset(): Promise<void> {
  const client = await pool.connect();

  try {
    console.log("🔄 [RESET] Démarrage de la réinitialisation...\n");

    // 1️⃣ Supprimer toutes les tables (cascade)
    console.log("🗑️  Suppression de toutes les tables...");
    await client.query(`
      DO $$
      DECLARE
        r RECORD;
      BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
          EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;
      END
      $$;
    `);
    console.log("✅ Tables supprimées\n");

    // 2️⃣ Réexécuter toutes les migrations
    console.log("📋 Exécution des migrations...");
    const migrationsDir = path.resolve(__dirname, "../migrations");
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, "utf8");
      console.log(`  📄 ${file}...`);
      await client.query(sql);
    }
    console.log("✅ Migrations appliquées\n");

    // 3️⃣ Charger les données de seed
    console.log("🌱 Chargement des données de seed...");
    const seedPath = path.resolve(__dirname, "./seed.sql");
    if (fs.existsSync(seedPath)) {
      const seedSql = fs.readFileSync(seedPath, "utf8");
      await client.query(seedSql);
      console.log("✅ Données de seed chargées\n");
    } else {
      console.log("⚠️  Fichier seed.sql non trouvé (optionnel)\n");
    }

    // 4️⃣ Afficher les statistiques finales
    console.log("📊 Statistiques finales:");
    const tables = await client.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    console.log(`  📦 Nombre de tables: ${tables.rows.length}`);

    for (const table of tables.rows) {
      const count = await client.query(
        `SELECT COUNT(*) as count FROM ${table.tablename}`
      );
      console.log(
        `    - ${table.tablename}: ${count.rows[0].count} enregistrements`
      );
    }

    console.log("\n✅ [SUCCESS] Base de données réinitialisée avec succès!");
  } catch (error) {
    console.error("\n❌ [ERROR] Erreur lors de la réinitialisation:");
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Exécuter
reset();
