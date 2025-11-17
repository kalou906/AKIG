import React, { useState } from 'react';
import { Settings, Bell, Users, Palette, Database, Lock, Globe, ChevronRight } from 'lucide-react';

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('general');
  const [settings, setSettings] = useState({
    general: {
      companyName: 'AKIG Immobilier',
      email: 'admin@akig.com',
      phone: '+33 1 23 45 67 89',
      timezone: 'Europe/Paris'
    },
    notifications: {
      emailAlerts: true,
      pushNotifications: true,
      dailySummary: true,
      weeklyReport: false
    },
    appearance: {
      theme: 'light',
      language: 'fr',
      colorScheme: 'guinea' // Blue #0056B3, Red #CC0000
    },
    security: {
      twoFactorAuth: false,
      passwordExpiry: 90,
      sessionTimeout: 30
    }
  });

  const sections = [
    { id: 'general', label: 'Général', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'roles', label: 'Rôles & Permissions', icon: Users },
    { id: 'appearance', label: 'Apparence', icon: Palette },
    { id: 'database', label: 'Base de Données', icon: Database },
    { id: 'security', label: 'Sécurité', icon: Lock }
  ];

  const handleSettingChange = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: { ...prev[section], [key]: value }
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#001F3F] via-[#0056B3] to-[#CC0000] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings size={32} />
            Paramètres Système
          </h1>
          <p className="text-blue-100 mt-1">Configuration et préférences d'AKIG</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {sections.map(section => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-4 border-l-4 transition ${
                      activeSection === section.id
                        ? 'border-[#0056B3] bg-blue-50 text-[#0056B3]'
                        : 'border-transparent hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="flex-1 text-left font-medium">{section.label}</span>
                    <ChevronRight size={18} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            {/* General Settings */}
            {activeSection === 'general' && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Paramètres Généraux</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nom de l'Entreprise</label>
                    <input
                      type="text"
                      value={settings.general.companyName}
                      onChange={(e) => handleSettingChange('general', 'companyName', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0056B3]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email Principal</label>
                    <input
                      type="email"
                      value={settings.general.email}
                      onChange={(e) => handleSettingChange('general', 'email', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0056B3]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Téléphone</label>
                    <input
                      type="tel"
                      value={settings.general.phone}
                      onChange={(e) => handleSettingChange('general', 'phone', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0056B3]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Fuseau Horaire</label>
                    <select
                      value={settings.general.timezone}
                      onChange={(e) => handleSettingChange('general', 'timezone', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0056B3]"
                    >
                      <option>Europe/Paris</option>
                      <option>Europe/London</option>
                      <option>Europe/Berlin</option>
                    </select>
                  </div>
                  <button className="w-full bg-gradient-to-r from-[#0056B3] to-[#003D82] text-white py-3 rounded-lg font-semibold hover:shadow-lg transition">
                    Enregistrer les Paramètres
                  </button>
                </div>
              </div>
            )}

            {/* Notifications Settings */}
            {activeSection === 'notifications' && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Notifications</h2>
                <div className="space-y-4">
                  {[
                    { key: 'emailAlerts', label: 'Alertes Email' },
                    { key: 'pushNotifications', label: 'Notifications Push' },
                    { key: 'dailySummary', label: 'Résumé Quotidien' },
                    { key: 'weeklyReport', label: 'Rapport Hebdomadaire' }
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <span className="font-medium text-gray-700">{item.label}</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notifications[item.key]}
                          onChange={(e) => handleSettingChange('notifications', item.key, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0056B3]"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Roles & Permissions */}
            {activeSection === 'roles' && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Rôles & Permissions</h2>
                <div className="space-y-4">
                  {[
                    { role: 'PDG', perms: ['Vue complète', 'Gestion équipe', 'Configuration système', 'Approbations'] },
                    { role: 'Comptable', perms: ['Finances', 'Rapports', 'Transactions', 'Exports'] },
                    { role: 'Agent', perms: ['Opérations', 'Propriétés', 'Leads', 'Tâches'] }
                  ].map((item, idx) => (
                    <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-bold text-[#0056B3] mb-2">{item.role}</h4>
                      <div className="flex flex-wrap gap-2">
                        {item.perms.map((perm, pidx) => (
                          <span key={pidx} className="px-3 py-1 bg-blue-100 text-[#0056B3] rounded-full text-sm font-medium">
                            {perm}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Appearance Settings */}
            {activeSection === 'appearance' && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Apparence</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Thème</label>
                    <select
                      value={settings.appearance.theme}
                      onChange={(e) => handleSettingChange('appearance', 'theme', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0056B3]"
                    >
                      <option value="light">Clair</option>
                      <option value="dark">Sombre</option>
                      <option value="auto">Automatique</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Langue</label>
                    <select
                      value={settings.appearance.language}
                      onChange={(e) => handleSettingChange('appearance', 'language', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0056B3]"
                    >
                      <option value="fr">Français</option>
                      <option value="en">Anglais</option>
                      <option value="es">Espagnol</option>
                    </select>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-3">Palette de Couleurs</p>
                    <div className="flex gap-4">
                      <button className="w-20 h-20 rounded-lg bg-gradient-to-r from-[#0056B3] to-[#CC0000] border-2 border-gray-300 hover:border-[#0056B3]" title="Guinéenne"></button>
                      <button className="w-20 h-20 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 border-2 border-gray-300 hover:border-blue-500" title="Moderne"></button>
                      <button className="w-20 h-20 rounded-lg bg-gradient-to-r from-green-500 to-teal-500 border-2 border-gray-300 hover:border-green-500" title="Nature"></button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeSection === 'security' && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Sécurité</h2>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-800">Authentification à Deux Facteurs</p>
                      <p className="text-sm text-gray-600 mt-1">Sécurisez votre compte avec 2FA</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.security.twoFactorAuth}
                        onChange={(e) => handleSettingChange('security', 'twoFactorAuth', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0056B3]"></div>
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Expiration du Mot de Passe (jours)</label>
                    <input
                      type="number"
                      value={settings.security.passwordExpiry}
                      onChange={(e) => handleSettingChange('security', 'passwordExpiry', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0056B3]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Délai Session (minutes)</label>
                    <input
                      type="number"
                      value={settings.security.sessionTimeout}
                      onChange={(e) => handleSettingChange('security', 'sessionTimeout', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0056B3]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
