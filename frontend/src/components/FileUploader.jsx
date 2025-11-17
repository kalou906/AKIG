/**
 * FileUploader.jsx
 * Phase 9: Drag & drop file upload component
 * Progress tracking, validation, preview
 */

import React, { useState, useRef } from 'react';
import { Upload, X, Check, AlertCircle, Loader } from 'lucide-react';
import axios from 'axios';

export default function FileUploader({ entityType, entityId, onSuccess, onClose }) {
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  const API_BASE = 'http://localhost:4000/api';
  const token = localStorage.getItem('token');

  const ALLOWED_EXT = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'jpg', 'jpeg', 'png', 'gif', 'tiff', 'zip'];
  const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

  const validateFile = (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
      return `Format "${ext}" non autorisé`;
    }
    if (file.size > MAX_SIZE) {
      return 'Fichier trop volumineux (max 10 MB)';
    }
    return null;
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const newFiles = Array.from(e.dataTransfer.files).map(file => {
      const error = validateFile(file);
      return {
        file,
        id: Math.random(),
        error,
        progress: 0,
        status: 'pending'
      };
    });

    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleFileSelect = (e) => {
    const newFiles = Array.from(e.target.files).map(file => {
      const error = validateFile(file);
      return {
        file,
        id: Math.random(),
        error,
        progress: 0,
        status: 'pending'
      };
    });

    setFiles(prev => [...prev, ...newFiles]);
  };

  const uploadFile = async (fileObj) => {
    if (fileObj.error) return;

    const formData = new FormData();
    formData.append('file', fileObj.file);
    formData.append('entityType', entityType);
    formData.append('entityId', entityId);

    try {
      setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: 'uploading' } : f));

      await axios.post(`${API_BASE}/attachments/upload`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (e) => {
          const progress = Math.round((e.loaded / e.total) * 100);
          setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, progress } : f));
        }
      });

      setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: 'success' } : f));
    } catch (error) {
      setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: 'error', error: error.response?.data?.error || 'Upload échoué' } : f));
    }
  };

  const handleUpload = async () => {
    setUploading(true);
    const validFiles = files.filter(f => !f.error && f.status === 'pending');

    for (const fileObj of validFiles) {
      await uploadFile(fileObj);
    }

    setUploading(false);

    const allSuccess = files.every(f => f.status === 'success' || f.error);
    if (allSuccess && onSuccess) {
      onSuccess();
    }
  };

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const completedCount = files.filter(f => f.status === 'success').length;
  const validFilesCount = files.filter(f => !f.error).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold">Ajouter des fichiers</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition cursor-pointer ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept={ALLOWED_EXT.map(ext => `.${ext}`).join(',')}
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="space-y-2"
            >
              <Upload className="mx-auto text-gray-400" size={32} />
              <div className="text-gray-600">
                <span className="font-semibold">Cliquez ou glissez les fichiers</span>
                <div className="text-xs text-gray-500 mt-1">
                  Formats: {ALLOWED_EXT.join(', ')} • Max 10 MB
                </div>
              </div>
            </div>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">
                  {files.length} fichier(s) • {completedCount} complété(s)
                </h3>
                {files.some(f => f.status !== 'success' && !f.error) && (
                  <button
                    onClick={() => setFiles([])}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Effacer
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {files.map(fileObj => (
                  <div key={fileObj.id} className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate">
                          {fileObj.file.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {(fileObj.file.size / 1024).toFixed(1)} KB
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-2">
                        {fileObj.status === 'uploading' && (
                          <Loader className="text-blue-600 animate-spin" size={18} />
                        )}
                        {fileObj.status === 'success' && (
                          <Check className="text-green-600" size={18} />
                        )}
                        {(fileObj.error || (fileObj.status === 'error')) && (
                          <AlertCircle className="text-red-600" size={18} />
                        )}
                        <button
                          onClick={() => removeFile(fileObj.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Error Message */}
                    {(fileObj.error || (fileObj.status === 'error' && fileObj.error)) && (
                      <div className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">
                        {fileObj.error}
                      </div>
                    )}

                    {/* Progress Bar */}
                    {fileObj.status === 'uploading' && (
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full transition-all"
                          style={{ width: `${fileObj.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Fermer
            </button>
            {validFilesCount > 0 && (
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {uploading ? 'Upload en cours...' : `Télécharger ${validFilesCount} fichier(s)`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
