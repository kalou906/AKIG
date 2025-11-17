/**
 * 💳 Composant Moyens de Paiement Guinée - AKIG
 * 
 * Affichage et sélection des moyens de paiement
 */

import React, { useState, useEffect } from 'react';
import { useGuineanPaymentMethods, useGuineaCurrency } from '../hooks/useGuinea';

const PaymentMethodsComponent = ({
  amount = 0,
  onMethodSelect = () => {},
  selectedMethod = null,
  showFees = true
}) => {
  const { paymentMethods, isLoading, error, calculateFees, recommendMethods } = useGuineanPaymentMethods();
  const { formatGnf } = useGuineaCurrency();
  const [recommended, setRecommended] = useState([]);
  const [fees, setFees] = useState({});
  const [filter, setFilter] = useState('ALL');

  // Charger les méthodes recommandées si montant change
  useEffect(() => {
    if (amount > 0) {
      loadRecommendedMethods();
      loadFees();
    }
  }, [amount]);

  const loadRecommendedMethods = async () => {
    const rec = await recommendMethods(amount);
    setRecommended(rec.map(m => m.id) || []);
  };

  const loadFees = async () => {
    const newFees = {};
    for (const method of paymentMethods) {
      const feeInfo = await calculateFees(method.id, amount);
      if (feeInfo) {
        newFees[method.id] = feeInfo;
      }
    }
    setFees(newFees);
  };

  const displayMethods = filter === 'ALL'
    ? paymentMethods
    : paymentMethods.filter(m => m.type === filter);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-2">💳</div>
          <p className="text-gray-500">Chargement moyens de paiement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        Erreur lors du chargement des moyens de paiement
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === 'ALL'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Tous
        </button>
        <button
          onClick={() => setFilter('MOBILE_MONEY')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === 'MOBILE_MONEY'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📱 Mobile Money
        </button>
        <button
          onClick={() => setFilter('BANK_TRANSFER')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === 'BANK_TRANSFER'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          🏦 Bancaire
        </button>
      </div>

      {/* Montant et infos */}
      {amount > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Montant à payer:</p>
              <p className="text-2xl font-bold text-blue-600">{formatGnf(amount)}</p>
            </div>
            {recommended.length > 0 && (
              <div className="text-right">
                <p className="text-sm text-green-600 font-semibold">✅ {recommended.length} option(s) recommandée(s)</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Grille moyens de paiement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayMethods.map((method) => {
          const isRecommended = recommended.includes(method.id);
          const feeInfo = fees[method.id];

          return (
            <div
              key={method.id}
              onClick={() => onMethodSelect(method)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition relative ${
                selectedMethod?.id === method.id
                  ? 'border-blue-600 bg-blue-50'
                  : isRecommended
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-200 bg-white hover:border-blue-400 hover:shadow-lg'
              }`}
            >
              {/* Badge recommandé */}
              {isRecommended && (
                <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                  ⭐ Recommandé
                </div>
              )}

              {/* Header */}
              <div className="flex items-start gap-3 mb-3">
                <span className="text-4xl">{method.icon}</span>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{method.name}</h3>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${
                    method.type === 'MOBILE_MONEY' ? 'bg-blue-100 text-blue-700' :
                    method.type === 'BANK_TRANSFER' ? 'bg-purple-100 text-purple-700' :
                    method.type === 'CASH' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {method.type}
                  </span>
                </div>
              </div>

              {/* Frais */}
              <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                <div>
                  <p className="text-xs text-gray-600">Frais:</p>
                  <p className="font-semibold text-red-600">{method.fees}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Temps:</p>
                  <p className="font-semibold text-blue-600">{method.processingTime}</p>
                </div>
              </div>

              {/* Calcul frais pour ce montant */}
              {feeInfo && showFees && amount > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-3 text-xs">
                  <div className="flex justify-between mb-1">
                    <span>Montant:</span>
                    <span className="font-bold">{formatGnf(feeInfo.amount)}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span>Frais ({feeInfo.feePercentage}%):</span>
                    <span className="font-bold text-red-600">{formatGnf(feeInfo.fees)}</span>
                  </div>
                  <div className="flex justify-between border-t border-yellow-200 pt-1 mt-1 font-bold">
                    <span>Total à payer:</span>
                    <span className="text-blue-600">{formatGnf(feeInfo.total)}</span>
                  </div>
                </div>
              )}

              {/* Limites */}
              <div className="text-xs text-gray-600 space-y-1 mb-3">
                {method.minAmount && (
                  <p>Min: {formatGnf(method.minAmount)}</p>
                )}
                {method.maxAmount && (
                  <p>Max: {formatGnf(method.maxAmount)}</p>
                )}
              </div>

              {/* Populaire */}
              {method.popular && (
                <div className="text-center text-sm font-semibold text-yellow-600">
                  🌟 Très populaire
                </div>
              )}
            </div>
          );
        })}
      </div>

      {displayMethods.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          Aucun moyen de paiement trouvé pour cette catégorie
        </div>
      )}
    </div>
  );
};

export default PaymentMethodsComponent;
