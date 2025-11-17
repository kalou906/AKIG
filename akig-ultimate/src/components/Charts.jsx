import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar } from "recharts";

export function RevenusChart({ data }) {
  return (
    <div className="h-64 rounded border p-3">
      <h4 className="mb-2 font-semibold">Revenus vs Impayés</h4>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="periode" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="revenus" stroke="#0B2E67" strokeWidth={2} />
          <Line type="monotone" dataKey="impayes" stroke="#E53935" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ChargesBar({ data }) {
  return (
    <div className="h-64 rounded border p-3">
      <h4 className="mb-2 font-semibold">Charges par type</h4>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="type" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="montant" fill="#E53935" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
