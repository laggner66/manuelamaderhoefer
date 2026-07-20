# Zeitaufzeichnung - Website-Kopie manuelamaderhoefer.com

Datum: 2026-06-25  
Zeitzone: Europe/Vienna

| Zeit | Arbeitsschritt | Ergebnis |
| --- | --- | --- |
| 11:14 | Projektordner geprueft | Arbeitsbereich war leer bis auf Git-Verzeichnis. |
| 11:15 | Live-Website technisch geprueft | Hostinger-Horizons-SPA mit HTML, JS/CSS-Bundle, Logo und externen Bildern/Skripten erkannt. |
| 11:16 | Routen und externe Assets ermittelt | Unterseiten und Asset-Quellen aus HTML/JS-Bundle gesammelt. |
| 11:18 | Archivierungsskript erstellt | Reproduzierbares Node-Skript fuer statische Kopie, externe Assets und Browser-Snapshots angelegt. |
| 11:21 | Erster Archivierungslauf abgeschlossen | 35 Dateien heruntergeladen, 10 Routen als gerenderte Snapshots gesichert, keine Fehler im Manifest. |
| 11:23 | Screenshot-Erzeugung verbessert | Scroll-Reveal fuer animierte Seitenbereiche ergaenzt und HTTP-Abrufe robuster gemacht. |
| 11:25 | Zweiter Archivierungslauf abgeschlossen | Screenshots nach Scrollen neu erzeugt, Manifest erneut mit 35 Downloads und 0 Fehlern geschrieben. |
| 11:26 | Lokale Kopie geprueft | Lokaler Server auf Port 4173 gestartet; alle 10 Routen mit HTTP 200 getestet. |
| 11:26 | Sichtkontrolle durchgefuehrt | Lokaler Startseiten-Screenshot mit sichtbaren Seitenbereichen erzeugt und geprueft. |
| 11:29 | Lokale Ansicht bereitgestellt | Aktiver Server unter http://127.0.0.1:4173 gestartet und mit HTTP 200 geprueft. |
| 11:34 | Angebotsinhalte bereinigt | Hinweise, Preise und sichtbare Texte zu Shiatsu und Beckenbodentraining aus der neuen Seite entfernt. |
| 11:38 | ProvenExpert korrigiert | ProvenExpert-Widget und lokales Profil-HTML wiederhergestellt, nachdem es bestehen bleiben soll. |
| 11:40 | Supervision korrigiert | Formulierungen zu "in Ausbildung unter Supervision" wieder in Header, Ueber-mich-Texten und Impressum zugelassen. |
| 11:43 | Cookie-Hinweis verfeinert | Cookie-Banner heller, dezenter und kompakter gestaltet; Button als zurueckhaltende Pill-Variante umgesetzt. |
| 11:46 | Gerenderte Seiten geprueft | Zehn lokale Routen erneut als Snapshots geprueft; eigene Seiten ohne Shiatsu-/Beckenboden-Begriffe. |
| 11:49 | Browser-QA durchgefuehrt | Startseite, ProvenExpert, Supervision, Preis-Navigation und Cookie-Banner im In-App-Browser kontrolliert. |
| 11:50 | Debug-Wrapper entfernt | Uebernommenen Hostinger-Fetch-/Console-Debug-Wrapper aus lokalen HTML-Routen entfernt, um nicht relevante Konsolenfehler zu vermeiden. |
| 11:51 | Abschlusscheck abgeschlossen | Alle zehn lokalen Routen liefern HTTP 200; Bundle-Syntax und Begriffssuche ohne Fehler. |
| 11:54 | UI/UX-Audit erstellt | Desktop- und Mobile-Screenshots fuer Startseite, Preise, Kontakt und Menue gespeichert; Optimierungsvorschlaege in reports/ui-ux-audit-2026-06-25/NOTES.md dokumentiert. |
| 12:14 | ProvenExpert-Widgetbar eingebaut | Neues ProvenExpert-Bewertungssiegel als Desktop-Bar eingebunden, alten Slider entfernt, Cookie-Hinweis kompakter gemacht und Desktop-Abstand zur Widgetbar ergaenzt. |
| 12:14 | Finale QA und Snapshots aktualisiert | Bundle-Syntax, zehn HTTP-Routen, Desktop-/Mobile-Browseransicht, Mobile-Menue-ARIA und gerenderte Snapshots mit neuer ProvenExpert-Bar geprueft. |
| 12:15 | GitHub-Veröffentlichung vorbereitet | Ziel-Repository laggner66/manuelamaderhoefer geprueft und lokaler Projektstand fuer den ersten Push vorbereitet. |
| 12:20 | Navigation und Berufsbezeichnung bereinigt | Menuepunkt Gua Sha & Schroepfen aus Header, Footer und Mobile-Menue entfernt; Formulierung "in Ausbildung unter Supervision" aus eigenen Website-Texten entfernt. |
| 12:20 | Finale GitHub-QA abgeschlossen | Gerenderte Snapshots aktualisiert, zehn Routen mit HTTP 200 geprueft und eigene Site-/Snapshot-Dateien auf entfernte Supervision-Formulierung kontrolliert. |
| 12:30 | Jugendberatungsbild ersetzt | Markiertes Startseitenfoto durch ein neues Beratungsbild mit Jugendlichen ersetzt, Alt-Text aktualisiert und Desktop-/Mobile-Browser-QA durchgefuehrt. |
| 12:37 | Netlify-Projekt angelegt und deployt | Neues Netlify-Projekt `manuelamaderhoefer` erstellt, statische Site produktiv auf https://manuelamaderhoefer.netlify.app deployt und Live-Seite im Browser geprueft. |
| 15:42 | Bildwechsel geprueft | Git-Diff kontrolliert: Bewertungsbereich nutzt jetzt `n1a5222-manuela-maderhoefer.jpg` statt `39e7c142a361fc2b91c1193ad5e82752.jpg`; neue JPG-Datei ist lokal vorhanden. |
| 15:43 | Live-Bundle geprueft | Netlify-Bundle enthaelt noch `39e7c142a361fc2b91c1193ad5e82752.jpg`; der neue Bildwechsel ist damit lokal vorbereitet, aber noch nicht live veroeffentlicht. |
| 15:44 | Lokale Vorschau gestartet | Statischer Server fuer den lokalen Arbeitsstand auf http://127.0.0.1:4174 gestartet und mit HTTP 200 geprueft. |
| 15:48 | Blaue Ueber-mich-Ueberschrift korrigiert | `brand-overrides.css` ergaenzt und in alle statischen HTML-Einstiege eingebunden; Browser-QA bestaetigt Sage-Farbe `rgb(49, 61, 49)` statt Blau und keine Konsolenwarnungen/-fehler. |
| 15:50 | Veroeffentlichung vorbereitet | Netlify-Projektstatus, lokale Routen und neues CSS-Asset geprueft; alle lokalen Routen und `/assets/brand-overrides.css` liefern HTTP 200. |
| 15:53 | GitHub-Push und Netlify-Deploy abgeschlossen | Commit `9a96851` nach `main` gepusht und Production-Deploy `6a466cdf4f7bdb67f7c57f15` auf https://manuelamaderhoefer.netlify.app veroeffentlicht; Live-HTTP-Pruefung bestaetigt neues CSS, neues Portraitbild und Bundle-Referenz. |
| 16:07 | Ueber-mich-Text erneuert | Neuen Text mit Koerper-Seele-Leitgedanken eingebaut, Perchtoldsdorf-Bezug im sichtbaren Abschnitt ausgelassen, lokale HTTP-Checks und Browser-QA fuer Startseite und `/ueber-mich/` erfolgreich durchgefuehrt. |
| 16:09 | Ueber-mich-Text live veroeffentlicht | Commit `1d82ea1` nach `main` gepusht und Production-Deploy `6a4670eac3dd656f702895f2` abgeschlossen; Live-HTTP- und Browser-QA bestaetigen neuen Text, keinen Perchtoldsdorf-Bezug im Abschnitt und keine Konsolenwarnungen/-fehler. |
| 16:16 | Calendly-Startseiten-CTA eingebaut | Prominenten Button `Erstgespraech im Juli buchen` im Hero-Bereich ergaenzt, bestehende Termin-Buttons auf `https://calendly.com/manuelamaderhofer/kostenloses-erstgesprach?month=2026-07` geleitet und lokale Mobile-/Desktop-Browser-QA sowie Routenchecks durchgefuehrt. |
| 16:17 | Calendly-CTA live veroeffentlicht | Commit `d4553af` nach `main` gepusht und Production-Deploy `6a4672f6514d8e4284b67570` abgeschlossen; Live-HTTP- und Browser-QA bestaetigen sichtbaren Startseiten-CTA, exakte Calendly-URL und keine Konsolenwarnungen/-fehler. |
| 18:59 | Visitenkarten erstellt | Doppelseitige Querformat-Visitenkarte mit typografischem Entfaltungsraum-Logo, Maria-Enzersdorf-Kontaktdaten, 85 x 55 mm Endformat plus 3 mm Beschnitt als PDF und PNG-Vorschauen erzeugt; PDF-Info, Textauszug und visuelle PNG-Pruefung abgeschlossen. |
| 20:40 | Berufszeile im Header erweitert | Markenbereich auf allen statischen Routen per `brand-copy-overrides.js` auf `Lebensberaterin (Personzentriert), Psychologische Beratung, Coaching` aktualisiert; Desktop-/Mobile-Browser-QA bestaetigt sichtbare Zeile ohne Header-Ueberlappung und ohne Konsolenwarnungen/-fehler. |
| 20:44 | Berufszeile live veroeffentlicht | Commit `0da4ede` nach `main` gepusht und Production-Deploy `6a46b0c8c3cd04a57c22e887` abgeschlossen; Live-HTTP- und Browser-QA bestaetigen ausgeliefertes `brand-copy-overrides.js`, sichtbare Berufszeile im Header und funktionierendes Mobile-Menue ohne Konsolenwarnungen/-fehler. |
| 20:45 | Baum-Logo erstellt | Stilistische Baum-Logo-Variante passend zur Website-Farbwelt generiert, visuell geprueft und als Original sowie 512-px-Webfassung unter `output/logo/` gespeichert. |
| 21:00 | Baum-Logo eingebaut | Baum-Logo als Website-Header-Logo, Footer-Logo, echtes PNG-Favicon und Apple-Touch-Icon eingebunden; Visitenkarten-PDF und PNG-Vorschauen mit rund ausgeschnittenem Logo neu erzeugt sowie lokale HTTP-, Desktop-, Tablet-, Mobile- und PDF-Render-QA abgeschlossen. |
| 21:07 | Baum-Logo live veroeffentlicht | Commit `d64680e` nach `main` gepusht und Production-Deploy `6a46b5b362ff1bb6af7bdd21` abgeschlossen; Live-HTTP- und Browser-QA bestaetigen Header-/Footer-Logo, Favicon, Apple-Touch-Icon und funktionierendes Mobile-Menue; zusaetzliche CSS-Korrektur fuer mobile X-Ueberlaeufe vorbereitet und lokal auf Desktop/Mobile geprueft. |
| 21:09 | Responsive Logo-Korrektur live veroeffentlicht | Commit `36628fd` nach `main` gepusht und Production-Deploy `6a46b72065c3f679c51a1287` abgeschlossen; Live-HTTP- und Browser-QA bestaetigen ausgeliefertes CSS, Header-Logo, Favicon, Apple-Touch-Icon, funktionierendes Mobile-Menue und keine horizontalen Ueberlaeufe auf Mobile/Desktop. |
| 12:00 | Admin-Statistik vorbereitet | Vitalstrategie-Analytics-Muster geprueft, UI/UX-Dashboard-Referenz herangezogen und fuer Mader-Hoefer eine datensparsame Statistik mit Netlify Functions, Blobs, Admin-Auth, CSV-/JSON-Export und Tracking ohne Cookies umgesetzt. |
| 12:00 | Lokale Statistik-QA abgeschlossen | `npm run check`, `npm audit --omit=dev`, Netlify-Dev-Funktionstest, Testevent-Speicherung, Admin-Auth, Browser-DOM-QA, Console-Check und Portraitbild-Pruefung erfolgreich durchgefuehrt. |
| 12:04 | Admin-Statistik live veroeffentlicht | Commit `56e9a7b` nach `main` gepusht, Netlify-Production-Deploy `6a5df25f94c4e977722f83dd` abgeschlossen und Live-QA fuer Startseite, Tracking-Asset, Admin-Auth, JSON-/Collect-API sowie neues Portraitbild bestanden. |
| 14:59 | Berufsbezeichnung korrigiert | Sichtbare Berufszeile, Startseiten-/Ueber-mich-Text, Portrait-Alt-Text und Impressum auf `Diplom Lebens- und Sozialberaterin` sowie `Psychosoziale Beraterin` umgestellt; Cache-Buster fuer das Haupt-Bundle erneuert. |
| 15:02 | Berufsbezeichnung live veroeffentlicht | Commit `b8f0065` nach `main` gepusht und Netlify-Production-Deploy `6a5e1c299f086c97e7ca1bfa` abgeschlossen; Live-HTTP-Checks bestaetigen neue Berufsbezeichnung, erneuerten Cache-Buster und keine Vorkommen von `in Ausbildung` oder `unter Supervision` im ausgelieferten Bundle. |
| 15:02 | Header-Cache-Buster ergaenzt | `brand-copy-overrides.js` in allen HTML-Einstiegen ebenfalls versioniert, damit die neue Berufszeile im Header ohne Browser-Cache-Verzoegerung erscheint. |
