/**
 * 💶 Service Devise Guinéenne - AKIG
 * 
 * Gestion de la devise GNF (Franc Guinéen)
 * - Conversion USD/EUR → GNF
 * - Taux de change en temps réel
 * - Format d'affichage Guinéen
 * - Arrondi Guinéen (francs)
 */

const axios = require('axios');

class GuineaCurrencyService {
  constructor() {
    // Redis disabled for development
    this.redisClient = null;

    // Taux de change par défaut (GNF pour 1 USD/EUR)
    this.EXCHANGE_RATES = {
      USD_TO_GNF: 8650,  // 1 USD = ~8650 GNF (approximatif)
      EUR_TO_GNF: 9200,  // 1 EUR = ~9200 GNF (approximatif)
      GBP_TO_GNF: 10800, // 1 GBP = ~10800 GNF
    };

    // Format Guinéen
    this.CURRENCY_CONFIG = {
      code: 'GNF',
      symbol: 'Fr',
      name: 'Franc Guinéen',
      decimals: 0, // Les francs n'ont pas de décimales
      locale: 'fr-GN',
    };

    this.EXCHANGE_CACHE_KEY = 'guinea:exchange_rates';
    this.EXCHANGE_CACHE_TTL = 3600; // 1 heure
  }

  /**
   * Convertir USD → GNF
   */
  usdToGnf(amountUsd) {
    return Math.round(amountUsd * this.EXCHANGE_RATES.USD_TO_GNF);
  }

  /**
   * Convertir EUR → GNF
   */
  eurToGnf(amountEur) {
    return Math.round(amountEur * this.EXCHANGE_RATES.EUR_TO_GNF);
  }

  /**
   * Convertir GNF → USD
   */
  gnfToUsd(amountGnf) {
    return Math.round((amountGnf / this.EXCHANGE_RATES.USD_TO_GNF) * 100) / 100;
  }

  /**
   * Formater montant en GNF Guinéen
   * Ex: 150000 → "150.000 Fr" ou "150 000 Fr"
   */
  formatGnf(amountGnf) {
    // Format Guinéen: espaces tous les 3 chiffres
    const formatted = amountGnf
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    
    return `${formatted} ${this.CURRENCY_CONFIG.symbol}`;
  }

  /**
   * Parser montant GNF (inverse du format)
   * Ex: "150.000 Fr" → 150000
   */
  parseGnf(formattedGnf) {
    const cleaned = formattedGnf
      .replace(/[^\d]/g, '')
      .trim();
    
    return parseInt(cleaned, 10);
  }

  /**
   * Récupérer taux de change en temps réel (optionnel)
   */
  async fetchRealExchangeRates() {
    try {
      // Vérifier cache Redis
      const cached = await this.redisClient.get(this.EXCHANGE_CACHE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }

      // API externe (exemple: exchangerate-api.com)
      // Remplacer par vrai API si disponible
      const response = await axios.get('https://api.exchangerate-api.com/v4/latest/GNF', {
        timeout: 5000
      });

      const rates = {
        USD_TO_GNF: response.data.rates.USD ? Math.round(1 / response.data.rates.USD) : this.EXCHANGE_RATES.USD_TO_GNF,
        EUR_TO_GNF: response.data.rates.EUR ? Math.round(1 / response.data.rates.EUR) : this.EXCHANGE_RATES.EUR_TO_GNF,
      };

      // Cacher pour 1 heure
      await this.redisClient.setex(
        this.EXCHANGE_CACHE_KEY,
        this.EXCHANGE_CACHE_TTL,
        JSON.stringify(rates)
      );

      this.EXCHANGE_RATES = { ...this.EXCHANGE_RATES, ...rates };
      return rates;
    } catch (error) {
      console.warn('⚠️  Pas de taux en temps réel, utilisation des taux par défaut:', error.message);
      return this.EXCHANGE_RATES;
    }
  }

  /**
   * Obtenir les infos de devise
   */
  getCurrencyInfo() {
    return {
      ...this.CURRENCY_CONFIG,
      exchangeRates: this.EXCHANGE_RATES,
      example: {
        usd: 100,
        gnf: this.usdToGnf(100),
        formatted: this.formatGnf(this.usdToGnf(100))
      }
    };
  }

  /**
   * Ajouter GNF à un objet de prix
   */
  enrichPriceObject(priceObj) {
    return {
      ...priceObj,
      gnf: this.usdToGnf(priceObj.usd || 0),
      gnf_formatted: this.formatGnf(this.usdToGnf(priceObj.usd || 0)),
      currency_primary: 'GNF'
    };
  }
}

// Export singleton
module.exports = new GuineaCurrencyService();
