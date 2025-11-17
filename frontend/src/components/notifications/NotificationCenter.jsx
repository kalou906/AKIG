import React, { useState, useEffect } from 'react';
import { Bell, X, AlertCircle, CheckCircle, Info, Clock } from 'lucide-react';
import { fetchNotifications } from '../../api/apiService';

const iconMap = {
    error: AlertCircle,
    success: CheckCircle,
    info: Info,
    warning: AlertCircle,
};

const colorMap = {
    error: 'text-red-600 bg-red-50',
    success: 'text-green-600 bg-green-50',
    info: 'text-blue-600 bg-blue-50',
    warning: 'text-yellow-600 bg-yellow-50',
};

export default function NotificationCenter({ isOpen, onClose }) {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const token = localStorage.getItem('token') || '';

    const loadNotifications = async () => {
        setLoading(true);
        const data = await fetchNotifications(token);
        setNotifications(data);
        setLoading(false);
    };

    useEffect(() => {
        if (isOpen) {
            loadNotifications();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]); if (!isOpen) return null;

    return (
        <div className="absolute right-0 top-12 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50">
            <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Bell size={18} className="text-gray-700" />
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                    {notifications.length > 0 && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                            {notifications.length}
                        </span>
                    )}
                </div>
                <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                    <X size={18} />
                </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
                {loading && (
                    <div className="p-8 text-center text-gray-500">
                        Chargement...
                    </div>
                )}

                {!loading && notifications.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        <Bell size={40} className="mx-auto mb-2 text-gray-300" />
                        <p>Aucune notification</p>
                    </div>
                )}

                {!loading && notifications.length > 0 && (
                    <div className="divide-y">
                        {notifications.map((notif, idx) => {
                            const Icon = iconMap[notif.type] || Info;
                            const colorClass = colorMap[notif.type] || colorMap.info;

                            return (
                                <div key={idx} className="p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-lg ${colorClass}`}>
                                            <Icon size={16} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">{notif.message || notif.title}</p>
                                            {notif.description && (
                                                <p className="text-xs text-gray-500 mt-1">{notif.description}</p>
                                            )}
                                            <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                                                <Clock size={12} />
                                                <span>{notif.time || notif.createdAt || 'À l\'instant'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="p-3 border-t bg-gray-50 text-center">
                <button
                    onClick={loadNotifications}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                    Actualiser
                </button>
            </div>
        </div>
    );
}
