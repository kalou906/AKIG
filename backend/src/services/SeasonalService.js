/**
 * 🏖️ Service Locations Saisonnières - ImmobilierLoyer
 * Gère: Airbnb, Booking, réservations saisonnières, acomptes/soldes
 * Devise: GNF (Franc Guinéen) + EUR/USD
 */

class SeasonalService {
  constructor(pool) {
    this.pool = pool;
  }

  /**
   * ⚙️ Configurer propriété en location saisonnière
   */
  async configureSeasonalProperty(propertyId, config) {
    try {
      const {
        base_price_gnf,
        currency,
        min_stay_days,
        max_stay_days,
        deposit_percentage,
        cleaning_fee_gnf,
        platform, // airbnb, booking, custom
        platform_url
      } = config;

      const result = await this.pool.query(`
        INSERT INTO seasonal_configs (
          property_id, base_price_gnf, currency, min_stay_days, max_stay_days,
          deposit_percentage, cleaning_fee_gnf, platform, platform_url,
          status, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', NOW())
        RETURNING id, property_id, base_price_gnf, platform
      `, [propertyId, base_price_gnf, currency, min_stay_days, max_stay_days,
          deposit_percentage, cleaning_fee_gnf, platform, platform_url]);

      console.log('✅ Propriété configurée saisonnière:', result.rows[0]);
      return result.rows[0];
    } catch (err) {
      console.error('❌ Erreur config saisonnière:', err.message);
      throw err;
    }
  }

  /**
   * 📅 Créer réservation
   */
  async createReservation(reservationData) {
    try {
      const {
        property_id,
        guest_id,
        guest_name,
        guest_email,
        guest_phone,
        check_in_date,
        check_out_date,
        guests_count,
        nightly_rate_gnf,
        currency,
        breakfast_included
      } = reservationData;

      // Calculer durée et prix
      const checkIn = new Date(check_in_date);
      const checkOut = new Date(check_out_date);
      const nights = Math.floor((checkOut - checkIn) / (1000 * 60 * 60 * 24));

      if (nights <= 0) {
        throw new Error('Dates invalides (check-out doit être après check-in)');
      }

      // Récupérer config saisonnière
      const configResult = await this.pool.query(`
        SELECT * FROM seasonal_configs WHERE property_id = $1 AND status = 'active'
      `, [property_id]);

      if (configResult.rows.length === 0) {
        throw new Error('Propriété non configurée pour location saisonnière');
      }

      const config = configResult.rows[0];

      // Vérifier disponibilité
      const conflictResult = await this.pool.query(`
        SELECT COUNT(*) as count FROM seasonal_reservations
        WHERE property_id = $1
          AND status IN ('confirmed', 'checked_in')
          AND (
            (check_in_date, check_out_date) OVERLAPS ($2::date, $3::date)
          )
      `, [property_id, check_in_date, check_out_date]);

      if (parseInt(conflictResult.rows[0].count) > 0) {
        throw new Error('Propriété non disponible pour ces dates');
      }

      // Calculer tarif avec variations saisonnières
      let totalPrice = nightly_rate_gnf * nights;
      const cleaningFee = config.cleaning_fee_gnf;
      const depositAmount = Math.round((totalPrice + cleaningFee) * (config.deposit_percentage / 100));

      const reservationResult = await this.pool.query(`
        INSERT INTO seasonal_reservations (
          property_id, guest_id, guest_name, guest_email, guest_phone,
          check_in_date, check_out_date, nights, guests_count,
          nightly_rate_gnf, total_price_gnf, cleaning_fee_gnf,
          deposit_amount_gnf, breakfast_included,
          status, reservation_date, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'pending', NOW(), NOW())
        RETURNING id, reference, total_price_gnf, deposit_amount_gnf, status
      `, [property_id, guest_id, guest_name, guest_email, guest_phone,
          check_in_date, check_out_date, nights, guests_count,
          nightly_rate_gnf, totalPrice, cleaningFee,
          depositAmount, breakfast_included]);

      const reservation = reservationResult.rows[0];

      console.log('✅ Réservation créée:', reservation);
      return {
        reservationId: reservation.id,
        reference: reservation.reference,
        nights,
        nightly_rate: nightly_rate_gnf,
        cleaningFee,
        subtotal: Math.round(totalPrice * 100) / 100,
        deposit: Math.round(depositAmount * 100) / 100,
        total: Math.round((totalPrice + cleaningFee) * 100) / 100,
        status: reservation.status
      };
    } catch (err) {
      console.error('❌ Erreur création réservation:', err.message);
      throw err;
    }
  }

