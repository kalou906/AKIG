/**
 * 🏢 Service SCI et Multi-Propriétaires - ImmobilierLoyer
 * Gère: Sociétés Civiles Immobilières, copropriétaires
 * Devise: GNF (Franc Guinéen)
 */

class SCIService {
  constructor(pool) {
    this.pool = pool;
  }

  /**
   * 🏢 Créer une SCI (Société Civile Immobilière)
   */
  async createSCI(sciData) {
    try {
      const {
        name,
        siret,
        address,
        manager_id,
        members_count,
        fiscal_regime,
        description
      } = sciData;

      // Validation
      if (!name || !manager_id) {
        throw new Error('Nom SCI et gestionnaire requis');
      }

      const result = await this.pool.query(`
        INSERT INTO sci_companies (
          name, siret, address, manager_id, members_count,
          fiscal_regime, description, created_at, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), 'active')
        RETURNING id, name, siret, created_at
      `, [name, siret, address, manager_id, members_count, fiscal_regime, description]);

      console.log('✅ SCI créée:', result.rows[0]);
      return result.rows[0];
    } catch (err) {
      console.error('❌ Erreur création SCI:', err.message);
      throw err;
    }
  }

  /**
   * 👥 Ajouter membre à SCI
   */
  async addMemberToSCI(sciId, memberData) {
    try {
      const {
        member_id,
        share_percentage,
        share_amount_gnf,
        role,
        entry_date
      } = memberData;

      // Vérifier que les parts ne dépassent pas 100%
      const currentSharesResult = await this.pool.query(`
        SELECT SUM(share_percentage) as total_shares
        FROM sci_members
        WHERE sci_id = $1
      `, [sciId]);

      const currentShares = parseFloat(currentSharesResult.rows[0]?.total_shares || 0);

      if (currentShares + share_percentage > 100) {
        throw new Error(`Partage total dépasserait 100% (actuellement: ${currentShares}%)`);
      }

      const result = await this.pool.query(`
        INSERT INTO sci_members (
          sci_id, member_id, share_percentage, share_amount_gnf,
          role, entry_date, status, added_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW())
        RETURNING id, share_percentage, share_amount_gnf
      `, [sciId, member_id, share_percentage, share_amount_gnf, role, entry_date]);

      console.log('✅ Membre ajouté à SCI:', result.rows[0]);
      return result.rows[0];
    } catch (err) {
      console.error('❌ Erreur ajout membre SCI:', err.message);
      throw err;
    }
  }

  /**
   * 📊 Obtenir détails SCI avec membres
   */
  async getSCIDetails(sciId) {
    try {
      const sciResult = await this.pool.query(`
        SELECT * FROM sci_companies WHERE id = $1
      `, [sciId]);

      if (sciResult.rows.length === 0) {
        throw new Error('SCI non trouvée');
      }

      const membersResult = await this.pool.query(`
        SELECT 
          sm.id, sm.member_id, c.first_name, c.last_name, c.email,
          sm.share_percentage, sm.share_amount_gnf, sm.role,
          sm.entry_date, sm.status
        FROM sci_members sm
        JOIN clients c ON sm.member_id = c.id
        WHERE sm.sci_id = $1
        ORDER BY sm.share_percentage DESC
      `, [sciId]);

      const propertiesResult = await this.pool.query(`
        SELECT p.* FROM properties p
        WHERE p.owner_sci_id = $1
      `, [sciId]);

      const totalShares = membersResult.rows.reduce((sum, m) => sum + m.share_percentage, 0);
      const totalCapital = membersResult.rows.reduce((sum, m) => sum + parseFloat(m.share_amount_gnf), 0);

      return {
        sci: sciResult.rows[0],
        members: membersResult.rows,
        properties: propertiesResult.rows,
        summary: {
          memberCount: membersResult.rows.length,
          totalShares,
          totalCapital: Math.round(totalCapital * 100) / 100,
          propertyCount: propertiesResult.rows.length
        }
      };
    } catch (err) {
      console.error('❌ Erreur lecture SCI:', err.message);
      throw err;
    }
  }

