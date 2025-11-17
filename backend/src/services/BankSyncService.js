/**
 * 🏦 Service Synchronisation Bancaire - ImmobilierLoyer
 * Réconciliation automatique des paiements
 * Devise: GNF (Franc Guinéen)
 */

class BankSyncService {
  constructor(pool) {
    this.pool = pool;
  }

  /**
   * 📥 Importer transactions bancaires
   */
  async importBankTransactions(transactions) {
    try {
      const results = [];

      for (const transaction of transactions) {
        const {
          transaction_id,
          date,
          amount_gnf,
          currency,
          description,
          sender_name,
          sender_account,
          reference_number,
          bank_name
        } = transaction;

        // Vérifier si transaction existe déjà
        const existResult = await this.pool.query(`
          SELECT id FROM bank_transactions WHERE transaction_id = $1
        `, [transaction_id]);

        if (existResult.rows.length > 0) {
          continue; // Transaction déjà importée
        }

        // Enregistrer transaction bancaire
        const importResult = await this.pool.query(`
          INSERT INTO bank_transactions (
            transaction_id, import_date, transaction_date, amount_gnf,
            currency, description, sender_name, sender_account,
            reference_number, bank_name, status, created_at
          )
          VALUES ($1, NOW(), $2, $3, $4, $5, $6, $7, $8, $9, 'unmatched', NOW())
          RETURNING id, transaction_id, amount_gnf, status
        `, [transaction_id, date, amount_gnf, currency, description, 
            sender_name, sender_account, reference_number, bank_name]);

        results.push(importResult.rows[0]);
      }

      console.log(`✅ ${results.length} transactions importées`);
      return {
        success: true,
        imported: results.length,
        transactions: results
      };
    } catch (err) {
      console.error('❌ Erreur import transactions:', err.message);
      throw err;
    }
  }

  /**
   * 🔗 Réconciliation automatique
   */
  async autoReconcile() {
    try {
      console.log('🔄 Lancement réconciliation automatique...');

      // 1. Trouver transactions non rapprochées
      const unmatchedResult = await this.pool.query(`
        SELECT id, amount_gnf, description, reference_number, transaction_date
        FROM bank_transactions
        WHERE status = 'unmatched'
        ORDER BY transaction_date DESC
        LIMIT 100
      `);

      const matches = [];

      for (const transaction of unmatchedResult.rows) {
        // 2. Chercher paiement correspondant
        const paymentResult = await this.pool.query(`
          SELECT py.id, py.amount_gnf, rc.reference, rc.id as contract_id
          FROM payments py
          JOIN rental_contracts rc ON py.contract_id = rc.id
          WHERE py.status = 'completed'
            AND py.verification = false
            AND ABS(py.amount_gnf - $1) < 100  -- Tolérance 100 GNF
            AND py.date <= $2 + INTERVAL '5 days'
          LIMIT 1
        `, [transaction.amount_gnf, transaction.transaction_date]);

        if (paymentResult.rows.length > 0) {
          const payment = paymentResult.rows[0];

          // 3. Mettre à jour paiement comme vérifié
          await this.pool.query(`
            UPDATE payments
            SET verification = true, 
                verified_by = 'bank_sync',
                verified_at = NOW(),
                external_ref = $1
            WHERE id = $2
          `, [transaction.id, payment.id]);

          // 4. Mettre à jour transaction comme appariée
          await this.pool.query(`
            UPDATE bank_transactions
            SET status = 'matched', 
                payment_id = $1,
                matched_at = NOW()
            WHERE id = $2
          `, [payment.id, transaction.id]);

          matches.push({
            bankTransaction: transaction.id,
            payment: payment.id,
            contractRef: payment.reference,
            amount: payment.amount_gnf
          });
        }
      }

      return {
        success: true,
        matched: matches.length,
        matches,
        message: `${matches.length} transactions rapprochées automatiquement`
      };
    } catch (err) {
      console.error('❌ Erreur réconciliation:', err.message);
      throw err;
    }
  }