  /**
   * 💰 Enregistrer acompte de réservation
   */
  async recordDepositPayment(reservationId, paymentData) {
    try {
      const {
        amount_gnf,
        payment_method,
        payment_date,
        platform // airbnb, booking, stripe, etc
      } = paymentData;

      const result = await this.pool.query(`
        SELECT total_price_gnf, deposit_amount_gnf, cleaning_fee_gnf
        FROM seasonal_reservations
        WHERE id = $1
      `, [reservationId]);

      if (result.rows.length === 0) {
        throw new Error('Réservation non trouvée');
      }

      const reservation = result.rows[0];
      const depositRequired = parseFloat(reservation.deposit_amount_gnf);

      if (amount_gnf < depositRequired) {
        throw new Error(`Acompte insuffisant. Requis: ${depositRequired} GNF, reçu: ${amount_gnf} GNF`);
      }

      const depositResult = await this.pool.query(`
        INSERT INTO seasonal_payments (
          reservation_id, payment_type, amount_gnf, payment_method,
          platform, payment_date, status, created_at
        )
        VALUES ($1, 'deposit', $2, $3, $4, $5, 'completed', NOW())
        RETURNING id, amount_gnf, status
      `, [reservationId, amount_gnf, payment_method, platform, payment_date]);

      // Mettre à jour statut réservation
      await this.pool.query(`
        UPDATE seasonal_reservations
        SET status = 'confirmed', updated_at = NOW()
        WHERE id = $1
      `, [reservationId]);

      console.log('✅ Acompte enregistré:', depositResult.rows[0]);
      return {
        paymentId: depositResult.rows[0].id,
        amount: depositResult.rows[0].amount_gnf,
        status: depositResult.rows[0].status,
        reservationStatus: 'confirmed'
      };
    } catch (err) {
      console.error('❌ Erreur enregistrement acompte:', err.message);
      throw err;
    }
  }

  /**
   * 💵 Enregistrer solde final
   */
  async recordBalancePayment(reservationId, paymentData) {
    try {
      const {
        amount_gnf,
        payment_method,
        payment_date,
        notes
      } = paymentData;

      // Récupérer réservation et calcul du solde dû
      const reservResult = await this.pool.query(`
        SELECT sr.total_price_gnf, sr.cleaning_fee_gnf,
               COALESCE(SUM(sp.amount_gnf), 0) as paid_so_far
        FROM seasonal_reservations sr
        LEFT JOIN seasonal_payments sp ON sr.id = sp.reservation_id
        WHERE sr.id = $1
        GROUP BY sr.id, sr.total_price_gnf, sr.cleaning_fee_gnf
      `, [reservationId]);

      if (reservResult.rows.length === 0) {
        throw new Error('Réservation non trouvée');
      }

      const reservation = reservResult.rows[0];
      const totalDue = parseFloat(reservation.total_price_gnf) + parseFloat(reservation.cleaning_fee_gnf);
      const alreadyPaid = parseFloat(reservation.paid_so_far);
      const balanceDue = totalDue - alreadyPaid;

      if (amount_gnf < balanceDue) {
        throw new Error(`Solde insuffisant. Dû: ${balanceDue} GNF, reçu: ${amount_gnf} GNF`);
      }

      const paymentResult = await this.pool.query(`
        INSERT INTO seasonal_payments (
          reservation_id, payment_type, amount_gnf, payment_method,
          payment_date, notes, status, created_at
        )
        VALUES ($1, 'balance', $2, $3, $4, $5, 'completed', NOW())
        RETURNING id, amount_gnf
      `, [reservationId, amount_gnf, payment_method, payment_date, notes]);

      // Mettre à jour statut réservation
      await this.pool.query(`
        UPDATE seasonal_reservations
        SET status = 'paid', paid_in_full = true, updated_at = NOW()
        WHERE id = $1
      `, [reservationId]);

      console.log('✅ Solde enregistré:', paymentResult.rows[0]);
      return {
        paymentId: paymentResult.rows[0].id,
        amount: paymentResult.rows[0].amount_gnf,
        balanceDue,
        totalPaid: alreadyPaid + parseFloat(paymentResult.rows[0].amount_gnf),
        reservationStatus: 'paid'
      };
    } catch (err) {
      console.error('❌ Erreur enregistrement solde:', err.message);
      throw err;
    }
  }

