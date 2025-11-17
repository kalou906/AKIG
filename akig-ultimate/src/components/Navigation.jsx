import React, { useState } from 'react';
import { useRole } from '../contexts/RoleContext';
import { Menu, X, Home, BarChart3, PieChart, Briefcase, Settings, LogOut, ChevronDown } from 'lucide-react';

export default function Navigation() {
  const { userRole, currentUser, switchRole, hasPermission } = useRole();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const navigationItems = [
    {
      label: 'Dashboard',
      href: userRole === 'pdg' ? '/dashboard-pdg' : userRole === 'comptable' ? '/dashboard-comptable' : '/dashboard-agent',
      icon: Home,
      visible: true
    },
    {
      label: 'IA & Analytics',
      href: '/ia',
      icon: BarChart3,
      visible: hasPermission('canViewReports')
    },
    {
      label: 'Finances',
      href: '/finances',
      icon: PieChart,
      visible: hasPermission('canViewFinances')
    },
    {
      label: 'Opérations',
      href: '/operations',
      icon: Briefcase,
      visible: hasPermission('canViewOperations')
    },
    {
      label: 'Paramètres',
      href: '/settings',
      icon: Settings,
      visible: hasPermission('canConfigureSystem')
    }
  ];

  return (
    <nav className="bg-gradient-to-r from-[#001F3F] via-[#0056B3] to-[#003D82] text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 font-bold text-xl">
            <div className="w-8 h-8 bg-gradient-to-br from-[#CC0000] to-[#0056B3] rounded-lg flex items-center justify-center">
              AI
            </div>
            <span>AKIG Pro</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navigationItems.map(item => {
              if (!item.visible) return null;
              const Icon = item.icon;
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-2 hover:text-yellow-300 transition"
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </div>

          {/* Right Side - Role & User */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg transition"
              >
                <span className="text-sm font-semibold">{userRole.toUpperCase()}</span>
                <ChevronDown size={16} />
              </button>
              {roleMenuOpen && (
                <div className="absolute right-0 mt-2 bg-white text-gray-800 rounded-lg shadow-xl z-50 w-48">
                  {['pdg', 'comptable', 'agent'].map(role => (
                    <button
                      key={role}
                      onClick={() => {
                        switchRole(role);
                        setRoleMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg ${
                        userRole === role ? 'bg-[#0056B3] text-white' : ''
                      }`}
                    >
                      <div className="font-semibold">{role.toUpperCase()}</div>
                      <div className="text-xs text-gray-600">
                        {role === 'pdg' ? 'Vue Complète' : role === 'comptable' ? 'Finances' : 'Opérations'}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden hover:bg-white/20 p-2 rounded-lg"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {navigationItems.map(item => {
              if (!item.visible) return null;
              const Icon = item.icon;
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 rounded-lg transition"
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </div>
        )}
      </div>

      {/* User Info Bar */}
      <div className="bg-black/20 px-4 py-2 text-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <span>👤 {currentUser.name} • {currentUser.department}</span>
          <button className="hover:text-yellow-300 transition flex items-center gap-1">
            <LogOut size={16} />
            Déconnexion
          </button>
        </div>
      </div>
    </nav>
  );
}
