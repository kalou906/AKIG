export function ErrorBanner({ message }) {
    return <div role="alert" aria-live="polite" className="bg-akig-danger text-white px-4 py-2 rounded">❌ {message}</div>;
}
export function SuccessBanner({ message }) {
    return <div role="status" aria-live="polite" className="bg-akig-success text-white px-4 py-2 rounded">✅ {message}</div>;
}
export function SkeletonCard({ height = 24 }) {
    return <div className="animate-pulse bg-gray-200 rounded" style={{ height }} />;
}