  /**
   * 🔍 Réconciliation manuelle
   */
  async manualReconcile(bankTransactionId, paymentId) {
    try {
      const bankTxResult = await this.pool.query(`
        SELECT * FROM bank_transactions WHERE id = $1
      `, [bankTransactionId]);

      const paymentResult = await this.pool.query(`
        SELECT py.*, rc.reference FROM payments py
        JOIN rental_contracts rc ON py.contract_id = rc.id
        WHERE py.id = $1
      `, [paymentId]);

      if (bankTxResult.rows.length === 0 || paymentResult.rows.length === 0) {
        throw new Error('Transaction ou paiement non trouvé');
      }

      const bankTx = bankTxResult.rows[0];
      const payment = paymentResult.rows[0];

      // Vérifier cohérence des montants (tolérance 1%)
      const tolerance = Math.abs(parseFloat(bankTx.amount_gnf) - parseFloat(payment.amount_gnf));
      const maxTolerance = Math.max(parseFloat(bankTx.amount_gnf) * 0.01, 100);

      if (tolerance > maxTolerance) {
        throw new Error(`Montants incohérents: ${bankTx.amount_gnf} GNF vs ${payment.amount_gnf} GNF`);
      }

      // Mettre à jour les deux enregistrements
      await this.pool.query(`
        UPDATE bank_transactions
        SET status = 'matched', payment_id = $1, matched_at = NOW()
        WHERE id = $2
      `, [paymentId, bankTransactionId]);

      await this.pool.query(`
        UPDATE payments
        SET verification = true, verified_by = 'manual', verified_at = NOW(),
            external_ref = $1
        WHERE id = $2
      `, [bankTransactionId, paymentId]);

      console.log('✅ Rapprochement manuel complété');
      return {
        success: true,
        bankTransaction: bankTx.id,
        payment: payment.id,
        contractRef: payment.reference,
        amount: payment.amount_gnf,
        message: 'Rapprochement effectué avec succès'
      };
    } catch (err) {
      console.error('❌ Erreur rapprochement manuel:', err.message);
      throw err;
    }
  }

  /**
   * ⚠️ Détecter anomalies
   */
  async detectAnomalies() {
    try {
      const anomalies = [];

      // 1. Paiements doublons
      const duplicatesResult = await this.pool.query(`
        SELECT amount_gnf, contract_id, COUNT(*) as count, STRING_AGG(id::text, ',') as ids
        FROM payments
        WHERE date > NOW() - INTERVAL '7 days'
          AND status = 'completed'
        GROUP BY amount_gnf, contract_id
        HAVING COUNT(*) > 1
      `);

      if (duplicatesResult.rows.length > 0) {
        anomalies.push({
          type: 'duplicate_payments',
          count: duplicatesResult.rows.length,
          details: duplicatesResult.rows
        });
      }

      // 2. Paiements sans correspondance bancaire
      const unmatchedResult = await this.pool.query(`
        SELECT COUNT(*) as count
        FROM payments py
        WHERE py.status = 'completed'
          AND py.verification = false
          AND py.date < NOW() - INTERVAL '7 days'
      `);

      if (parseInt(unmatchedResult.rows[0].count) > 0) {
        anomalies.push({
          type: 'unverified_payments_old',
          count: parseInt(unmatchedResult.rows[0].count),
          message: 'Paiements non vérifiés depuis plus de 7 jours'
        });
      }

      // 3. Transactions bancaires sans correspondance
      const orphanBankResult = await this.pool.query(`
        SELECT COUNT(*) as count
        FROM bank_transactions
        WHERE status = 'unmatched'
          AND created_at < NOW() - INTERVAL '5 days'
      `);

      if (parseInt(orphanBankResult.rows[0].count) > 0) {
        anomalies.push({
          type: 'orphan_bank_transactions',
          count: parseInt(orphanBankResult.rows[0].count),
          message: 'Transactions bancaires non rapprochées depuis 5 jours'
        });
      }

      return {
        hasAnomalies: anomalies.length > 0,
        anomalies,
        detectionTime: new Date()
      };
    } catch (err) {
      console.error('❌ Erreur détection anomalies:', err.message);
      throw err;
    }
  }

