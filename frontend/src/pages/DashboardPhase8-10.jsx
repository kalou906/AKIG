/**
 * DashboardPhase8-10.jsx - Tableau de bord intégrant Phases 8-10
 * Candidatures, Fichiers joints, Rapports avec statistiques
 * Thème Guinéen stunning
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  Paperclip,
  BarChart3,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Calendar,
  Users,
  FileText,
  Upload,
  Download,
  Eye,
  Plus,
  ArrowRight
} from 'lucide-react';
import './DashboardPhase8-10.css';

export default function DashboardPhase8_10() {
  const [stats, setStats] = useState({
    candidatures: {
      total: 47,
      pending: 12,
      approved: 28,
      rejected: 7,
      trend: '+15%'
    },
    files: {
      total: 156,
      thisMonth: 34,
      storage: '2.4 GB',
      types: { pdf: 89, images: 45, documents: 22 }
    },
    reports: {
      total: 23,
      thisMonth: 8,
      templates: 12,
      generated: '2.4 GB'
    }
  });

  const [recentCandidatures, setRecentCandidatures] = useState([
    { id: 1, name: 'Jean Dupont', property: 'Villa Kindia', date: '2025-01-15', status: 'approved', score: 95 },
    { id: 2, name: 'Marie Sow', property: 'Apt. Conakry', date: '2025-01-14', status: 'pending', score: 78 },
    { id: 3, name: 'Ahmed Diallo', property: 'Maison Kindia', date: '2025-01-13', status: 'approved', score: 88 },
  ]);

  const [recentFiles, setRecentFiles] = useState([
    { id: 1, name: 'Contrat_Jean_Dupont.pdf', size: '2.3 MB', date: '2025-01-15', type: 'pdf' },
    { id: 2, name: 'Photo_Villa_001.jpg', size: '5.6 MB', date: '2025-01-14', type: 'image' },
    { id: 3, name: 'Rapport_Fiscal_Q4.xlsx', size: '1.2 MB', date: '2025-01-13', type: 'xlsx' },
  ]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="badge badge-success">Approuvée</span>;
      case 'pending':
        return <span className="badge badge-warning">En attente</span>;
      case 'rejected':
        return <span className="badge badge-danger">Rejetée</span>;
      default:
        return <span className="badge badge-info">Nouvelle</span>;
    }
  };

  return (
    <div className="dashboard-phase8-10">
      {/* Header Titre */}
      <div className="dashboard-intro">
        <div className="intro-content">
          <img 
            src="/assets/logos/logo.png" 
            alt="Logo AKIG" 
            className="w-12 h-12 object-contain mr-3"
          />
          <div>
            <h1>Tableau de Bord Phases 8-10</h1>
            <p>Gestion intégrée des candidatures, fichiers et rapports</p>
          </div>
        </div>
        <div className="intro-actions">
          <Link to="/candidatures" className="btn btn-primary">
            <Plus size={18} /> Nouvelle Candidature
          </Link>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <section className="stats-section">
        <div className="stats-grid">
          {/* Candidatures Card */}
          <div className="stat-card candidatures-card">
            <div className="card-header">
              <div className="icon-container">
                <ClipboardList size={32} />
              </div>
              <div className="card-title-section">
                <h3>Candidatures</h3>
                <span className="trend-badge success">
                  <TrendingUp size={14} /> {stats.candidatures.trend}
                </span>
              </div>
            </div>
            <div className="card-content">
              <div className="main-stat">{stats.candidatures.total}</div>
              <p className="stat-subtitle">Total enregistrés</p>
              <div className="sub-stats">
                <div className="sub-stat">
                  <span className="label">En attente</span>
                  <span className="value pending">{stats.candidatures.pending}</span>
                </div>
                <div className="sub-stat">
                  <span className="label">Approuvées</span>
                  <span className="value approved">{stats.candidatures.approved}</span>
                </div>
                <div className="sub-stat">
                  <span className="label">Rejetées</span>
                  <span className="value rejected">{stats.candidatures.rejected}</span>
                </div>
              </div>
            </div>
            <Link to="/candidatures" className="card-footer-link">
              Voir toutes les candidatures <ArrowRight size={16} />
            </Link>
          </div>

          {/* Files Card */}
          <div className="stat-card files-card">
            <div className="card-header">
              <div className="icon-container">
                <Paperclip size={32} />
              </div>
              <div className="card-title-section">
                <h3>Fichiers Joints</h3>
                <span className="trend-badge info">
                  Ce mois: {stats.files.thisMonth}
                </span>
              </div>
            </div>
            <div className="card-content">
              <div className="main-stat">{stats.files.total}</div>
              <p className="stat-subtitle">Fichiers stockés</p>
              <div className="storage-bar">
                <div className="storage-used" style={{ width: '60%' }}></div>
              </div>
              <p className="storage-text">{stats.files.storage} utilisés</p>
              <div className="file-types">
                <div className="file-type">
                  <span>📄 PDF</span>
                  <strong>{stats.files.types.pdf}</strong>
                </div>
                <div className="file-type">
                  <span>🖼️ Images</span>
                  <strong>{stats.files.types.images}</strong>
                </div>
                <div className="file-type">
                  <span>📋 Docs</span>
                  <strong>{stats.files.types.documents}</strong>
                </div>
              </div>
            </div>
            <Link to="/piecesjointes" className="card-footer-link">
              Gérer les fichiers <ArrowRight size={16} />
            </Link>
          </div>

          {/* Reports Card */}
          <div className="stat-card reports-card">
            <div className="card-header">
              <div className="icon-container">
                <BarChart3 size={32} />
              </div>
              <div className="card-title-section">
                <h3>Rapports</h3>
                <span className="trend-badge success">
                  Ce mois: {stats.reports.thisMonth}
                </span>
              </div>
            </div>
            <div className="card-content">
              <div className="main-stat">{stats.reports.total}</div>
              <p className="stat-subtitle">Rapports générés</p>
              <div className="report-templates">
                <div className="template">
                  <FileText size={20} />
                  <div>
                    <p className="template-name">Rapport Candidatures</p>
                    <span className="template-count">{stats.reports.templates} variantes</span>
                  </div>
                </div>
                <div className="template">
                  <BarChart3 size={20} />
                  <div>
                    <p className="template-name">Rapport Statistiques</p>
                    <span className="template-count">Actualisé mensuel</span>
                  </div>
                </div>
              </div>
            </div>
            <Link to="/reports" className="card-footer-link">
              Accéder aux rapports <ArrowRight size={16} />
            </Link>
          </div>

          {/* Quick Actions Card */}
          <div className="stat-card actions-card">
            <div className="card-header">
              <div className="icon-container">
                <Plus size={32} />
              </div>
              <h3>Actions Rapides</h3>
            </div>
            <div className="card-content quick-actions">
              <button className="action-btn action-upload">
                <Upload size={20} />
                <span>Ajouter Fichier</span>
              </button>
              <button className="action-btn action-report">
                <BarChart3 size={20} />
                <span>Générer Rapport</span>
              </button>
              <button className="action-btn action-form">
                <ClipboardList size={20} />
                <span>Nouvelle Candidature</span>
              </button>
              <button className="action-btn action-download">
                <Download size={20} />
                <span>Exporter Données</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Items */}
      <section className="recent-section">
        <div className="section-header">
          <h2>Candidatures Récentes</h2>
          <Link to="/candidatures" className="see-all-link">Voir toutes →</Link>
        </div>
        <div className="recent-table">
          <table>
            <thead>
              <tr>
                <th>Candidat</th>
                <th>Propriété</th>
                <th>Date</th>
                <th>Statut</th>
                <th>Score</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentCandidatures.map(cand => (
                <tr key={cand.id}>
                  <td className="candidate-name">{cand.name}</td>
                  <td>{cand.property}</td>
                  <td>
                    <Calendar size={14} style={{ marginRight: '4px' }} />
                    {cand.date}
                  </td>
                  <td>{getStatusBadge(cand.status)}</td>
                  <td>
                    <div className="score-bar">
                      <div className="score-fill" style={{ width: `${cand.score}%` }}></div>
                      <span className="score-text">{cand.score}%</span>
                    </div>
                  </td>
                  <td className="action-links">
                    <button className="action-icon view" title="Voir">
                      <Eye size={16} />
                    </button>
                    <button className="action-icon edit" title="Éditer">
                      <FileText size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent Files */}
      <section className="recent-section">
        <div className="section-header">
          <h2>Fichiers Récents</h2>
          <Link to="/piecesjointes" className="see-all-link">Voir tous →</Link>
        </div>
        <div className="files-grid">
          {recentFiles.map(file => (
            <div key={file.id} className="file-card">
              <div className="file-icon">
                {file.type === 'pdf' && <span>📄</span>}
                {file.type === 'image' && <span>🖼️</span>}
                {file.type === 'xlsx' && <span>📊</span>}
              </div>
              <div className="file-info">
                <p className="file-name">{file.name}</p>
                <p className="file-date">{file.date}</p>
              </div>
              <div className="file-size">{file.size}</div>
              <div className="file-actions">
                <button className="file-btn download" title="Télécharger">
                  <Download size={14} />
                </button>
                <button className="file-btn preview" title="Aperçu">
                  <Eye size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Integration Notice */}
      <section className="integration-notice">
        <div className="notice-content">
          <AlertCircle size={24} />
          <div>
            <h3>Phases 8-10 Intégrées</h3>
            <p>
              Gestion complète des candidatures (Phase 8), fichiers joints (Phase 9), 
              et rapports analytiques (Phase 10) maintenant disponibles dans le système AKIG.
            </p>
          </div>
          <CheckCircle size={24} style={{ color: '#22C55E' }} />
        </div>
      </section>
    </div>
  );
}
