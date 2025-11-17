// ============================================================
// ⚙️  Settings Page - Configuration Système et Utilisateur
// ============================================================

import React, { useState } from 'react';
import { Save, Bell, Lock, User, Database, Globe } from 'lucide-react';
import { Button, Card, FormField, Alert } from '../components';

const Settings = () => {
    const [activeTab, setActiveTab] = useState('profile');
    const [saved, setSaved] = useState(false);
    const [formData, setFormData] = useState({
        fullName: 'Démo User',
        email: 'demo@akig.com',
        phone: '+224 622 123 456',
        company: 'AKIG Properties',
        language: 'fr',
        timezone: 'GMT+0'
    });

    const [notificationSettings, setNotificationSettings] = useState({
        emailOverduePayments: true,
        emailExpiringContracts: true,
        emailDailyReport: false,
        smsReminders: true,
        pushNotifications: true
    });

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const tabs = [
        { id: 'profile', label: 'Profil', icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Sécurité', icon: Lock },
        { id: 'system', label: 'Système', icon: Globe }
    ];

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
                <p className="text-gray-600 mt-1">Gérez votre profil et vos préférences</p>
            </div>

            {/* Saved Alert */}
            {saved && (
                <Alert variant="success">
                    ✓ Vos modifications ont été sauvegardées avec succès
                </Alert>
            )}

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <Icon size={18} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            {activeTab === 'profile' && (
                <div className="space-y-6">
                    <Card header="Informations Personnelles">
                        <div className="space-y-5">
                            <div className="grid grid-cols-2 gap-5">
                                <FormField
                                    label="Nom Complet"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                />
                                <FormField
                                    label="Email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <FormField
                                    label="Téléphone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                                <FormField
                                    label="Entreprise"
                                    value={formData.company}
                                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                />
                            </div>
                        </div>
                    </Card>

                    <Card header="Préférences Régionales">
                        <div className="space-y-5">
                            <div className="grid grid-cols-2 gap-5">
                                <FormField
                                    label="Langue"
                                    type="select"
                                    value={formData.language}
                                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                                    options={[
                                        { label: 'Français', value: 'fr' },
                                        { label: 'English', value: 'en' },
                                        { label: 'Arabic', value: 'ar' }
                                    ]}
                                />
                                <FormField
                                    label="Fuseau Horaire"
                                    type="select"
                                    value={formData.timezone}
                                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                                    options={[
                                        { label: 'GMT+0 (Guinée)', value: 'GMT+0' },
                                        { label: 'GMT+1 (Sénégal)', value: 'GMT+1' },
                                        { label: 'GMT+2 (Afrique Centrale)', value: 'GMT+2' }
                                    ]}
                                />
                            </div>
                        </div>
                    </Card>

                    <div className="flex justify-end gap-3">
                        <Button variant="secondary">Annuler</Button>
                        <Button variant="primary" icon={Save} onClick={handleSave}>
                            Enregistrer les modifications
                        </Button>
                    </div>
                </div>
            )}

            {activeTab === 'notifications' && (
                <div className="space-y-6">
                    <Card header="Notifications Email">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                <div>
                                    <p className="font-medium text-gray-900">Paiements en retard</p>
                                    <p className="text-sm text-gray-600">Recevoir une alerte si un paiement est en retard de 5+ jours</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={notificationSettings.emailOverduePayments}
                                    onChange={(e) => setNotificationSettings({ ...notificationSettings, emailOverduePayments: e.target.checked })}
                                    className="w-5 h-5 rounded text-blue-600"
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                <div>
                                    <p className="font-medium text-gray-900">Contrats expirant</p>
                                    <p className="text-sm text-gray-600">Notification 30 jours avant expiration d'un contrat</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={notificationSettings.emailExpiringContracts}
                                    onChange={(e) => setNotificationSettings({ ...notificationSettings, emailExpiringContracts: e.target.checked })}
                                    className="w-5 h-5 rounded text-blue-600"
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                <div>
                                    <p className="font-medium text-gray-900">Rapport quotidien</p>
                                    <p className="text-sm text-gray-600">Reçois un résumé quotidien à 08:00</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={notificationSettings.emailDailyReport}
                                    onChange={(e) => setNotificationSettings({ ...notificationSettings, emailDailyReport: e.target.checked })}
                                    className="w-5 h-5 rounded text-blue-600"
                                />
                            </div>
                        </div>
                    </Card>

                    <Card header="Notifications SMS & Push">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                <div>
                                    <p className="font-medium text-gray-900">Rappels SMS</p>
                                    <p className="text-sm text-gray-600">Recevoir des SMS pour les paiements importants</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={notificationSettings.smsReminders}
                                    onChange={(e) => setNotificationSettings({ ...notificationSettings, smsReminders: e.target.checked })}
                                    className="w-5 h-5 rounded text-blue-600"
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                <div>
                                    <p className="font-medium text-gray-900">Notifications Push</p>
                                    <p className="text-sm text-gray-600">Notifications en temps réel dans l'application</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={notificationSettings.pushNotifications}
                                    onChange={(e) => setNotificationSettings({ ...notificationSettings, pushNotifications: e.target.checked })}
                                    className="w-5 h-5 rounded text-blue-600"
                                />
                            </div>
                        </div>
                    </Card>

                    <div className="flex justify-end gap-3">
                        <Button variant="secondary">Réinitialiser</Button>
                        <Button variant="primary" icon={Save} onClick={handleSave}>
                            Enregistrer les préférences
                        </Button>
                    </div>
                </div>
            )}

            {activeTab === 'security' && (
                <div className="space-y-6">
                    <Card header="Sécurité du Compte">
                        <div className="space-y-5">
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-900">
                                    <strong>Authentification 2FA:</strong> Activez l'authentification à deux facteurs pour sécuriser votre compte
                                </p>
                            </div>
                            <Button variant="secondary" className="w-full">
                                Activer l'authentification 2FA
                            </Button>
                        </div>
                    </Card>

                    <Card header="Mot de Passe">
                        <div className="space-y-5">
                            <FormField
                                label="Mot de passe actuel"
                                type="password"
                                placeholder="••••••••"
                            />
                            <FormField
                                label="Nouveau mot de passe"
                                type="password"
                                placeholder="••••••••"
                            />
                            <FormField
                                label="Confirmer le nouveau mot de passe"
                                type="password"
                                placeholder="••••••••"
                            />
                        </div>
                    </Card>

                    <Card header="Sessions Actives">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="font-medium text-gray-900">Session actuelle</p>
                                    <p className="text-xs text-gray-600">Windows • Chrome • 192.168.1.1</p>
                                </div>
                                <span className="text-xs font-semibold text-green-600">Actif</span>
                            </div>
                        </div>
                    </Card>

                    <div className="flex justify-end gap-3">
                        <Button variant="secondary">Annuler</Button>
                        <Button variant="primary" icon={Save} onClick={handleSave}>
                            Mettre à jour la sécurité
                        </Button>
                    </div>
                </div>
            )}

            {activeTab === 'system' && (
                <div className="space-y-6">
                    <Card header="Information Système">
                        <div className="space-y-3">
                            <div className="flex justify-between py-3 border-b border-gray-200">
                                <span className="text-gray-600">Version AKIG:</span>
                                <span className="font-semibold text-gray-900">1.0.0 Premium Edition</span>
                            </div>
                            <div className="flex justify-between py-3 border-b border-gray-200">
                                <span className="text-gray-600">Base de données:</span>
                                <span className="font-semibold text-gray-900">PostgreSQL 15</span>
                            </div>
                            <div className="flex justify-between py-3 border-b border-gray-200">
                                <span className="text-gray-600">Dernière mise à jour:</span>
                                <span className="font-semibold text-gray-900">2024-01-15</span>
                            </div>
                            <div className="flex justify-between py-3">
                                <span className="text-gray-600">Statut:</span>
                                <span className="font-semibold text-green-600">✓ En ligne</span>
                            </div>
                        </div>
                    </Card>

                    <Card header="Données & Sauvegarde">
                        <div className="space-y-3">
                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-sm text-yellow-900">
                                    <strong>Avertissement:</strong> L'export des données est une action irréversible. Procédez avec prudence.
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="secondary" className="flex-1">
                                    <Database size={18} />
                                    Télécharger sauvegarde
                                </Button>
                                <Button variant="secondary" className="flex-1">
                                    <Database size={18} />
                                    Restaurer sauvegarde
                                </Button>
                            </div>
                        </div>
                    </Card>

                    <Card header="Maintenance">
                        <div className="space-y-3">
                            <Button variant="secondary" className="w-full">
                                Vider le cache
                            </Button>
                            <Button variant="secondary" className="w-full">
                                Réindexer la base de données
                            </Button>
                            <Button variant="danger" className="w-full">
                                Réinitialiser l'application
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default Settings;
