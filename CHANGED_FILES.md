# Geänderte Dateien / Changed files

Alle Pfade relativ zum Programmordner (Upstream-Stand von Manuel als Basis).
All paths relative to the app folder (Manuel's upstream state as base).

| Datei / File | Änderung / Change |
|---|---|
| `nasenleiste.js` | Nasentasche: Drehung, Höhe/Lage, Teilrippen, DXF; Kerf-Bezugsseite; sichtbare Fehler; Taschenvergrößerung bei großem Abbrand |
| `render.js` | Vorschau: Teilrippen-Linien, Tasche (`noseBarDraw`), Warnung bei vergrößerter Tasche |
| `sidebar.js` | Optionen der Nasentasche; Kalibrier-Assistent (Werkstoffdatenbank); Hinweis zur ignorierten NL-Art |
| `dxfshapes.js` | „Komplexe Form ausrichten“ |
| `core.js` | Standardwerte `blockK`, `abplan`, `blockKMatId`, `abplanMatId` |
| `compute.js` | `PREP_MAT_KEYS`, Vorschub-Sync für Blockzuschnitt/Abplanen; Nasenverlängerung fest horizontal bei aktivem Nasenausschnitt |
| `gcodegen.js` | `blockKGcode`, `abplanGcode` (halber Abbrand für neuen Nullpunkt), robuste Status-Initialisierung |
| `gcode.js` | 3D-Szenen `buildBlockKScene`, `buildAbplanScene` |
| `cutpanel.js` | Gruppen „Blockzuschnitt komplett“, „Abplanen“, Quellenauswahl |
| `sim3d.js` | Simulations-Tempo |
| `AI Foam Cut.html` | Tempo-Auswahl `#simMSpeed` |
| `hotwire_gcode.js` | Neuer Schnittablauf für den Nasenausschnitt (Pause an der Nasenspitze, Ausschnitt + Unterzug) |
