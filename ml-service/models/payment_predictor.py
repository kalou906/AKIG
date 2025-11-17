# models/payment_predictor.py
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sklearn.model_selection import TimeSeriesSplit
from xgboost import XGBClassifier
import joblib
from typing import Dict, List, Optional

class PaymentPredictor:
    """
    Modèle IA de prédiction de solvabilité avec feature engineering avancé
    """
    def __init__(self):
        self.model = XGBClassifier(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.1,
            subsample=0.8,
            random_state=42,
            scale_pos_weight=3  # Pour gérer le déséquilibre des classes
        )
        self.feature_columns = []
        self.delay_model = None
        
    def engineer_features(self, transactions: pd.DataFrame) -> pd.DataFrame:
        """Feature engineering robuste pour la prédiction"""
        
        features = pd.DataFrame()
        
        # 1. Historique de paiement (30, 60, 90 jours)
        for days in [30, 60, 90]:
            mask = transactions['due_date'] >= datetime.now() - timedelta(days=days)
            recent_transactions = transactions[mask]
            
            features[f'payment_ratio_{days}d'] = (
                recent_transactions.groupby('tenant_id')['amount_paid'].sum() / 
                recent_transactions.groupby('tenant_id')['amount_due'].sum()
            ).fillna(0)
            
            features[f'delay_avg_{days}d'] = (
                recent_transactions.groupby('tenant_id')['delay_days'].mean()
            ).fillna(0)
            
            features[f'late_payments_count_{days}d'] = (
                recent_transactions[recent_transactions['delay_days'] > 7]
                .groupby('tenant_id').size()
            ).fillna(0)
        
        # 2. Patterns de paiement
        features['payment_consistency'] = transactions.groupby('tenant_id').apply(
            lambda x: x['delay_days'].std()
        ).fillna(0)
        
        features['days_since_last_payment'] = transactions.groupby('tenant_id').apply(
            lambda x: (datetime.now() - x['payment_date'].max()).days if pd.notna(x['payment_date'].max()) else 999
        ).fillna(999)
        
        # 3. Score de gravité pondéré
        features['severity_score'] = transactions.groupby('tenant_id').apply(
            lambda x: (x['delay_days'] * x['amount_due']).sum() / x['amount_due'].sum() if x['amount_due'].sum() > 0 else 0
        ).fillna(0)
        
        # 4. Recency, Frequency, Monetary (RFM)
        features['recency'] = transactions.groupby('tenant_id')['payment_date'].apply(
            lambda x: (datetime.now() - x.max()).days if pd.notna(x.max()) else 999
        ).fillna(999)
        features['frequency'] = transactions.groupby('tenant_id').size()
        features['monetary'] = transactions.groupby('tenant_id')['amount_paid'].sum()
        
        # 5. Indicateurs binaires
        features['has_unpaid_invoices'] = (transactions.groupby('tenant_id')['status']
                                          .apply(lambda x: (x == 'unpaid').any()).astype(int))
        
        self.feature_columns = features.columns.tolist()
        return features.fillna(0)
    
    def calculate_payment_probability(self, tenant_id: str, features: pd.DataFrame) -> Dict:
        """Calcule la probabilité de paiement et le badge associé"""
        
        if tenant_id not in features.index:
            return {
                'tenant_id': tenant_id,
                'payment_probability': 0.0,
                'risk_level': 'UNKNOWN',
                'badge': '⚪',
                'color': '#94a3b8',
                'expected_payment_date': None,
                'confidence_score': 0.0,
                'factors': [{'type': 'INSUFFICIENT_DATA', 'severity': 'HIGH', 'message': 'Données insuffisantes'}],
                'calculated_at': datetime.now().isoformat()
            }
        
        client_features = features.loc[[tenant_id]]
        proba = self.model.predict_proba(client_features)[0][1]
        
        # Classification avec seuils optimisés
        if proba >= 0.8:
            risk_level = 'EXCELLENT'
            badge = '🟢'
            color = '#10b981'
        elif proba >= 0.6:
            risk_level = 'GOOD'
            badge = '🟡'
            color = '#f59e0b'
        elif proba >= 0.4:
            risk_level = 'MEDIUM'
            badge = '🟠'
            color = '#f97316'
        elif proba >= 0.2:
            risk_level = 'RISKY'
            badge = '🔴'
            color = '#ef4444'
        else:
            risk_level = 'CRITICAL'
            badge = '⚫'
            color = '#000000'
        
        # Anticipation de la date de paiement
        expected_delay = self._predict_delay(client_features)
        expected_payment_date = datetime.now() + timedelta(days=float(expected_delay))
        
        # Facteurs explicatifs
        factors = self._explain_prediction(client_features)
        
        return {
            'tenant_id': tenant_id,
            'payment_probability': float(proba),
            'risk_level': risk_level,
            'badge': badge,
            'color': color,
            'expected_payment_date': expected_payment_date.isoformat(),
            'confidence_score': self._calculate_confidence(client_features),
            'factors': factors,
            'calculated_at': datetime.now().isoformat()
        }
    
    def _predict_delay(self, features: pd.DataFrame) -> float:
        """Prédit le nombre de jours de retard basé sur les features"""
        if self.delay_model is None:
            # Modèle simple basé sur la moyenne pondérée
            delay = features.iloc[0]['delay_avg_30d'] * 0.5 + features.iloc[0]['delay_avg_60d'] * 0.3 + features.iloc[0]['delay_avg_90d'] * 0.2
            return max(0, delay)
        return self.delay_model.predict(features)[0]
    
    def _explain_prediction(self, features: pd.DataFrame) -> List[Dict]:
        """Génère des explications compréhensibles"""
        explanations = []
        feature_vals = features.iloc[0]
        
        if feature_vals['payment_ratio_30d'] < 0.5:
            explanations.append({
                'type': 'LOW_PAYMENT_PROBABILITY',
                'severity': 'HIGH',
                'message': f"Faible taux de paiement sur 30 derniers jours ({feature_vals['payment_ratio_30d']*100:.1f}%)"
            })
        if feature_vals['delay_avg_60d'] > 15:
            explanations.append({
                'type': 'HIGH_DELAY',
                'severity': 'CRITICAL',
                'message': f"Retard moyen élevé sur 60 derniers jours ({feature_vals['delay_avg_60d']:.1f} jours)"
            })
        if feature_vals['days_since_last_payment'] > 30:
            explanations.append({
                'type': 'INSUFFICIENT_DATA',
                'severity': 'MEDIUM',
                'message': f"Aucun paiement reçu depuis {int(feature_vals['days_since_last_payment'])} jours"
            })
        if feature_vals['severity_score'] > 50:
            explanations.append({
                'type': 'HIGH_DELAY',
                'severity': 'CRITICAL',
                'message': f"Score de gravité élevé (montants importants en retard)"
            })
        
        return explanations[:3]  # Top 3 facteurs
    
    def _calculate_confidence(self, features: pd.DataFrame) -> float:
        """Calcule un score de confiance basé sur le volume de données"""
        feature_vals = features.iloc[0]
        confidence = min(100, (
            feature_vals['frequency'] * 5 +  # Plus de transactions = plus de confiance
            (0 if feature_vals['recency'] > 90 else 50)  # Données récentes
        ))
        return float(confidence) / 100
    
    def train(self, transactions: pd.DataFrame, labels: pd.Series):
        """Entraîne le modèle"""
        features = self.engineer_features(transactions)
        self.model.fit(features, labels)
        
    def save_model(self, filepath: str):
        """Sauvegarde le modèle entraîné"""
        joblib.dump(self.model, filepath)
        
    def load_model(self, filepath: str):
        """Charge un modèle pré-entraîné"""
        self.model = joblib.load(filepath)
