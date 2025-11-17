import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, FileText, Home, Users, CreditCard, TrendingUp } from 'lucide-react';
import { searchGlobal } from '../../api/apiService';
import { useNavigate } from 'react-router-dom';

const iconMap = {
    contract: FileText,
    property: Home,
    tenant: Users,
    payment: CreditCard,
    default: TrendingUp
};

export default function GlobalSearch({ onClose }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const token = localStorage.getItem('token') || '';

    const performSearch = useCallback(async (searchQuery) => {
        if (!searchQuery || searchQuery.length < 2) {
            setResults([]);
            return;
        }

        setLoading(true);
        const data = await searchGlobal(searchQuery, token);
        setResults(data);
        setLoading(false);
    }, [token]);

    useEffect(() => {
        const timer = setTimeout(() => {
            performSearch(query);
        }, 300);

        return () => clearTimeout(timer);
    }, [query, performSearch]);

    const handleSelect = (result) => {
        if (result.type && result.id) {
            navigate(`/${result.type}s/${result.id}`);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-start justify-center pt-20" onClick={onClose}>
            <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b flex items-center gap-3">
                    <Search size={20} className="text-gray-400" />
                    <input
                        type="text"
                        placeholder="Rechercher propriétés, contrats, locataires, paiements..."
                        className="flex-1 outline-none text-lg"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        autoFocus
                    />
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                        <X size={20} />
                    </button>
                </div>

                <div className="max-h-96 overflow-y-auto">
                    {loading && (
                        <div className="p-8 text-center text-gray-500">
                            Recherche en cours...
                        </div>
                    )}

                    {!loading && query.length >= 2 && results.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            Aucun résultat trouvé
                        </div>
                    )}

                    {!loading && results.length > 0 && (
                        <div className="divide-y">
                            {results.map((result, idx) => {
                                const Icon = iconMap[result.type] || iconMap.default;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleSelect(result)}
                                        className="w-full p-4 hover:bg-gray-50 text-left flex items-center gap-4 transition-colors"
                                    >
                                        <div className="p-2 bg-blue-50 rounded-lg">
                                            <Icon size={20} className="text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">{result.title}</p>
                                            <p className="text-sm text-gray-500">{result.subtitle}</p>
                                        </div>
                                        <span className="text-xs text-gray-400 uppercase">{result.type}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