  /**
   * 📊 Rapport de réconciliation
   */
  async getReconciliationReport(startDate, endDate) {
    try {
      // Statistiques globales
      const statsResult = await this.pool.query(`
        SELECT 
          COUNT(DISTINCT CASE WHEN status = 'matched' THEN id END) as matched_count,
          COUNT(DISTINCT CASE WHEN status = 'unmatched' THEN id END) as unmatched_count,
          SUM(CASE WHEN status = 'matched' THEN amount_gnf ELSE 0 END) as matched_amount,
          SUM(CASE WHEN status = 'unmatched' THEN amount_gnf ELSE 0 END) as unmatched_amount
        FROM bank_transactions
        WHERE created_at BETWEEN $1 AND $2
      `, [startDate, endDate]);

      const stats = statsResult.rows[0];

      // Taux de réconciliation
      const totalTransactions = parseInt(stats.matched_count) + parseInt(stats.unmatched_count);
      const reconciliationRate = totalTransactions > 0 
        ? (parseInt(stats.matched_count) / totalTransactions * 100).toFixed(2)
        : 0;

      // Détail par jour
      const dailyResult = await this.pool.query(`
        SELECT 
          DATE(created_at) as day,
          COUNT(*) as transaction_count,
          COUNT(DISTINCT CASE WHEN status = 'matched' THEN id END) as matched,
          SUM(amount_gnf) as total_amount
        FROM bank_transactions
        WHERE created_at BETWEEN $1 AND $2
        GROUP BY DATE(created_at)
        ORDER BY day DESC
      `, [startDate, endDate]);

      return {
        period: { startDate, endDate },
        summary: {
          totalTransactions,
          matchedCount: parseInt(stats.matched_count),
          unmatchedCount: parseInt(stats.unmatched_count),
          matchedAmount: Math.round(parseFloat(stats.matched_amount) * 100) / 100,
          unmatchedAmount: Math.round(parseFloat(stats.unmatched_amount) * 100) / 100,
          reconciliationRate: `${reconciliationRate}%`
        },
        dailyBreakdown: dailyResult.rows.map(r => ({
          date: r.day,
          transactions: r.transaction_count,
          matched: r.matched,
          totalAmount: Math.round(r.total_amount * 100) / 100
        }))
      };
    } catch (err) {
      console.error('❌ Erreur rapport réconciliation:', err.message);
      throw err;
    }
  }

  /**
   * 🔐 Valider intégrité des données
   */
  async validateIntegrity() {
    try {
      const validationErrors = [];

      // 1. Vérifier cohérence montants
      const amountCheckResult = await this.pool.query(`
        SELECT COUNT(*) as count
        FROM payments
        WHERE amount_gnf <= 0 OR amount_gnf IS NULL
      `);

      if (parseInt(amountCheckResult.rows[0].count) > 0) {
        validationErrors.push({
          level: 'error',
          type: 'invalid_amounts',
          count: parseInt(amountCheckResult.rows[0].count)
        });
      }

      // 2. Vérifier doublons de contrats
      const contractDuplicateResult = await this.pool.query(`
        SELECT COUNT(*) as count
        FROM (
          SELECT reference, COUNT(*) as cnt
          FROM rental_contracts
          GROUP BY reference
          HAVING COUNT(*) > 1
        ) t
      `);

      if (parseInt(contractDuplicateResult.rows[0].count) > 0) {
        validationErrors.push({
          level: 'error',
          type: 'duplicate_contracts',
          count: parseInt(contractDuplicateResult.rows[0].count)
        });
      }

      // 3. Vérifier dates incohérentes
      const dateCheckResult = await this.pool.query(`
        SELECT COUNT(*) as count
        FROM rental_contracts
        WHERE end_date < start_date
      `);

      if (parseInt(dateCheckResult.rows[0].count) > 0) {
        validationErrors.push({
          level: 'warning',
          type: 'invalid_dates',
          count: parseInt(dateCheckResult.rows[0].count)
        });
      }

      return {
        isValid: validationErrors.length === 0,
        validationErrors,
        checkedAt: new Date()
      };
    } catch (err) {
      console.error('❌ Erreur validation intégrité:', err.message);
      throw err;
    }
  }
}

module.exports = BankSyncService;
