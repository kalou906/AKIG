import ical from "ical-generator";

const downloadBlob = (blob, filename) => {
  if (typeof document === "undefined") {
    return;
  }
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};

export function exportSeasonCalendar({
  name = "AKIG Saison",
  bookings = [],
}) {
  const calendar = ical({ name });

  bookings.forEach(({ date, summary = "Réservation", description }) => {
    const start = new Date(date);
    const end = new Date(date);
    end.setHours(end.getHours() + 1);

    calendar.createEvent({
      start,
      end,
      summary,
      description,
    });
  });

  const blob = new Blob([calendar.toString()], { type: "text/calendar" });
  downloadBlob(blob, `${name.replace(/\s+/g, "-").toLowerCase()}.ics`);
}
