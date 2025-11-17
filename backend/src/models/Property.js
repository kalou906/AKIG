/**
 * 🏢 Modèle Propriété
 * Gestion complète des propriétés immobilières pour agence (contexte guinéen GNF)
 */

class Property {
  constructor(data = {}) {
    this.id = data.id;
    this.reference = data.reference; // Ref unique agence (ex: PROP-2025-001)
    this.title = data.title; // Titre attractif
    this.description = data.description;
    
    // 📍 Localisation
    this.location = {
      address: data.address,
      city: data.city || 'Conakry', // Défaut Guinée
      district: data.district, // Quartier
      region: data.region,
      country: 'Guinée',
      coordinates: data.coordinates || { lat: 9.6412, lng: -13.2344 }, // Conakry par défaut
      gps: data.gps, // GPS brut
    };

    // 🏠 Type & Caractéristiques
    this.type = data.type; // apartment, house, villa, land, commercial
    this.characteristics = {
      bedrooms: data.bedrooms || 0,
      bathrooms: data.bathrooms || 0,
      kitchens: data.kitchens || 1,
      livingRooms: data.livingRooms || 1,
      totalArea: data.totalArea || 0, // m²
      plotArea: data.plotArea || 0, // m² terrain
      floors: data.floors || 1,
      yearBuilt: data.yearBuilt,
      condition: data.condition, // excellent, good, fair, poor
    };

    // 💰 Pricing (GNF - Franc Guinéen)
    this.pricing = {
      currency: 'GNF',
      salePrice: data.salePrice || 0,
      rentalPrice: data.rentalPrice || 0, // Par mois
      pricePerM2: data.pricePerM2 || 0,
      currency_usd: data.currency_usd || 0, // Taux conversion
    };

    // 📋 Statut & Disponibilité
    this.status = data.status || 'available'; // available, rented, sold, maintenance
    this.availability = {
      availableFrom: data.availableFrom,
      availableTo: data.availableTo,
      isAvailable: data.isAvailable !== false,
      maintenanceScheduled: data.maintenanceScheduled || false,
    };

    // 👤 Propriétaire/Agent
    this.owner = {
      id: data.ownerId,
      name: data.ownerName,
      phone: data.ownerPhone,
      email: data.ownerEmail,
    };

    this.agent = {
      id: data.agentId,
      name: data.agentName,
      phone: data.agentPhone,
      email: data.agentEmail,
    };

    // 📸 Médias
    this.media = {
      mainImage: data.mainImage,
      images: data.images || [],
      virtualTour: data.virtualTour, // URL video 360
      documents: data.documents || [], // Plans, titres fonciers
    };

    // 🛠️ Équipements
    this.amenities = data.amenities || [];
    // Possibles: parking, garden, pool, gym, security, wifi, generator, water_tank, solar_panel

    // 📝 Informations supplémentaires
    this.extra = {
      furnished: data.furnished || false,
      hasGenerator: data.hasGenerator || false,
      hasWaterTank: data.hasWaterTank || false,
      hasSecurity: data.hasSecurity || false,
      allowPets: data.allowPets || false,
      description: data.description || '',
    };

    // 📊 Statistiques
    this.stats = {
      views: data.views || 0,
      inquiries: data.inquiries || 0,
      favorites: data.favorites || 0,
      rating: data.rating || 0,
      reviews: data.reviews || [],
    };

    // 🔐 Audit
    this.audit = {
      createdAt: data.createdAt || new Date(),
      createdBy: data.createdBy,
      updatedAt: data.updatedAt || new Date(),
      updatedBy: data.updatedBy,
      deletedAt: data.deletedAt,
    };
  }

  // Convertir prix GNF en USD (taux approximatif)
  getPriceInUSD(priceGNF, rate = 0.000116) {
    return (priceGNF * rate).toFixed(2);
  }

  // Obtenir l'adresse complète
  getFullAddress() {
    return `${this.location.address}, ${this.location.district}, ${this.location.city}, ${this.location.country}`;
  }

  // Valider les champs obligatoires
  validate() {
    const errors = [];
    if (!this.title) errors.push('Titre requis');
    if (!this.type) errors.push('Type de propriété requis');
    if (!this.location.address) errors.push('Adresse requise');
    if (!this.pricing.salePrice && !this.pricing.rentalPrice) 
      errors.push('Prix de vente ou location requis');
    return { isValid: errors.length === 0, errors };
  }

  // Obtenir les détails pour affichage
  getSummary() {
    return {
      id: this.id,
      reference: this.reference,
      title: this.title,
      type: this.type,
      location: this.getFullAddress(),
      price: this.pricing.salePrice || this.pricing.rentalPrice,
      currency: this.pricing.currency,
      bedrooms: this.characteristics.bedrooms,
      bathrooms: this.characteristics.bathrooms,
      area: this.characteristics.totalArea,
      status: this.status,
      image: this.media.mainImage,
    };
  }

  // Obtenir détails complets
  getFullDetails() {
    return {
      ...this,
      fullAddress: this.getFullAddress(),
      priceUSD: this.getPriceInUSD(this.pricing.salePrice || this.pricing.rentalPrice),
    };
  }

  // JSON pour export
  toJSON() {
    return {
      id: this.id,
      reference: this.reference,
      title: this.title,
      description: this.description,
      type: this.type,
      location: this.location,
      characteristics: this.characteristics,
      pricing: this.pricing,
      status: this.status,
      availability: this.availability,
      owner: this.owner,
      agent: this.agent,
      media: this.media,
      amenities: this.amenities,
      extra: this.extra,
      stats: this.stats,
      audit: this.audit,
    };
  }
}

module.exports = Property;
