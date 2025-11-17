-- Script d'initialisation AKIG PostgreSQL
-- Crée utilisateur, base de données et permissions
-- À exécuter avec superuser (postgres)

-- 1. Créer utilisateur akig_user s'il n'existe pas
DO $$
BEGIN
    CREATE USER akig_user WITH PASSWORD 'akig_password';
    RAISE NOTICE 'Utilisateur akig_user créé';
EXCEPTION WHEN DUPLICATE_OBJECT THEN
    RAISE NOTICE 'Utilisateur akig_user existe déjà';
END
$$;

-- 2. Créer base de données s'il n'existe pas
DO $$
BEGIN
    CREATE DATABASE akig
        OWNER akig_user
        ENCODING 'UTF8'
        LOCALE 'C'
        TEMPLATE template0;
    RAISE NOTICE 'Base de données akig créée';
EXCEPTION WHEN DUPLICATE_DATABASE THEN
    RAISE NOTICE 'Base de données akig existe déjà';
    ALTER DATABASE akig OWNER TO akig_user;
END
$$;

-- 3. Donner droits de connexion
GRANT CONNECT ON DATABASE akig TO akig_user;

-- 4. Configurer paramètres par défaut pour l'utilisateur
ALTER USER akig_user WITH CREATEDB;

-- 5. Vérifier créations
SELECT 'Utilisateurs:' as info;
SELECT usename FROM pg_user WHERE usename = 'akig_user';

SELECT 'Bases de données:' as info;
SELECT datname FROM pg_database WHERE datname = 'akig';

-- Fin du script
SELECT 'Initialisation AKIG terminée ✅' as status;
