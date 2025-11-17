# Validation Dashboards Premium (Multi-année + PDF)

## Objectif
Garantir que les tableaux premium (scoring agents, badges, historique multi-années) et les exports PDF sont fonctionnels et cohérents avec les données 2015 → 2025.

---

## Étape 1 – Préparer les données de test (2015-2025)
1. Importer l’historique complet (2015 → 2025). Si le script SQL existe (ex: `migrations/005_phase4_complete_schema.sql`), l’exécuter sur une base de test.
2. Vérifier qu’il n’y a pas de doublons :
```sql
SELECT year, COUNT(*)
FROM payments
GROUP BY year
ORDER BY year;
```
3. Contrôler les totaux annuels :
```sql
SELECT year, SUM(amount) AS total_paid
FROM payments
GROUP BY year
ORDER BY year;
```
Comparer avec les valeurs attendues (tableau Excel ou chiffres fournis).

---

## Étape 2 – Vérifier les filtres multi-années (Frontend)
1. Lancer le frontend : `npm --prefix frontend start`.
2. Naviguer vers le dashboard premium (ex: `/dashboard/premium`).
3. Tester les filtres entre 2015 et 2025 :
   - Sélectionner différentes plages (2015-2018, 2018-2021, 2021-2025).
   - Vérifier que les graphiques (tendance, badges, scoring) se mettent à jour.
   - Croiser les chiffres avec la base SQL (ex: pour 2017, total payments correspond).
4. Observer la console : aucun warning/erreur React.

---

## Étape 3 – Export PDF
1. Générer un PDF via l’UI (« Export PDF ») ou la route API :
   ```bash
   curl -L -o rapport-premium.pdf "http://localhost:4000/api/pdf/rapports-premium?startYear=2015&endYear=2025"
   ```
   (Adapter le chemin/endpoint selon implémentation réelle : voir `backend/src/routes/pdf.routes.js`).
2. Ouvrir le PDF généré et vérifier :
   - Présence du logo, bande aux couleurs guinéennes.
   - Tableaux cohérents avec l’UI.
   - Historique complet (2015-2025) sans rupture.
3. Effacer les fichiers temporaires si besoin (répertoire `backend/exports/`).

---

## Étape 4 – Checklist
| Item | Résultat | Commentaire |
|------|----------|-------------|
| Import 2015-2025 sans doublons | ☐ | |
| Totaux annuels OK | ☐ | |
| Filtre multi-années (2015-2018) | ☐ | |
| Filtre multi-années (2018-2021) | ☐ | |
| Filtre multi-années (2021-2025) | ☐ | |
| Export PDF premium | ☐ | |
| PDF lisible sur mobile/tablette | ☐ | |

---

## Étape 5 – Corrections (si anomalies)
- **Doublons** : supprimer les enregistrements dupliqués (`DELETE ... WHERE ctid NOT IN (SELECT min(ctid) ...)`).
- **Totaux incohérents** : recalculer sur table `ledger` ou `payments_archive`.
- **Filtres UI** : vérifier le hook multi-année (`frontend/src/pages/Fiscal.jsx`) et les appels API (`frontend/src/lib/httpClient.ts`).
- **PDF** : inspecter `backend/src/services/pdf.service.js` (mise en page, données). Ajuster les margins, polices, etc.

---

## Livrables
- Rapport PDF validé (`rapport-premium.pdf`).
- Export Excel/CSV des tests multi-années (optionnel).
- Mise à jour du document Q/A (inscrire la validation de cette fonctionnalité).
