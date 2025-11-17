/**
 * Sync & Conflict Management Service
 * mobile/src/services/syncService.js
 * 
 * Gère la synchronisation des données et la résolution des conflits
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import logger from './logger';

class SyncService {
  constructor() {
    this.syncInProgress = false;
    this.conflictQueue = [];
  }

  /**
   * Détecte les conflits entre les données locales et serveur
   */
  async detectConflicts(resource, localData, serverId = null) {
    try {
      let serverData;

      if (serverId) {
        // Récupérer une ressource spécifique
        const res = await api.get(`/${resource}/${serverId}`);
        serverData = res.data;
      } else {
        // Récupérer la liste
        const res = await api.get(`/${resource}`);
        serverData = res.data;
      }

      const conflicts = this._findConflicts(localData, serverData);

      if (conflicts.length > 0) {
        logger.warn(`Detected ${conflicts.length} conflicts for ${resource}`, { conflicts });
        return {
          hasConflicts: true,
          conflicts,
          server: serverData,
          local: localData,
        };
      }

      return { hasConflicts: false };
    } catch (error) {
      logger.error('Error detecting conflicts', { error: error.message, resource });
      throw error;
    }
  }

  /**
   * Trouve les champs en conflit
   */
  _findConflicts(local, server) {
    const conflicts = [];

    // Comparer les clés
    const allKeys = new Set([
      ...Object.keys(local || {}),
      ...Object.keys(server || {}),
    ]);

    allKeys.forEach((key) => {
      // Ignorer les champs de métadonnées
      if (['id', 'created_at', 'updated_at', 'deleted_at'].includes(key)) {
        return;
      }

      const localValue = local?.[key];
      const serverValue = server?.[key];

      if (JSON.stringify(localValue) !== JSON.stringify(serverValue)) {
        conflicts.push(key);
      }
    });

    return conflicts;
  }

  /**
   * Résout un conflit unique
   */
  async resolveConflict(resource, fieldName, source, localData, serverData) {
    try {
      if (source === 'server') {
        // Garder la version serveur
        return serverData[fieldName];
      } else if (source === 'local') {
        // Garder la version locale
        return localData[fieldName];
      } else if (source === 'merge') {
        // Fusion intelligente
        return this._intelligentMerge(localData[fieldName], serverData[fieldName]);
      } else {
        throw new Error(`Unknown resolution source: ${source}`);
      }
    } catch (error) {
      logger.error('Error resolving conflict', { error: error.message, fieldName });
      throw error;
    }
  }

  /**
   * Résout tous les conflits
   */
  async resolveAllConflicts(resource, resolutions, localData, serverData) {
    try {
      const mergedData = { ...serverData, ...localData };

      // Appliquer les résolutions
      for (const [field, source] of Object.entries(resolutions)) {
        const resolvedValue = await this.resolveConflict(
          resource,
          field,
          source,
          localData,
          serverData
        );
        mergedData[field] = resolvedValue;
      }

      // Envoyer les données fusionnées
      const res = await api.patch(`/${resource}/${serverData.id}`, mergedData);

      logger.info('Conflicts resolved', {
        resource,
        conflictCount: Object.keys(resolutions).length,
      });

      return res.data;
    } catch (error) {
      logger.error('Error resolving all conflicts', { error: error.message });
      throw error;
    }
  }

  /**
   * Fusion intelligente de deux valeurs
   */
  _intelligentMerge(local, server) {
    if (local === undefined || local === null) return server;
    if (server === undefined || server === null) return local;

    // Si les deux sont des objets, fusionner
    if (typeof local === 'object' && typeof server === 'object') {
      return { ...server, ...local };
    }

    // Sinon, préférer la version locale
    return local;
  }

  /**
   * Synchronise une ressource avec le serveur
   */
  async syncResource(resource, options = {}) {
    try {
      this.syncInProgress = true;

      // Récupérer les données locales
      const localData = await AsyncStorage.getItem(`data_${resource}`);
      const localJSON = localData ? JSON.parse(localData) : null;

      if (!localJSON) {
        logger.debug('No local data to sync', { resource });
        return { synced: 0, errors: 0 };
      }

      let synced = 0;
      let errors = 0;

      // Synchroniser chaque item
      for (const item of Array.isArray(localJSON) ? localJSON : [localJSON]) {
        try {
          // Vérifier les conflits
          const conflictCheck = await this.detectConflicts(resource, item, item.id);

          if (conflictCheck.hasConflicts) {
            // Ajouter à la queue de conflits
            this.conflictQueue.push({
              resource,
              item,
              conflicts: conflictCheck,
            });
            logger.warn('Conflict detected, added to queue', { resource, itemId: item.id });
          } else {
            // Synchroniser
            if (item.id) {
              await api.patch(`/${resource}/${item.id}`, item);
            } else {
              await api.post(`/${resource}`, item);
            }
            synced++;
          }
        } catch (error) {
          errors++;
          logger.error('Error syncing item', { error: error.message, resource, itemId: item.id });
        }
      }

      logger.info('Sync completed', { resource, synced, errors });

      return { synced, errors, conflicts: this.conflictQueue.length };
    } catch (error) {
      logger.error('Error syncing resource', { error: error.message, resource });
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Récupère le prochain conflit de la queue
   */
  async getNextConflict() {
    if (this.conflictQueue.length === 0) {
      return null;
    }
    return this.conflictQueue[0];
  }

  /**
   * Résout le conflit actuel
   */
  async resolveCurrentConflict(resolutions) {
    try {
      if (this.conflictQueue.length === 0) {
        throw new Error('No conflicts in queue');
      }

      const conflict = this.conflictQueue.shift();
      const resolved = await this.resolveAllConflicts(
        conflict.resource,
        resolutions,
        conflict.item,
        conflict.conflicts.server
      );

      // Mettre à jour les données locales
      await AsyncStorage.setItem(
        `data_${conflict.resource}`,
        JSON.stringify(resolved)
      );

      logger.info('Conflict resolved', { resource: conflict.resource });

      return { success: true, resolved };
    } catch (error) {
      logger.error('Error resolving current conflict', { error: error.message });
      throw error;
    }
  }

  /**
   * Rejette le conflit actuel
   */
  async rejectCurrentConflict() {
    try {
      if (this.conflictQueue.length === 0) {
        throw new Error('No conflicts in queue');
      }

      this.conflictQueue.shift();
      logger.info('Conflict rejected');

      return { success: true };
    } catch (error) {
      logger.error('Error rejecting conflict', { error: error.message });
      throw error;
    }
  }

  /**
   * Récupère les statistiques de conflit
   */
  getConflictStats() {
    return {
      totalConflicts: this.conflictQueue.length,
      isProcessing: this.syncInProgress,
      queue: this.conflictQueue.map((c) => ({
        resource: c.resource,
        itemId: c.item.id,
        conflictCount: c.conflicts.conflicts.length,
      })),
    };
  }

  /**
   * Efface tous les conflits
   */
  clearAllConflicts() {
    const count = this.conflictQueue.length;
    this.conflictQueue = [];
    logger.info('All conflicts cleared', { count });
    return { cleared: count };
  }

  /**
   * Synchronise tout (données et conflits)
   */
  async syncAll(resources = []) {
    try {
      this.syncInProgress = true;
      const results = {};

      for (const resource of resources) {
        results[resource] = await this.syncResource(resource);
      }

      logger.info('Full sync completed', { resources, results });

      return {
        results,
        totalConflicts: this.conflictQueue.length,
      };
    } catch (error) {
      logger.error('Error during full sync', { error: error.message });
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Récupère les conflits en attente
   */
  getPendingConflicts() {
    return this.conflictQueue.map((c) => ({
      resource: c.resource,
      item: c.item,
      conflictedFields: c.conflicts.conflicts,
      server: c.conflicts.server,
      local: c.item,
    }));
  }

  /**
   * Crée un log de synchronisation
   */
  async logSync(resource, action, status, details = {}) {
    try {
      const logs = await AsyncStorage.getItem('sync_logs');
      const logList = logs ? JSON.parse(logs) : [];

      logList.push({
        resource,
        action,
        status,
        details,
        timestamp: new Date().toISOString(),
      });

      // Garder seulement les 100 derniers logs
      const recentLogs = logList.slice(-100);

      await AsyncStorage.setItem('sync_logs', JSON.stringify(recentLogs));
    } catch (error) {
      logger.error('Error logging sync', { error: error.message });
    }
  }

  /**
   * Récupère les logs de synchronisation
   */
  async getSyncLogs() {
    try {
      const logs = await AsyncStorage.getItem('sync_logs');
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      logger.error('Error fetching sync logs', { error: error.message });
      return [];
    }
  }
}

export default new SyncService();
