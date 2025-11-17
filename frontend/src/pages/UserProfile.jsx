import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Save, Lock, LogOut, Trash2, Settings, User, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';

/**
 * Page Gestion du Profil Utilisateur
 * 
 * Fonctionnalités:
 * - Affichage et édition du profil
 * - Changement de mot de passe
 * - Gestion des préférences
 * - Suppression de compte
 * - Statistiques utilisateur
 */
export default function UserProfile() {
  const navigate = useNavigate();

  // États du formulaire
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('info'); // info, password, preferences, stats
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Édition profil
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    adresse: '',
    code_postal: '',
    ville: '',
    profession: '',
    entreprise: '',
    bio: ''
  });

  // Changement mot de passe
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Préférences
  const [preferences, setPreferences] = useState({
    langue: 'fr',
    timezone: 'Europe/Paris',
    notifications_actives: true,
    theme: 'light'
  });

  // Statistiques
  const [stats, setStats] = useState(null);

  // Suppression compte
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  // Charger profil au montage
  useEffect(() => {
    loadUserProfile();
  }, []);

  // Charger profil utilisateur
  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get('/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const userData = response.data.data;
        setProfile(userData);
        setFormData({
          nom: userData.nom || '',
          prenom: userData.prenom || '',
          email: userData.email || '',
          telephone: userData.telephone || '',
          adresse: userData.adresse || '',
          code_postal: userData.code_postal || '',
          ville: userData.ville || '',
          profession: userData.profession || '',
          entreprise: userData.entreprise || '',
          bio: userData.bio || ''
        });

        if (userData.preferences) {
          setPreferences(userData.preferences);
        }
      }
    } catch (err) {
      setError('Erreur chargement profil: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Charger statistiques
  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/users/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('Erreur statistiques:', err);
    }
  };

  // Mettre à jour profil
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      const token = localStorage.getItem('token');

      const response = await axios.patch('/api/users/profile', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setProfile(response.data.data);
        setSuccess('Profil mis à jour avec succès');
        setIsEditing(false);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError('Erreur mise à jour: ' + err.response?.data?.error || err.message);
    }
  };

  // Changer mot de passe
  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      setError(null);

      // Validation
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError('Les mots de passe ne correspondent pas');
        return;
      }

      if (passwordData.newPassword.length < 8) {
        setError('Le mot de passe doit contenir au moins 8 caractères');
        return;
      }

      const token = localStorage.getItem('token');

      const response = await axios.post('/api/users/password/change', passwordData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSuccess('Mot de passe changé avec succès');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError('Erreur changement mot de passe: ' + err.response?.data?.error || err.message);
    }
  };

  // Mettre à jour préférences
  const handleUpdatePreferences = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      const token = localStorage.getItem('token');

      const response = await axios.patch('/api/users/preferences', preferences, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSuccess('Préférences mises à jour');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError('Erreur mise à jour préférences: ' + err.message);
    }
  };

  // Supprimer compte
  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      const token = localStorage.getItem('token');

      const response = await axios.delete('/api/users/account', {
        headers: { Authorization: `Bearer ${token}` },
        data: { password: deletePassword }
      });

      if (response.data.success) {
        setSuccess('Compte supprimé. Redirection...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      setError('Erreur suppression: ' + err.response?.data?.error || err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
              <User className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {profile?.prenom} {profile?.nom}
              </h1>
              <p className="text-gray-600">{profile?.email}</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-600 p-4 mb-6 rounded flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Erreur</p>
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-600 p-4 mb-6 rounded flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-800 font-medium">{success}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
          <div className="flex border-b">
            <button
              onClick={() => { setActiveTab('info'); setIsEditing(false); }}
              className={`flex-1 px-6 py-4 font-medium flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'info'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <User className="w-5 h-5" />
              Profil
            </button>
            <button
              onClick={() => { setActiveTab('password'); setIsEditing(false); }}
              className={`flex-1 px-6 py-4 font-medium flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'password'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Lock className="w-5 h-5" />
              Mot de passe
            </button>
            <button
              onClick={() => { setActiveTab('preferences'); setIsEditing(false); }}
              className={`flex-1 px-6 py-4 font-medium flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'preferences'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Settings className="w-5 h-5" />
              Préférences
            </button>
            <button
              onClick={() => { setActiveTab('stats'); if (activeTab !== 'stats') loadStats(); setIsEditing(false); }}
              className={`flex-1 px-6 py-4 font-medium flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'stats'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Settings className="w-5 h-5" />
              Statistiques
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {/* Tab: Profil */}
            {activeTab === 'info' && (
              <div>
                {isEditing ? (
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                        <input
                          type="text"
                          value={formData.prenom}
                          onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                        <input
                          type="text"
                          value={formData.nom}
                          onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                        <input
                          type="tel"
                          value={formData.telephone}
                          onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Profession</label>
                        <input
                          type="text"
                          value={formData.profession}
                          onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Entreprise</label>
                        <input
                          type="text"
                          value={formData.entreprise}
                          onChange={(e) => setFormData({ ...formData, entreprise: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                        <input
                          type="text"
                          value={formData.adresse}
                          onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Code Postal</label>
                        <input
                          type="text"
                          value={formData.code_postal}
                          onChange={(e) => setFormData({ ...formData, code_postal: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Ville</label>
                        <input
                          type="text"
                          value={formData.ville}
                          onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                        <textarea
                          value={formData.bio}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                          rows="4"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center gap-2"
                      >
                        <Save className="w-5 h-5" />
                        Enregistrer
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="flex-1 bg-gray-200 text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-300"
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-gray-600">Prénom</p>
                        <p className="font-medium text-gray-900">{profile?.prenom || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Nom</p>
                        <p className="font-medium text-gray-900">{profile?.nom || '-'}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium text-gray-900">{profile?.email || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Téléphone</p>
                        <p className="font-medium text-gray-900">{profile?.telephone || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Profession</p>
                        <p className="font-medium text-gray-900">{profile?.profession || '-'}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-600">Adresse</p>
                        <p className="font-medium text-gray-900">{profile?.adresse || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Code Postal</p>
                        <p className="font-medium text-gray-900">{profile?.code_postal || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Ville</p>
                        <p className="font-medium text-gray-900">{profile?.ville || '-'}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsEditing(true)}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
                    >
                      Modifier le profil
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Mot de passe */}
            {activeTab === 'password' && (
              <form onSubmit={handleChangePassword} className="space-y-6 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe actuel</label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className="absolute right-3 top-2.5 text-gray-600"
                    >
                      {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nouveau mot de passe</label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute right-3 top-2.5 text-gray-600"
                    >
                      {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Minimum 8 caractères, 1 majuscule, 1 chiffre, 1 caractère spécial</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirmer le mot de passe</label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-3 top-2.5 text-gray-600"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Lock className="w-5 h-5" />
                  Changer le mot de passe
                </button>
              </form>
            )}

            {/* Tab: Préférences */}
            {activeTab === 'preferences' && (
              <form onSubmit={handleUpdatePreferences} className="space-y-6 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Langue</label>
                  <select
                    value={preferences.langue}
                    onChange={(e) => setPreferences({ ...preferences, langue: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                    <option value="es">Español</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fuseau horaire</label>
                  <select
                    value={preferences.timezone}
                    onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Europe/Paris">Europe/Paris (GMT+1)</option>
                    <option value="Europe/London">Europe/London (GMT+0)</option>
                    <option value="America/New_York">America/New_York (GMT-5)</option>
                    <option value="Asia/Tokyo">Asia/Tokyo (GMT+9)</option>
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="notifications"
                    checked={preferences.notifications_actives}
                    onChange={(e) => setPreferences({ ...preferences, notifications_actives: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600"
                  />
                  <label htmlFor="notifications" className="text-sm text-gray-700">Activer les notifications</label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Thème</label>
                  <select
                    value={preferences.theme}
                    onChange={(e) => setPreferences({ ...preferences, theme: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="light">Clair</option>
                    <option value="dark">Sombre</option>
                    <option value="auto">Automatique</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Enregistrer les préférences
                </button>
              </form>
            )}

            {/* Tab: Statistiques */}
            {activeTab === 'stats' && stats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-6">
                  <p className="text-sm text-blue-600 font-semibold">Connexions totales</p>
                  <p className="text-3xl font-bold text-blue-900 mt-2">{stats.total_logins || 0}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-6">
                  <p className="text-sm text-green-600 font-semibold">Déconnexions</p>
                  <p className="text-3xl font-bold text-green-900 mt-2">{stats.total_logouts || 0}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-6">
                  <p className="text-sm text-purple-600 font-semibold">Changements de mot de passe</p>
                  <p className="text-3xl font-bold text-purple-900 mt-2">{stats.password_changes || 0}</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-6">
                  <p className="text-sm text-yellow-600 font-semibold">Jours actifs</p>
                  <p className="text-3xl font-bold text-yellow-900 mt-2">{stats.active_days || 0}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-6">
                  <p className="text-sm text-red-600 font-semibold">Sessions actives</p>
                  <p className="text-3xl font-bold text-red-900 mt-2">{stats.total_sessions || 0}</p>
                </div>
                {stats.last_activity && (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <p className="text-sm text-gray-600 font-semibold">Dernière activité</p>
                    <p className="text-sm font-mono text-gray-900 mt-2">{new Date(stats.last_activity).toLocaleString('fr-FR')}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-red-900 mb-4">Zone Dangereuse</h3>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 flex items-center gap-2"
          >
            <Trash2 className="w-5 h-5" />
            Supprimer mon compte
          </button>
        </div>

        {/* Modal Suppression */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Supprimer votre compte?</h3>
              <p className="text-gray-600 mb-6">Cette action est irréversible. Tous vos données seront supprimées.</p>
              
              <form onSubmit={handleDeleteAccount} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe de confirmation</label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Entrez votre mot de passe"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700"
                  >
                    Supprimer définitivement
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowDeleteModal(false); setDeletePassword(''); }}
                    className="flex-1 bg-gray-200 text-gray-900 py-2 rounded-lg font-semibold hover:bg-gray-300"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
