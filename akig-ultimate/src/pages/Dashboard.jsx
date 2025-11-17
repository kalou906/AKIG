import { useState } from 'react';
import { ChevronDown, Sparkles, Brain, TrendingUp, Users, Home, FileText, Settings, MapPin, Zap } from 'lucide-react';

export default function Dashboard() {
  const [expandedSection, setExpandedSection] = useState(null);

  const sections = [
    { id: 'gestion', icon: Home, title: '🏠 Gestion Immobilière', items: ['Locataires', 'Contrats', 'Immeubles', 'Charges', 'Revenus'] },
    { id: 'recouvrement', icon: TrendingUp, title: '💰 Recouvrement', items: ['Recouvrement', 'Paiements', 'Place Marché'] },
    { id: 'operations', icon: Zap, title: '🔧 Opérations', items: ['Maintenance', 'Saisonnier'] },
    { id: 'reporting', icon: FileText, title: '📊 Reporting', items: ['Rapports', 'Analytics', 'Rapports Email'] },
    { id: 'client', icon: Users, title: '👥 Portails', items: ['Espace Client', 'Propriétaires'] },
    { id: 'admin', icon: Settings, title: '⚙️ Administration', items: ['Paramètres', 'Audit', 'Notifications'] },
    { id: 'search', icon: Brain, title: '🤖 IA & Recherche', items: ['Recherche Avancée', 'ChatBot IA', 'ML Prédictif'] },
    { id: 'geo', icon: MapPin, title: '🗺️ Géolocalisation', items: ['Cartographie', 'Mobile', 'Dashboard Perso'] },
  ];

  const kpis = [
    { label: 'Occupation', value: '92%', change: '+2.3%', color: '#0056B3' },
    { label: 'Revenus', value: '845M', change: '+12%', color: '#28A745' },
    { label: 'Impayés', value: '8', change: '-1', color: '#CC0000' },
    { label: 'Satisfaction', value: '4.7/5', change: '+0.2', color: '#FFC107' },
  ];

  return (
    <div className='min-h-screen bg-gradient-to-br from-[#E6F2FF] via-white to-[#FFE6E6]'>
      {/* Header Hero */}
      <div className='bg-gradient-to-r from-[#001F3F] via-[#0056B3] to-[#CC0000] px-8 py-12 text-white shadow-lg'>
        <div className='max-w-7xl mx-auto'>
          <div className='flex items-center gap-4 mb-4'>
            <div className='bg-white/20 backdrop-blur p-3 rounded-xl'>
              <Sparkles className='w-8 h-8' />
            </div>
            <h1 className='text-4xl md:text-5xl font-bold'>🏢 AKIG Immobilier</h1>
          </div>
          <p className='text-lg text-blue-100 max-w-2xl'>Plateforme intelligente de gestion immobilière avec IA avancée</p>
        </div>
      </div>

      {/* KPIs Section */}
      <div className='max-w-7xl mx-auto px-8 py-12'>
        <h2 className='text-2xl font-bold text-[#212529] mb-6'>📊 Indicateurs Clés</h2>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          {kpis.map((kpi, idx) => (
            <div key={idx} className='bg-white rounded-2xl shadow-lg p-6 border-l-4 hover:shadow-xl transition-all' style={{ borderLeftColor: kpi.color }}>
              <p className='text-sm text-[#495057] mb-2 font-medium'>{kpi.label}</p>
              <h3 className='text-3xl font-bold text-[#212529] mb-2'>{kpi.value}</h3>
              <p className='text-sm font-semibold text-green-600'>{kpi.change} vs mois dernier</p>
            </div>
          ))}
        </div>
      </div>

      {/* AI Premium Section */}
      <div className='max-w-7xl mx-auto px-8 py-8'>
        <div className='bg-gradient-to-r from-[#0056B3] to-[#CC0000] rounded-3xl p-8 shadow-2xl text-white overflow-hidden relative'>
          <div className='absolute top-0 right-0 opacity-10'>
            <Brain className='w-48 h-48' />
          </div>
          <div className='relative z-10'>
            <div className='flex items-center gap-3 mb-4'>
              <Sparkles className='w-8 h-8' />
              <h2 className='text-2xl font-bold'>✨ Votre Assistant IA Personnel</h2>
            </div>
            <p className='text-blue-100 mb-6 max-w-2xl'>Explorez les recommandations intelligentes, les insights en temps réel et l\'analyse prédictive pour optimiser votre portefeuille immobilier.</p>
            <button className='bg-white text-[#0056B3] hover:bg-[#F8F9FA] px-8 py-3 rounded-lg font-bold transition-all shadow-lg hover:shadow-xl'>
              Accéder à l\'IA Premium →
            </button>
          </div>
        </div>
      </div>

      {/* Modules Section */}
      <div className='max-w-7xl mx-auto px-8 pb-12'>
        <h2 className='text-2xl font-bold text-[#212529] mb-6'>🎯 Modules Disponibles</h2>
        <div className='space-y-3'>
          {sections.map(s => {
            const IconComponent = s.icon;
            const isExpanded = expandedSection === s.id;
            
            return (
              <div key={s.id} className='bg-white rounded-2xl shadow-md border border-[#E9ECEF] overflow-hidden hover:shadow-lg transition-all'>
                <button 
                  onClick={() => setExpandedSection(isExpanded ? null : s.id)} 
                  className='w-full px-8 py-5 flex justify-between items-center hover:bg-[#F8F9FA] transition-colors group'
                >
                  <div className='flex items-center gap-3'>
                    <div className='bg-gradient-to-br from-[#0056B3] to-[#CC0000] p-3 rounded-lg group-hover:shadow-lg transition-all'>
                      <IconComponent className='w-6 h-6 text-white' />
                    </div>
                    <h2 className='text-lg font-bold text-[#212529] group-hover:text-[#0056B3] transition-colors'>{s.title}</h2>
                  </div>
                  <ChevronDown 
                    className='w-6 h-6 text-[#0056B3] transition-transform' 
                    style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }} 
                  />
                </button>
                
                {isExpanded && (
                  <div className='bg-gradient-to-br from-[#E6F2FF] to-white px-8 py-6 border-t border-[#E9ECEF]'>
                    <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
                      {s.items.map((item, idx) => (
                        <a 
                          key={idx} 
                          href={'/' + item.toLowerCase().replace(/ /g, '-')} 
                          className='p-4 bg-white rounded-xl border-2 border-[#E9ECEF] hover:border-[#0056B3] hover:bg-[#E6F2FF] transition-all font-medium text-[#212529] hover:text-[#0056B3] text-center'
                        >
                          {item}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer CTA */}
      <div className='bg-[#F8F9FA] border-t border-[#E9ECEF] py-8'>
        <div className='max-w-7xl mx-auto px-8 text-center'>
          <p className='text-[#495057] mb-4'>Besoin d\'aide ? Consultez notre documentation ou contactez le support.</p>
          <div className='flex gap-4 justify-center flex-wrap'>
            <button className='bg-[#0056B3] hover:bg-[#003D82] text-white px-6 py-2 rounded-lg font-medium transition-all'>
              Documentation
            </button>
            <button className='bg-white border-2 border-[#0056B3] text-[#0056B3] hover:bg-[#E6F2FF] px-6 py-2 rounded-lg font-medium transition-all'>
              Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
