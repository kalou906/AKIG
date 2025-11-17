/**
 * MediaGallery.jsx
 * Phase 9: File gallery, preview, download, search
 */

import React, { useState, useEffect } from 'react';
import { Download, Trash2, Search, Eye, Image as ImageIcon, FileText } from 'lucide-react';
import axios from 'axios';

export default function MediaGallery({ entityType, entityId, onClose }) {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterExt, setFilterExt] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [stats, setStats] = useState(null);

  const API_BASE = 'http://localhost:4000/api';
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchAttachments();
    fetchStats();
  }, [search, filterExt]);

  const fetchAttachments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        entity_type: entityType,
        entity_id: entityId,
        ...(search && { filename: search }),
        ...(filterExt && { ext: filterExt })
      });

      const res = await axios.get(`${API_BASE}/attachments/entity/${entityType}/${entityId}?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAttachments(res.data.data || []);
    } catch (error) {
      console.error('Error fetching attachments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_BASE}/attachments/stats/overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleDownload = async (attachmentId, filename) => {
    try {
      const res = await axios.get(`${API_BASE}/attachments/${attachmentId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const handleDelete = async (attachmentId) => {
    if (!window.confirm('Confirmer la suppression?')) return;

    try {
      await axios.delete(`${API_BASE}/attachments/${attachmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAttachments();
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const handlePreview = async (attachmentId) => {
    try {
      const res = await axios.get(`${API_BASE}/attachments/${attachmentId}/preview`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(res.data);
      setSelectedFile({ id: attachmentId, url });
    } catch (error) {
      console.error('Error loading preview:', error);
    }
  };

  const isImage = (ext) => ['jpg', 'jpeg', 'png', 'gif', 'tiff'].includes(ext.toLowerCase());

  const fileGroups = {};
  attachments.forEach(att => {
    const ext = att.ext.toLowerCase();
    if (!fileGroups[ext]) fileGroups[ext] = [];
    fileGroups[ext].push(att);
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold">Galerie Média</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-4 gap-3 bg-gray-50 p-3 rounded-lg">
              <div>
                <div className="text-xs text-gray-600">Fichiers</div>
                <div className="text-lg font-bold">{stats.count}</div>
              </div>
              <div>
                <div className="text-xs text-gray-600">Taille totale</div>
                <div className="text-lg font-bold">{(stats.total_size / 1024 / 1024).toFixed(1)} MB</div>
              </div>
              <div>
                <div className="text-xs text-gray-600">Téléchargements</div>
                <div className="text-lg font-bold">{stats.total_downloads || 0}</div>
              </div>
              <div>
                <div className="text-xs text-gray-600">Dernier upload</div>
                <div className="text-sm font-semibold">{stats.last_upload ? new Date(stats.last_upload).toLocaleDateString('fr-FR') : 'N/A'}</div>
              </div>
            </div>
          )}

          {/* Search & Filter */}
          <div className="flex gap-3">
            <div className="flex-1 flex items-center gap-2 border rounded-lg px-3 py-2">
              <Search size={18} className="text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 outline-none"
              />
            </div>
            <select
              value={filterExt}
              onChange={(e) => setFilterExt(e.target.value)}
              className="border rounded-lg px-3 py-2"
            >
              <option value="">Tous les formats</option>
              {Object.keys(fileGroups).map(ext => (
                <option key={ext} value={ext}>{ext.toUpperCase()} ({fileGroups[ext].length})</option>
              ))}
            </select>
          </div>

          {/* File List */}
          {loading ? (
            <div className="text-center py-8 text-gray-500">Chargement...</div>
          ) : attachments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Aucun fichier trouvé</div>
          ) : (
            <div className="space-y-4">
              {Object.entries(fileGroups).map(([ext, files]) => (
                <div key={ext} className="space-y-2">
                  <h3 className="font-semibold text-sm text-gray-700 uppercase">{ext} ({files.length})</h3>
                  <div className="space-y-2">
                    {files.map(att => (
                      <div key={att.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg hover:bg-gray-100">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="text-gray-400 flex-shrink-0">
                            {isImage(att.ext) ? <ImageIcon size={20} /> : <FileText size={20} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold truncate">{att.original_filename}</div>
                            <div className="text-xs text-gray-500">
                              {(att.file_size / 1024).toFixed(1)} KB • {new Date(att.created_at).toLocaleDateString('fr-FR')}
                              {att.download_count > 0 && ` • ${att.download_count} téléchargement(s)`}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isImage(att.ext) && (
                            <button
                              onClick={() => handlePreview(att.id)}
                              className="text-blue-600 hover:text-blue-900 p-2"
                              title="Aperçu"
                            >
                              <Eye size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDownload(att.id, att.original_filename)}
                            className="text-green-600 hover:text-green-900 p-2"
                            title="Télécharger"
                          >
                            <Download size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(att.id)}
                            className="text-red-600 hover:text-red-900 p-2"
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preview Modal */}
        {selectedFile && (
          <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
            onClick={() => setSelectedFile(null)}
          >
            <div className="max-w-2xl max-h-[80vh] bg-white rounded-lg overflow-hidden" onClick={e => e.stopPropagation()}>
              <img src={selectedFile.url} alt="Preview" className="w-full h-full object-contain" />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-100"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
