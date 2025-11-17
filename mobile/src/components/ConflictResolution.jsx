/**
 * Conflict Resolution Component
 * mobile/src/components/ConflictResolution.jsx
 * 
 * Affiche les conflits de synchronisation et permet de les résoudre
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const ConflictResolution = ({ server, local, fields, onChoose, onResolveAll, loading = false }) => {
  const [selections, setSelections] = useState({});
  const [expanded, setExpanded] = useState(null);

  const handleChoose = (field, source) => {
    setSelections((prev) => ({ ...prev, [field]: source }));
    onChoose(field, source);
  };

  const handleResolveAll = async () => {
    const unresolved = fields.filter((f) => !selections[f]);
    if (unresolved.length > 0) {
      Alert.alert(
        'Conflits non résolus',
        `${unresolved.length} champ(s) non résolu(s): ${unresolved.join(', ')}`
      );
      return;
    }

    try {
      await onResolveAll(selections);
      Alert.alert('Succès', 'Tous les conflits ont été résolus');
      setSelections({});
    } catch (error) {
      Alert.alert('Erreur', error.message);
    }
  };

  const getFieldDifference = (field) => {
    const serverValue = server[field];
    const localValue = local[field];

    // Comparer les valeurs
    if (JSON.stringify(serverValue) === JSON.stringify(localValue)) {
      return 'identical';
    }

    // Déterminer le type de changement
    if (!serverValue && localValue) return 'local_added';
    if (serverValue && !localValue) return 'server_deleted';
    if (typeof serverValue === 'number' && typeof localValue === 'number') {
      return 'numeric_change';
    }
    return 'modified';
  };

  const getDifferenceLabel = (type) => {
    const labels = {
      identical: 'Identique',
      local_added: 'Ajouté localement',
      server_deleted: 'Supprimé sur serveur',
      numeric_change: 'Valeur numérique différente',
      modified: 'Modifié',
    };
    return labels[type] || 'Différent';
  };

  const getDifferenceColor = (type) => {
    const colors = {
      identical: '#4CAF50',
      local_added: '#2196F3',
      server_deleted: '#FF9800',
      numeric_change: '#FF9800',
      modified: '#F44336',
    };
    return colors[type] || '#9E9E9E';
  };

  const formatValue = (value) => {
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    if (typeof value === 'boolean') {
      return value ? 'Oui' : 'Non';
    }
    if (value === null || value === undefined) {
      return '(vide)';
    }
    return String(value);
  };

  const resolvedCount = Object.keys(selections).length;
  const conflictCount = fields.length;
  const progress = (resolvedCount / conflictCount) * 100;

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <MaterialIcons name="warning" size={32} color="#F44336" />
        <Text style={styles.title}>Résolution de Conflits</Text>
        <Text style={styles.subtitle}>
          {resolvedCount}/{conflictCount} conflits résolus
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>

      {/* Summary Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Total</Text>
          <Text style={styles.statValue}>{conflictCount}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Résolus</Text>
          <Text style={[styles.statValue, { color: '#4CAF50' }]}>{resolvedCount}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Restants</Text>
          <Text style={[styles.statValue, { color: '#F44336' }]}>
            {conflictCount - resolvedCount}
          </Text>
        </View>
      </View>

      {/* Fields */}
      <View style={styles.fieldsContainer}>
        {fields.map((field, index) => {
          const differenceType = getFieldDifference(field);
          const isResolved = selections[field];
          const isExpanded = expanded === field;

          return (
            <View key={field} style={styles.fieldCard}>
              {/* Field Header */}
              <TouchableOpacity
                style={[
                  styles.fieldHeader,
                  isResolved && styles.fieldHeaderResolved,
                  differenceType === 'identical' && styles.fieldHeaderIdentical,
                ]}
                onPress={() => setExpanded(isExpanded ? null : field)}
              >
                <View style={styles.fieldHeaderLeft}>
                  {isResolved ? (
                    <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
                  ) : (
                    <MaterialIcons name="error" size={24} color="#F44336" />
                  )}
                  <View style={styles.fieldInfo}>
                    <Text style={styles.fieldName}>{field}</Text>
                    <Text
                      style={[
                        styles.fieldDifference,
                        { color: getDifferenceColor(differenceType) },
                      ]}
                    >
                      {getDifferenceLabel(differenceType)}
                    </Text>
                  </View>
                </View>
                <MaterialIcons
                  name={isExpanded ? 'expand-less' : 'expand-more'}
                  size={24}
                  color="#666"
                />
              </TouchableOpacity>

              {/* Expanded Content */}
              {isExpanded && (
                <View style={styles.fieldContent}>
                  {/* Server Value */}
                  <View style={styles.valueBox}>
                    <View style={styles.valueHeader}>
                      <MaterialIcons name="cloud" size={16} color="#2196F3" />
                      <Text style={styles.valueLabel}>Serveur</Text>
                      {isResolved && selections[field] === 'server' && (
                        <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
                      )}
                    </View>
                    <Text style={styles.valueText}>{formatValue(server[field])}</Text>
                    <TouchableOpacity
                      style={[
                        styles.button,
                        selections[field] === 'server' && styles.buttonSelected,
                      ]}
                      onPress={() => handleChoose(field, 'server')}
                      disabled={loading}
                    >
                      <MaterialIcons
                        name={selections[field] === 'server' ? 'radio-button-checked' : 'radio-button-unchecked'}
                        size={20}
                        color={selections[field] === 'server' ? '#2196F3' : '#999'}
                      />
                      <Text
                        style={[
                          styles.buttonText,
                          selections[field] === 'server' && styles.buttonTextSelected,
                        ]}
                      >
                        Garder serveur
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Divider */}
                  <View style={styles.divider} />

                  {/* Local Value */}
                  <View style={styles.valueBox}>
                    <View style={styles.valueHeader}>
                      <MaterialIcons name="smartphone" size={16} color="#FF9800" />
                      <Text style={styles.valueLabel}>Local</Text>
                      {isResolved && selections[field] === 'local' && (
                        <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
                      )}
                    </View>
                    <Text style={styles.valueText}>{formatValue(local[field])}</Text>
                    <TouchableOpacity
                      style={[
                        styles.button,
                        selections[field] === 'local' && styles.buttonSelected,
                      ]}
                      onPress={() => handleChoose(field, 'local')}
                      disabled={loading}
                    >
                      <MaterialIcons
                        name={selections[field] === 'local' ? 'radio-button-checked' : 'radio-button-unchecked'}
                        size={20}
                        color={selections[field] === 'local' ? '#FF9800' : '#999'}
                      />
                      <Text
                        style={[
                          styles.buttonText,
                          selections[field] === 'local' && styles.buttonTextSelected,
                        ]}
                      >
                        Garder local
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Auto-merge suggestion */}
                  {differenceType === 'local_added' && (
                    <View style={styles.suggestionBox}>
                      <MaterialIcons name="lightbulb" size={16} color="#FFC107" />
                      <Text style={styles.suggestionText}>
                        Suggestion: Garder local (ajouté localement)
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleChoose(field, 'local')}
                        disabled={loading}
                      >
                        <Text style={styles.suggestionLink}>Appliquer</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {differenceType === 'server_deleted' && (
                    <View style={styles.suggestionBox}>
                      <MaterialIcons name="lightbulb" size={16} color="#FFC107" />
                      <Text style={styles.suggestionText}>
                        Suggestion: Garder serveur (supprimé sur serveur)
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleChoose(field, 'server')}
                        disabled={loading}
                      >
                        <Text style={styles.suggestionLink}>Appliquer</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonPrimary, loading && styles.buttonDisabled]}
          onPress={handleResolveAll}
          disabled={loading || resolvedCount !== conflictCount}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <MaterialIcons name="check" size={20} color="white" />
              <Text style={styles.actionButtonText}>Résoudre tous les conflits</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Info Box */}
      <View style={styles.infoBox}>
        <MaterialIcons name="info" size={16} color="#2196F3" />
        <Text style={styles.infoText}>
          Sélectionnez la version à conserver pour chaque champ en conflit, puis validez.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212121',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  progressContainer: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    elevation: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212121',
  },
  fieldsContainer: {
    marginBottom: 20,
  },
  fieldCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 1,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FAFAFA',
  },
  fieldHeaderResolved: {
    backgroundColor: '#F1F8E9',
  },
  fieldHeaderIdentical: {
    backgroundColor: '#E8F5E9',
  },
  fieldHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  fieldInfo: {
    flex: 1,
  },
  fieldName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
  },
  fieldDifference: {
    fontSize: 12,
    marginTop: 4,
  },
  fieldContent: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  valueBox: {
    marginBottom: 16,
  },
  valueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  valueLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    flex: 1,
  },
  valueText: {
    fontSize: 12,
    color: '#333',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 4,
    marginBottom: 12,
    fontFamily: 'monospace',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
    gap: 8,
  },
  buttonSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  buttonText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  buttonTextSelected: {
    color: '#2196F3',
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },
  suggestionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDE7',
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
    padding: 12,
    borderRadius: 4,
    gap: 8,
    marginTop: 12,
  },
  suggestionText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
  },
  suggestionLink: {
    fontSize: 12,
    color: '#FFC107',
    fontWeight: '600',
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonPrimary: {
    backgroundColor: '#2196F3',
  },
  actionButtonText: {
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
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#1976D2',
    lineHeight: 18,
  },
});

export default ConflictResolution;
