import React, { useEffect } from 'react';
import { X, Zap, SlidersHorizontal, MonitorSmartphone, CircuitBoard } from 'lucide-react';
import { useUIConfig } from '../../context/UIConfigContext';
import ApiExplorer from './ApiExplorer';

const AccentSwatch = ({ color, selected, onSelect }) => (
    <button
        title={color}
        onClick={() => onSelect(color)}
        className={`w-8 h-8 rounded-full border-2 transition-transform ${selected ? 'scale-110 border-black/20' : 'border-transparent'}
      bg-gradient-to-br from-${color}-500 to-${color}-700`}
    />
);

export default function GeniusPanel({ open, onClose }) {
    const {
        theme,
        setTheme,
        density,
        setDensity,
        accent,
        setAccent,
        geniusEnabled,
        setGeniusEnabled,
        showSidebar,
        setShowSidebar,
        uiMode,
        setUiMode
    } = useUIConfig();

    useEffect(() => {
        const handler = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                if (onClose) onClose(false);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100]">
            <div className="absolute inset-0 bg-black/40" onClick={() => onClose(false)} />

            <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl border-l border-gray-200 flex flex-col">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-yellow-100 text-yellow-700 rounded">
                            <Zap size={16} />
                        </div>
                        <h3 className="text-base font-semibold text-gray-900">Mode Génie — Paramètres avancés</h3>
                    </div>
                    <button onClick={() => onClose(false)} className="p-1.5 hover:bg-gray-100 rounded">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-5 space-y-6 overflow-auto">
                    {/* UI Mode */}
                    <section>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Mode d'interface</label>
                        <div className="mt-2 grid grid-cols-3 gap-2">
                            {[
                                { id: 'classic', label: 'Classique' },
                                { id: 'modern', label: 'Moderne' },
                                { id: 'pro', label: 'Pro' },
                            ].map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => setUiMode(m.id)}
                                    className={`p-3 rounded-lg border text-sm flex items-center justify-center gap-2 ${uiMode === m.id ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:bg-gray-50'}`}
                                >
                                    <MonitorSmartphone size={16} /> {m.label}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Toggle Genius */}
                    <section>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Activation</label>
                        <div className="mt-2 flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <div className="flex items-center gap-2">
                                <SlidersHorizontal size={16} className="text-gray-500" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Activer le mode Génie</p>
                                    <p className="text-xs text-gray-500">Thème avancé + réglages experts</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setGeniusEnabled(!geniusEnabled)}
                                className={`px-3 py-1.5 rounded text-xs font-medium ${geniusEnabled ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 text-gray-700'}`}
                            >
                                {geniusEnabled ? 'Activé' : 'Désactivé'}
                            </button>
                        </div>
                    </section>

                    {/* Theme */}
                    <section>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Thème</label>
                        <div className="mt-2 grid grid-cols-3 gap-2">
                            {['light', 'dark', 'genius'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => t === 'genius' ? setGeniusEnabled(true) : setTheme(t)}
                                    className={`p-3 rounded-lg border text-sm ${(t === 'genius' && geniusEnabled) || (t !== 'genius' && theme === t) ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:bg-gray-50'}`}
                                >
                                    {t === 'light' ? 'Clair' : t === 'dark' ? 'Sombre' : 'Génie'}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Density */}
                    <section>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Densité</label>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                            {['comfortable', 'compact'].map(d => (
                                <button
                                    key={d}
                                    onClick={() => setDensity(d)}
                                    className={`p-3 rounded-lg border text-sm ${density === d ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:bg-gray-50'}`}
                                >
                                    {d === 'comfortable' ? 'Confortable' : 'Compact'}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Accent */}
                    <section>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Couleur d'accent</label>
                        <div className="mt-3 flex items-center gap-3 flex-wrap">
                            {['indigo', 'blue', 'emerald', 'violet', 'rose', 'amber'].map(c => (
                                <AccentSwatch key={c} color={c} selected={accent === c} onSelect={setAccent} />
                            ))}
                        </div>
                    </section>

                    {/* Sidebar */}
                    <section>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Barre latérale</label>
                        <div className="mt-2 flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <div>
                                <p className="text-sm font-medium text-gray-900">Afficher par défaut</p>
                                <p className="text-xs text-gray-500">Masquer/afficher la barre latérale à l'ouverture</p>
                            </div>
                            <button
                                onClick={() => setShowSidebar(!showSidebar)}
                                className={`px-3 py-1.5 rounded text-xs font-medium ${showSidebar ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 text-gray-700'}`}
                            >
                                {showSidebar ? 'Affichée' : 'Masquée'}
                            </button>
                        </div>
                    </section>

                    {/* Pro Tools */}
                    {uiMode !== 'classic' && (
                        <section>
                            <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-2">
                                <CircuitBoard size={14} /> Outils Pro
                            </label>
                            <div className="mt-2">
                                <ApiExplorer />
                            </div>
                        </section>
                    )}
                </div>

                <div className="mt-auto px-5 py-3 border-t bg-gray-50 flex items-center justify-between">
                    <p className="text-xs text-gray-500">Les réglages sont enregistrés automatiquement.</p>
                    <button onClick={() => onClose(false)} className="px-3 py-1.5 bg-indigo-600 text-white rounded text-sm">Fermer</button>
                </div>
            </div>
        </div>
    );
}
