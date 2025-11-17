import React from 'react';
import type { EnvironmentConfig } from '../config/environment';
import type { ModuleDiagnostic } from '../hooks/useSystemDiagnostics';

interface DiagnosticsPanelProps {
  env: EnvironmentConfig;
  status: 'checking' | 'ok' | 'degraded';
  lastChecked?: string;
  modules: ModuleDiagnostic[];
  lastError?: string;
}

export default function DiagnosticsPanel({ env, status, lastChecked, modules, lastError }: DiagnosticsPanelProps): React.ReactElement {
  return (
    <section className="mt-20 rounded-3xl bg-slate-950/70 p-8 shadow-lg shadow-black/30 ring-1 ring-white/10">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Diagnostics en direct</h2>
          <p className="text-sm text-slate-400">Comprenez en un coup d’œil l’état de la plateforme pendant les démonstrations.</p>
        </div>
        <span
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${status === 'ok'
              ? 'bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-500/40'
              : status === 'checking'
                ? 'bg-amber-500/20 text-amber-200 ring-1 ring-amber-500/40'
                : 'bg-rose-500/20 text-rose-200 ring-1 ring-rose-500/40'
            }`}
        >
          <span className="h-2 w-2 rounded-full bg-current" />
          {status === 'ok' && 'Statut : opérationnel'}
          {status === 'checking' && 'Statut : vérification en cours'}
          {status === 'degraded' && 'Statut : mode dégradé'}
        </span>
      </header>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <article className="rounded-2xl border border-white/10 bg-slate-900/50 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Environnement</h3>
          <dl className="mt-4 space-y-2 text-sm text-slate-200">
            <div className="flex justify-between gap-6">
              <dt className="text-slate-400">App Env</dt>
              <dd className="font-medium text-white">{env.appEnv}</dd>
            </div>
            <div className="flex justify-between gap-6">
              <dt className="text-slate-400">API Base URL</dt>
              <dd className="truncate font-medium text-white" title={env.apiBaseUrl}>
                {env.apiBaseUrl}
              </dd>
            </div>
            <div className="flex justify-between gap-6">
              <dt className="text-slate-400">Rôle actif</dt>
              <dd className="font-medium text-white">{env.userRole}</dd>
            </div>
            <div className="flex justify-between gap-6">
              <dt className="text-slate-400">Base path</dt>
              <dd className="font-medium text-white">{env.basePath}</dd>
            </div>
          </dl>
        </article>

        <article className="rounded-2xl border border-white/10 bg-slate-900/50 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Feature flags actifs</h3>
          <ul className="mt-4 space-y-2 text-sm text-slate-200">
            {env.featureFlagList.map((flag) => (
              <li key={flag} className="flex items-center justify-between gap-4">
                <span className="font-medium text-white">{flag}</span>
                <span className="text-xs uppercase tracking-wide text-emerald-300">Activé</span>
              </li>
            ))}
          </ul>
          {env.featureFlagList.length === 0 && (
            <p className="mt-4 text-xs text-rose-300">Aucun flag défini : l’interface restera vide.</p>
          )}
        </article>

        <article className="rounded-2xl border border-white/10 bg-slate-900/50 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Dernière vérification</h3>
          <p className="mt-4 text-sm text-slate-200">
            {lastChecked ? new Date(lastChecked).toLocaleTimeString('fr-FR') : 'En attente…'}
          </p>
          {lastError && (
            <p className="mt-3 text-xs text-rose-300">{lastError}</p>
          )}
          <p className="mt-4 text-xs text-slate-500">
            Les vérifications de santé et des modules /api sont ré-exécutées automatiquement toutes les 60 secondes.
          </p>
        </article>
      </div>

      <div className="mt-10 overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10 text-sm text-slate-200">
          <thead className="text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3 text-left">Module</th>
              <th className="px-4 py-3 text-left">Flag</th>
              <th className="px-4 py-3 text-left">Statut</th>
              <th className="px-4 py-3 text-left">Rôles</th>
              <th className="px-4 py-3 text-left">Route</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {modules.map((module, index) => (
              <tr key={`module-${index}`} className="transition hover:bg-white/5">
                <td className="px-4 py-3 font-medium text-white">{module.name}</td>
                <td className="px-4 py-3 text-slate-300">-</td>
                <td className="px-4 py-3">
                  {module.status === 'healthy' ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                      ✓ {module.status}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-200">
                      ✕ {module.status}
                    </span>
                  )}</td>
                <td className="px-4 py-3 text-slate-300">-</td>
                <td className="px-4 py-3 text-slate-400">-</td>
              </tr>
            ))}
            {modules.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">
                  Aucun module chargé — vérifiez l'état du système.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
