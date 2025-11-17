// ============================================================
// 🎨 Main Layout - Wrapper principal avec Navbar + Sidebar
// Utilisé par App.jsx pour toutes les pages protégées
// ============================================================

import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';
import GeniusPanel from '../genius/GeniusPanel';
import { useUIConfig } from '../../context/UIConfigContext';
import { Health } from '../../api/client';

function UptimeChart({ history }) {
    return (
        <div className="flex gap-1 mt-1">
            {history.map((status, idx) => (
                <div
                    key={idx}
                    className={`h-2 flex-1 rounded ${status === 'ok' ? 'bg-green-500' : status === 'fail' ? 'bg-red-500' : 'bg-yellow-400'
                        }`}
                />
            ))}
        </div>
    );
}

const MainLayout = ({ children, onLogout }) => {
    const [sidebarExpanded, setSidebarExpanded] = useState(true);
    const [geniusPanelOpen, setGeniusPanelOpen] = useState(false);
    const { geniusEnabled } = useUIConfig();

    const [apiStatus, setApiStatus] = useState('loading');
    const [history, setHistory] = useState([]);

    useEffect(() => {
        async function checkHealth() {
            try {
                await Health.ping();
                setApiStatus('ok');
                setHistory(h => [...h.slice(-29), 'ok']);
            } catch {
                setApiStatus('fail');
                setHistory(h => [...h.slice(-29), 'fail']);
            }
        }
        checkHealth();
        const interval = setInterval(checkHealth, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar expanded={sidebarExpanded} genius={geniusEnabled} onToggle={() => setSidebarExpanded(!sidebarExpanded)} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Navbar genius={geniusEnabled} onLogout={onLogout} onOpenGeniusPanel={() => setGeniusPanelOpen(true)} />
                <div className={`text-sm px-4 py-1 ${apiStatus === 'ok' ? 'bg-green-100 text-green-700'
                    : apiStatus === 'fail' ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                    {apiStatus === 'ok' && '✅ API opérationnelle'}
                    {apiStatus === 'fail' && '❌ API indisponible'}
                    {apiStatus === 'loading' && '⏳ Vérification API...'}
                    <UptimeChart history={history} />
                </div>
                <main role="main" className="flex-1 overflow-auto">
                    <div className="p-6 max-w-7xl mx-auto">
                        {children}
                        <Outlet />
                        <Footer />
                    </div>
                </main>
            </div>
            <GeniusPanel open={geniusPanelOpen} onClose={() => setGeniusPanelOpen(false)} />
        </div>
    );
};

export default MainLayout;
