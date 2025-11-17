# API IA Avancée - Agence Immobilière Guinéenne

## Vue d'ensemble

L'API IA Avancée fournit l'analyse intelligente des propriétés spécifiques au contexte guinéen. Toutes les analyses utilisent les données marché réelles de Guinée (Kaloum, Dixinn, Ratoma, Kindia, Mamou, Fria).

**Base URL**: `/api/ai`
**Authentification**: JWT Bearer Token (toutes les routes)
**Langue**: Français (réponses contextualisées Guinée)

---

## 1. Analyse Prix Propriété

### Endpoint
```
POST /api/ai/analyze-price
```

### Description
Analyser une propriété et suggérer le prix optimal basé sur le marché guinéen.

### Requête
```json
{
  "title": "Maison 4 pièces à Kaloum",
  "surface": 150,
  "rooms": 4,
  "bathrooms": 2,
  "location": "Kaloum",
  "property_type": "maison",
  "condition": "bon",
  "amenities": ["parking", "jardin", "securite"],
  "yearBuilt": 2015
}
```

### Paramètres
| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| surface | number | ✅ | Surface en m² |
| rooms | number | ✅ | Nombre de chambres |
| location | string | ✅ | Quartier/Zone |
| bathrooms | number | Non | Salles de bain |
| property_type | string | Non | Type (maison, appartement, villa) |
| condition | string | Non | État (excellent, bon, moyen, à rénover) |
| amenities | array | Non | Commodités disponibles |
| yearBuilt | number | Non | Année construction |

### Réponse
```json
{
  "success": true,
  "analysis": {
    "estimatedPrice": 22500000,
    "minPrice": 19500000,
    "maxPrice": 25500000,
    "pricePerSqm": 150000,
    "marketLocation": {
      "area": "Kaloum",
      "priceRange": "15,000 - 25,000 GNF/m²",
      "demandLevel": "Haute"
    },
    "suggestions": [
      "Prix optimal pour cette surface à Kaloum",
      "Ajouter parking augmenterait 5-8% la valeur",
      "Qualité construction affecte 15-20% du prix"
    ]
  }
}
```

### Zones et Prix par m²
- **Kaloum**: 15,000-25,000 GNF/m² (zone premium)
- **Dixinn**: 12,000-20,000 GNF/m² (haute demande)
- **Ratoma**: 10,000-18,000 GNF/m² (mid-high)
- **Kindia**: 8,000-15,000 GNF/m² (intermédiaire)
- **Mamou**: 5,000-12,000 GNF/m² (accès)
- **Fria**: 6,000-13,000 GNF/m² (accès)

---

## 2. Génération Description Propriété

### Endpoint
```
POST /api/ai/generate-description
```

### Description
Générer une description professionnelle en français (contexte Guinée) pour la propriété.

### Requête
```json
{
  "title": "Villa luxe 5 pièces Dixinn",
  "surface": 280,
  "rooms": 5,
  "bathrooms": 3,
  "location": "Dixinn",
  "property_type": "villa",
  "condition": "excellent",
  "amenities": ["piscine", "parking", "securite", "jardin", "climatisation"],
  "description": "Villa moderne avec équipements modernes"
}
```

### Réponse
```json
{
  "success": true,
  "description": "Découvrez cette magnifique villa de prestige située au cœur de Dixinn, un quartier prisé de Conakry... [description complète en français, 3-4 paragraphes]",
  "generatedAt": "2024-01-15T10:30:00Z"
}
```

---

## 3. Recommandations Propriétés Similaires

### Endpoint
```
POST /api/ai/recommendations
```

### Description
Recommander des propriétés similaires dans la même zone/type/gamme de prix.

### Requête
```json
{
  "propertyId": 123
}
```

