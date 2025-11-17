/**
 * MaintenanceService.js - Phase 5: Maintenance & Configuration
 * 8 méthodes pour gérer les tickets de maintenance et les demandes d'intervention
 */

const pool = require('../db');
const logger = require('../utils/logger');

class MaintenanceService {
  /**
   * Créer un nouveau ticket de maintenance
   * @param {Object} ticketData - Données du ticket
   * @returns {Promise<Object>} - Ticket créé
   */
  async createTicket(ticketData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const {
        propriete_id,
        description,
        priorite,
        type_intervention,
        localisation,
        locataire_id,
        date_demande,
        details_probleme,
      } = ticketData;

      // Validation
      if (!propriete_id || !description) {
        throw new Error('Propriété et description requises');
      }

      const result = await client.query(
        `INSERT INTO maintenance_tickets (
          propriete_id, description, priorite, type_intervention,
          localisation, locataire_id, date_demande, details_probleme,
          statut, date_creation, numero_ticket
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10)
        RETURNING *`,
        [
          propriete_id,
          description,
          priorite || 'normal',
          type_intervention || 'reparation',
          localisation || '',
          locataire_id || null,
          date_demande || new Date(),
          details_probleme || '',
          'ouvert',
          `TK-${Date.now()}`,
        ]
      );

      const ticket = result.rows[0];

      // Audit logging
      await client.query(
        `INSERT INTO audit_logs (entite, action, entite_id, details, date_action)
        VALUES ($1, $2, $3, $4, NOW())`,
        ['maintenance_tickets', 'CREATE', ticket.id, JSON.stringify(ticket)]
      );

      await client.query('COMMIT');
      logger.info(`Maintenance ticket created: ${ticket.id} - ${ticket.numero_ticket}`);

      return {
        success: true,
        data: ticket,
        message: `Ticket ${ticket.numero_ticket} créé avec succès`,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Error creating maintenance ticket: ${error.message}`);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Mettre à jour un ticket de maintenance
   * @param {number} ticketId - ID du ticket
   * @param {Object} updates - Données à mettre à jour
   * @returns {Promise<Object>} - Ticket mis à jour
   */
  async updateTicket(ticketId, updates) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const {
        description,
        priorite,
        statut,
        type_intervention,
        localisation,
        details_probleme,
      } = updates;

      const fields = [];
      const values = [];
      let paramIndex = 1;

      if (description !== undefined) {
        fields.push(`description = $${paramIndex++}`);
        values.push(description);
      }
      if (priorite !== undefined) {
        fields.push(`priorite = $${paramIndex++}`);
        values.push(priorite);
      }
      if (statut !== undefined) {
        fields.push(`statut = $${paramIndex++}`);
        values.push(statut);
      }
      if (type_intervention !== undefined) {
        fields.push(`type_intervention = $${paramIndex++}`);
        values.push(type_intervention);
      }
      if (localisation !== undefined) {
        fields.push(`localisation = $${paramIndex++}`);
        values.push(localisation);
      }
      if (details_probleme !== undefined) {
        fields.push(`details_probleme = $${paramIndex++}`);
        values.push(details_probleme);
      }

      if (fields.length === 0) {
        throw new Error('Aucune donnée à mettre à jour');
      }

      values.push(ticketId);

      const result = await client.query(
        `UPDATE maintenance_tickets SET ${fields.join(', ')}, date_modification = NOW()
        WHERE id = $${paramIndex} RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        throw new Error('Ticket non trouvé');
      }

      const ticket = result.rows[0];

      // Audit logging
      await client.query(
        `INSERT INTO audit_logs (entite, action, entite_id, details, date_action)
        VALUES ($1, $2, $3, $4, NOW())`,
        ['maintenance_tickets', 'UPDATE', ticketId, JSON.stringify(updates)]
      );

      await client.query('COMMIT');
      logger.info(`Maintenance ticket updated: ${ticketId}`);

      return {
        success: true,
        data: ticket,
        message: 'Ticket mis à jour avec succès',
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Error updating maintenance ticket: ${error.message}`);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Récupérer les détails d'un ticket
   * @param {number} ticketId - ID du ticket
   * @returns {Promise<Object>} - Détails du ticket avec interventions
   */
  async getTicket(ticketId) {
    try {
      const ticketResult = await pool.query(
        `SELECT * FROM maintenance_tickets WHERE id = $1`,
        [ticketId]
      );

      if (ticketResult.rows.length === 0) {
        throw new Error('Ticket non trouvé');
      }

      const ticket = ticketResult.rows[0];

      // Récupérer les interventions/techniciens assignés
      const interventionsResult = await pool.query(
        `SELECT * FROM maintenance_assignments
         WHERE ticket_id = $1 ORDER BY date_assignment DESC`,
        [ticketId]
      );

      // Récupérer l'historique
      const historyResult = await pool.query(
        `SELECT * FROM maintenance_history
         WHERE ticket_id = $1 ORDER BY date_action DESC`,
        [ticketId]
      );

      return {
        success: true,
        data: {
          ticket,
          assignments: interventionsResult.rows,
          history: historyResult.rows,
        },
      };
    } catch (error) {
      logger.error(`Error getting maintenance ticket: ${error.message}`);
      throw error;
    }
  }

  /**
   * Lister tous les tickets avec filtres et pagination
   * @param {Object} filters - Filtres (propriete_id, statut, priorite, page, limit)
   * @returns {Promise<Array>} - Liste des tickets
   */
  async listTickets(filters = {}) {
    try {
      const {
        propriete_id,
        statut,
        priorite,
        type_intervention,
        page = 1,
        limit = 50,
      } = filters;

      let query = `SELECT id, numero_ticket, description, priorite, statut, 
                          type_intervention, localisation, propriete_id, 
                          date_creation, date_modification
                   FROM maintenance_tickets WHERE 1=1`;
      const values = [];
      let paramIndex = 1;

      if (propriete_id) {
        query += ` AND propriete_id = $${paramIndex++}`;
        values.push(propriete_id);
      }

      if (statut) {
        query += ` AND statut = $${paramIndex++}`;
        values.push(statut);
      }

      if (priorite) {
        query += ` AND priorite = $${paramIndex++}`;
        values.push(priorite);
      }

      if (type_intervention) {
        query += ` AND type_intervention = $${paramIndex++}`;
        values.push(type_intervention);
      }

      // Pagination
      const offset = (page - 1) * limit;
      query += ` ORDER BY date_creation DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      values.push(limit, offset);

      const result = await pool.query(query, values);

      // Récupérer le total
      let countQuery = `SELECT COUNT(*) FROM maintenance_tickets WHERE 1=1`;
      const countValues = [];
      let countParamIndex = 1;

      if (propriete_id) {
        countQuery += ` AND propriete_id = $${countParamIndex++}`;
        countValues.push(propriete_id);
      }

      if (statut) {
        countQuery += ` AND statut = $${countParamIndex++}`;
        countValues.push(statut);
      }

      if (priorite) {
        countQuery += ` AND priorite = $${countParamIndex++}`;
        countValues.push(priorite);
      }

      if (type_intervention) {
        countQuery += ` AND type_intervention = $${countParamIndex++}`;
        countValues.push(type_intervention);
      }

      const countResult = await pool.query(countQuery, countValues);
      const total = parseInt(countResult.rows[0].count);

      return {
        success: true,
        data: result.rows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error(`Error listing maintenance tickets: ${error.message}`);
      throw error;
    }
  }

  /**
   * Assigner un technicien à un ticket
   * @param {number} ticketId - ID du ticket
   * @param {Object} assignmentData - Données d'assignation
   * @returns {Promise<Object>} - Assignation créée
   */
  async assignTechnician(ticketId, assignmentData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { technicien_id, notes, date_intervention_prevue } = assignmentData;

      // Vérifier que le ticket existe
      const ticketCheck = await client.query(
        'SELECT id FROM maintenance_tickets WHERE id = $1',
        [ticketId]
      );

      if (ticketCheck.rows.length === 0) {
        throw new Error('Ticket non trouvé');
      }

      // Créer l'assignation
      const result = await client.query(
        `INSERT INTO maintenance_assignments (
          ticket_id, technicien_id, notes, date_intervention_prevue, date_assignment
        ) VALUES ($1, $2, $3, $4, NOW())
        RETURNING *`,
        [ticketId, technicien_id, notes || '', date_intervention_prevue || null]
      );

      const assignment = result.rows[0];

      // Mettre à jour le statut du ticket à "en_cours"
      await client.query(
        `UPDATE maintenance_tickets SET statut = $1, date_modification = NOW()
         WHERE id = $2`,
        ['en_cours', ticketId]
      );

      // Audit logging
      await client.query(
        `INSERT INTO audit_logs (entite, action, entite_id, details, date_action)
        VALUES ($1, $2, $3, $4, NOW())`,
        ['maintenance_assignments', 'CREATE', assignment.id, JSON.stringify(assignment)]
      );

      await client.query('COMMIT');
      logger.info(`Technician assigned to ticket: ${ticketId}`);

      return {
        success: true,
        data: assignment,
        message: 'Technicien assigné avec succès',
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Error assigning technician: ${error.message}`);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Marquer un ticket comme complété
   * @param {number} ticketId - ID du ticket
   * @param {Object} completionData - Données de complétion
   * @returns {Promise<Object>} - Ticket mis à jour
   */
  async completeTicket(ticketId, completionData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const {
        notes_completion,
        cout_total,
        date_completion,
        photo_before,
        photo_after,
      } = completionData;

      // Mettre à jour le ticket
      const result = await client.query(
        `UPDATE maintenance_tickets SET 
         statut = $1, date_completion = $2, 
         cout_total = $3, date_modification = NOW()
         WHERE id = $4 RETURNING *`,
        [
          'termine',
          date_completion || new Date(),
          cout_total || 0,
          ticketId,
        ]
      );

      if (result.rows.length === 0) {
        throw new Error('Ticket non trouvé');
      }

      const ticket = result.rows[0];

      // Enregistrer dans l'historique
      await client.query(
        `INSERT INTO maintenance_history (
          ticket_id, action, notes, photo_before, photo_after, date_action
        ) VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          ticketId,
          'completion',
          notes_completion || '',
          photo_before || null,
          photo_after || null,
        ]
      );

      // Audit logging
      await client.query(
        `INSERT INTO audit_logs (entite, action, entite_id, details, date_action)
        VALUES ($1, $2, $3, $4, NOW())`,
        [
          'maintenance_tickets',
          'UPDATE',
          ticketId,
          `Ticket complété - Coût: ${cout_total}`,
        ]
      );

      await client.query('COMMIT');
      logger.info(`Maintenance ticket completed: ${ticketId}`);

      return {
        success: true,
        data: ticket,
        message: 'Ticket marqué comme complété',
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Error completing ticket: ${error.message}`);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Récupérer l'historique d'un ticket
   * @param {number} ticketId - ID du ticket
   * @returns {Promise<Array>} - Historique du ticket
   */
  async getTicketHistory(ticketId) {
    try {
      const result = await pool.query(
        `SELECT h.*, t.numero_ticket, t.description
         FROM maintenance_history h
         JOIN maintenance_tickets t ON h.ticket_id = t.id
         WHERE h.ticket_id = $1
         ORDER BY h.date_action DESC`,
        [ticketId]
      );

      return {
        success: true,
        data: result.rows,
      };
    } catch (error) {
      logger.error(`Error getting ticket history: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculer les coûts associés à un ticket
   * @param {number} ticketId - ID du ticket
   * @returns {Promise<Object>} - Détails des coûts
   */
  async calculateTicketCosts(ticketId) {
    try {
      const ticketResult = await pool.query(
        `SELECT id, cout_total, propriete_id FROM maintenance_tickets WHERE id = $1`,
        [ticketId]
      );

      if (ticketResult.rows.length === 0) {
        throw new Error('Ticket non trouvé');
      }

      const ticket = ticketResult.rows[0];

      // Récupérer les assignations/interventions
      const assignmentsResult = await pool.query(
        `SELECT COUNT(*) as nombre_interventions,
                SUM(CASE WHEN cout_intervention IS NOT NULL THEN cout_intervention ELSE 0 END) as cout_interventions
         FROM maintenance_assignments WHERE ticket_id = $1`,
        [ticketId]
      );

      // Récupérer les matériaux/fournitures si applicable
      const materialsResult = await pool.query(
        `SELECT SUM(CASE WHEN cout_material IS NOT NULL THEN cout_material ELSE 0 END) as cout_materiaux
         FROM maintenance_materials WHERE ticket_id = $1`,
        [ticketId]
      );

      const coutInterventions =
        assignmentsResult.rows[0].cout_interventions || 0;
      const coutMateriaux = materialsResult.rows[0].cout_materiaux || 0;
      const totalCosts = coutInterventions + coutMateriaux;

      return {
        success: true,
        data: {
          ticket_id: ticketId,
          cout_interventions: parseFloat(coutInterventions),
          cout_materiaux: parseFloat(coutMateriaux),
          cout_total: parseFloat(totalCosts),
          nombre_interventions: parseInt(assignmentsResult.rows[0].nombre_interventions),
        },
      };
    } catch (error) {
      logger.error(`Error calculating ticket costs: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new MaintenanceService();
