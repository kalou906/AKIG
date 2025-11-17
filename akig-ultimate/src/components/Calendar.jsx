import { useMemo, useState } from "react";

const daysOfWeek = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const formatDate = (year, month, day) => `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

export default function Calendar({ year = 2025, month = 10, bookings = [], onBlockDate, onCreateBooking }) {
  const [selected, setSelected] = useState(null);
  const first = useMemo(() => new Date(year, month - 1, 1), [year, month]);
  const startIdx = useMemo(() => (first.getDay() + 6) % 7, [first]); // lundi = 0
  const days = useMemo(() => new Date(year, month, 0).getDate(), [year, month]);
  const cells = useMemo(() => {
    const leading = Array.from({ length: startIdx }, () => null);
    const monthDays = Array.from({ length: days }, (_, i) => i + 1);
    return leading.concat(monthDays);
  }, [startIdx, days]);

  const getEntry = (day) => bookings.find((b) => b.date === formatDate(year, month, day));

  const handleSelect = (day) => {
    if (!day) {
      return;
    }
    setSelected(day);
  };

  const handleCreate = () => {
    if (!selected || !onCreateBooking) {
      return;
    }
    const target = formatDate(year, month, selected);
    onCreateBooking(target);
  };

  const handleBlock = () => {
    if (!selected || !onBlockDate) {
      return;
    }
    const target = formatDate(year, month, selected);
    onBlockDate(target);
  };

  return (
    <div className="border rounded p-3">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="font-semibold">
          Calendrier {String(month).padStart(2, "0")}/{year}
        </h4>
        <div className="flex gap-2 text-sm">
          <span className="rounded bg-akig-blue px-2 py-1 text-white">Réservé</span>
          <span className="rounded bg-akig-red px-2 py-1 text-white">Bloqué</span>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {daysOfWeek.map((day) => (
          <div key={day} className="text-center text-sm font-medium">
            {day}
          </div>
        ))}
        {cells.map((day, idx) => {
          if (!day) {
            return <div key={`empty-${idx}`} />;
          }

          const entry = getEntry(day);
          const isBlocked = Boolean(entry?.blocked);
          const isBooked = Boolean(entry && !entry.blocked);
          const selectedDay = day === selected;

          return (
            <button
              key={day}
              type="button"
              className={`h-20 rounded border p-1 text-left transition ${
                selectedDay ? "border-akig-blue ring-2 ring-akig-blue" : "hover:border-akig-blue"
              } ${isBlocked ? "bg-akig-red/10" : isBooked ? "bg-akig-blue50" : "bg-white"}`}
              onClick={() => handleSelect(day)}
            >
              <div className="flex h-full flex-col">
                <span className="text-xs font-medium">{day}</span>
                {isBooked ? (
                  <span className="mt-auto rounded bg-akig-blue px-1 text-xs text-white">Réservé</span>
                ) : null}
                {isBlocked ? (
                  <span className="mt-auto rounded bg-akig-red px-1 text-xs text-white">Bloqué</span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
      {selected ? (
        <div className="mt-3 flex gap-2">
          <button type="button" className="rounded bg-akig-blue px-3 py-2 text-white" onClick={handleCreate}>
            Créer réservation
          </button>
          <button type="button" className="rounded bg-akig-red px-3 py-2 text-white" onClick={handleBlock}>
            Bloquer la date
          </button>
        </div>
      ) : null}
    </div>
  );
}
