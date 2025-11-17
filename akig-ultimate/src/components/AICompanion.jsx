import React, { useState } from 'react';
import { Brain, BarChart3, TrendingUp, MessageCircle, Zap, Target, Clock, AlertCircle } from 'lucide-react';

const AICompanion = () => {
  const [activeTab, setActiveTab] = useState('insights');
  const [expandedCard, setExpandedCard] = useState(null);

  const aiInsights = [
    {
      id: 1,
      category: 'Performance',
      icon: TrendingUp,
      title: 'Tendance positive détectée',
      description: 'Votre portefeuille a augmenté de 12% ce trimestre',
      color: 'from-[#0056B3] to-[#1E90FF]',
      action: 'Voir détails',
    },
    {
      id: 2,
      category: 'Opportunité',
      icon: Target,
      title: 'Nouveau marché identifié',
      description: 'Potentiel de 15% de rendement dans le secteur Ouest',
      color: 'from-[#CC0000] to-[#FF3333]',
      action: 'Analyser',
    },
    {
      id: 3,
      category: 'Alerte',
      icon: AlertCircle,
      title: 'Taux de vacance élevé',
      description: '3 propriétés avec taux vacant > 30%',
      color: 'from-[#FFC107] to-[#FFD700]',
      action: 'Résoudre',
    },
    {
      id: 4,
      category: 'Prévision',
      icon: Clock,
      title: 'Maintenance recommandée',
      description: 'Révision des systèmes prévue dans 15 jours',
      color: 'from-[#28A745] to-[#20C997]',
      action: 'Planifier',
    },
  ];

  const aiRecommendations = [
    {
      title: 'Optimisation des Loyers',
      description: 'Augmenter les tarifs de 8-12% en fonction du marché actuel',
      confidence: 95,
      impact: 'Revenu +45K€/an',
    },
    {
      title: 'Amélioration Énergétique',
      description: 'Rénover les systèmes de chauffage pour réduire les coûts',
      confidence: 82,
      impact: 'Économies +12K€/an',
    },
    {
      title: 'Stratégie Marketing',
      description: 'Investir dans les canaux digitaux pour meilleure visibilité',
      confidence: 78,
      impact: 'Croissance +25%',
    },
  ];

  return (
    <div className="w-full bg-gradient-to-br from-[#E6F2FF] via-white to-[#FFE6E6] p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-gradient-to-br from-[#0056B3] to-[#CC0000] p-4 rounded-xl shadow-lg">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#212529]">Compagnon IA AKIG</h1>
            <p className="text-[#495057] mt-1">Intelligence artificielle pour vos décisions immobilières</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 flex-wrap">
        {['insights', 'recommendations', 'chat'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 rounded-lg font-medium transition-all capitalize ${
              activeTab === tab
                ? 'bg-gradient-to-r from-[#0056B3] to-[#CC0000] text-white shadow-lg'
                : 'bg-white text-[#212529] border border-[#E9ECEF] hover:border-[#0056B3]'
            }`}
          >
            {tab === 'insights' && '📊 Insights'}
            {tab === 'recommendations' && '💡 Recommandations'}
            {tab === 'chat' && '💬 Assistant'}
          </button>
        ))}
      </div>

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {aiInsights.map((insight) => {
            const Icon = insight.icon;
            const isExpanded = expandedCard === insight.id;

            return (
              <div
                key={insight.id}
                onClick={() => setExpandedCard(isExpanded ? null : insight.id)}
                className={`bg-white border border-[#E9ECEF] rounded-2xl p-6 shadow-md hover:shadow-xl transition-all cursor-pointer overflow-hidden ${
                  isExpanded ? 'md:col-span-2' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`bg-gradient-to-br ${insight.color} p-4 rounded-xl flex-shrink-0`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-[#0056B3] uppercase tracking-wide">
                        {insight.category}
                      </span>
                      <Zap className="w-4 h-4 text-[#CC0000]" />
                    </div>
                    <h3 className="text-lg font-bold text-[#212529] mb-1">{insight.title}</h3>
                    <p className="text-sm text-[#495057]">{insight.description}</p>

                    {isExpanded && (
                      <div className="mt-4 p-4 bg-[#E6F2FF] rounded-lg border border-[#B3D9FF]">
                        <p className="text-sm text-[#212529] mb-3">
                          <strong>Analyse détaillée:</strong> Basé sur les données historiques et les tendances actuelles, ce{' '}
                          {insight.category.toLowerCase()} mérite une attention particulière pour optimiser vos résultats.
                        </p>
                        <div className="flex gap-2">
                          <button className="flex-1 bg-[#0056B3] hover:bg-[#003D82] text-white py-2 rounded-lg text-sm font-medium transition-all">
                            {insight.action}
                          </button>
                          <button className="flex-1 bg-white border border-[#0056B3] text-[#0056B3] hover:bg-[#E6F2FF] py-2 rounded-lg text-sm font-medium transition-all">
                            Partager
                          </button>
                        </div>
                      </div>
                    )}

                    {!isExpanded && (
                      <button className="mt-3 text-sm font-medium text-[#0056B3] hover:text-[#CC0000] transition-colors">
                        Plus d'infos →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recommendations Tab */}
      {activeTab === 'recommendations' && (
        <div className="space-y-4">
          {aiRecommendations.map((rec, idx) => (
            <div key={idx} className="bg-white border border-[#E9ECEF] rounded-2xl p-6 shadow-md hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-[#212529] mb-2">{rec.title}</h3>
                  <p className="text-sm text-[#495057]">{rec.description}</p>
                </div>
                <div className="flex-shrink-0 bg-gradient-to-br from-[#0056B3] to-[#CC0000] rounded-lg p-2">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-[#212529]">Niveau de confiance</span>
                    <span className="text-sm font-bold text-[#0056B3]">{rec.confidence}%</span>
                  </div>
                  <div className="h-2 bg-[#E9ECEF] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#0056B3] to-[#CC0000] transition-all duration-500"
                      style={{ width: `${rec.confidence}%` }}
                    />
                  </div>
                </div>

                <div className="bg-[#E6F2FF] border border-[#B3D9FF] rounded-lg p-3">
                  <p className="text-sm text-[#212529]">
                    <strong>Impact estimé:</strong> {rec.impact}
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button className="flex-1 bg-[#0056B3] hover:bg-[#003D82] text-white py-2 rounded-lg text-sm font-medium transition-all">
                    Implémenter
                  </button>
                  <button className="flex-1 bg-white border border-[#E9ECEF] hover:border-[#0056B3] text-[#212529] hover:text-[#0056B3] py-2 rounded-lg text-sm font-medium transition-all">
                    Détails
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <div className="bg-white rounded-2xl border border-[#E9ECEF] shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <MessageCircle className="w-6 h-6 text-[#0056B3]" />
            <h2 className="text-xl font-bold text-[#212529]">Assistant IA</h2>
          </div>

          <div className="bg-[#F8F9FA] rounded-xl p-4 mb-4 max-h-96 overflow-y-auto space-y-3">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0056B3] to-[#CC0000] flex items-center justify-center text-white text-sm font-bold">
                IA
              </div>
              <div className="bg-white border border-[#E9ECEF] rounded-lg p-3 text-sm text-[#212529] flex-1">
                Bonjour! Je suis votre assistant IA spécialisé dans l'immobilier. Comment puis-je vous aider?
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Posez votre question..."
              className="flex-1 border border-[#E9ECEF] rounded-lg px-4 py-3 focus:outline-none focus:border-[#0056B3] text-sm"
            />
            <button className="bg-gradient-to-r from-[#0056B3] to-[#CC0000] hover:from-[#003D82] hover:to-[#990000] text-white px-6 py-3 rounded-lg font-medium transition-all shadow-md hover:shadow-lg">
              Envoyer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AICompanion;
