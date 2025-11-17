export default function StatCard({ title, value, color = "bg-akig-blue", hint }) {
  return (
    <div className={`rounded p-4 text-white ${color}`}>
      <div className="text-sm opacity-90">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
      {hint ? <div className="mt-1 text-xs opacity-80">{hint}</div> : null}
    </div>
  );
}