  /**
   * 📋 Lister toutes les SCI
   */
  async listSCIs(filter = {}) {
    try {
      let query = `
        SELECT sc.*, COUNT(DISTINCT sm.id) as member_count,
               COUNT(DISTINCT p.id) as property_count
        FROM sci_companies sc
        LEFT JOIN sci_members sm ON sc.id = sm.sci_id AND sm.status = 'active'
        LEFT JOIN properties p ON sc.id = p.owner_sci_id AND p.status != 'deleted'
        WHERE 1=1
      `;

      const params = [];

      if (filter.status) {
        params.push(filter.status);
        query += ` AND sc.status = $${params.length}`;
      }

      if (filter.manager_id) {
        params.push(filter.manager_id);
        query += ` AND sc.manager_id = $${params.length}`;
      }

      query += ` GROUP BY sc.id ORDER BY sc.created_at DESC`;

      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (err) {
      console.error('❌ Erreur liste SCI:', err.message);
      throw err;
    }
  }

  /**
   * 💰 Distribuer revenus SCI aux membres
   */
  async distributeRevenue(sciId, month, year) {
    try {
      // 1. Récupérer revenus totaux SCI pour la période
      const revenueResult = await this.pool.query(`
        SELECT 
          SUM(py.amount_gnf) as total_collected,
          COUNT(DISTINCT py.contract_id) as payment_count
        FROM payments py
        JOIN rental_contracts rc ON py.contract_id = rc.id
        JOIN properties p ON rc.property_id = p.id
        WHERE p.owner_sci_id = $1
          AND EXTRACT(YEAR FROM py.date) = $2
          AND EXTRACT(MONTH FROM py.date) = $3
      `, [sciId, year, month]);

      const revenue = revenueResult.rows[0];
      const totalRevenue = parseFloat(revenue.total_collected) || 0;

      // 2. Récupérer dépenses SCI
      const expensesResult = await this.pool.query(`
        SELECT SUM(amount_gnf) as total_expenses
        FROM sci_expenses
        WHERE sci_id = $1
          AND EXTRACT(YEAR FROM expense_date) = $2
          AND EXTRACT(MONTH FROM expense_date) = $3
      `, [sciId, year, month]);

      const totalExpenses = parseFloat(expensesResult.rows[0]?.total_expenses || 0);
      const netRevenue = totalRevenue - totalExpenses;

      // 3. Récupérer membres et calculer distributions
      const membersResult = await this.pool.query(`
        SELECT id, member_id, share_percentage
        FROM sci_members
        WHERE sci_id = $1 AND status = 'active'
      `, [sciId]);

      const distributions = [];

      for (const member of membersResult.rows) {
        const memberShare = (netRevenue * member.share_percentage) / 100;

        const distributionResult = await this.pool.query(`
          INSERT INTO sci_distributions (
            sci_id, member_id, month, year, gross_revenue, expenses,
            net_revenue, share_percentage, member_amount_gnf, status, created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', NOW())
          RETURNING id, member_amount_gnf, status
        `, [sciId, member.member_id, month, year, totalRevenue, totalExpenses, 
            netRevenue, member.share_percentage, memberShare]);

        distributions.push({
          memberId: member.member_id,
          share: member.share_percentage,
          amount: Math.round(memberShare * 100) / 100,
          status: distributionResult.rows[0].status
        });
      }

      return {
        period: { month, year },
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        netRevenue: Math.round(netRevenue * 100) / 100,
        distributions,
        message: `Distribution créée pour ${distributions.length} membres`
      };
    } catch (err) {
      console.error('❌ Erreur distribution SCI:', err.message);
      throw err;
    }
  }

  /**
   * 🏠 Assigner propriété à SCI
   */
  async assignPropertyToSCI(propertyId, sciId) {
    try {
      const result = await this.pool.query(`
        UPDATE properties
        SET owner_sci_id = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, reference, owner_sci_id
      `, [sciId, propertyId]);

      if (result.rows.length === 0) {
        throw new Error('Propriété non trouvée');
      }

      console.log('✅ Propriété assignée à SCI:', result.rows[0]);
      return result.rows[0];
    } catch (err) {
      console.error('❌ Erreur assignation propriété:', err.message);
      throw err;
    }
  }

  /**
   * 📊 Rapport financier SCI
   */
  async getSCIFinancialReport(sciId, year) {
    try {
      // Revenus
      const incomeResult = await this.pool.query(`
        SELECT 
          COUNT(DISTINCT py.contract_id) as payment_count,
          SUM(py.amount_gnf) as total_collected,
          COUNT(DISTINCT p.id) as property_count
        FROM payments py
        JOIN rental_contracts rc ON py.contract_id = rc.id
        JOIN properties p ON rc.property_id = p.id
        WHERE p.owner_sci_id = $1
          AND EXTRACT(YEAR FROM py.date) = $2
      `, [sciId, year]);

      // Dépenses
      const expensesResult = await this.pool.query(`
        SELECT 
          type,
          SUM(amount_gnf) as total
        FROM sci_expenses
        WHERE sci_id = $1 AND EXTRACT(YEAR FROM expense_date) = $2
        GROUP BY type
      `, [sciId, year]);

      // Distributions aux membres
      const distributionsResult = await this.pool.query(`
        SELECT 
          member_id, SUM(member_amount_gnf) as total_distributed
        FROM sci_distributions
        WHERE sci_id = $1 AND year = $2 AND status = 'completed'
        GROUP BY member_id
      `, [sciId, year]);

      const income = incomeResult.rows[0];
      const totalRevenue = parseFloat(income.total_collected) || 0;
      const totalExpenses = expensesResult.rows.reduce((sum, row) => sum + parseFloat(row.total), 0);
      const netRevenue = totalRevenue - totalExpenses;

      return {
        sciId,
        year,
        revenue: {
          paymentCount: income.payment_count,
          totalCollected: Math.round(totalRevenue * 100) / 100,
          propertyCount: income.property_count
        },
        expenses: expensesResult.rows.map(e => ({
          type: e.type,
          amount: Math.round(e.total * 100) / 100
        })),
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        netRevenue: Math.round(netRevenue * 100) / 100,
        memberDistributions: distributionsResult.rows
      };
    } catch (err) {
      console.error('❌ Erreur rapport SCI:', err.message);
      throw err;
    }
  }

  /**
   * 📜 Générer résolution d'assemblée
   */
  async generateAssemblyResolution(sciId, month, year) {
    try {
      const sciDetails = await this.getSCIDetails(sciId);
      const financialReport = await this.getSCIFinancialReport(sciId, year);

      return {
        sciName: sciDetails.sci.name,
        date: new Date(),
        period: { month, year },
        members: sciDetails.members,
        financialSummary: {
          revenue: financialReport.revenue.totalCollected,
          expenses: financialReport.totalExpenses,
          netRevenue: financialReport.netRevenue,
          membersCount: sciDetails.members.length
        },
        resolutionText: `
          RÉSOLUTION DE L'ASSEMBLÉE DE ${sciDetails.sci.name}
          
          Approuvation des comptes et distribution aux membres pour ${month}/${year}
          
          Revenus collectés: ${financialReport.revenue.totalCollected} GNF
          Dépenses: ${financialReport.totalExpenses} GNF
          Revenu net: ${financialReport.netRevenue} GNF
          
          Distribution aux membres selon leurs parts respectives:
          ${sciDetails.members.map(m => 
            `- ${m.first_name} ${m.last_name}: ${m.share_percentage}%`
          ).join('\n')}
        `
      };
    } catch (err) {
      console.error('❌ Erreur génération résolution:', err.message);
      throw err;
    }
  }
}

module.exports = SCIService;
