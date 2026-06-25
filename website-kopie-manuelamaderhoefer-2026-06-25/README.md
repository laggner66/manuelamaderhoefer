# Website-Kopie manuelamaderhoefer.com

Lokale Arbeitskopie der Website `https://www.manuelamaderhoefer.com` vom 2026-06-25.

## Struktur

- `site/`: lokal lauffaehige statische Kopie der Website-Dateien.
- `rendered-pages/`: per Browser gerenderte HTML- und Text-Snapshots der sichtbaren Seiten.
- `screenshots/`: Screenshots der gerenderten Seiten.
- `reports/manifest.json`: technische Uebersicht der gesicherten Dateien, Routen und Hinweise.
- `tools/archive-site.mjs`: reproduzierbares Skript zum erneuten Sichern.
- `ZEITAUFZEICHNUNG.md`: Arbeitsschritte und Zeiten.

## Lokal ansehen

```bash
cd "/Users/tlmacbookpro/Documents/MADER-HÖFER Manuela/website-kopie-manuelamaderhoefer-2026-06-25/site"
python3 -m http.server 4173
```

Danach im Browser oeffnen: `http://localhost:4173`

## Hinweis

Die Website ist eine clientseitig gerenderte SPA. Einige Funktionen bleiben bewusst externe Verweise, zum Beispiel Calendly, WhatsApp, Google Maps und Bewertungsplattformen. Fuer den Neubau sind besonders `rendered-pages/*.txt`, `rendered-pages/*.html` und die Bilder in `site/external-assets/` relevant.

