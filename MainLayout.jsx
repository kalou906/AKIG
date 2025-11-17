// ============================================================
// 🎨 Main Layout - Wrapper principal avec Navbar + Sidebar
// Utilisé par App.jsx pour toutes les pages protégées
// ============================================================

import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const MainLayout = ({ children, onLogout }) => {
    const [sidebarExpanded, setSidebarExpanded] = useState(true);

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <Sidebar expanded={sidebarExpanded} onToggle={() => setSidebarExpanded(!sidebarExpanded)} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Navbar */}
                <Navbar onLogout={onLogout} />

                {/* Page Content */}
                <main className="flex-1 overflow-auto">
                    <div className="p-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
