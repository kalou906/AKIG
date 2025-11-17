import { FormEvent, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage(): JSX.Element {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await login(email.trim(), password);
    } catch (err) {
      const message = (err as any)?.message ?? 'Connexion impossible. Vérifiez vos accès.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-akig-blue via-akig-blueDark to-akig-blue/90 px-4">
      <div className="w-full max-w-md space-y-8 rounded-3xl bg-white/95 p-10 shadow-premium">
        <header className="space-y-2 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-akig-red to-akig-gold text-lg font-bold text-white shadow-lg">
            AK
          </div>
          <h1 className="text-2xl font-semibold text-akig-blue">Connexion AKIG Première</h1>
          <p className="text-sm text-akig-blue/60">
            Accédez au cockpit premium du patrimoine guinéen en saisissant vos identifiants.
          </p>
        </header>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide text-akig-blue/60">
              Email professionnel
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-akig-blue/20 bg-white px-4 py-2 text-sm text-akig-blue shadow focus:border-akig-blue focus:outline-none focus:ring-2 focus:ring-akig-blue/20"
              placeholder="vous@akig-premiere.com"
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wide text-akig-blue/60">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-akig-blue/20 bg-white px-4 py-2 text-sm text-akig-blue shadow focus:border-akig-blue focus:outline-none focus:ring-2 focus:ring-akig-blue/20"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-akig-blue px-5 py-3 text-sm font-semibold text-white shadow transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? 'Connexion en cours…' : 'Se connecter'}
          </button>
        </form>

        <p className="text-center text-xs text-akig-blue/50">
          Besoin d’un accès ? Contactez <span className="font-semibold text-akig-blue">support@akig-premiere.com</span>
        </p>
      </div>
    </div>
  );
}
