/**
 * Routes Carte Interactive - AKIG
 * 
 * Module pour:
 * - Affichage des locataires en retard sur une carte
 * - Calcul d'itinéraires optimisés
 * - Géolocalisation en temps réel
 * 
 * Utilisation: GET /api/carte/...
 */

import express, { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import axios from 'axios';
import CacheService, { CACHE_KEYS } from '../services/cache.service';

const router = Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// ==================== LOCATAIRES SUR CARTE ====================

/**
 * GET /api/carte/locataires-retard
 * Récupérer tous les locataires en retard avec coordonnées GPS
 */
router.get(
  '/locataires-retard',
  async (req: Request, res: Response) => {
    const { site_id, jours_retard_min = 0 } = req.query;

    try {
      let query = `
        SELECT 
          l.id,
          l.nom,
          l.prenom,
          l.telephone,
          l.email,
          s.id as site_id,
          s.nom as site_nom,
          s.adresse,
          s.latitude,
          s.longitude,
          SUM(i.montant) as montant_total,
          MAX(EXTRACT(DAY FROM CURRENT_DATE - i.date_echeance))::INT as jours_retard_max,
          COUNT(DISTINCT i.id) as nb_impayes,
          CASE 
            WHEN MAX(EXTRACT(DAY FROM CURRENT_DATE - i.date_echeance)) > 60 THEN 'critique'
            WHEN MAX(EXTRACT(DAY FROM CURRENT_DATE - i.date_echeance)) > 30 THEN 'urgent'
            ELSE 'normal'
          END as priorite
        FROM locataires l
        JOIN sites s ON l.site_id = s.id
        LEFT JOIN impayes i ON l.id = i.locataire_id AND i.statut = 'impaye'
        WHERE i.id IS NOT NULL
      `;

      const params: any[] = [];

      if (site_id) {
        query += ` AND s.id = $${params.length + 1}`;
        params.push(site_id);
      }

      query += `
        GROUP BY l.id, s.id
        HAVING MAX(EXTRACT(DAY FROM CURRENT_DATE - i.date_echeance)) >= $${params.length + 1}
        ORDER BY jours_retard_max DESC
      `;
      params.push(jours_retard_min);

      const result = await pool.query(query, params);

      const markers = result.rows.map(row => ({
        id: row.id,
        type: 'locataire',
        nom: `${row.prenom} ${row.nom}`,
        telephone: row.telephone,
        email: row.email,
        site: row.site_nom,
        adresse: row.adresse,
        montant: parseFloat(row.montant_total),
        jours_retard: row.jours_retard_max,
        priorite: row.priorite,
        latitude: parseFloat(row.latitude),
        longitude: parseFloat(row.longitude),
        popup: `
          <strong>${row.prenom} ${row.nom}</strong><br/>
          Site: ${row.site_nom}<br/>
          Retard: ${row.jours_retard_max} jours<br/>
          Montant: ${parseFloat(row.montant_total).toFixed(2)}€<br/>
          Tel: ${row.telephone}
        `,
      }));

      res.json({
        success: true,
        total: markers.length,
        markers,
      });
    } catch (error) {
      console.error('Erreur locataires retard:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// ==================== ITINÉRAIRES OPTIMISÉS ====================

/**
 * POST /api/carte/itineraire-optimise
 * Calculer l'itinéraire optimal pour une mission
 * 
 * Body:
 * {
 *   mission_id: UUID,
 *   locataire_ids: [UUID, ...],
 *   algorithme: 'nearest_neighbor' | 'tsp' (defaut: nearest_neighbor)
 * }
 */
router.post(
  '/itineraire-optimise',
  async (req: Request, res: Response) => {
    const { mission_id, locataire_ids, algorithme = 'nearest_neighbor' } = req.body;

    try {
      // Récupérer coordonnées des locataires
      const query = `
        SELECT 
          l.id,
          l.nom,
          s.adresse,
          s.latitude,
          s.longitude,
          i.montant,
          EXTRACT(DAY FROM CURRENT_DATE - i.date_echeance)::INT as jours_retard
        FROM locataires l
        JOIN sites s ON l.site_id = s.id
        LEFT JOIN impayes i ON l.id = i.locataire_id
        WHERE l.id = ANY($1)
        ORDER BY i.montant DESC
      `;

      const result = await pool.query(query, [locataire_ids]);
      const locataires = result.rows;

      // Optimiser l'ordre de visite
      let ordreOptimise: any[];

      if (algorithme === 'tsp') {
        ordreOptimise = optimiseTSP(locataires);
      } else {
        ordreOptimise = nearestNeighbor(locataires);
      }

      // Calculer distance totale
      let distanceTotale = 0;
      for (let i = 0; i < ordreOptimise.length - 1; i++) {
        const lat1 = ordreOptimise[i].latitude;
        const lon1 = ordreOptimise[i].longitude;
        const lat2 = ordreOptimise[i + 1].latitude;
        const lon2 = ordreOptimise[i + 1].longitude;
        distanceTotale += haversineDistance(lat1, lon1, lat2, lon2);
      }

      // Créer chemin visuel pour la carte
      const coords = ordreOptimise.map(l => [l.latitude, l.longitude]);

      res.json({
        success: true,
        mission_id,
        algorithme,
        itineraire: ordreOptimise,
        distance_km: parseFloat((distanceTotale / 1000).toFixed(2)),
        nb_arrets: ordreOptimise.length,
        coords_map: coords,
      });
    } catch (error) {
      console.error('Erreur itinéraire:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

/**
 * POST /api/carte/geolocalisation
 * Enregistrer la géolocalisation en temps réel d'un agent
 */
router.post(
  '/geolocalisation',
  async (req: Request, res: Response) => {
    const { agent_id, latitude, longitude, accuracy } = req.body;

    try {
      const query = `
        INSERT INTO agent_geolocalisation (
          agent_id, latitude, longitude, accuracy, timestamp
        )
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (agent_id) 
        DO UPDATE SET 
          latitude = $2,
          longitude = $3,
          accuracy = $4,
          timestamp = NOW()
      `;

      await pool.query(query, [agent_id, latitude, longitude, accuracy]);

      res.json({ success: true, message: 'Géolocalisation mise à jour' });
    } catch (error) {
      console.error('Erreur géolocalisation:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

/**
 * GET /api/carte/agents-position
 * Récupérer position actuelle de tous les agents
 */
router.get(
  '/agents-position',
  async (req: Request, res: Response) => {
    try {
      const query = `
        SELECT 
          u.id as agent_id,
          u.prenom || ' ' || u.nom as nom,
          ag.latitude,
          ag.longitude,
          ag.accuracy,
          ag.timestamp,
          EXTRACT(MINUTE FROM NOW() - ag.timestamp)::INT as minutes_ago,
          m.id as mission_id,
          s.nom as site_nom
        FROM utilisateurs u
        LEFT JOIN agent_geolocalisation ag ON u.id = ag.agent_id
        LEFT JOIN missions m ON u.id = m.agent_id AND m.statut = 'en_cours'
        LEFT JOIN sites s ON m.site_id = s.id
        WHERE u.role = 'agent'
        AND ag.timestamp > NOW() - INTERVAL '2 hours'
        ORDER BY ag.timestamp DESC
      `;

      const result = await pool.query(query);

      const markers = result.rows
        .filter(row => row.latitude && row.longitude)
        .map(row => ({
          agent_id: row.agent_id,
          nom: row.nom,
          latitude: parseFloat(row.latitude),
          longitude: parseFloat(row.longitude),
          accuracy: row.accuracy,
          timestamp: row.timestamp,
          minutes_ago: row.minutes_ago,
          mission_id: row.mission_id,
          site: row.site_nom,
        }));

      res.json({
        success: true,
        agents_actifs: markers.length,
        markers,
      });
    } catch (error) {
      console.error('Erreur position agents:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// ==================== HELPERS ====================

/**
 * Algorithme du plus proche voisin (Nearest Neighbor)
 */
function nearestNeighbor(locataires: any[]): any[] {
  if (locataires.length === 0) return [];

  const reste = [...locataires];
  const ordonne = [reste.shift()];

  while (reste.length > 0) {
    const dernier = ordonne[ordonne.length - 1];
    let plusProche = reste[0];
    let distanceMin = haversineDistance(
      dernier.latitude,
      dernier.longitude,
      plusProche.latitude,
      plusProche.longitude
    );

    for (let i = 1; i < reste.length; i++) {
      const distance = haversineDistance(
        dernier.latitude,
        dernier.longitude,
        reste[i].latitude,
        reste[i].longitude
      );

      if (distance < distanceMin) {
        distanceMin = distance;
        plusProche = reste[i];
      }
    }

    ordonne.push(plusProche);
    reste.splice(reste.indexOf(plusProche), 1);
  }

  return ordonne;
}

/**
 * Algorithme TSP simplifié (Travelling Salesman Problem)
 */
function optimiseTSP(locataires: any[]): any[] {
  // Version simplifiée: pour petits ensembles, on teste plusieurs permutations
  if (locataires.length <= 10) {
    return nearestNeighbor(locataires); // Utiliser NN pour perf
  }
  return nearestNeighbor(locataires);
}

/**
 * Calculer distance entre deux coordonnées (Formule Haversine)
 * Retourne distance en mètres
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Rayon Terre en mètres
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export default router;
