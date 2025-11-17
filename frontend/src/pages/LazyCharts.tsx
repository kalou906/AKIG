import React, { Suspense } from 'react';

const ReviewsChart = React.lazy(() =>
  import('../components/ReviewsChart').catch(() => ({
    default: () => (
      <div className="card text-center text-gray-600">
        Erreur lors du chargement du graphe
      </div>
    ),
  }))
);

function ChartSkeleton() {
  return (
    <div className="card space-y-3">
      <div className="h-4 w-1/3 rounded bg-gray-200 animate-pulse"></div>
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 rounded bg-gray-200 animate-pulse"></div>
        ))}
      </div>
    </div>
  );
}

export default function LazyCharts() {
  return (
    <div className="space-y-4">
      <h2>Graphiques & Analyses</h2>
      <Suspense fallback={<ChartSkeleton />}>
        <ReviewsChart />
      </Suspense>
    </div>
  );
}
