import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle, Loader2, XCircle, RefreshCcw } from 'lucide-react';
import { ENDPOINT_CATEGORIES, buildEndpointUrl } from '../../api/endpoints';

async function pingEndpoint(path, token) {
    const url = buildEndpointUrl(path);
    try {
        const res = await fetch(url, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        return { ok: res.ok, status: res.status };
    } catch (e) {
        return { ok: false, status: 'ERR' };
    }
}

export default function ApiExplorer() {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState({}); // key -> {ok,status}
    const token = useMemo(() => localStorage.getItem('token') || '', []);

    const runChecks = async () => {
        setLoading(true);
        const next = {};
        for (const cat of ENDPOINT_CATEGORIES) {
            for (const item of cat.items) {
                next[item.key] = await pingEndpoint(item.path, token);
            }
        }
        setResults(next);
        setLoading(false);
    };

    useEffect(() => {
        runChecks();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900">Explorateur d'API</h4>
                <button
                    onClick={runChecks}
                    disabled={loading}
                    className={`px-3 py-1.5 text-xs rounded border flex items-center gap-2 ${loading ? 'opacity-60' : ''}`}
                >
                    <RefreshCcw size={14} /> Tester
                </button>
            </div>

            {ENDPOINT_CATEGORIES.map(cat => (
                <div key={cat.id} className="border rounded-lg overflow-hidden">
                    <div className="px-3 py-2 bg-gray-50 border-b text-xs font-semibold text-gray-600">{cat.label}</div>
                    <div className="divide-y">
                        {cat.items.map(item => {
                            const r = results[item.key];
                            const Icon = !r ? Loader2 : r.ok ? CheckCircle : XCircle;
                            const color = !r ? 'text-gray-400 animate-spin' : r.ok ? 'text-emerald-600' : 'text-red-600';
                            return (
                                <div key={item.key} className="px-3 py-2 text-sm flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Icon size={16} className={color} />
                                        <span className="font-medium">{item.key}</span>
                                        <span className="text-xs text-gray-500">{item.path}</span>
                                    </div>
                                    <span className="text-xs text-gray-500">{r ? r.status : '...'}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
