# QA Export PDF Premium (Tableaux multi-années)

## 1. Préparation
- Lancer le frontend (`npm start`).
- Charger le dataset 2015-2025.
- Connexion avec un compte disposant des droits premium.

## 2. Tests fonctionnels
1. Naviguer vers le dashboard premium.
2. Vérifier que les filtres multi-années s’affichent (sélecteur de période).
3. Sélectionner différentes plages et vérifier :
   - Graphiques (tendance, badges) se mettent à jour.
   - Data-table affiche les totaux prévus.
4. Clic sur « Export PDF ».
5. Télécharger le fichier et l’ouvrir sur ordinateur, tablette, mobile.
6. Contrôler :
   - Couleurs conformes au guide (bleu, rouge, blanc + bande guinéenne).
   - Typographies Montserrat / Poppins.
   - Totaux identiques à l’écran.

## 3. Tests de robustesse
- Filtre sur une seule année (ex: 2019).
- Plage large (2015-2025).
- Filtre sans données (vérifier message d’alerte).
- Export répété (aucune erreur, pas de doublon).

## 4. Vérifications supplémentaires
- Temps de génération < 3 secondes.
- Fichier < 5 Mo.
- Compatibilité avec PDF viewer mobile.

## 5. Consignation
| Test | Résultat | Notes |
|------|----------|-------|
| Filtre 2015-2018 | ☐ | |
| Filtre 2018-2021 | ☐ | |
| Filtre 2021-2025 | ☐ | |
| Export PDF 2015-2025 | ☐ | |
| Responsive PDF | ☐ | |

## 6. Corrections
- Si échec, documenter la cause.
- Ouvrir un ticket (GitHub / Notion) avec capture PDF et logs console.
