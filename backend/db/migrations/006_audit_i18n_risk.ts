/**
 * Database Migration 006: Audit Logs, i18n, Risk Assessment
 * New tables and features for compliance, multi-language, risk prediction
 */

export const up = async (sequelize: any, DataTypes: any) => {
  const queryInterface = sequelize.getQueryInterface();

  // 1. AUDIT LOGS TABLE
  await queryInterface.createTable('audit_logs', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
      index: true
    },
    entity_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      index: true
    },
    entity_id: {
      type: DataTypes.STRING(100),
      allowNull: false,
      index: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      index: true
    },
    changes: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    old_values: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    new_values: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    ip_address: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      index: true
    },
    status: {
      type: DataTypes.ENUM('success', 'failure', 'warning'),
      defaultValue: 'success'
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  });

  // Create indexes for common audit queries
  await queryInterface.addIndex('audit_logs', ['action', 'timestamp']);
  await queryInterface.addIndex('audit_logs', ['entity_type', 'entity_id', 'timestamp']);
  await queryInterface.addIndex('audit_logs', ['user_id', 'timestamp']);
  await queryInterface.addIndex('audit_logs', ['timestamp']);

  // Create function to clean old audit logs
  await queryInterface.sequelize.query(`
    CREATE OR REPLACE FUNCTION cleanup_old_audit_logs() RETURNS void AS $$
    BEGIN
      DELETE FROM audit_logs WHERE timestamp < NOW() - INTERVAL '90 days' AND status = 'success';
    END;
    $$ LANGUAGE plpgsql;
  `);

  // 2. TRANSLATIONS TABLE (i18n)
  await queryInterface.createTable('translations', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    key: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    language: {
      type: DataTypes.ENUM('fr', 'en'),
      allowNull: false
    },
    context: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      onUpdate: new Date()
    }
  });

  // Unique constraint: key + language
  await queryInterface.addConstraint('translations', {
    fields: ['key', 'language'],
    type: 'unique',
    name: 'unique_key_language'
  });

  await queryInterface.addIndex('translations', ['language']);
  await queryInterface.addIndex('translations', ['key']);

  // 3. USER PREFERENCES TABLE
  await queryInterface.createTable('user_preferences', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    language: {
      type: DataTypes.ENUM('fr', 'en'),
      defaultValue: 'fr'
    },
    timezone: {
      type: DataTypes.STRING(50),
      defaultValue: 'Europe/Paris'
    },
    notifications_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    email_digest: {
      type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'never'),
      defaultValue: 'daily'
    },
    two_factor_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      onUpdate: new Date()
    }
  });

  // 4. RISK ASSESSMENTS TABLE
  await queryInterface.createTable('risk_assessments', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    locataire_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'locataires',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    risk_score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 0, max: 100 }
    },
    risk_level: {
      type: DataTypes.ENUM('GREEN', 'YELLOW', 'RED', 'CRITICAL'),
      allowNull: false
    },
    factors: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Array of risk factors with impact scores'
    },
    recommendation: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    last_updated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      index: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  });

  await queryInterface.addIndex('risk_assessments', ['risk_score']);
  await queryInterface.addIndex('risk_assessments', ['risk_level']);
  await queryInterface.addIndex('risk_assessments', ['last_updated']);

  // 5. RISK ASSESSMENTS HISTORY (for trend analysis)
  await queryInterface.createTable('risk_assessments_history', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    locataire_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'locataires',
        key: 'id'
      },
      onDelete: 'CASCADE',
      index: true
    },
    risk_score: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    risk_level: {
      type: DataTypes.ENUM('GREEN', 'YELLOW', 'RED', 'CRITICAL'),
      allowNull: false
    },
    date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      index: true
    }
  });

  await queryInterface.addIndex('risk_assessments_history', ['locataire_id', 'date']);

  // 6. BACKUP METADATA TABLE
  await queryInterface.createTable('backup_metadata', {
    id: {
      type: DataTypes.STRING(100),
      primaryKey: true
    },
    filename: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    size_bytes: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('full', 'incremental'),
      defaultValue: 'full'
    },
    status: {
      type: DataTypes.ENUM('success', 'failure'),
      allowNull: false
    },
    location: {
      type: DataTypes.ENUM('local', 's3', 'both'),
      allowNull: false
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    duration_seconds: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      index: true
    }
  });

  // 7. STORED PROCEDURE: Recalculate all risk scores
  await queryInterface.sequelize.query(`
    CREATE OR REPLACE FUNCTION recalculate_risk_scores()
    RETURNS void AS $$
    DECLARE
      l_record RECORD;
    BEGIN
      FOR l_record IN
        SELECT l.id, l.nom
        FROM locataires l
        WHERE l.actif = true
      LOOP
        -- Trigger risk calculation for each tenant
        -- In production, this would be done via application service
        UPDATE risk_assessments
        SET last_updated = NOW()
        WHERE locataire_id = l_record.id;
      END LOOP;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // 8. STORED PROCEDURE: Get tenant risk trend
  await queryInterface.sequelize.query(`
    CREATE OR REPLACE FUNCTION get_risk_trend(p_locataire_id UUID, p_days INT DEFAULT 30)
    RETURNS TABLE (
      date DATE,
      risk_score INTEGER,
      risk_level TEXT,
      trend_direction TEXT
    ) AS $$
    BEGIN
      RETURN QUERY
      SELECT 
        rah.date,
        rah.risk_score,
        rah.risk_level::TEXT,
        CASE 
          WHEN LAG(rah.risk_score) OVER (ORDER BY rah.date) < rah.risk_score THEN 'degrading'
          WHEN LAG(rah.risk_score) OVER (ORDER BY rah.date) > rah.risk_score THEN 'improving'
          ELSE 'stable'
        END as trend_direction
      FROM risk_assessments_history rah
      WHERE rah.locataire_id = p_locataire_id
        AND rah.date >= NOW() - (p_days || ' days')::INTERVAL
      ORDER BY rah.date DESC;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // 9. Add full-text search on audit_logs
  await queryInterface.sequelize.query(`
    ALTER TABLE audit_logs ADD COLUMN search_text TSVECTOR;

    CREATE OR REPLACE FUNCTION update_audit_search_text()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.search_text := to_tsvector('french', 
        COALESCE(NEW.action, '') || ' ' ||
        COALESCE(NEW.entity_type, '') || ' ' ||
        COALESCE(NEW.error_message, ''));
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER audit_search_text_trigger BEFORE INSERT OR UPDATE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION update_audit_search_text();

    CREATE INDEX idx_audit_search_text ON audit_logs USING GIN (search_text);
  `);

  console.log('✅ Migration 006 completed: Audit, i18n, Risk Assessment');
};

export const down = async (sequelize: any) => {
  const queryInterface = sequelize.getQueryInterface();

  // Drop in reverse order
  await queryInterface.dropTable('backup_metadata', { cascade: true });
  await queryInterface.dropTable('risk_assessments_history', { cascade: true });
  await queryInterface.dropTable('risk_assessments', { cascade: true });
  await queryInterface.dropTable('user_preferences', { cascade: true });
  await queryInterface.dropTable('translations', { cascade: true });
  await queryInterface.dropTable('audit_logs', { cascade: true });

  // Drop functions
  await queryInterface.sequelize.query('DROP FUNCTION IF EXISTS cleanup_old_audit_logs();');
  await queryInterface.sequelize.query('DROP FUNCTION IF EXISTS recalculate_risk_scores();');
  await queryInterface.sequelize.query('DROP FUNCTION IF EXISTS get_risk_trend(UUID, INT);');
  await queryInterface.sequelize.query('DROP FUNCTION IF EXISTS update_audit_search_text();');

  console.log('✅ Migration 006 rolled back');
};
