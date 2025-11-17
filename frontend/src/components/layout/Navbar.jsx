// ============================================================
// 📍 Navbar Component - Header avec User Profile & Notifications
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, User, LogOut, Settings, Search, MessageSquare, Zap } from 'lucide-react';
import { useUIConfig } from '../../context/UIConfigContext';
import NotificationCenter from '../notifications/NotificationCenter';
import GlobalSearch from '../search/GlobalSearch';

// Helper pour parser localStorage en sécurité
const safeParse = (key, fallback = {}) => {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch (error) {
        console.warn(`[Navbar] Invalid JSON in localStorage key: ${key}`, error);
        return fallback;
    }
};

const Navbar = ({ onLogout, onOpenGeniusPanel }) => {
    const navigate = useNavigate();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { geniusEnabled, toggleGenius, uiMode } = useUIConfig();

    const user = safeParse('user', {});

    const handleLogout = () => {
        if (onLogout) {
            onLogout();
        }
        navigate('/login');
    };

    const handleSearch = (e) => {
        if (e.key === 'Enter' && searchQuery) {
            setShowSearch(true);
        }
    };

    useEffect(() => {
        const handler = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                if (onOpenGeniusPanel) onOpenGeniusPanel();
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
                e.preventDefault();
                setShowSearch(true);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onOpenGeniusPanel]);

    return (
        <nav className={`sticky top-0 z-30 ${geniusEnabled ? 'bg-transparent' : uiMode === 'modern' ? 'bg-white/70 backdrop-blur-md border-b border-white/40 shadow-sm' : 'bg-white shadow-sm border-b border-gray-200'}`}>
            <div className="px-4 py-2.5 flex items-center justify-between">
                {/* Logo & Titre */}
                <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded flex items-center justify-center ${geniusEnabled ? 'bg-white/20 text-white' : 'bg-gradient-to-br from-indigo-600 to-blue-600 text-white'} shadow-sm`}>
                        <span className="font-bold text-sm">A</span>
                    </div>
                    <h1 className={`text-lg font-semibold ${geniusEnabled ? 'text-white' : 'text-gray-900'}`}>AKIG</h1>
                </div>

                {/* Barre de Recherche */}
                <div
                    onClick={() => setShowSearch(true)}
                    className={`hidden md:flex items-center gap-2 rounded-lg px-3 py-1.5 w-80 border cursor-pointer ${uiMode === 'modern' ? 'bg-white/60 backdrop-blur-sm border-white/40 shadow-inner' : 'bg-gray-50 border-gray-200'}`}
                >
                    <Search size={16} className="text-gray-400" />
                    <input
                        type="text"
                        placeholder="Rechercher... (Ctrl+P)"
                        className="bg-transparent outline-none text-sm text-gray-700 w-full placeholder-gray-400 cursor-pointer"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={handleSearch}
                        readOnly
                    />
                </div>

                {/* Notifications, Genius Toggle & User */}
                <div className="flex items-center gap-3">
                    {/* Genius Mode Toggle */}
                    <button
                        title="Activer le mode Génie (Ctrl+K)"
                        onClick={() => {
                            toggleGenius();
                            if (onOpenGeniusPanel) onOpenGeniusPanel();
                        }}
                        className={`p-1.5 rounded-lg transition-colors ${geniusEnabled ? 'bg-white/10 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <Zap size={18} />
                    </button>
                    {/* Notifications */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <Bell size={18} />
                            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>

                        <NotificationCenter isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
                    </div>

                    {/* Messages */}
                    <button className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors relative">
                        <MessageSquare size={18} />
                        <span className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full"></span>
                    </button>

                    {/* User Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="flex items-center gap-2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                            aria-haspopup="true"
                            aria-expanded={showUserMenu}
                            aria-label="Menu utilisateur"
                        >
                            <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">
                                    {user.firstName?.[0] || 'U'}{user.lastName?.[0] || ''}
                                </span>
                            </div>
                            <div className="hidden lg:block text-left">
                                <p className="text-xs font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                            </div>
                        </button>

                        {showUserMenu && (
                            <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                                <div className="p-3 border-b border-gray-100">
                                    <p className="text-sm font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
                                    <p className="text-xs text-gray-500">{user.email}</p>
                                </div>

                                <div className="py-1">
                                    <button className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                        <User size={14} /> Mon Profil
                                    </button>
                                    <button className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                        <Settings size={14} /> Paramètres
                                    </button>
                                </div>

                                <div className="border-t border-gray-100 p-1">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 rounded"
                                    >
                                        <LogOut size={14} /> Déconnexion
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Global Search Overlay */}
            {showSearch && <GlobalSearch onClose={() => setShowSearch(false)} />}
        </nav>
    );
};

export default Navbar;
