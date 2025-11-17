import { useState } from "react";

const initialTasks = [
  {
    id: 1,
    site: "Matam",
    type: "Plomberie",
    due: "2025-10-28",
    statut: "Ouvert",
    agent_id: 2,
    photos: ["https://via.placeholder.com/80x80.png?text=Photo"],
  },
];

export default function Maintenance() {
  const [tasks, setTasks] = useState(initialTasks);

  const addTask = () => {
    setTasks((current) =>
      current.concat({
        id: Date.now(),
        site: "Lambagni",
        type: "Électricité",
        due: "2025-11-02",
        statut: "Planifié",
        agent_id: 4,
        photos: [],
      })
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Maintenance planifiée</h3>
      <button type="button" className="rounded bg-akig-blue px-3 py-2 text-white" onClick={addTask}>
        + Ajouter une tâche
      </button>
      <table className="mt-3 w-full border">
        <thead className="bg-akig-blue50">
          <tr>
            <th className="border p-2">Site</th>
            <th className="border p-2">Type</th>
            <th className="border p-2">Échéance</th>
            <th className="border p-2">Statut</th>
            <th className="border p-2">Agent</th>
            <th className="border p-2">Photos</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id}>
              <td className="border p-2">{task.site}</td>
              <td className="border p-2">{task.type}</td>
              <td className="border p-2">{task.due}</td>
              <td className="border p-2">{task.statut}</td>
              <td className="border p-2">#{task.agent_id ?? "-"}</td>
              <td className="border p-2">
                <div className="flex gap-1">
                  {(task.photos ?? []).map((photo) => (
                    <img key={photo} src={photo} alt="Maintenance" className="h-12 w-12 rounded object-cover" />
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
