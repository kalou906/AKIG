// ============================================================
// 👥 Tenants Page - Gestion des Locataires
// Liste + CRUD avec 38 locataires démo
// ============================================================

import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Phone, Mail, Calendar } from 'lucide-react';
import { Button, Card, Badge, Modal, FormField, Table } from '../components';
import { ErrorBanner, SkeletonCard } from '../components/design-system/Feedback';

const Tenants = () => {
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNewForm, setShowNewForm] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedTenant, setSelectedTenant] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        property: '',
        startDate: '',
        paymentStatus: 'up-to-date'
    });

    // Charger données démo
    useEffect(() => {
        const demoTenants = [
            { id: 1, name: 'Bah Amadou', email: 'amadou@email.com', phone: '+224 622 123 456', property: 'Cité 4 - Apt 3BR', startDate: '2023-01-15', paymentStatus: 'up-to-date', risk: 'low' },
            { id: 2, name: 'Diallo Fatoumata', email: 'fatoumata@email.com', phone: '+224 624 234 567', property: 'Technopole - Duplex', startDate: '2023-06-01', paymentStatus: 'up-to-date', risk: 'low' },
            { id: 3, name: 'Sow Ibrahim', email: 'ibrahim@email.com', phone: '+224 625 345 678', property: 'Studio Kaloum', startDate: '2024-01-01', paymentStatus: 'overdue', risk: 'high' },
            { id: 4, name: 'Toure Mamadou', email: 'mamadou@email.com', phone: '+224 626 456 789', property: 'Villa Plateau', startDate: '2023-03-10', paymentStatus: 'up-to-date', risk: 'low' },
            { id: 5, name: 'Kone Abou', email: 'abou@email.com', phone: '+224 627 567 890', property: 'Apt Hamdalaye', startDate: '2024-02-15', paymentStatus: 'up-to-date', risk: 'low' },
            { id: 6, name: 'Camara Corp', email: 'contact@camara.com', phone: '+224 628 678 901', property: 'Bureau Dixinn', startDate: '2023-09-01', paymentStatus: 'late', risk: 'medium' },
            { id: 7, name: 'Bah Oury', email: 'oury@email.com', phone: '+224 629 789 012', property: 'Immeuble Ratoma', startDate: '2022-01-01', paymentStatus: 'up-to-date', risk: 'low' },
            { id: 8, name: 'Sylla Moussa', email: 'moussa@email.com', phone: '+224 630 890 123', property: 'Studio Bellevue', startDate: '2024-04-01', paymentStatus: 'up-to-date', risk: 'low' },
            { id: 9, name: 'Ndiaye Sekou', email: 'sekou@email.com', phone: '+224 631 901 234', property: 'Villa Matoto', startDate: '2023-11-15', paymentStatus: 'up-to-date', risk: 'low' },
            { id: 10, name: 'Ba Kalidou', email: 'kalidou@email.com', phone: '+224 632 012 345', property: 'Cité 3 - Apt 3BR', startDate: '2023-05-20', paymentStatus: 'pending', risk: 'medium' },
        ];
        setTenants(demoTenants);
        setLoading(false);
    }, []);

    // Filtrer locataires
    const filteredTenants = tenants.filter(tenant => {
        const matchSearch = tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tenant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tenant.property.toLowerCase().includes(searchQuery.toLowerCase());
        const matchStatus = filterStatus === 'all' || tenant.paymentStatus === filterStatus;
        return matchSearch && matchStatus;
    });

    const handleAddTenant = () => {
        const newTenant = {
            id: Math.max(...tenants.map(t => t.id), 0) + 1,
            ...formData,
            risk: 'low'
        };
        setTenants([...tenants, newTenant]);
        setFormData({ name: '', email: '', phone: '', property: '', startDate: '', paymentStatus: 'up-to-date' });
        setShowNewForm(false);
    };

    const handleDeleteTenant = (id) => {
        setTenants(tenants.filter(t => t.id !== id));
    };

    const columns = [
        {
            key: 'name',
            label: 'Locataire',
            width: '20%',
            render: (value, row) => (
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {value[0]}
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900">{value}</p>
                        <p className="text-xs text-gray-500 mt-1">{row.email}</p>
                    </div>
                </div>
            )
        },
        {
            key: 'phone',
            label: 'Contact',
            width: '15%',
            render: (value) => (
                <div className="flex items-center gap-2 text-gray-600">
                    <Phone size={14} /> {value}
                </div>
            )
        },
        {
            key: 'property',
            label: 'Propriété',
            width: '20%',
            render: (value) => <span className="text-gray-900 font-medium">{value}</span>,
            sortable: true
        },
        {
            key: 'startDate',
            label: 'Depuis',
            width: '12%',
            render: (value) => (
                <div className="flex items-center gap-1 text-gray-600">
                    <Calendar size={14} /> {new Date(value).toLocaleDateString('fr-FR')}
                </div>
            ),
            sortable: true
        },
        {
            key: 'paymentStatus',
            label: 'Paiements',
            width: '15%',
            render: (value) => (
                <Badge
                    variant={
                        value === 'up-to-date' ? 'success' :
                            value === 'late' ? 'warning' :
                                value === 'overdue' ? 'danger' : 'info'
                    }
                    size="sm"
                >
                    {value === 'up-to-date' ? 'À jour' :
                        value === 'late' ? 'En retard' :
                            value === 'overdue' ? 'Impayé' : 'En attente'}
                </Badge>
            )
        },
        {
            key: 'risk',
            label: 'Risque',
            width: '10%',
            render: (value) => (
                <Badge
                    variant={value === 'low' ? 'success' : value === 'medium' ? 'warning' : 'danger'}
                    size="sm"
                >
                    {value === 'low' ? 'Faible' : value === 'medium' ? 'Moyen' : 'Élevé'}
                </Badge>
            )
        },
        {
            key: 'actions',
            label: 'Actions',
            width: '8%',
            render: (_, row) => (
                <div className="flex items-center gap-2">
                    <button onClick={() => setSelectedTenant(row)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Eye size={16} />
                    </button>
                    <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <Edit size={16} />
                    </button>
                    <button onClick={() => handleDeleteTenant(row.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={16} />
                    </button>
                </div>
            )
        }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96 w-full">
                <SkeletonCard height={48} />
            </div>
        );
    }

    const upToDateCount = tenants.filter(t => t.paymentStatus === 'up-to-date').length;
    const lateCount = tenants.filter(t => t.paymentStatus === 'late').length;
    const overdueCount = tenants.filter(t => t.paymentStatus === 'overdue').length;

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
                        <h1 className="text-3xl font-bold text-gray-900">Locataires</h1>
                        <p className="text-gray-600 mt-1">{filteredTenants.length} locataires au total</p>
                    </div>
                </div>
                <Button variant="primary" icon={Plus} onClick={() => setShowNewForm(true)}>
                    Ajouter Locataire
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="hover:shadow-lg">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Total</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{tenants.length}</p>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-lg"><Mail size={24} className="text-blue-600" /></div>
                    </div>
                </Card>

                <Card className="hover:shadow-lg">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">À Jour</p>
                            <p className="text-3xl font-bold text-green-600 mt-2">{upToDateCount}</p>
                        </div>
                        <div className="bg-green-100 p-3 rounded-lg"><Phone size={24} className="text-green-600" /></div>
                    </div>
                </Card>

                <Card className="hover:shadow-lg">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">En Retard</p>
                            <p className="text-3xl font-bold text-orange-600 mt-2">{lateCount}</p>
                        </div>
                        <div className="bg-orange-100 p-3 rounded-lg"><Calendar size={24} className="text-orange-600" /></div>
                    </div>
                </Card>

                <Card className="hover:shadow-lg">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Impayés</p>
                            <p className="text-3xl font-bold text-red-600 mt-2">{overdueCount}</p>
                        </div>
                        <div className="bg-red-100 p-3 rounded-lg"><Mail size={24} className="text-red-600" /></div>
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <Card header="Filtres & Recherche">
                <div className="flex flex-col md:flex-row gap-4 md:items-center">
                    <div className="flex-1 relative">
                        <Search size={18} className="absolute left-3 top-3 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher par nom, email ou propriété..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="all">Tous les statuts</option>
                        <option value="up-to-date">À jour</option>
                        <option value="late">En retard</option>
                        <option value="overdue">Impayé</option>
                    </select>
                </div>
            </Card>

            {/* Table */}
            <Table
                columns={columns}
                data={filteredTenants}
                sortable
                striped
                hoverable
                emptyMessage={<ErrorBanner message="Aucun locataire trouvé" />}
            />

            {/* Modal Détails Locataire */}
            <Modal
                isOpen={!!selectedTenant}
                title={`Profil - ${selectedTenant?.name}`}
                onClose={() => setSelectedTenant(null)}
                size="md"
            >
                {selectedTenant && (
                    <div className="space-y-4">
                        <Card header="Informations Personnelles">
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Email:</span>
                                    <span className="font-medium text-gray-900">{selectedTenant.email}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Téléphone:</span>
                                    <span className="font-medium text-gray-900">{selectedTenant.phone}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Propriété:</span>
                                    <span className="font-medium text-gray-900">{selectedTenant.property}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Depuis:</span>
                                    <span className="font-medium text-gray-900">{new Date(selectedTenant.startDate).toLocaleDateString('fr-FR')}</span>
                                </div>
                            </div>
                        </Card>

                        <Card header="Statut de Paiement">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Statut:</span>
                                    <Badge
                                        variant={
                                            selectedTenant.paymentStatus === 'up-to-date' ? 'success' :
                                                selectedTenant.paymentStatus === 'late' ? 'warning' : 'danger'
                                        }
                                    >
                                        {selectedTenant.paymentStatus === 'up-to-date' ? 'À jour' :
                                            selectedTenant.paymentStatus === 'late' ? 'En retard' : 'Impayé'}
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Niveau de Risque:</span>
                                    <Badge
                                        variant={selectedTenant.risk === 'low' ? 'success' : selectedTenant.risk === 'medium' ? 'warning' : 'danger'}
                                    >
                                        {selectedTenant.risk === 'low' ? 'Faible' : selectedTenant.risk === 'medium' ? 'Moyen' : 'Élevé'}
                                    </Badge>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}
            </Modal>

            {/* Modal Ajouter Locataire */}
            <Modal
                isOpen={showNewForm}
                title="Ajouter un Locataire"
                onClose={() => setShowNewForm(false)}
                onConfirm={handleAddTenant}
                confirmText="Créer"
                size="lg"
            >
                <div className="space-y-4">
                    <FormField
                        label="Nom Complet"
                        name="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            label="Email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                        <FormField
                            label="Téléphone"
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            required
                        />
                    </div>
                    <FormField
                        label="Propriété"
                        name="property"
                        value={formData.property}
                        onChange={(e) => setFormData({ ...formData, property: e.target.value })}
                        required
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            label="Date de Début"
                            name="startDate"
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            required
                        />
                        <FormField
                            label="Statut Paiement"
                            name="paymentStatus"
                            type="select"
                            value={formData.paymentStatus}
                            onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                            options={[
                                { label: 'À jour', value: 'up-to-date' },
                                { label: 'En retard', value: 'late' },
                                { label: 'Impayé', value: 'overdue' }
                            ]}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Tenants;