  /**
   * 📋 Lister réservations
   */
  async listReservations(propertyId, filters = {}) {
    try {
      let query = `
        SELECT sr.*, COUNT(sp.id) as payment_count,
               SUM(sp.amount_gnf) as total_paid
        FROM seasonal_reservations sr
        LEFT JOIN seasonal_payments sp ON sr.id = sp.reservation_id
        WHERE sr.property_id = $1
      `;

      const params = [propertyId];

      if (filters.status) {
        params.push(filters.status);
        query += ` AND sr.status = $${params.length}`;
      }

      if (filters.month) {
        params.push(filters.month);
        query += ` AND EXTRACT(MONTH FROM sr.check_in_date) = $${params.length}`;
      }

      if (filters.year) {
        params.push(filters.year);
        query += ` AND EXTRACT(YEAR FROM sr.check_in_date) = $${params.length}`;
      }

      query += ` GROUP BY sr.id ORDER BY sr.check_in_date DESC`;

      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (err) {
      console.error('❌ Erreur liste réservations:', err.message);
      throw err;
    }
  }

  /**
   ⏳ Calculer taux d'occupation
   */
  async getOccupancyRate(propertyId, month, year) {
    try {
      const daysInMonth = new Date(year, month, 0).getDate();

      const result = await this.pool.query(`
        SELECT 
          SUM(sr.nights) as booked_nights,
          COUNT(DISTINCT sr.id) as reservation_count,
          SUM(sr.total_price_gnf + sr.cleaning_fee_gnf) as total_revenue
        FROM seasonal_reservations sr
        WHERE sr.property_id = $1
          AND sr.status IN ('confirmed', 'checked_in', 'completed')
          AND EXTRACT(YEAR FROM sr.check_in_date) = $2
          AND EXTRACT(MONTH FROM sr.check_in_date) = $3
      `, [propertyId, year, month]);

      const row = result.rows[0];
      const bookedNights = parseInt(row.booked_nights) || 0;
      const occupancyRate = (bookedNights / daysInMonth) * 100;

      return {
        propertyId,
        period: { month, year },
        daysInMonth,
        bookedNights,
        occupancyRate: Math.round(occupancyRate * 10) / 10,
        reservationCount: row.reservation_count,
        totalRevenue: Math.round(parseFloat(row.total_revenue) * 100) / 100,
        averagePricePerNight: row.reservation_count > 0 
          ? Math.round((parseFloat(row.total_revenue) / bookedNights) * 100) / 100
          : 0
      };
    } catch (err) {
      console.error('❌ Erreur calcul occupation:', err.message);
      throw err;
    }
  }

  /**
   * 📊 Calendrier des prix saisonniers
   */
  async setPricingCalendar(propertyId, pricingRules) {
    try {
      // pricingRules: [{startDate, endDate, pricePerNight, season}]

      for (const rule of pricingRules) {
        await this.pool.query(`
          INSERT INTO seasonal_pricing (
            property_id, start_date, end_date, price_per_night_gnf,
            season, multiplier, created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, NOW())
        `, [propertyId, rule.startDate, rule.endDate, rule.pricePerNight, rule.season, rule.multiplier || 1]);
      }

      console.log(`✅ ${pricingRules.length} règles de pricing créées`);
      return { success: true, rulesCreated: pricingRules.length };
    } catch (err) {
      console.error('❌ Erreur calendrier prix:', err.message);
      throw err;
    }
  }

  /**
   * 🔍 Obtenir prix pour une période
   */
  async getPriceForPeriod(propertyId, checkInDate, checkOutDate) {
    try {
      const result = await this.pool.query(`
        SELECT sp.price_per_night_gnf, sp.season
        FROM seasonal_pricing sp
        WHERE sp.property_id = $1
          AND sp.start_date <= $2
          AND sp.end_date >= $3
        LIMIT 1
      `, [propertyId, checkInDate, checkOutDate]);

      if (result.rows.length === 0) {
        // Retourner prix de base
        const configResult = await this.pool.query(`
          SELECT base_price_gnf FROM seasonal_configs
          WHERE property_id = $1 AND status = 'active'
        `, [propertyId]);

        return {
          pricePerNight: configResult.rows[0]?.base_price_gnf || 0,
          season: 'standard',
          source: 'base_config'
        };
      }

      return {
        pricePerNight: result.rows[0].price_per_night_gnf,
        season: result.rows[0].season,
        source: 'seasonal_pricing'
      };
    } catch (err) {
      console.error('❌ Erreur calcul prix période:', err.message);
      throw err;
    }
  }

  /**
   * 📈 Rapport de revenus saisonniers
   */
  async getSeasonalRevenueReport(propertyId, year) {
    try {
      const result = await this.pool.query(`
        SELECT 
          EXTRACT(MONTH FROM sr.check_in_date) as month,
          COUNT(DISTINCT sr.id) as reservation_count,
          SUM(sr.nights) as total_nights,
          SUM(sr.total_price_gnf) as accommodation_revenue,
          SUM(sr.cleaning_fee_gnf) as cleaning_revenue,
          SUM(sr.total_price_gnf + sr.cleaning_fee_gnf) as total_revenue
        FROM seasonal_reservations sr
        WHERE sr.property_id = $1
          AND sr.status IN ('completed', 'checked_in', 'confirmed')
          AND EXTRACT(YEAR FROM sr.check_in_date) = $2
        GROUP BY EXTRACT(MONTH FROM sr.check_in_date)
        ORDER BY month
      `, [propertyId, year]);

      const totalRevenue = result.rows.reduce((sum, r) => sum + parseFloat(r.total_revenue), 0);

      return {
        propertyId,
        year,
        monthlyBreakdown: result.rows.map(r => ({
          month: parseInt(r.month),
          reservations: r.reservation_count,
          nights: r.total_nights,
          accommodationRevenue: Math.round(r.accommodation_revenue * 100) / 100,
          cleaningRevenue: Math.round(r.cleaning_revenue * 100) / 100,
          totalRevenue: Math.round(r.total_revenue * 100) / 100
        })),
        annualTotal: Math.round(totalRevenue * 100) / 100
      };
    } catch (err) {
      console.error('❌ Erreur rapport revenus:', err.message);
      throw err;
    }
  }
}

module.exports = SeasonalService;
