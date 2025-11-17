/**
 * ============================================================
 * frontend/src/pages/TenantPortal/index.jsx - Portail Locataire
 * Interface pour les locataires: voir paiements, télécharger reçus
 * ============================================================
 */

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../hooks/useAuth";
import "./TenantPortal.css";

const TenantPortal = () => {
    const { user, token } = useAuth();
    const [activeTab, setActiveTab] = useState("dashboard");
    const [dashboard, setDashboard] = useState(null);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [stats, setStats] = useState(null);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [selectedContract, setSelectedContract] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:4000";

    // Charger le dashboard au montage
    useEffect(() => {
        fetchDashboard();
        fetchStats();
        fetchPaymentMethods();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Charger historique quand un contrat est sélectionné
    useEffect(() => {
        if (selectedContract) {
            fetchPaymentHistory(selectedContract.id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedContract]);

    const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    };

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE}/api/tenant-portal/dashboard`, {
                headers,
            });
            setDashboard(res.data);
            if (res.data.contracts.length > 0) {
                setSelectedContract(res.data.contracts[0]);
            }
        } catch (err) {
            setError("Erreur en chargeant le tableau de bord");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPaymentHistory = async (contractId) => {
        try {
            const res = await axios.get(
                `${API_BASE}/api/tenant-portal/contract/${contractId}/history`,
                { headers }
            );
            setPaymentHistory(res.data);
        } catch (err) {
            setError("Erreur en chargeant l'historique");
            console.error(err);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/tenant-portal/stats`, {
                headers,
            });
            setStats(res.data);
        } catch (err) {
            console.error("Erreur statistiques", err);
        }
    };

    const fetchPaymentMethods = async () => {
        try {
            const res = await axios.get(
                `${API_BASE}/api/tenant-portal/payment-methods`,
                { headers }
            );
            setPaymentMethods(res.data);
        } catch (err) {
            console.error("Erreur méthodes", err);
        }
    };

    const downloadReceipt = async (paymentId) => {
        try {
            const res = await axios.get(
                `${API_BASE}/api/tenant-portal/payment/${paymentId}/receipt`,
                { headers, responseType: "blob" }
            );

            // Créer un blob et télécharger
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `quittance_${paymentId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (err) {
            setError("Erreur en téléchargeant le reçu");
            console.error(err);
        }
    };

    // eslint-disable-next-line no-unused-vars
    const requestReceipt = async (paymentId) => {
        try {
            await axios.post(
                `${API_BASE}/api/tenant-portal/request-receipt`,
                { paymentId },
                { headers }
            );
            alert("Quittance envoyée par email");
        } catch (err) {
            setError("Erreur en demandant la quittance");
            console.error(err);
        }
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            PENDING: { color: "#ff9800", label: "En attente" },
            CONFIRMED: { color: "#ff9800", label: "Confirmé" },
            VERIFIED: { color: "#2196f3", label: "Vérifié" },
            COMPLETED: { color: "#4caf50", label: "Complété" },
            FAILED: { color: "#f44336", label: "Échoué" },
            CANCELLED: { color: "#9e9e9e", label: "Annulé" },
            DISPUTED: { color: "#e91e63", label: "Contesté" },
        };

        const s = statusMap[status] || { color: "#999", label: status };
        return (
            <span
                className="status-badge"
                style={{ backgroundColor: s.color }}
            >
                {s.label}
            </span>
        );
    };

    if (loading && !dashboard) {
        return (
            <div className="tenant-portal loading">
                <p>Chargement...</p>
            </div>
        );
    }

    return (
        <div className="tenant-portal">
            <header className="portal-header">
                <h1>🏠 Portail Locataire</h1>
                <p>Bienvenue, {user?.first_name}</p>
            </header>

            {error && <div className="error-message">{error}</div>}

            {/* Navigation */}
            <nav className="portal-nav">
                <button
                    className={`nav-btn ${activeTab === "dashboard" ? "active" : ""}`}
                    onClick={() => setActiveTab("dashboard")}
                >
                    📊 Tableau de Bord
                </button>
                <button
                    className={`nav-btn ${activeTab === "history" ? "active" : ""}`}
                    onClick={() => setActiveTab("history")}
                >
                    📋 Historique
                </button>
                <button
                    className={`nav-btn ${activeTab === "methods" ? "active" : ""}`}
                    onClick={() => setActiveTab("methods")}
                >
                    💳 Méthodes de Paiement
                </button>
            </nav>

            {/* TAB 1: DASHBOARD */}
            {activeTab === "dashboard" && dashboard && (
                <section className="tab-content">
                    {/* Résumé dette */}
                    <div className="debt-summary">
                        <div className="debt-card total">
                            <h3>Total Dû</h3>
                            <p className="amount">
                                {dashboard.total_debt?.toLocaleString()} FG
                            </p>
                        </div>
                        <div className="debt-card pending">
                            <h3>Paiements en Attente</h3>
                            <p className="count">{dashboard.pending_payments?.length}</p>
                        </div>
                        <div className="debt-card paid">
                            <h3>Paiements Effectués</h3>
                            <p className="count">{dashboard.recent_payments?.length}</p>
                        </div>
                    </div>

                    {/* Contrats */}
                    <div className="contracts-section">
                        <h2>Mes Contrats</h2>
                        <div className="contracts-list">
                            {dashboard.contracts?.map((contract) => (
                                <div
                                    key={contract.id}
                                    className={`contract-card ${selectedContract?.id === contract.id ? "active" : ""
                                        }`}
                                    onClick={() => setSelectedContract(contract)}
                                >
                                    <div className="contract-header">
                                        <h3>{contract.reference}</h3>
                                        <span className="status">{contract.status}</span>
                                    </div>
                                    <p className="location">
                                        📍 {contract.address}, {contract.city}
                                    </p>
                                    <p className="rent">
                                        💰 {contract.monthly_rent} {contract.currency}/mois
                                    </p>
                                    {contract.last_payment_date && (
                                        <p className="last-payment">
                                            ✓ Dernier paiement: {contract.last_payment_date}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Paiements en attente */}
                    {dashboard.pending_payments?.length > 0 && (
                        <div className="pending-section">
                            <h2>⚠️ Paiements en Attente</h2>
                            <table className="payments-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Montant</th>
                                        <th>Statut</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dashboard.pending_payments.map((payment) => (
                                        <tr key={payment.id}>
                                            <td>{payment.payment_date}</td>
                                            <td>{payment.amount} FG</td>
                                            <td>{getStatusBadge(payment.status)}</td>
                                            <td>
                                                <button
                                                    className="btn-small"
                                                    onClick={() => downloadReceipt(payment.id)}
                                                >
                                                    📥 Reçu
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Derniers paiements */}
                    {dashboard.recent_payments?.length > 0 && (
                        <div className="recent-section">
                            <h2>Derniers Paiements</h2>
                            <table className="payments-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Montant</th>
                                        <th>Méthode</th>
                                        <th>Référence</th>
                                        <th>Statut</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dashboard.recent_payments.map((payment) => (
                                        <tr key={payment.id}>
                                            <td>{payment.payment_date}</td>
                                            <td>{payment.amount} FG</td>
                                            <td>{payment.payment_method}</td>
                                            <td>{payment.reference_number || "N/A"}</td>
                                            <td>{getStatusBadge(payment.status)}</td>
                                            <td>
                                                <button
                                                    className="btn-small"
                                                    onClick={() => downloadReceipt(payment.id)}
                                                >
                                                    📥 Reçu
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            )}

            {/* TAB 2: HISTORIQUE */}
            {activeTab === "history" && selectedContract && (
                <section className="tab-content">
                    <h2>Historique: {selectedContract.reference}</h2>
                    {paymentHistory.length > 0 ? (
                        <table className="history-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Montant</th>
                                    <th>Méthode</th>
                                    <th>Référence</th>
                                    <th>Statut</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paymentHistory.map((payment) => (
                                    <tr key={payment.id}>
                                        <td>{payment.payment_date}</td>
                                        <td>{payment.amount} FG</td>
                                        <td>{payment.payment_method}</td>
                                        <td>{payment.reference_number || "N/A"}</td>
                                        <td>{getStatusBadge(payment.status)}</td>
                                        <td>
                                            <button
                                                className="btn-small"
                                                onClick={() => downloadReceipt(payment.id)}
                                            >
                                                📥
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="empty-message">Aucun paiement</p>
                    )}
                </section>
            )}

            {/* TAB 3: MÉTHODES DE PAIEMENT */}
            {activeTab === "methods" && (
                <section className="tab-content">
                    <h2>Méthodes de Paiement Disponibles</h2>
                    <div className="methods-grid">
                        {paymentMethods.map((method) => (
                            <div key={method.id} className="method-card">
                                <div className="method-icon">{method.icon}</div>
                                <h3>{method.name}</h3>
                                <p className="description">{method.description}</p>
                                <p className="instructions">{method.instructions}</p>
                            </div>
                        ))}
                    </div>
                    <div className="help-section">
                        <h3>Besoin d'aide?</h3>
                        <p>Contactez l'agence AKIG pour plus d'informations:</p>
                        <p>📞 +224 XXXXXXX</p>
                        <p>📧 contact@akig.gn</p>
                    </div>
                </section>
            )}

            {/* Statistiques (toujours visibles) */}
            {stats && (
                <footer className="portal-footer">
                    <h3>Vos Statistiques</h3>
                    <div className="stats-grid">
                        <div className="stat">
                            <strong>{stats.total_payments || 0}</strong>
                            <span>Paiements</span>
                        </div>
                        <div className="stat">
                            <strong>{(stats.total_paid || 0).toLocaleString()}</strong>
                            <span>FG payés</span>
                        </div>
                        <div className="stat">
                            <strong>{stats.pending_count || 0}</strong>
                            <span>En attente</span>
                        </div>
                        <div className="stat">
                            <strong>{(stats.total_pending || 0).toLocaleString()}</strong>
                            <span>FG dus</span>
                        </div>
                    </div>
                </footer>
            )}
        </div>
    );
};

export default TenantPortal;
