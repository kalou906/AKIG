import { useState } from "react";
import Calendar from "../components/Calendar";
import { seasons, reservations as initialReservations } from "../data/seasons";
import { exportSeasonCalendar } from "../services/calendar";

const initialBookings = initialReservations.map((reservation) => ({
  date: reservation.date,
  ref: `BK-${reservation.id}`,
  client: reservation.client,
  blocked: false,
}));

export default function Saisonniere() {
  const [bookings, setBookings] = useState(initialBookings);
  const [reservations, setReservations] = useState(initialReservations);

  const onCreateBooking = (date) => {
    setBookings((current) =>
      current.concat({ date, ref: `BK-${Date.now()}`, client: "Client", blocked: false })
    );
    setReservations((current) =>
      current.concat({
        id: Date.now(),
        date,
        client: "Client",
        acompte: 0,
        reste: 0,
        statut: "En attente",
      })
    );
  };

  const onBlockDate = (date) => {
    setBookings((current) =>
      current.concat({ date, ref: `BL-${Date.now()}`, blocked: true })
    );
  };

  const handleExportCalendar = () => {
    exportSeasonCalendar({
      name: "AKIG Saison",
      bookings: bookings
        .filter((booking) => !booking.blocked)
        .map((booking) => ({
          date: booking.date,
          summary: `Réservation ${booking.client ?? "Client"}`,
          description: booking.ref,
        })),
    });
  };

  const priceForDate = (date) => {
    const target = new Date(date);
    const entry = seasons.find((season) => {
      const start = new Date(season.debut);
      const end = new Date(season.fin);
      return target >= start && target <= end;
    });
    return entry?.prix_jour ?? null;
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Locations saisonnières</h3>
      <div className="rounded border p-4">
        <h4 className="mb-2 font-semibold">Périodes tarifaires</h4>
        <ul className="space-y-1 text-sm">
          {seasons.map((season) => (
            <li key={season.id}>
              {season.label} — {season.debut} → {season.fin} — Prix jour: {season.prix_jour.toLocaleString()} GNF
            </li>
          ))}
        </ul>
      </div>
      <Calendar year={2025} month={10} bookings={bookings} onCreateBooking={onCreateBooking} onBlockDate={onBlockDate} />
      <button
        type="button"
        className="rounded bg-akig-blue px-3 py-2 text-white"
        onClick={handleExportCalendar}
      >
        Exporter calendrier (.ics)
      </button>
      <div className="rounded border p-4">
        <h4 className="mb-2 font-semibold">Réservations / blocs</h4>
        <ul className="space-y-1 text-sm">
          {reservations.map((reservation) => (
            <li key={reservation.id}>
              {reservation.date} — {reservation.client} — Acompte: {reservation.acompte.toLocaleString()} GNF — Reste: {reservation.reste.toLocaleString()} GNF — {reservation.statut}
              {(() => {
                const price = priceForDate(reservation.date);
                return price ? ` — Tarif jour: ${price.toLocaleString()} GNF` : "";
              })()}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
