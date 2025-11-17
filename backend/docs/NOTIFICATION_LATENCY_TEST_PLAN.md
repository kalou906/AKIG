# Plan de test de latence SMS / Email (conditions locales)

## Objectif
Mesurer le délai réel d'envoi et de réception des notifications critiques (paiement, préavis, risques) dans un contexte réseau guinéen :
- Périodes de coupure Internet
- Changement de réseau (4G → 3G)
- Débit réduit

Les mesures doivent alimenter les ajustements de retry et d’escalade dans le backend.

---

## Pré-requis
1. **PostgreSQL** et **backend API** démarrés.
2. Variables d’environnement configurées :
   - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` (ou provider local).
   - `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`.
3. Téléphone(s) test avec réseau local (Orange, MTN).
4. Adresse(s) email fonctionnelles (Gmail / domaine pro).

---

## Étapes de test

### 1. Lancer le backend en mode monitoré
```bash
npm --prefix backend run start:guarded
```
Le fichier `backend/logs/notification-latency.log` sera alimenté automatiquement.

### 2. Déclencher manuellement les notifications
Utiliser l’API ou l’outil interne pour envoyer :
- 3 SMS de paiement
- 3 SMS de préavis
- 3 emails (paiement + préavis)

> Bonus : déclencher un envoi pendant une coupure réseau (basculer le téléphone en mode avion 30s puis reconnecter).

### 3. Consigner les observations
- Heure de déclenchement (backend console).
- Heure de réception réelle (observée sur le téléphone / boîte mail).
- Latence calculée.

### 4. Exporter les données
Le fichier `backend/logs/notification-latency.log` contient des lignes JSON :
```json
{"timestamp":"2025-10-31T14:03:21.123Z","channel":"sms","recipient":"+224620000000","template":"twilio","durationMs":845,"success":true}
```
Importer le fichier dans Google Sheets / Excel pour analyse.

### 5. Ajustements
- Si `durationMs` > 3000 ms de manière récurrente → augmenter le nombre de retries.
- Si `success:false` fréquemment → prévoir fallback (email/SMS via second provider).
- Documenter le délai moyen par canal.

---

## Analyse recommandée
| Canal | Délai moyen | % échecs | Commentaire |
|-------|-------------|----------|-------------|
| SMS Paiement | 850 ms | 0 % | OK |
| SMS Préavis | 4300 ms | 20 % | Ajouter 1 retry |
| Email Paiement | 1200 ms | 0 % | OK |
| ... | ... | ... | ... |

---

## Actions post-test
1. Mettre à jour la configuration (`MAX_RETRIES`, `delayMs`) selon les résultats.
2. Conserver les logs dans un dossier sécurisé (preuve de conformité).
3. Ajouter un résumé dans le rapport d’exploitation.
