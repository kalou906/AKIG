import React, { useState } from 'react';
import {
  Brain,
  Sparkles,
  TrendingUp,
  BarChart3,
  MessageCircle,
  Zap,
  Target,
  Lock,
  Award,
  Rocket,
  Star,
} from 'lucide-react';
import AIInterface from './AIInterface';

const IAModule = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [showFullChat, setShowFullChat] = useState(false);

  if (showFullChat) {
    return (
      <div>
        <button
          onClick={() => setShowFullChat(false)}
          className="m-4 px-6 py-2 bg-[#CC0000] hover:bg-[#990000] text-white rounded-lg font-medium transition-all"
        >
          ← Retour
        </button>
        <AIInterface />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E6F2FF] via-white to-[#FFE6E6]">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#001F3F] via-[#0056B3] to-[#CC0000] px-8 py-16 text-white text-center">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="bg-white/20 backdrop-blur p-4 rounded-2xl">
              <Brain className="w-12 h-12" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-4">IA Immobilière de Nouvelle Génération</h1>
          <p className="text-xl text-blue-100 mb-8">
            Exploitez la puissance de l'intelligence artificielle pour optimiser votre portefeuille
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={() => setShowFullChat(true)}
              className="bg-white text-[#0056B3] hover:bg-[#F8F9FA] px-8 py-3 rounded-lg font-bold transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Ouvrir Chat IA
            </button>
            <button className="bg-[#CC0000] hover:bg-[#990000] text-white px-8 py-3 rounded-lg font-bold transition-all shadow-lg hover:shadow-xl flex items-center gap-2">
              <Star className="w-5 h-5" />
              Accès Premium
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-[#E9ECEF] sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-4 flex gap-6 overflow-x-auto">
          {[
            { id: 'overview', label: '📊 Vue d\'ensemble', icon: BarChart3 },
            { id: 'features', label: '✨ Fonctionnalités', icon: Sparkles },
            { id: 'insights', label: '🧠 Insights IA', icon: Brain },
            { id: 'pricing', label: '💎 Tarification', icon: Award },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`px-6 py-2 font-medium transition-all whitespace-nowrap ${
                activeSection === tab.id
                  ? 'text-[#0056B3] border-b-4 border-[#0056B3]'
                  : 'text-[#495057] hover:text-[#0056B3]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Section */}
      {activeSection === 'overview' && (
        <div className="max-w-7xl mx-auto px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: Rocket,
                title: 'Démarrage Rapide',
                description: 'Interface intuitive pour commencer immédiatement',
              },
              {
                icon: Zap,
                title: 'Performance',
                description: 'Analyses en temps réel avec résultats instantanés',
              },
              {
                icon: Lock,
                title: 'Sécurité',
                description: 'Données chiffrées et conformes RGPD',
              },
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-all border border-[#E9ECEF]">
                  <div className="bg-gradient-to-br from-[#0056B3] to-[#CC0000] p-4 rounded-xl w-fit mb-4">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-[#212529] mb-3">{feature.title}</h3>
                  <p className="text-[#495057]">{feature.description}</p>
                </div>
              );
            })}
          </div>

          {/* Quick Stats */}
          <div className="bg-gradient-to-r from-[#E6F2FF] to-[#FFE6E6] rounded-2xl p-8 border-2 border-[#0056B3]">
            <h2 className="text-2xl font-bold text-[#212529] mb-8">📈 Impact Mesurable</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Gain de Temps', value: '65%', desc: 'moins de temps sur l\'analyse' },
                { label: 'Rentabilité', value: '+24%', desc: 'augmentation moyenne' },
                { label: 'Prévision Exacte', value: '94%', desc: 'précision des modèles' },
                { label: 'Utilisateurs Actifs', value: '2.4K+', desc: 'professionnels satisfaits' },
              ].map((stat, idx) => (
                <div key={idx} className="text-center">
                  <p className="text-3xl font-bold text-[#0056B3] mb-2">{stat.value}</p>
                  <p className="font-bold text-[#212529] mb-1">{stat.label}</p>
                  <p className="text-sm text-[#495057]">{stat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Features Section */}
      {activeSection === 'features' && (
        <div className="max-w-7xl mx-auto px-8 py-16">
          <h2 className="text-3xl font-bold text-[#212529] mb-12">Fonctionnalités Premium</h2>
          <div className="space-y-6">
            {[
              {
                title: '🤖 Chatbot Conversationnel',
                description: 'Posez vos questions en langage naturel et recevez des réponses expertes',
                features: ['Multi-langue', 'Compréhension contextuelle', 'Apprentissage continu'],
              },
              {
                title: '📊 Tableau de Bord Intelligent',
                description: 'Visualisez vos données avec des graphiques interactifs',
                features: ['Dashboards personnalisés', 'Métriques en temps réel', 'Exports PDF'],
              },
              {
                title: '🎯 Recommandations Prédictives',
                description: 'Recevez des suggestions basées sur l\'analyse de vos données',
                features: ['ML prédictif', 'Alertes intelligentes', 'Optimisation automatique'],
              },
              {
                title: '📈 Analyse de Marché',
                description: 'Analysez les tendances du marché immobilier en temps réel',
                features: ['Données géolocalisées', 'Benchmarking', 'Prévisions de prix'],
              },
            ].map((feature, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-8 shadow-md hover:shadow-lg transition-all border-l-4 border-[#0056B3]">
                <h3 className="text-2xl font-bold text-[#212529] mb-3">{feature.title}</h3>
                <p className="text-[#495057] mb-4">{feature.description}</p>
                <div className="flex gap-3 flex-wrap">
                  {feature.features.map((f, i) => (
                    <span key={i} className="bg-[#E6F2FF] text-[#0056B3] px-4 py-2 rounded-full text-sm font-medium">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights Section */}
      {activeSection === 'insights' && (
        <div className="max-w-7xl mx-auto px-8 py-16">
          <h2 className="text-3xl font-bold text-[#212529] mb-12">Insights IA en Action</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                title: 'Anomalies Détectées',
                content: 'L\'IA a identifié 3 propriétés avec taux de vacance anormal',
                icon: '⚠️',
                color: 'from-[#FFE6E6]',
              },
              {
                title: 'Opportunités de Croissance',
                content: 'Potentiel de 18% de rendement dans le secteur Nord',
                icon: '📈',
                color: 'from-[#E6F2FF]',
              },
              {
                title: 'Optimisation Proposée',
                content: 'Augmentez les loyers de 12% pour maximiser les revenus',
                icon: '💡',
                color: 'from-[#FFE6E6]',
              },
              {
                title: 'Maintenance Prédictive',
                content: 'Révision requise dans 12 jours pour 2 installations',
                icon: '🔧',
                color: 'from-[#E6F2FF]',
              },
            ].map((insight, idx) => (
              <div key={idx} className={`bg-gradient-to-br ${insight.color} to-white rounded-2xl p-8 shadow-md border border-[#E9ECEF]`}>
                <div className="text-4xl mb-4">{insight.icon}</div>
                <h3 className="text-xl font-bold text-[#212529] mb-3">{insight.title}</h3>
                <p className="text-[#495057]">{insight.content}</p>
                <button className="mt-4 text-[#0056B3] font-bold hover:text-[#CC0000] transition-colors">
                  En savoir plus →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pricing Section */}
      {activeSection === 'pricing' && (
        <div className="max-w-7xl mx-auto px-8 py-16">
          <h2 className="text-3xl font-bold text-[#212529] mb-12 text-center">Plans de Tarification</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Starter',
                price: 'Gratuit',
                desc: 'Pour débuter',
                features: ['Chat basique', 'Dashboard simple', '5 analyses/mois'],
              },
              {
                name: 'Pro',
                price: '99€/mois',
                desc: 'Recommandé',
                features: ['Chat illimité', 'Dashboards avancés', 'Analyses illimitées', 'Support prioritaire'],
                featured: true,
              },
              {
                name: 'Enterprise',
                price: 'Sur devis',
                desc: 'Pour les grands portefeuilles',
                features: ['Tous les services', 'API personnalisée', 'Support 24/7', 'Training dédié'],
              },
            ].map((plan, idx) => (
              <div
                key={idx}
                className={`rounded-2xl p-8 shadow-md transition-all ${
                  plan.featured
                    ? 'bg-gradient-to-br from-[#0056B3] to-[#CC0000] text-white border-2 border-[#0056B3] transform scale-105'
                    : 'bg-white border border-[#E9ECEF] text-[#212529]'
                }`}
              >
                {plan.featured && <div className="mb-4 inline-block bg-white/20 px-4 py-2 rounded-full text-sm font-bold">⭐ POPULAIRE</div>}
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className={plan.featured ? 'text-blue-100' : 'text-[#495057]'}>{plan.desc}</p>
                <div className="my-6 text-4xl font-bold">{plan.price}</div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  className={`w-full py-3 rounded-lg font-bold transition-all ${
                    plan.featured
                      ? 'bg-white text-[#0056B3] hover:bg-[#F8F9FA]'
                      : 'bg-[#0056B3] text-white hover:bg-[#003D82]'
                  }`}
                >
                  Choisir ce plan
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA Footer */}
      <div className="bg-gradient-to-r from-[#001F3F] to-[#CC0000] text-white py-16 px-8 text-center">
        <h2 className="text-3xl font-bold mb-4">Prêt à révolutionner votre immobilier ?</h2>
        <p className="text-xl text-blue-100 mb-8">Rejoignez les professionnels qui font confiance à AKIG IA</p>
        <button
          onClick={() => setShowFullChat(true)}
          className="bg-white text-[#0056B3] hover:bg-[#F8F9FA] px-10 py-4 rounded-lg font-bold transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-2"
        >
          <MessageCircle className="w-5 h-5" />
          Commencer Maintenant
        </button>
      </div>
    </div>
  );
};

export default IAModule;
