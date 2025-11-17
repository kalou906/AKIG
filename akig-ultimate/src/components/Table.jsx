export default function Table({ columns, data, actions }) {
  return (
    <table className="w-full border">
      <thead className="bg-akig-blue50">
        <tr>
          {columns.map((column) => (
            <th key={column.key} className="border p-2 text-left text-sm font-semibold text-akig-blue">
              {column.label}
            </th>
          ))}
          {actions ? <th className="border p-2 text-left text-sm font-semibold text-akig-blue">Actions</th> : null}
        </tr>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr key={row.id} className="odd:bg-white even:bg-akig-blue50/40">
            {columns.map((column) => (
              <td key={column.key} className="border p-2 text-sm">
                {column.render ? column.render(row[column.key], row) : row[column.key]}
              </td>
            ))}
            {actions ? (
              <td className="border p-2 text-sm">
                <div className="flex flex-wrap gap-2">
                  {actions.map((action) => (
                    <button
                      key={action.label}
                      type="button"
                      className={`rounded px-3 py-1 text-sm ${action.className ?? "border"}`}
                      onClick={() => action.onClick(row)}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </td>
            ) : null}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
