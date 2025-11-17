export function agentBadges(metrics) {
  const badges = [];
  if ((metrics.encaissementsMois ?? 0) >= 30) {
    badges.push("Top Encaisseur");
  }
  if ((metrics.tauxRecouvrement ?? 0) >= 0.95) {
    badges.push("Pro du Recouvrement");
  }
  if ((metrics.visitesJournalières ?? 0) >= 10) {
    badges.push("Terrain Expert");
  }
  return badges;
}
