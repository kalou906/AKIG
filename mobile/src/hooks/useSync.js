/**
 * useSync Hook
 * mobile/src/hooks/useSync.js
 * 
 * Hook personnalisé pour la gestion de la synchronisation et des conflits
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import syncService from '../services/syncService';
import logger from '../services/logger';

const useSync = (resources = []) => {
  const [syncing, setSyncing] = useState(false);
  const [conflicts, setConflicts] = useState([]);
  const [currentConflict, setCurrentConflict] = useState(null);
  const [syncStats, setSyncStats] = useState({
    total: 0,
    synced: 0,
    errors: 0,
    conflicts: 0,
  });
  const [error, setError] = useState(null);
  const retryCount = useRef(0);
  const MAX_RETRIES = 3;

  /**
   * Lance la synchronisation
   */
  const startSync = useCallback(async () => {
    try {
      setSyncing(true);
      setError(null);

      await syncService.logSync('all', 'sync_start', 'pending');

      const result = await syncService.syncAll(resources);

      setSyncStats({
        total: resources.length,
        synced: Object.values(result.results).reduce((sum, r) => sum + r.synced, 0),
        errors: Object.values(result.results).reduce((sum, r) => sum + r.errors, 0),
        conflicts: result.totalConflicts,
      });

      // Charger les conflits
      const pending = syncService.getPendingConflicts();
      setConflicts(pending);

      if (pending.length > 0) {
        setCurrentConflict(pending[0]);
      }

      await syncService.logSync('all', 'sync_end', 'completed', result);

      logger.info('Sync completed', result);
    } catch (err) {
      setError(err.message);
      await syncService.logSync('all', 'sync_error', 'failed', { error: err.message });
      logger.error('Sync error', { error: err.message });
    } finally {
      setSyncing(false);
    }
  }, [resources]);

  /**
   * Résout le conflit courant
   */
  const resolveConflict = useCallback(async (resolutions) => {
    try {
      if (!currentConflict) return;

      setSyncing(true);
      setError(null);

      const resolved = await syncService.resolveCurrentConflict(resolutions);

      // Mettre à jour les conflits
      const pending = syncService.getPendingConflicts();
      setConflicts(pending);

      if (pending.length > 0) {
        setCurrentConflict(pending[0]);
      } else {
        setCurrentConflict(null);
      }

      await syncService.logSync(
        currentConflict.resource,
        'conflict_resolve',
        'completed',
        { resolutions }
      );

      logger.info('Conflict resolved', resolved);
    } catch (err) {
      setError(err.message);
      logger.error('Error resolving conflict', { error: err.message });
    } finally {
      setSyncing(false);
    }
  }, [currentConflict]);

  /**
   * Rejette le conflit courant
   */
  const rejectConflict = useCallback(async () => {
    try {
      if (!currentConflict) return;

      setSyncing(true);
      setError(null);

      await syncService.rejectCurrentConflict();

      // Mettre à jour les conflits
      const pending = syncService.getPendingConflicts();
      setConflicts(pending);

      if (pending.length > 0) {
        setCurrentConflict(pending[0]);
      } else {
        setCurrentConflict(null);
      }

      await syncService.logSync(
        currentConflict.resource,
        'conflict_reject',
        'completed'
      );

      logger.info('Conflict rejected');
    } catch (err) {
      setError(err.message);
      logger.error('Error rejecting conflict', { error: err.message });
    } finally {
      setSyncing(false);
    }
  }, [currentConflict]);

  /**
   * Efface tous les conflits
   */
  const clearConflicts = useCallback(async () => {
    try {
      setSyncing(true);
      setError(null);

      const result = syncService.clearAllConflicts();
      setConflicts([]);
      setCurrentConflict(null);

      await syncService.logSync('all', 'conflicts_clear', 'completed', result);

      logger.info('Conflicts cleared', result);
    } catch (err) {
      setError(err.message);
      logger.error('Error clearing conflicts', { error: err.message });
    } finally {
      setSyncing(false);
    }
  }, []);

  /**
   * Réessaye la synchronisation
   */
  const retry = useCallback(async () => {
    if (retryCount.current >= MAX_RETRIES) {
      setError('Nombre maximum de tentatives atteint');
      return;
    }

    retryCount.current += 1;
    await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retryCount.current) * 1000));
    await startSync();
  }, [startSync]);

  /**
   * Récupère les logs de synchronisation
   */
  const fetchLogs = useCallback(async () => {
    try {
      return await syncService.getSyncLogs();
    } catch (err) {
      logger.error('Error fetching logs', { error: err.message });
      return [];
    }
  }, []);

  /**
   * Récupère les statistiques
   */
  const getStats = useCallback(() => {
    return {
      ...syncStats,
      hasPendingConflicts: conflicts.length > 0,
      isSyncing: syncing,
      hasError: !!error,
      errorMessage: error,
    };
  }, [syncStats, conflicts, syncing, error]);

  // Auto-sync si configuré
  useEffect(() => {
    // Vous pouvez ajouter une auto-sync ici
    // startSync();
  }, []);

  return {
    // State
    syncing,
    conflicts,
    currentConflict,
    syncStats,
    error,

    // Methods
    startSync,
    resolveConflict,
    rejectConflict,
    clearConflicts,
    retry,
    fetchLogs,
    getStats,
  };
};

export default useSync;
