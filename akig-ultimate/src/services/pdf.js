import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../assets/logo-akig.svg";

// Export générique (placeholder) conservé pour les listes.
export function exportPDF(filename, rows) {
  const payload = JSON.stringify({ filename, rows }, null, 2);
  const blob = new Blob([payload], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.pdf`;
  link.click();
  URL.revokeObjectURL(link.href);
}

// Génère une quittance PDF avec branding AKIG.
export function exportQuittancePDF({
  proprietaire = "AKIG",
  locataire,
  contrat,
  periode,
  montant_du,
  montant_paye,
  reste,
  montant,
}) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  // En-tête avec logo
  doc.addImage(logo, "SVG", 40, 30, 120, 40);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(14);
  doc.text("AGENCE KAMOULA IMMOBILIER GUINEE (AKIG)", 200, 50);
  doc.setFontSize(11);
  doc.text(`Quittance de loyer — Période: ${periode}`, 200, 70);

  // Corps du document
  const due = Number(montant_du ?? montant ?? 0);
  const paid = Number(montant_paye ?? montant ?? 0);
  const remaining = Number(reste ?? Math.max(due - paid, 0));

  autoTable(doc, {
    startY: 110,
    styles: { fontSize: 10 },
    head: [["Champ", "Valeur"]],
    body: [
      ["Propriétaire", proprietaire],
      ["Locataire", locataire ?? "-"],
      ["Contrat", contrat ?? "-"],
      ["Période", periode ?? "-"],
      ["Montant dû", `GNF ${due.toLocaleString()}`],
      ["Montant payé", `GNF ${paid.toLocaleString()}`],
      ["Reste", `GNF ${remaining.toLocaleString()}`],
    ],
  });

  // Bande guinéenne en pied de page
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const bandHeight = 8;
  doc.setFillColor(215, 25, 32);
  doc.rect(0, height - bandHeight, width / 3, bandHeight, "F");
  doc.setFillColor(255, 209, 0);
  doc.rect(width / 3, height - bandHeight, width / 3, bandHeight, "F");
  doc.setFillColor(0, 122, 94);
  doc.rect((width / 3) * 2, height - bandHeight, width / 3, bandHeight, "F");

  doc.save(`quittance-${contrat}-${periode}.pdf`);
}
