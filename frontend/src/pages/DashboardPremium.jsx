// ============================================================
// 📊 Dashboard Premium v2 - Advanced Analytics & KPIs
// ============================================================

import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
    Home, DollarSign, Users, TrendingUp, Clock, AlertCircle,
    Calendar, CheckCircle, Phone, Mail, ArrowRight, Download,
    Eye, Lock, MapPin, Zap
} from 'lucide-react';
import { Card, Button, Badge, Alert } from '../components';
import { exportFiscalPDF, exportPropertiesPDF, exportPaymentsPDF } from '../utils/exportUtils';

const DashboardPremium = () => {
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState('6months');
    const [refreshing, setRefreshing] = useState(false);
    const [exporting, setExporting] = useState(false);

    // KPIs State
    const [kpis, setKpis] = useState({
        totalProperties: 45,
        totalTenants: 38,
        monthlyRevenue: 13500000,
        occupancyRate: 84.5,
        overduepayments: 8,
        avgRent: 355000,
        sciCompanies: 10,
        seasonalOccupancy: 72
    });

    // Revenue Trend Data
    const [revenueData] = useState([
        { date: '01 Jan', revenue: 12000000, expected: 13000000, collected: 11800000 },
        { date: '08 Jan', revenue: 12500000, expected: 13000000, collected: 12300000 },
        { date: '15 Jan', revenue: 13200000, expected: 13000000, collected: 13100000 },
        { date: '22 Jan', revenue: 12800000, expected: 13000000, collected: 12700000 },
        { date: '29 Jan', revenue: 13500000, expected: 13000000, collected: 13400000},
        { date: '05 Feb', revenue: 13100000, expected: 13000000, collected: 13000000 },
        { date: '12 Feb', revenue: 12900000, expected: 13000000, collected: 12800000 },
        { date: '19 Feb', revenue: 13300000, expected: 13000000, collected: 13200000 },
        { date: '26 Feb', revenue: 13600000, expected: 13000000, collected: 13500000 }
    ]);

    // Payment Distribution
    const [paymentMethods] = useState([
        { name: 'Bank Transfer', value: 45, fill: '#3B82F6' },
        { name: 'Cash', value: 30, fill: '#10B981' },
        { name: 'Mobile Money', value: 20, fill: '#8B5CF6' },
        { name: 'Other', value: 5, fill: '#F59E0B' }
    ]);

    // Expense Categories
    const [expenses] = useState([
        { name: 'Maintenance', value: 18, amount: '1.2M' },
        { name: 'Insurance', value: 15, amount: '1.0M' },
        { name: 'Taxes', value: 25, amount: '1.7M' },
        { name: 'Utilities', value: 20, amount: '1.3M' },
        { name: 'Agency Fee', value: 22, amount: '1.5M' }
    ]);

    // Property Performance
    const [propertyPerf] = useState([
        { ref: '#001', name: 'Cité 4 - Apt 3BR', occupancy: 95, revenue: 1500000, status: 'excellent' },
        { ref: '#002', name: 'Technopole - Duplex', occupancy: 100, revenue: 2000000, status: 'excellent' },
        { ref: '#003', name: 'Kaloum - Studio', occupancy: 80, revenue: 500000, status: 'good' },
        { ref: '#004', name: 'Plateau - Villa', occupancy: 60, revenue: 3500000, status: 'warning' },
        { ref: '#005', name: 'Hamdalaye - Apt 2BR', occupancy: 45, revenue: 1450000, status: 'poor' }
    ]);

    const handleRefresh = async () => {
        setRefreshing(true);
        // Simulate API call
        setTimeout(() => setRefreshing(false), 1500);
    };

    useEffect(() => {
        // Simulate loading
        setTimeout(() => setLoading(false), 1000);
    }, []);

    const handleExportReport = async () => {
        try {
            setExporting(true);
            const year = new Date().getFullYear();
            const result = await exportFiscalPDF(year);
            if (!result.success) {
                alert('❌ Erreur export: ' + result.error);
            }
        } catch (err) {
            alert('❌ ' + err.message);
        } finally {
            setExporting(false);
        }
    };

    const getOccupancyColor = (rate) => {
        if (rate >= 90) return 'text-green-600 bg-green-50';
        if (rate >= 75) return 'text-blue-600 bg-blue-50';
        if (rate >= 60) return 'text-yellow-600 bg-yellow-50';
        return 'text-red-600 bg-red-50';
    };

    const getStatusColor = (status) => {
        if (status === 'excellent') return 'success';
        if (status === 'good') return 'primary';
        if (status === 'warning') return 'warning';
        return 'danger';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Chargement du tableau de bord...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <img 
                        src="/assets/logos/logo.png" 
                        alt="Logo AKIG" 
                        className="w-12 h-12 object-contain"
                    />
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord Avancé</h1>
                        <p className="text-gray-600 mt-1">Analyse complète de votre portefeuille immobilier</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <select
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:border-gray-400 transition-colors"
                    >
                        <option value="1month">Dernier mois</option>
                        <option value="3months">3 derniers mois</option>
                        <option value="6months">6 derniers mois</option>
                        <option value="1year">1 an</option>
                    </select>
                    <Button
                        variant="secondary"
                        size="md"
                        onClick={handleRefresh}
                        disabled={refreshing}
                        icon={refreshing ? undefined : ArrowRight}
                    >
                        {refreshing ? 'Refresh...' : 'Rafraîchir'}
                    </Button>
                    <Button variant="primary" size="md" icon={Download} onClick={handleExportReport} disabled={exporting}>
                        {exporting ? 'Export...' : 'Export'}
                    </Button>
                </div>
            </div>

            {/* Critical Alerts */}
            {kpis.overduepayments > 0 && (
                <Alert type="error" title="⚠️ Loyers en Retard" closeable>
                    <strong>{kpis.overduepayments} paiements</strong> en retard pour un total de <strong>8.5M GNF</strong>. Envoyez des relances immédiatement.
                </Alert>
            )}

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Properties */}
                <Card className="hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Propriétés</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{kpis.totalProperties}</p>
                            <p className="text-xs text-green-600 mt-2">✓ {Math.round(kpis.occupancyRate)}% occupé</p>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-full">
                            <Home className="w-8 h-8 text-blue-600" />
                        </div>
                    </div>
                </Card>

                {/* Total Revenue */}
                <Card className="hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Revenu Mensuel</p>
                            <p className="text-2xl font-bold text-gray-900 mt-2">13.5M</p>
                            <p className="text-xs text-green-600 mt-2">↑ 8.5% vs mois dernier</p>
                        </div>
                        <div className="bg-green-100 p-3 rounded-full">
                            <DollarSign className="w-8 h-8 text-green-600" />
                        </div>
                    </div>
                </Card>

                {/* Active Tenants */}
                <Card className="hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Locataires</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{kpis.totalTenants}</p>
                            <p className="text-xs text-blue-600 mt-2">3 nouveaux ce mois</p>
                        </div>
                        <div className="bg-indigo-100 p-3 rounded-full">
                            <Users className="w-8 h-8 text-indigo-600" />
                        </div>
                    </div>
                </Card>

                {/* Overdue Payments */}
                <Card className="hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">En Retard</p>
                            <p className="text-3xl font-bold text-red-600 mt-2">{kpis.overduepayments}</p>
                            <p className="text-xs text-red-600 mt-2">8.5M GNF</p>
                        </div>
                        <div className="bg-red-100 p-3 rounded-full">
                            <AlertCircle className="w-8 h-8 text-red-600" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Trend (Large) */}
                <Card className="lg:col-span-2" header="📈 Tendance des Revenus">
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={revenueData}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip formatter={(value) => `${(value / 1000000).toFixed(1)}M GNF`} />
                            <Area type="monotone" dataKey="collected" stroke="#10B981" fill="url(#colorRevenue)" name="Collecté" />
                        </AreaChart>
                    </ResponsiveContainer>
                </Card>

                {/* Payment Methods */}
                <Card header="💳 Méthodes de Paiement">
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={paymentMethods}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, value }) => `${name} ${value}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {paymentMethods.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => `${value}%`} />
                        </PieChart>
                    </ResponsiveContainer>
                </Card>
            </div>

            {/* Secondary Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Expenses */}
                <Card header="💰 Dépenses par Catégorie">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={expenses}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#F59E0B" />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>

                {/* Property Performance */}
                <Card header="🏆 Performance des Propriétés">
                    <div className="space-y-3">
                        {propertyPerf.map((prop, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-gray-900">{prop.name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="flex-1 bg-gray-300 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full ${prop.occupancy >= 90 ? 'bg-green-500' : prop.occupancy >= 75 ? 'bg-blue-500' : prop.occupancy >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                style={{ width: `${prop.occupancy}%` }}
                                            ></div>
                                        </div>
                                        <span className={`text-xs font-bold px-2 py-1 rounded ${getOccupancyColor(prop.occupancy)}`}>
                                            {prop.occupancy}%
                                        </span>
                                    </div>
                                </div>
                                <div className="ml-4 text-right">
                                    <p className="text-sm font-semibold text-green-600">{(prop.revenue / 1000000).toFixed(1)}M</p>
                                    <Badge variant={getStatusColor(prop.status)} size="sm">
                                        {prop.status === 'excellent' ? 'Excellent' :
                                         prop.status === 'good' ? 'Bon' :
                                         prop.status === 'warning' ? 'Alerte' : 'Faible'}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card header="SCI Companies" variant="info">
                    <div className="text-center">
                        <p className="text-3xl font-bold text-blue-600">{kpis.sciCompanies}</p>
                        <p className="text-sm text-gray-600 mt-2">Compagnies actives</p>
                        <Button variant="ghost" fullWidth className="mt-3" size="sm">
                            Gérer SCI →
                        </Button>
                    </div>
                </Card>

                <Card header="Occupancy Rate" variant="success">
                    <div className="text-center">
                        <p className="text-3xl font-bold text-green-600">{kpis.occupancyRate.toFixed(1)}%</p>
                        <p className="text-sm text-gray-600 mt-2">Taux moyen</p>
                        <div className="mt-3 w-full bg-gray-300 rounded-full h-2">
                            <div className="h-2 rounded-full bg-green-500" style={{ width: `${kpis.occupancyRate}%` }}></div>
                        </div>
                    </div>
                </Card>

                <Card header="Seasonal Rental" variant="warning">
                    <div className="text-center">
                        <p className="text-3xl font-bold text-yellow-600">{kpis.seasonalOccupancy}%</p>
                        <p className="text-sm text-gray-600 mt-2">Occupation saisonnière</p>
                        <Button variant="ghost" fullWidth className="mt-3" size="sm">
                            Voir Réservations →
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default DashboardPremium;
