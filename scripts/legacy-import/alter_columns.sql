-- Safely widen columns for long text values prior to re-import

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='management_fees' AND column_name='grc_tel'
  ) THEN
    EXECUTE 'ALTER TABLE management_fees ALTER COLUMN grc_tel TYPE VARCHAR(100)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='management_fees' AND column_name='grc_rib'
  ) THEN
    EXECUTE 'ALTER TABLE management_fees ALTER COLUMN grc_rib TYPE VARCHAR(255)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='management_fees' AND column_name='grc_ag_lib'
  ) THEN
    EXECUTE 'ALTER TABLE management_fees ALTER COLUMN grc_ag_lib TYPE VARCHAR(100)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='management_fees' AND column_name='grc_adr1'
  ) THEN
    EXECUTE 'ALTER TABLE management_fees ALTER COLUMN grc_adr1 TYPE VARCHAR(100)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='management_fees' AND column_name='grc_adr2'
  ) THEN
    EXECUTE 'ALTER TABLE management_fees ALTER COLUMN grc_adr2 TYPE VARCHAR(100)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='management_fees' AND column_name='grc_ville'
  ) THEN
    EXECUTE 'ALTER TABLE management_fees ALTER COLUMN grc_ville TYPE VARCHAR(100)';
  END IF;
END $$ LANGUAGE plpgsql;

-- Widen all VARCHAR columns < 255 on disbursements
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='disbursements'
      AND data_type='character varying'
      AND (character_maximum_length IS NULL OR character_maximum_length < 255)
  LOOP
    EXECUTE format('ALTER TABLE disbursements ALTER COLUMN %I TYPE VARCHAR(255)', r.column_name);
  END LOOP;
END $$ LANGUAGE plpgsql;

-- Widen all VARCHAR columns < 255 on inventory_reports
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='inventory_reports'
      AND data_type='character varying'
      AND (character_maximum_length IS NULL OR character_maximum_length < 255)
  LOOP
    EXECUTE format('ALTER TABLE inventory_reports ALTER COLUMN %I TYPE VARCHAR(255)', r.column_name);
  END LOOP;
END $$ LANGUAGE plpgsql;
