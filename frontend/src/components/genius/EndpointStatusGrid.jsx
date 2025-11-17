import React, { useEffect, useState } from 'react';
import { ENDPOINT_CATEGORIES, buildEndpointUrl } from '../../api/endpoints';

const StatusDot = ({ ok }) => (
    <span className={`inline-block w-2 h-2 rounded-full ${ok ? 'bg-emerald-500' : 'bg-red-500'}`} />
);

export default function EndpointStatusGrid() {
    const [status, setStatus] = useState({}); // key -> {ok}

    useEffect(() => {
        (async () => {
            const token = localStorage.getItem('token') || '';
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const next = {};
            for (const cat of ENDPOINT_CATEGORIES) {
                for (const item of cat.items) {
                    try {
                        const res = await fetch(buildEndpointUrl(item.path), { headers });
                        next[item.key] = { ok: res.ok };
                    } catch (e) {
                        next[item.key] = { ok: false };
                    }
                }
            }
            setStatus(next);
        })();
    }, []);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ENDPOINT_CATEGORIES.map(cat => (
                <div key={cat.id} className="bg-white/70 backdrop-blur rounded-lg border border-gray-200 shadow-sm">
                    <div className="px-3 py-2 border-b text-xs font-semibold text-gray-600">
                        {cat.label}
                    </div>
                    <div className="p-3 grid grid-cols-2 gap-2">
                        {cat.items.map(item => (
                            <div key={item.key} className="flex items-center gap-2 text-sm text-gray-700">
                                <StatusDot ok={status[item.key]?.ok} />
                                <span className="truncate" title={item.path}>{item.key}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
