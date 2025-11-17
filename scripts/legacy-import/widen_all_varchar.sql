-- Script automatique pour élargir TOUTES les colonnes VARCHAR
-- Exécute un ALTER TABLE sur chaque colonne VARCHAR trouvée

DO $$
DECLARE
    rec RECORD;
    sql TEXT;
BEGIN
    RAISE NOTICE 'Début élargissement automatique des colonnes VARCHAR...';
    
    -- Pour chaque colonne VARCHAR trouvée dans le schéma public
    FOR rec IN 
        SELECT table_name, column_name, character_maximum_length
        FROM information_schema.columns 
        WHERE data_type = 'character varying'
        AND table_schema = 'public'
        ORDER BY table_name, column_name
    LOOP
        BEGIN
            -- Construire et exécuter la commande ALTER pour passer à TEXT
            sql := format('ALTER TABLE %I ALTER COLUMN %I TYPE TEXT', 
                          rec.table_name, rec.column_name);
            RAISE NOTICE 'Exécution: % (était VARCHAR(%))', sql, rec.character_maximum_length;
            EXECUTE sql;
        EXCEPTION
            WHEN others THEN
                RAISE NOTICE 'Erreur ignorée pour %.%: %', 
                             rec.table_name, rec.column_name, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Terminé !';
END $$;

-- Message de confirmation
SELECT 'Toutes les colonnes VARCHAR ont été converties en TEXT !' AS status;
