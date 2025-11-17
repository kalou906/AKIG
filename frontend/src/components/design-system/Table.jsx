export function Table({ headers, rows }) {
    return (
        <table className="min-w-full border rounded overflow-hidden bg-white">
            <thead className="bg-gray-100">
                <tr>
                    {headers.map((h, i) => (
                        <th key={i} className="px-4 py-2 text-left font-semibold">{h}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {rows.map((row, i) => (
                    <tr key={i} className="border-t hover:bg-gray-50">
                        {row.map((cell, j) => (
                            <td key={j} className="px-4 py-2">{cell}</td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}