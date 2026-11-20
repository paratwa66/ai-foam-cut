# Changelog – Paratwa Edition

## Paratwa Edition 1.0 (2026-11-20)

### Changed / Geändert
- **Nasenausschnitt ignoriert „Schnittverlängerung NL (Art)“**: Ist der Nasenausschnitt aktiv, gilt fest „Horizontal nach vorne“. Die Seitenleiste zeigt dazu einen Hinweis, der G-Code-Kopf eine Kommentarzeile (`compute.js`, `sidebar.js`, `hotwire_gcode.js`). *With the nose pocket active, the nose extension type is ignored and fixed to horizontal; shown as a sidebar hint and a G-code comment.*
- **Schnittablauf Nasenausschnitt**: Bei aktivierter Nasentasche schneidet der Draht den Oberzug mit der Nasenverlängerung, fährt zurück, folgt der Nasenrundung bis zum Austritt der Tasche und schneidet die Tasche von unten nach oben. Am Eintrittspunkt oben schneidet er senkrecht auf Sicherheitshöhe, Heizung aus, Pause (M0): Oberschale abnehmen, danach ohne weitere Pause ggf. Holmausschnitte „nach Oberseitenschnitt“. Anschließend fährt er im Schnittspalt durch die fertige Tasche zurück und schneidet den Unterzug. Gilt im Standardablauf (von hinten, beide Profilseiten, kein Stapel, Oberseite zuerst, keine Werkstück-Drehung, kein Pfad-Override); sonst bleibt der bisherige Ablauf (`nasenleiste.js`, `hotwire_gcode.js`). *New nose-pocket sequence: top pass + nose extension, back along the nose radius, pocket cut bottom-to-top, vertical cut to safe height at the entry point, pause (remove top shell, spar pockets), retrace through the finished pocket, then the bottom pass. Standard flow only.*

### Fixed / Behoben
- **Nasentasche verschwindet bei großem Abbrand (z. B. 1,2 mm, auch mit „Kopfüber schneiden“)**: Die um den Abbrand verkleinerte Tasche lag komplett innerhalb der Drahtbahn, die Bahn schnitt sie nicht mehr, und die Tasche wurde stillschweigend verworfen. Jetzt wird die Tasche schrittweise (0,05 mm, max. 3 mm) vergrößert, bis die Bahn sie schneidet; die Vergrößerung wird als Warnung in der Kerndesign-Legende angezeigt (`noseBarGrow`, `nasenleiste.js`, `render.js`). *Nose pocket vanished with large kerf (e.g. 1.2 mm, also with "cut upside down"): the kerf-shrunk pocket lay entirely inside the wire path and was silently dropped. It is now enlarged in 0.05 mm steps (max 3 mm) until the path crosses it, and the enlargement is shown as a warning in the core-design legend.*
- **Nasentasche im G-Code (Abbrand-Bezugsseite oben/unten)**: `hotwire.js` verschiebt die gesamte Bahn vertikal um den Abbrand; die Tasche wurde nicht mitverschoben (~1 mm Versatz gegenüber Kerndesign). Jetzt wird `kerfInfo.shift` (Wurzel/Rand) berücksichtigt. *The pocket in the G-code ignored the vertical kerf-datum shift; fixed.*
- Stille Rückfälle in `noseBarApply` (ungleiche Punktzahl, Austritt hinter Pfadende, Ausnahme) lassen die Tasche nicht mehr unbemerkt weg, sondern setzen `noseBarErr` (Warnung in der Vorschau). *Silent fallbacks now raise a visible warning.*
- Blockzuschnitt: Anzeige 340 mm statt 300 mm (Zugabe in der 3D-Szene) behoben. *3D scene showed 340 mm instead of 300 mm.*
- Gespeicherte Projekte ohne neue Statusschlüssel erzeugten keinen G-Code; robuste Initialisierung (`blockKState()`, `abplanState()`). *Old projects lacking new state keys no longer break G-code generation.*

### Added / Neu
- **Abplanen**: Länge, Tiefe, Sicherheitsabstand, Vorschub; Draht fährt 10 mm hoch, X = Länge + Sicherheit, Heizung nach Werkstoffprofil, Schnitt mit Werkstoff-Schnittgeschwindigkeit, danach Absenken um den Abbrand und `G10 L20 P0 X0 Y0 U0 V0` als neuer Nullpunkt, Ende mit M5/M2. *Surfacing with automatic new work zero.*
- **Blockzuschnitt komplett**: Draht fährt vorne unten ein, hoch, schneidet Oberseite nach hinten, fährt hinten nach unten, schneidet Unterseite; mit Abbrandkompensation; ohne Pause, Ausfahrt auf Nullstellung. *Full cuboid trim from front-bottom entry.*
- **Tempo-Auswahl** der Simulation im Schneiden-Monitor (`#simMSpeed`, gekoppelt mit `#simSpeed`). *Simulation speed selector.*
- **Kalibrier-Assistent** (Werkstoffdatenbank): Rechteck schneiden, messen, Abbrand berechnen und übernehmen (`App.setKerf`). *Kerf calibration by cutting and measuring a rectangle.*
- **Komplexe Form ausrichten** (DXF-Formen): Startpunkte, Höhenausrichtung, Mess-Overlay. *Align complex DXF shapes.*
- **Nasentasche**: freie Höhe/Höhenlage, Drehung in 0,1°, Teilrippen (grün gestrichelt), DXF-Export. *Nose pocket extensions.*
