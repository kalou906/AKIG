/**
 * Sync Screen
 * mobile/src/screens/SyncScreen.jsx
 * 
 * Écran pour gérer la synchronisation et les conflits
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import useSync from '../hooks/useSync';
import ConflictResolution from '../components/ConflictResolution';
import logger from '../services/logger';

const SyncScreen = ({ navigation }) => {
  const RESOURCES = ['properties', 'tenants', 'contracts', 'payments', 'feedback'];
  const {
    syncing,
    conflicts,
    currentConflict,
    syncStats,
    error,
    startSync,
    resolveConflict,
    rejectConflict,
    clearConflicts,
    retry,
    fetchLogs,
    getStats,
  } = useSync(RESOURCES);

  const [showConflictResolution, setShowConflictResolution] = useState(false);
  const [logs, setLogs] = useState([]);
  const [selectedTab, setSelectedTab] = useState('status');

  // Auto-load logs et stats
  useFocusEffect(
    React.useCallback(() => {
      loadLogs();
    }, [])
  );

  const loadLogs = async () => {
    const syncLogs = await fetchLogs();
    setLogs(syncLogs);
  };

  const handleStartSync = async () => {
    Alert.alert('Synchroniser', 'Voulez-vous synchroniser toutes les données ?', [
      { text: 'Annuler', onPress: () => {} },
      { text: 'Confirmer', onPress: () => startSync() },
    ]);
  };

  const handleResolveConflict = async (fieldResolutions) => {
    try {
      await resolveConflict(fieldResolutions);
      if (conflicts.length === 0) {
        setShowConflictResolution(false);
        Alert.alert('Succès', 'Tous les conflits ont été résolus !');
      }
    } catch (err) {
      Alert.alert('Erreur', err.message);
    }
  };

  const handleClearConflicts = () => {
    Alert.alert('Effacer les conflits', 'Êtes-vous sûr ? Cette action est irréversible.', [
      { text: 'Annuler' },
      { text: 'Confirmer', onPress: () => clearConflicts() },
    ]);
  };

  const stats = getStats();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={syncing} onRefresh={startSync} />}
    >
      {/* Header Alert */}
      {error && (
        <View style={styles.alertBox}>
          <MaterialIcons name="error" size={20} color="#F44336" />
          <Text style={styles.alertText}>{error}</Text>
          <TouchableOpacity onPress={retry}>
            <Text style={styles.alertLink}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabBar}>
        {['status', 'conflicts', 'logs'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selectedTab === tab && styles.tabActive]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text style={[styles.tabLabel, selectedTab === tab && styles.tabLabelActive]}>
              {tab === 'status' ? 'Statut' : tab === 'conflicts' ? 'Conflits' : 'Logs'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* TAB: Status */}
      {selectedTab === 'status' && (
        <View style={styles.content}>
          {/* Sync Stats */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <MaterialIcons name="cloud-sync" size={28} color="#2196F3" />
              </View>
              <Text style={styles.statValue}>{stats.synced}</Text>
              <Text style={styles.statLabel}>Synchronisé</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <MaterialIcons name="error-outline" size={28} color="#FF9800" />
              </View>
              <Text style={styles.statValue}>{stats.errors}</Text>
              <Text style={styles.statLabel}>Erreurs</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <MaterialIcons name="warning" size={28} color="#F44336" />
              </View>
              <Text style={styles.statValue}>{stats.conflicts}</Text>
              <Text style={styles.statLabel}>Conflits</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <MaterialIcons name="schedule" size={28} color="#4CAF50" />
              </View>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>Ressources</Text>
            </View>
          </View>

          {/* Sync Status */}
          <View style={styles.statusSection}>
            <Text style={styles.sectionTitle}>État de la Synchronisation</Text>

            <View style={styles.statusCard}>
              <View style={styles.statusRow}>
                <MaterialIcons
                  name={stats.isSyncing ? 'hourglass-empty' : 'check-circle'}
                  size={24}
                  color={stats.isSyncing ? '#FF9800' : '#4CAF50'}
                />
                <Text style={styles.statusText}>
                  {stats.isSyncing ? 'Synchronisation en cours...' : 'À jour'}
                </Text>
              </View>

              {stats.hasPendingConflicts && (
                <View style={[styles.statusRow, { marginTop: 12 }]}>
                  <MaterialIcons name="warning" size={24} color="#F44336" />
                  <Text style={styles.statusText}>
                    {stats.conflicts} conflit(s) en attente
                  </Text>
                </View>
              )}

              {stats.hasError && (
                <View style={[styles.statusRow, { marginTop: 12 }]}>
                  <MaterialIcons name="error" size={24} color="#F44336" />
                  <Text style={styles.statusText}>{stats.errorMessage}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary, syncing && styles.buttonDisabled]}
              onPress={handleStartSync}
              disabled={syncing}
            >
              {syncing ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <MaterialIcons name="sync" size={20} color="white" />
                  <Text style={styles.buttonText}>Synchroniser</Text>
                </>
              )}
            </TouchableOpacity>

            {stats.hasPendingConflicts && (
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => setShowConflictResolution(true)}
              >
                <MaterialIcons name="gavel" size={20} color="#2196F3" />
                <Text style={[styles.buttonText, { color: '#2196F3' }]}>
                  Résoudre les Conflits
                </Text>
              </TouchableOpacity>
            )}

            {stats.hasPendingConflicts && (
              <TouchableOpacity
                style={[styles.button, styles.buttonDanger]}
                onPress={handleClearConflicts}
              >
                <MaterialIcons name="delete" size={20} color="#F44336" />
                <Text style={[styles.buttonText, { color: '#F44336' }]}>Effacer les Conflits</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Info */}
          <View style={styles.infoBox}>
            <MaterialIcons name="info" size={16} color="#2196F3" />
            <Text style={styles.infoText}>
              Les données seront synchronisées avec le serveur. Les conflits doivent être résolus
              manuellement.
            </Text>
          </View>
        </View>
      )}

      {/* TAB: Conflicts */}
      {selectedTab === 'conflicts' && (
        <View style={styles.content}>
          {currentConflict && showConflictResolution ? (
            <View>
              <ConflictResolution
                server={currentConflict.server}
                local={currentConflict.local}
                fields={currentConflict.conflictedFields}
                onChoose={() => {}}
                onResolveAll={handleResolveConflict}
                loading={syncing}
              />
            </View>
          ) : conflicts.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="check-circle" size={48} color="#4CAF50" />
              <Text style={styles.emptyStateText}>Aucun conflit</Text>
              <Text style={styles.emptyStateSubtext}>Toutes les données sont synchronisées</Text>
            </View>
          ) : (
            <View>
              <Text style={styles.sectionTitle}>Conflits en Attente</Text>
              {conflicts.map((conflict, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.conflictCard}
                  onPress={() => setShowConflictResolution(true)}
                >
                  <View style={styles.conflictHeader}>
                    <MaterialIcons name="warning" size={24} color="#F44336" />
                    <View style={styles.conflictInfo}>
                      <Text style={styles.conflictResource}>{conflict.resource}</Text>
                      <Text style={styles.conflictSubtext}>
                        {conflict.conflictedFields.length} champ(s) en conflit
                      </Text>
                    </View>
                  </View>
                  <View style={styles.conflictFields}>
                    {conflict.conflictedFields.map((field) => (
                      <Text key={field} style={styles.conflictField}>
                        • {field}
                      </Text>
                    ))}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {/* TAB: Logs */}
      {selectedTab === 'logs' && (
        <View style={styles.content}>
          {logs.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="history" size={48} color="#999" />
              <Text style={styles.emptyStateText}>Aucun log</Text>
              <Text style={styles.emptyStateSubtext}>Les logs de synchronisation apparaîtront ici</Text>
            </View>
          ) : (
            <View>
              <Text style={styles.sectionTitle}>Historique de Synchronisation</Text>
              {logs.slice(-20).reverse().map((log, index) => (
                <View key={index} style={styles.logCard}>
                  <View style={styles.logHeader}>
                    <Text style={styles.logResource}>{log.resource}</Text>
                    <Text style={[styles.logStatus, { color: log.status === 'completed' ? '#4CAF50' : '#F44336' }]}>
                      {log.status}
                    </Text>
                  </View>
                  <Text style={styles.logAction}>{log.action}</Text>
                  <Text style={styles.logTime}>
                    {new Date(log.timestamp).toLocaleString('fr-FR')}
                  </Text>
                  {log.details && Object.keys(log.details).length > 0 && (
                    <Text style={styles.logDetails}>{JSON.stringify(log.details, null, 2)}</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderBottomWidth: 1,
    borderBottomColor: '#F44336',
    padding: 16,
    gap: 12,
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    color: '#C62828',
    fontWeight: '500',
  },
  alertLink: {
    fontSize: 12,
    color: '#F44336',
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: 'white',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#2196F3',
  },
  tabLabel: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#2196F3',
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    elevation: 1,
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
  },
  statusSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    elevation: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  actionsSection: {
    gap: 12,
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  buttonPrimary: {
    backgroundColor: '#2196F3',
  },
  buttonSecondary: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  buttonDanger: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
    padding: 12,
    borderRadius: 4,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#1976D2',
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  conflictCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
  },
  conflictHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  conflictInfo: {
    flex: 1,
  },
  conflictResource: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
  },
  conflictSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  conflictFields: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  conflictField: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  logCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    elevation: 1,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logResource: {
    fontSize: 13,
    fontWeight: '600',
    color: '#212121',
  },
  logStatus: {
    fontSize: 11,
    fontWeight: '600',
  },
  logAction: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  logTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  logDetails: {
    fontSize: 10,
    color: '#999',
    fontFamily: 'monospace',
    marginTop: 8,
    backgroundColor: '#F5F5F5',
    padding: 8,
    borderRadius: 4,
  },
});

export default SyncScreen;
