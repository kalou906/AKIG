/**
 * 🏢 Service Immobilier - Gestion des Propriétés
 * Toutes les opérations CRUD et métier pour les propriétés
 */

const Property = require('../models/Property');

class PropertyService {
  constructor(pool) {
    this.pool = pool;
  }

  /**
   * Créer une nouvelle propriété
   */
  async createProperty(data) {
    try {
      const property = new Property(data);
      const validation = property.validate();
      
      if (!validation.isValid) {
        return { success: false, errors: validation.errors };
      }

      const query = `
        INSERT INTO properties (
          reference, title, description, type, address, district, city, region,
          country, coordinates, bedrooms, bathrooms, kitchens, living_rooms,
          total_area, plot_area, floors, year_built, condition,
          sale_price, rental_price, price_per_m2, currency,
          status, available_from, available_to, is_available,
          owner_id, owner_name, owner_phone, owner_email,
          agent_id, agent_name, agent_phone, agent_email,
          main_image, images, virtual_tour, amenities,
          furnished, has_generator, has_water_tank, has_security,
          allow_pets, created_by, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14,
          $15, $16, $17, $18, $19,
          $20, $21, $22, $23,
          $24, $25, $26, $27,
          $28, $29, $30, $31,
          $32, $33, $34, $35,
          $36, $37, $38, $39,
          $40, $41, $42, $43,
          $44, $45, $46
        ) RETURNING *
      `;

      const values = [
        property.reference || `PROP-${Date.now()}`,
        property.title,
        property.description,
        property.type,
        property.location.address,
        property.location.district,
        property.location.city || 'Conakry',
        property.location.region,
        'Guinée',
        JSON.stringify(property.location.coordinates),
        property.characteristics.bedrooms,
        property.characteristics.bathrooms,
        property.characteristics.kitchens,
        property.characteristics.livingRooms,
        property.characteristics.totalArea,
        property.characteristics.plotArea,
        property.characteristics.floors,
        property.characteristics.yearBuilt,
        property.characteristics.condition,
        property.pricing.salePrice,
        property.pricing.rentalPrice,
        property.pricing.pricePerM2,
        'GNF',
        property.status,
        property.availability.availableFrom,
        property.availability.availableTo,
        property.availability.isAvailable,
        property.owner.id,
        property.owner.name,
        property.owner.phone,
        property.owner.email,
        property.agent.id,
        property.agent.name,
        property.agent.phone,
        property.agent.email,
        property.media.mainImage,
        JSON.stringify(property.media.images),
        property.media.virtualTour,
        JSON.stringify(property.amenities),
        property.extra.furnished,
        property.extra.hasGenerator,
        property.extra.hasWaterTank,
        property.extra.hasSecurity,
        property.extra.allowPets,
        data.createdBy || 'system',
        new Date()
      ];

      const result = await this.pool.query(query, values);
      return { success: true, data: result.rows[0] };
    } catch (error) {
      console.error('❌ Erreur création propriété:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtenir une propriété par ID
   */
  async getPropertyById(propertyId) {
    try {
      const query = 'SELECT * FROM properties WHERE id = $1 AND deleted_at IS NULL';
      const result = await this.pool.query(query, [propertyId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Erreur lecture propriété:', error);
      return null;
    }
  }

  /**
   * Lister toutes les propriétés avec filtres
   */
  async listProperties(filters = {}) {
    try {
      let query = 'SELECT * FROM properties WHERE deleted_at IS NULL';
      const values = [];
      let paramCount = 1;

      // Filtres
      if (filters.type) {
        query += ` AND type = $${paramCount}`;
        values.push(filters.type);
        paramCount++;
      }

      if (filters.status) {
        query += ` AND status = $${paramCount}`;
        values.push(filters.status);
        paramCount++;
      }

      if (filters.city) {
        query += ` AND city = $${paramCount}`;
        values.push(filters.city);
        paramCount++;
      }

      if (filters.district) {
        query += ` AND district = $${paramCount}`;
        values.push(filters.district);
        paramCount++;
      }

      if (filters.minPrice) {
        query += ` AND (sale_price >= $${paramCount} OR rental_price >= $${paramCount})`;
        values.push(filters.minPrice);
        values.push(filters.minPrice);
        paramCount += 2;
      }

      if (filters.maxPrice) {
        query += ` AND (sale_price <= $${paramCount} OR rental_price <= $${paramCount})`;
        values.push(filters.maxPrice);
        values.push(filters.maxPrice);
        paramCount += 2;
      }

      if (filters.bedrooms) {
        query += ` AND bedrooms >= $${paramCount}`;
        values.push(filters.bedrooms);
        paramCount++;
      }

      if (filters.agentId) {
        query += ` AND agent_id = $${paramCount}`;
        values.push(filters.agentId);
        paramCount++;
      }

      // Pagination
      const limit = filters.limit || 20;
      const offset = ((filters.page || 1) - 1) * limit;
      query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      values.push(limit, offset);

      const result = await this.pool.query(query, values);
      
      // Obtenir le total
      let countQuery = 'SELECT COUNT(*) FROM properties WHERE deleted_at IS NULL';
      if (filters.type) countQuery += ` AND type = $1`;
      if (filters.status) countQuery += ` AND status = $${filters.type ? 2 : 1}`;
      
      const countResult = await this.pool.query('SELECT COUNT(*) FROM properties WHERE deleted_at IS NULL');
      const total = parseInt(countResult.rows[0].count);

      return {
        success: true,
        data: result.rows,
        pagination: { total, page: filters.page || 1, limit, pages: Math.ceil(total / limit) }
      };
    } catch (error) {
      console.error('❌ Erreur liste propriétés:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Recherche avancée de propriétés
   */
  async searchProperties(searchTerm, filters = {}) {
    try {
      const query = `
        SELECT * FROM properties 
        WHERE deleted_at IS NULL
        AND (
          title ILIKE $1 OR
          description ILIKE $1 OR
          address ILIKE $1 OR
          district ILIKE $1 OR
          city ILIKE $1
        )
        ${filters.type ? 'AND type = $2' : ''}
        ${filters.status ? `AND status = $${filters.type ? 3 : 2}` : ''}
        ORDER BY created_at DESC
        LIMIT 50
      `;

      const values = [`%${searchTerm}%`];
      if (filters.type) values.push(filters.type);
      if (filters.status) values.push(filters.status);

      const result = await this.pool.query(query, values);
      return { success: true, data: result.rows };
    } catch (error) {
      console.error('❌ Erreur recherche propriétés:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mettre à jour une propriété
   */
  async updateProperty(propertyId, updateData) {
    try {
      const current = await this.getPropertyById(propertyId);
      if (!current) return { success: false, error: 'Propriété non trouvée' };

      const query = `
        UPDATE properties SET
          title = COALESCE($1, title),
          description = COALESCE($2, description),
          type = COALESCE($3, type),
          address = COALESCE($4, address),
          bedrooms = COALESCE($5, bedrooms),
          bathrooms = COALESCE($6, bathrooms),
          total_area = COALESCE($7, total_area),
          sale_price = COALESCE($8, sale_price),
          rental_price = COALESCE($9, rental_price),
          status = COALESCE($10, status),
          updated_by = $11,
          updated_at = NOW()
        WHERE id = $12 AND deleted_at IS NULL
        RETURNING *
      `;

      const values = [
        updateData.title,
        updateData.description,
        updateData.type,
        updateData.address,
        updateData.bedrooms,
        updateData.bathrooms,
        updateData.totalArea,
        updateData.salePrice,
        updateData.rentalPrice,
        updateData.status,
        updateData.updatedBy || 'system',
        propertyId
      ];

      const result = await this.pool.query(query, values);
      return { success: true, data: result.rows[0] };
    } catch (error) {
      console.error('❌ Erreur mise à jour propriété:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Supprimer une propriété (soft delete)
   */
  async deleteProperty(propertyId, deletedBy) {
    try {
      const query = `
        UPDATE properties SET
          deleted_at = NOW(),
          updated_by = $1
        WHERE id = $2 AND deleted_at IS NULL
        RETURNING *
      `;

      const result = await this.pool.query(query, [deletedBy || 'system', propertyId]);
      return result.rows[0] ? { success: true } : { success: false, error: 'Propriété non trouvée' };
    } catch (error) {
      console.error('❌ Erreur suppression propriété:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtenir les propriétés d'un agent
   */
  async getAgentProperties(agentId) {
    try {
      const query = `
        SELECT * FROM properties 
        WHERE agent_id = $1 AND deleted_at IS NULL
        ORDER BY created_at DESC
      `;
      const result = await this.pool.query(query, [agentId]);
      return { success: true, data: result.rows };
    } catch (error) {
      console.error('❌ Erreur propriétés agent:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtenir les propriétés disponibles pour la location
   */
  async getAvailableProperties(filters = {}) {
    try {
      const query = `
        SELECT * FROM properties 
        WHERE status = 'available' AND deleted_at IS NULL
        ${filters.type ? 'AND type = $1' : ''}
        ${filters.district ? `AND district = $${filters.type ? 2 : 1}` : ''}
        ORDER BY rental_price ASC
      `;

      const values = [];
      if (filters.type) values.push(filters.type);
      if (filters.district) values.push(filters.district);

      const result = await this.pool.query(query, values);
      return { success: true, data: result.rows };
    } catch (error) {
      console.error('❌ Erreur propriétés disponibles:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtenir statistiques de marché
   */
  async getMarketStats() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_properties,
          COUNT(CASE WHEN status = 'available' THEN 1 END) as available,
          COUNT(CASE WHEN status = 'rented' THEN 1 END) as rented,
          COUNT(CASE WHEN status = 'sold' THEN 1 END) as sold,
          AVG(rental_price) as avg_rental_price,
          MIN(rental_price) as min_rental_price,
          MAX(rental_price) as max_rental_price,
          AVG(sale_price) as avg_sale_price,
          COUNT(DISTINCT district) as districts_covered
        FROM properties 
        WHERE deleted_at IS NULL
      `;

      const result = await this.pool.query(query);
      return { success: true, data: result.rows[0] };
    } catch (error) {
      console.error('❌ Erreur stats marché:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = PropertyService;
