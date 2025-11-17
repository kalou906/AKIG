/**
 * ⚙️ SettingsEnhanced - Page de paramètres avancés avec tabs et animations
 */

import React, { useState } from 'react';
import { Settings, Bell, Lock, User, CreditCard, LogOut, ToggleLeft, ToggleRight, Save, Eye, EyeOff } from 'lucide-react';

export default function SettingsEnhanced() {
  const [activeTab, setActiveTab] = useState('account');
  const [showPassword, setShowPassword] = useState(false);
  const [settings, setSettings] = useState({
    firstName: 'Ahmed',
    lastName: 'Diallo',
    email: 'ahmed.diallo@akig.com',
    phone: '+224 620 000 001',
    notifications: {
      email: true,
      sms: false,
      push: true,
      paymentReminders: true,
    },
    security: {
      twoFactor: false,
      sessionTimeout: 30,
      loginAlerts: true,
    },
  });

  const tabs = [
    { id: 'account', label: 'Compte', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Sécurité', icon: Lock },
    { id: 'billing', label: 'Facturation', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-slideInDown">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Settings size={36} className="text-blue-600" />
            Paramètres
          </h1>
          <p className="text-gray-600">Gérez vos préférences et paramètres de compte</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-md mb-8 p-4 overflow-x-auto animate-slideInUp">
          <div className="flex gap-2 md:gap-0">
            {tabs.map((tab, i) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 md:flex-none px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105 flex items-center gap-2 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  style={{ animation: `slideInUp 0.5s ease-out ${i * 100}ms backwards` }}
                >
                  <Icon size={20} />
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden animate-fadeInScale">
          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="p-8 space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Informations Personnelles</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="animate-slideInLeft" style={{ animationDelay: '0ms' }}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                  <input
                    type="text"
                    defaultValue={settings.firstName}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="animate-slideInRight" style={{ animationDelay: '100ms' }}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                  <input
                    type="text"
                    defaultValue={settings.lastName}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="animate-slideInLeft" style={{ animationDelay: '200ms' }}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    defaultValue={settings.email}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="animate-slideInRight" style={{ animationDelay: '300ms' }}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                  <input
                    type="tel"
                    defaultValue={settings.phone}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <button className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all flex items-center gap-2 animate-slideInUp">
                <Save size={20} />
                Enregistrer les modifications
              </button>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="p-8 space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Préférences de Notifications</h2>

              <div className="space-y-4">
                {[
                  { key: 'email' as const, label: 'Notifications par Email', desc: 'Recevez les mises à jour importantes' },
                  { key: 'sms' as const, label: 'Notifications par SMS', desc: 'Alertes urgentes et rappels' },
                  { key: 'push' as const, label: 'Notifications Push', desc: 'Alertes en temps réel sur votre appareil' },
                  { key: 'paymentReminders' as const, label: 'Rappels de Paiement', desc: 'Notifications pour les loyers à venir' },
                ].map((item, i) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors animate-slideInUp"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div>
                      <p className="font-medium text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                    <button className="relative inline-flex items-center">
                      {settings.notifications[item.key] ? (
                        <ToggleRight size={32} className="text-green-500 animate-bounce" />
                      ) : (
                        <ToggleLeft size={32} className="text-gray-400" />
                      )}
                    </button>
                  </div>
                ))}
              </div>

              <button className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all flex items-center gap-2 animate-slideInUp">
                <Save size={20} />
                Enregistrer les préférences
              </button>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="p-8 space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Paramètres de Sécurité</h2>

              <div className="space-y-6">
                {/* Change Password */}
                <div className="p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border-2 border-red-200 animate-slideInLeft">
                  <h3 className="font-bold text-gray-900 mb-4">Changer le Mot de Passe</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe actuel</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          className="w-full px-4 py-2 pr-10 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                        />
                        <button
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-2.5 text-gray-500"
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nouveau mot de passe</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <button className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition-all">
                    Mettre à jour le mot de passe
                  </button>
                </div>

                {/* Two-Factor Authentication */}
                <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-200 animate-slideInRight">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">Authentification à Deux Facteurs</h3>
                    {settings.security.twoFactor ? (
                      <span className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-xs font-bold">Activé</span>
                    ) : (
                      <span className="px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-xs font-bold">Désactivé</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mb-4">Sécurisez votre compte avec une authentification à deux facteurs</p>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-all">
                    {settings.security.twoFactor ? 'Désactiver' : 'Activer'}
                  </button>
                </div>

                {/* Session Timeout */}
                <div className="p-6 bg-gray-50 rounded-lg border-2 border-gray-200 animate-slideInUp">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Délai d'expiration de session (minutes)</label>
                  <input
                    type="range"
                    min="5"
                    max="120"
                    defaultValue={settings.security.sessionTimeout}
                    className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="text-sm text-gray-600 mt-2">Actuel: {settings.security.sessionTimeout} minutes</p>
                </div>
              </div>
            </div>
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <div className="p-8 space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Facturation et Abonnement</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Current Plan */}
                <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border-2 border-green-300 animate-slideInLeft">
                  <h3 className="font-bold text-gray-900 mb-2">Plan Actuel</h3>
                  <p className="text-3xl font-bold text-green-600 mb-2">Premium</p>
                  <p className="text-sm text-gray-700 mb-4">Renouvellement: 15 Décembre 2025</p>
                  <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition-all">
                    Gérer l'abonnement
                  </button>
                </div>

                {/* Billing Method */}
                <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-300 animate-slideInRight">
                  <h3 className="font-bold text-gray-900 mb-2">Méthode de Paiement</h3>
                  <p className="text-sm text-gray-700 mb-4">Carte Visa terminant par 4242</p>
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition-all">
                    Mettre à jour
                  </button>
                </div>
              </div>

              {/* Invoice History */}
              <div className="border-t pt-6 animate-slideInUp">
                <h3 className="font-bold text-gray-900 mb-4">Historique des Factures</h3>
                <div className="space-y-2">
                  {[
                    { date: '01 Nov 2025', amount: '99,99 €', status: 'Payée' },
                    { date: '01 Oct 2025', amount: '99,99 €', status: 'Payée' },
                    { date: '01 Sep 2025', amount: '99,99 €', status: 'Payée' },
                  ].map((invoice, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors animate-slideInUp"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div>
                        <p className="font-medium text-gray-900">{invoice.date}</p>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">{invoice.status}</span>
                      </div>
                      <p className="font-bold text-gray-900">{invoice.amount}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <div className="mt-8 flex justify-center animate-slideInUp" style={{ animationDelay: '600ms' }}>
          <button className="flex items-center gap-2 px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
            <LogOut size={20} />
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  );
}