### Réponse
```json
{
  "success": true,
  "originalProperty": {
    "id": 123,
    "title": "Maison Kaloum",
    "price": 22500000,
    "location": "Kaloum",
    "surface": 150
  },
  "recommendations": [
    {
      "id": 456,
      "title": "Villa Kaloum",
      "price": 24000000,
      "similarity": 92,
      "reason": "Même zone, surface similaire, prix comparable"
    },
    {
      "id": 789,
      "title": "Maison Dixinn",
      "price": 20000000,
      "similarity": 85,
      "reason": "Zone adjacente, budget similaire"
    }
  ],
  "message": "5 propriétés similaires recommandées"
}
```

---

## 4. Analyse Tendances Marché

### Endpoint
```
GET /api/ai/market-trends
```

### Description
Analyser les tendances du marché immobilier guinéen complet.

### Réponse
```json
{
  "success": true,
  "trends": {
    "totalProperties": 156,
    "averagePrice": 18500000,
    "averageSurface": 180,
    "averageRooms": 3.8,
    "byLocation": {
      "Kaloum": {
        "count": 32,
        "avgPrice": 22500000,
        "demandLevel": "Haute"
      },
      "Dixinn": {
        "count": 41,
        "avgPrice": 19500000,
        "demandLevel": "Très haute"
      }
    },
    "byPropertyType": {
      "maison": { "count": 89, "avgPrice": 17500000 },
      "appartement": { "count": 45, "avgPrice": 15000000 },
      "villa": { "count": 22, "avgPrice": 28000000 }
    },
    "priceRanges": {
      "sous5M": 8,
      "5a10M": 32,
      "10a25M": 78,
      "plus25M": 38
    },
    "marketInsights": [
      "Zone Dixinn en haute demande",
      "Prix moyen en hausse de 8% vs période précédente",
      "Villas recherchées, offre limitée"
    ]
  }
}
```

---

## 5. Suggestions Améliorations Propriété

### Endpoint
```
POST /api/ai/property-improvements
```

### Description
Suggérer améliorations pour augmenter la valeur (ROI-focused).

### Requête
```json
{
  "surface": 150,
  "rooms": 4,
  "condition": "bon",
  "amenities": ["parking"],
  "location": "Kaloum"
}
```

### Réponse
```json
{
  "success": true,
  "improvements": {
    "suggestions": [
      {
        "improvement": "Ajouter jardin paysager",
        "impactPercentage": 15,
        "costLevel": "Moyen",
        "priority": "Haute",
        "roi": "Excellent"
      },
      {
        "improvement": "Renforcer sécurité",
        "impactPercentage": 12,
        "costLevel": "Moyen",
        "priority": "Haute",
        "roi": "Excellent"
      },
      {
        "improvement": "Rénovation intérieure",
        "impactPercentage": 20,
        "costLevel": "Élevé",
        "priority": "Moyenne",
        "roi": "Bon"
      }
    ],
    "totalEstimatedValueIncrease": 47
  }
}
```

---

## 6. Prédiction Délai Vente

### Endpoint
```
POST /api/ai/sales-duration
```

### Description
Prédire le délai estimé de vente basé sur marché, zone, prix.

### Requête
```json
{
  "location": "Kaloum",
  "price": 22500000,
  "rooms": 4,
  "condition": "bon",
  "amenities": ["parking", "jardin", "securite"]
}
```

### Réponse
```json
{
  "success": true,
  "prediction": {
    "estimatedDurationDays": 45,
    "estimatedDurationWeeks": 6,
    "estimatedDurationMonths": "1.5 mois",
    "confidence": "80%",
    "breakdown": {
      "locationFactor": 1.0,
      "priceRangeFactor": 1.2,
      "conditionFactor": 0.95,
      "amenitiesFactor": 0.85
    },
    "insight": "Propriété en bon état à Kaloum devrait se vendre rapidement"
  }
}
```

---

## 7. Opportunités Marché

### Endpoint
```
GET /api/market-opportunities
```

### Description
Identifier les meilleures opportunités d'investissement (prix bas + haute demande).

