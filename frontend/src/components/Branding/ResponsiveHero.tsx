import React from 'react';
import classNames from 'clsx';

/**
 * Responsive hero avec bande guinéenne, couleurs AKIG,
 * adapté pour mobile / tablette / desktop.
 */
const ResponsiveHero: React.FC = () => {
  return (
    <section className="w-full overflow-hidden bg-akig-bg">
      <div
        className={classNames(
          'relative mx-auto flex w-full max-w-content-wide flex-col overflow-hidden rounded-3xl shadow-hero',
          'bg-white md:flex-row'
        )}
      >
        <div className="absolute left-0 top-0 h-full w-1 md:w-2">
          <span className="absolute inset-0 bg-akig-flag-vertical" aria-hidden />
        </div>

        <div className="flex-1 px-6 py-12 sm:px-10 md:px-12 lg:px-16">
          <p className="text-sm font-semibold uppercase tracking-wider text-akig-flag-red md:text-base">
            AKIG Immobilier Premium
          </p>
          <h1 className="mt-3 text-3xl font-heading font-bold text-akig-blue sm:text-4xl md:text-[2.75rem]">
            Optimisez vos loyers avec une suite fiable à 100%
          </h1>
          <p className="mt-4 max-w-xl text-base text-akig-muted sm:text-lg">
            Un démarrage garanti sans page blanche : paiements en 2 minutes, SMS automatiques, dashboard impayés, et rapports
            PDF prêts pour vos propriétaires.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#demo"
              className="rounded-full bg-akig-blue px-6 py-3 text-center text-sm font-semibold text-white shadow-md transition-colors duration-200 hover:bg-akig-blueDeep sm:text-base"
            >
              Lancer la démo guidée
            </a>
            <a
              href="#guided-tour"
              className="rounded-full border border-akig-blue px-6 py-3 text-center text-sm font-semibold text-akig-blue transition-colors duration-200 hover:bg-akig-blue/10 sm:text-base"
            >
              Voir le guide interactif
            </a>
          </div>

          <dl className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <dt className="text-xs font-semibold uppercase text-akig-muted">Performance</dt>
              <dd className="text-lg font-bold text-akig-blue sm:text-xl">99.9%</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-akig-muted">SMS envoyés</dt>
              <dd className="text-lg font-bold text-akig-blue sm:text-xl">+12K/mois</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-akig-muted">Agents premium</dt>
              <dd className="text-lg font-bold text-akig-blue sm:text-xl">48</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-akig-muted">Temps d'intégration</dt>
              <dd className="text-lg font-bold text-akig-blue sm:text-xl">5 min</dd>
            </div>
          </dl>
        </div>

        <div className="relative flex-1 bg-akig-hero px-6 py-12 text-akig-light sm:px-10 md:px-12 lg:px-16">
          <div className="absolute inset-x-0 top-0 h-px bg-white/20" aria-hidden />
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-sm uppercase tracking-wider text-akig-light/80">Accessible mobile & tablette</p>
              <h2 className="mt-2 text-2xl font-heading font-semibold sm:text-3xl">Design responsive premium</h2>
              <p className="mt-3 text-sm text-akig-light/80 sm:text-base">
                Interfaces optimisées pour smartphone, tablette et desktop, respectant la charte AKIG (bleu, rouge, blanc +
                bande guinéenne).
              </p>
            </div>

            <ul className="space-y-4 text-sm sm:text-base">
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-akig-light/40 bg-akig-light/10 text-xs font-semibold text-akig-light">
                  1
                </span>
                <p>Tableau de bord agents avec scoring, badges et filtres multi-années.</p>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-akig-light/40 bg-akig-light/10 text-xs font-semibold text-akig-light">
                  2
                </span>
                <p>Exports PDF premium alignés sur la charte (Montserrat / Poppins, bande guinéenne).</p>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-akig-light/40 bg-akig-light/10 text-xs font-semibold text-akig-light">
                  3
                </span>
                <p>Notifications mobiles instantanées (paiement, préavis, risques) testées en conditions locales.</p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResponsiveHero;
