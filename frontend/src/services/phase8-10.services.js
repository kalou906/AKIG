/**
 * Frontend API Services for Phases 8-10
 * - CandidatureService.js
 * - AttachmentService.js  
 * - ReportService.js
 */

// ============================================================================
// CandidatureService.js - Candidature API calls
// ============================================================================

import axios from 'axios';

const API_BASE = 'http://localhost:4000/api';

const CandidatureService = {
  // Create new candidature
  create: (data, token) => {
    return axios.post(`${API_BASE}/candidatures`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Get all candidatures with filters/pagination
  list: (page = 1, limit = 20, filters = {}, token) => {
    const params = new URLSearchParams({
      page,
      limit,
      ...(filters.statut && { statut: filters.statut }),
      ...(filters.search && { search: filters.search }),
      ...(filters.local_id && { local_id: filters.local_id }),
      ...(filters.proprietaire_id && { proprietaire_id: filters.proprietaire_id })
    });
    return axios.get(`${API_BASE}/candidatures?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Get single candidature
  getById: (id, token) => {
    return axios.get(`${API_BASE}/candidatures/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Update candidature
  update: (id, data, token) => {
    return axios.patch(`${API_BASE}/candidatures/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Delete candidature
  delete: (id, token) => {
    return axios.delete(`${API_BASE}/candidatures/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Integrate dossierfacile
  integrateDossierfacile: (id, dfId, token) => {
    return axios.post(`${API_BASE}/candidatures/${id}/dossierfacile`, { dossierfacile_id: dfId }, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Get statistics
  getStats: (proprietaireId = null, token) => {
    const params = proprietaireId ? `?proprietaire_id=${proprietaireId}` : '';
    return axios.get(`${API_BASE}/candidatures/stats/overview${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Export candidatures
  export: (ids, format = 'json', token) => {
    return axios.post(`${API_BASE}/candidatures/export`, { ids, format }, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: format === 'json' ? 'json' : 'blob'
    });
  }
};

// ============================================================================
// AttachmentService.js - File upload/download API calls
// ============================================================================

const AttachmentService = {
  // Upload file
  upload: (file, entityType, entityId, token) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', entityType);
    formData.append('entityId', entityId);

    return axios.post(`${API_BASE}/attachments/upload`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  // Get attachment by ID
  getById: (id, token) => {
    return axios.get(`${API_BASE}/attachments/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // List attachments for entity
  listByEntity: (entityType, entityId, token) => {
    return axios.get(`${API_BASE}/attachments/entity/${entityType}/${entityId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Search attachments
  search: (filters = {}, page = 1, limit = 20, token) => {
    const params = new URLSearchParams({
      page,
      limit,
      ...(filters.filename && { filename: filters.filename }),
      ...(filters.ext && { ext: filters.ext }),
      ...(filters.entity_type && { entity_type: filters.entity_type }),
      ...(filters.date_from && { date_from: filters.date_from }),
      ...(filters.date_to && { date_to: filters.date_to })
    });
    return axios.get(`${API_BASE}/attachments/search?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Download file
  download: (id, filename, token) => {
    return axios.get(`${API_BASE}/attachments/${id}/download`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob'
    }).then(res => {
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  },

  // Get file preview (images only)
  getPreview: (id, size = 'preview', token) => {
    return axios.get(`${API_BASE}/attachments/${id}/preview?size=${size}`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob'
    });
  },

  // Delete attachment
  delete: (id, token) => {
    return axios.delete(`${API_BASE}/attachments/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Get attachment statistics
  getStats: (token) => {
    return axios.get(`${API_BASE}/attachments/stats/overview`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
};

// ============================================================================
// ReportService.js - Report generation API calls
// ============================================================================

const ReportService = {
  // Payment report
  getPaymentReport: (filters = {}, format = 'json', token) => {
    const params = new URLSearchParams({
      format,
      ...(filters.date_from && { date_from: filters.date_from }),
      ...(filters.date_to && { date_to: filters.date_to }),
      ...(filters.proprietaire_id && { proprietaire_id: filters.proprietaire_id }),
      ...(filters.statut && { statut: filters.statut })
    });
    return axios.get(`${API_BASE}/reports/payments?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: format === 'json' ? 'json' : 'blob'
    });
  },

  // Fiscal report
  getFiscalReport: (filters = {}, format = 'json', token) => {
    const params = new URLSearchParams({
      format,
      ...(filters.annee && { annee: filters.annee }),
      ...(filters.proprietaire_id && { proprietaire_id: filters.proprietaire_id })
    });
    return axios.get(`${API_BASE}/reports/fiscal?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: format === 'json' ? 'json' : 'blob'
    });
  },

  // Occupancy report
  getOccupancyReport: (filters = {}, format = 'json', token) => {
    const params = new URLSearchParams({
      format,
      ...(filters.date_from && { date_from: filters.date_from }),
      ...(filters.date_to && { date_to: filters.date_to })
    });
    return axios.get(`${API_BASE}/reports/occupancy?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: format === 'json' ? 'json' : 'blob'
    });
  },

  // Income/Expense report
  getIncomeExpenseReport: (filters = {}, format = 'json', token) => {
    const params = new URLSearchParams({
      format,
      ...(filters.date_from && { date_from: filters.date_from }),
      ...(filters.date_to && { date_to: filters.date_to })
    });
    return axios.get(`${API_BASE}/reports/income-expense?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: format === 'json' ? 'json' : 'blob'
    });
  },

  // Reconciliation report
  getReconciliationReport: (filters = {}, format = 'json', token) => {
    const params = new URLSearchParams({
      format,
      ...(filters.date_from && { date_from: filters.date_from }),
      ...(filters.date_to && { date_to: filters.date_to })
    });
    return axios.get(`${API_BASE}/reports/reconciliation?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: format === 'json' ? 'json' : 'blob'
    });
  },

  // Honoraires (fees) report
  getFeesReport: (filters = {}, format = 'json', token) => {
    const params = new URLSearchParams({
      format,
      ...(filters.date_from && { date_from: filters.date_from }),
      ...(filters.date_to && { date_to: filters.date_to }),
      ...(filters.proprietaire_id && { proprietaire_id: filters.proprietaire_id })
    });
    return axios.get(`${API_BASE}/reports/fees?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: format === 'json' ? 'json' : 'blob'
    });
  }
};

// Export all services
export { CandidatureService, AttachmentService, ReportService };