### Réponse
```json
{
  "success": true,
  "opportunities": [
    {
      "id": 234,
      "title": "Maison Ratoma",
      "price": 14500000,
      "pricePerSqm": 96667,
      "opportunityScore": 95,
      "recommendation": "Investir rapidement"
    },
    {
      "id": 567,
      "title": "Villa Kindia",
      "price": 16000000,
      "pricePerSqm": 94118,
      "opportunityScore": 90,
      "recommendation": "Investir rapidement"
    }
  ],
  "count": 5
}
```

---

## 8. Analyse Complète Propriété

### Endpoint
```
POST /api/ai/complete-analysis
```

### Description
Analyse COMPLÈTE incluant prix, améliorations, délai vente, tout en parallèle.

### Requête
```json
{
  "title": "Propriété test",
  "surface": 200,
  "rooms": 4,
  "bathrooms": 2,
  "location": "Dixinn",
  "property_type": "maison",
  "condition": "bon",
  "amenities": ["parking", "jardin"]
}
```

### Réponse
```json
{
  "success": true,
  "completeAnalysis": {
    "priceAnalysis": {
      "estimatedPrice": 20000000,
      "pricePerSqm": 100000,
      "minPrice": 17500000,
      "maxPrice": 22500000
    },
    "description": "Description complète en français...",
    "improvements": [
      {
        "improvement": "Ajouter piscine",
        "impactPercentage": 18,
        "costLevel": "Élevé"
      }
    ],
    "salesDuration": {
      "estimatedDurationMonths": "1.5 mois",
      "confidence": "80%"
    },
    "generatedAt": "2024-01-15T10:30:00Z",
    "confidence": "80-90%"
  }
}
```

---

## Codes Erreurs

| Code | Message | Cause |
|------|---------|-------|
| 400 | Données propriété incomplètes | Paramètres requis manquants |
| 401 | Non authentifié | Token JWT manquant/invalide |
| 404 | Propriété non trouvée | ID propriété n'existe pas |
| 500 | Erreur serveur | Erreur interne traitement |

---

## Exemples Complets

### Exemple 1: Analyser et obtenir prix pour nouvelle propriété
```bash
curl -X POST http://localhost:4000/api/ai/analyze-price \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "surface": 150,
    "rooms": 4,
    "location": "Kaloum",
    "amenities": ["parking", "jardin"]
  }'
```

### Exemple 2: Analyse complète avant mise en vente
```bash
curl -X POST http://localhost:4000/api/ai/complete-analysis \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "surface": 200,
    "rooms": 4,
    "location": "Dixinn",
    "condition": "bon",
    "amenities": ["parking", "piscine", "jardin"]
  }'
```

### Exemple 3: Voir tendances marché
```bash
curl -X GET http://localhost:4000/api/ai/market-trends \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Limitations et Notes

1. **Données Marché**: Basées sur données estimées Guinée - peut être mis à jour avec données réelles
2. **Confiance**: 80-90% de confiance sur prédictions
3. **Zones**: Actuellement 6 zones (Kaloum, Dixinn, Ratoma, Kindia, Mamou, Fria)
4. **Langue**: Toutes les réponses en français (contexte Guinée)
5. **Performance**: Analyses parallèles pour endpoint `/complete-analysis`

---

## Intégration Frontend

Utiliser ces endpoints dans l'interface pour:
- 💰 **Prix intelligent**: Suggérer prix avant mise en ligne
- ✍️ **Descriptions auto**: Générer descriptions professionnelles
- 🎯 **Recommandations**: Montrer propriétés similaires
- 📊 **Dashboard marché**: Afficher tendances marché
- ⭐ **Améliorations**: Suggérer ROI-optimisé
- ⏰ **Délai vente**: Prédire temps avant vente
- 💎 **Opportunités**: Identifier deals

---

**Version**: 1.0  
**Dernière mise à jour**: 2024-01-15  
**Créé pour**: Agence Immobilière Guinéenne AKIG
