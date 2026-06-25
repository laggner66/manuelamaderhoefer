# UI/UX Audit - Entfaltungsraum Website

Datum: 2026-06-25
Quelle: http://127.0.0.1:4173/
Hinweis: Der genannte Skill `ui-ux-pro-max` war nicht verfuegbar. Geprueft wurde mit Product-Design-Audit und In-App-Browser.

## Audit Scope

User flow: Startseite -> Angebote/Preise -> Kontakt/Termin.

Screenshots:

1. `01-desktop-home.png` - Desktop Startseite
2. `02-desktop-prices.png` - Desktop Preisbereich
3. `03-desktop-contact.png` - Desktop Kontaktbereich
4. `04-mobile-home.png` - Mobile Startseite
5. `05-mobile-menu.png` - Mobile Navigation

## Strengths

- Ruhige, warme Gestaltung passt gut zu Beratung, Supervision und Praxis-Kontext.
- Startseite macht schnell klar, wer die Anbieterin ist und welches Erstziel Nutzer haben: Erstgespraech buchen oder Angebote ansehen.
- Mobile Startseite ist lesbar, ohne horizontale Ueberlaeufe oder kaputte Buttons.
- Preisbereich ist nach der Bereinigung deutlich klarer: ein Angebot, ein Preis, eine Primaeraktion.
- Mobile Navigation ist einfach, gross genug und verstaendlich beschriftet.

## UX Risiken

1. ProvenExpert ueberlagert auf Desktop wichtige Inhalte.
   - Evidenz: `01-desktop-home.png`, `02-desktop-prices.png`, `03-desktop-contact.png`.
   - Das Widget liegt ueber Portrait, Preisbereich und Karte. Vertrauen ist wichtig, aber die fixe Platzierung nimmt dem Hauptinhalt Prioritaet.
   - Empfehlung: ProvenExpert behalten, aber als kompaktes Badge in den Bereich "Was meine Klient:innen sagen" integrieren oder als kleines sticky Badge unten rechts nutzen. Falls das grosse Widget bleiben muss, auf Desktop nur ausserhalb des Content-Bereichs anzeigen und bei Kontakt/Preis nicht ueber Karten legen.

2. CTA-Farben sind nicht konsequent genug.
   - Evidenz: `05-mobile-menu.png`.
   - "Termin buchen" im mobilen Menue wirkt beige mit weisser Schrift und hat wahrscheinlich zu wenig Kontrast.
   - Empfehlung: Primaeraktionen einheitlich in Sage-Gruen mit weisser Schrift halten. Beige nur fuer ruhige Flaechen oder Sekundaerbuttons mit dunkler Schrift verwenden.

3. Navigationsbegriff "Koerpermethoden" ist nach der Bereinigung etwas unklar.
   - Evidenz: `01-desktop-home.png`, `05-mobile-menu.png`.
   - Nach Entfernen von Shiatsu und Beckenboden sollte der Menuepunkt praeziser benennen, was dort bleibt.
   - Empfehlung: Entweder "Koerperarbeit" oder konkreter "Gua Sha & Schroepfen" verwenden. Das reduziert falsche Erwartungen.

4. Desktop-Hero konkurriert mit dem Trust-Widget.
   - Evidenz: `01-desktop-home.png`.
   - Portrait, H1 und ProvenExpert wollen gleichzeitig Hauptfokus sein.
   - Empfehlung: H1 und Portrait frei halten; Trust-Signal darunter oder als Zeile unter den CTAs platzieren: "3 Bewertungen auf ProvenExpert" mit Link.

5. Kontaktbereich hat zu viele gleich starke Aktionen.
   - Evidenz: `03-desktop-contact.png`.
   - Karte, Adresse, Route, Telefon, E-Mail und drei Kontaktkarten sind alle gleichzeitig sichtbar. Das ist informativ, aber etwas schwer zu priorisieren.
   - Empfehlung: Eine klare Hauptaktion im Kontaktbereich definieren, z. B. "Kostenloses Erstgespraech buchen". Telefon und WhatsApp als gleichrangige Sekundaeraktionen darunter.

## Accessibility Risiken

1. Kontrast des mobilen "Termin buchen"-Buttons pruefen.
   - Sichtbar wahrscheinlich kritisch: helle Beige-Flaeche mit weisser Schrift.
   - Empfehlung: Dunklere Textfarbe oder gruener Primaerbutton.

2. Cookie-Link-Kontrast pruefen.
   - Fruehere Banner-Pruefung zeigte einen sehr hellen Link zur Datenschutzerklaerung auf heller Flaeche.
   - Empfehlung: Linkfarbe auf dunkles Sage-Gruen setzen und Unterstreichung beibehalten.

3. Scroll-Navigation per Button ist funktional, aber URLs bleiben weniger aussagekraeftig.
   - Empfehlung: Fuer Preis, Ueber mich und Kontakt echte Ankerlinks wie `/#preise`, `/#ueber-mich`, `/#kontakt` verwenden. Das verbessert Tastaturverhalten, Teilen von Links und Orientierung.

4. Mobile Menue-Zustand semantisch pruefen.
   - Sichtbar funktioniert das Menue.
   - Empfehlung: `aria-expanded`, `aria-controls` und Fokusfuehrung beim Oeffnen/Schliessen verifizieren.

## Priorisierte Empfehlungen

1. ProvenExpert neu platzieren, ohne Inhalte zu ueberlagern.
2. CTA-System vereinheitlichen: Gruen = Primaeraktion, Outline = Sekundaeraktion, Beige nicht mit weisser Schrift.
3. Menuepunkt "Koerpermethoden" fachlich genauer benennen.
4. Kontaktbereich entschlacken und eine Hauptaktion priorisieren.
5. Ankerlinks fuer Seitenabschnitte einsetzen.
6. Cookie-Link-Kontrast und mobile Menue-ARIA pruefen.
7. Optional: Mobile Hero minimal kuerzen oder Bild etwas frueher sichtbar machen, damit Person und Vertrauen schneller erscheinen.

## Evidence Limits

- Der Audit basiert auf Screenshots und DOM-Zustand der lokalen Kopie.
- Vollstaendige WCAG-Konformitaet wurde nicht geprueft.
- Externe Ziele wie Calendly, Google Maps, WhatsApp und ProvenExpert-Profil wurden nicht als kompletter Flow getestet.
