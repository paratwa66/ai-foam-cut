# Handbuch – Paratwa Edition (Deutsch)

## 1. Nasentasche (Kerndesign → Tragflächen)
Im Kerndesign wird an der Nase ein rechteckiger Ausschnitt (Nasenleiste) definiert.
- **Höhe, Höhenlage (Dy), Tiefe** frei einstellbar, **Drehung** in 0,1°-Schritten.
- **Teilrippen** werden grün gestrichelt angezeigt; **DXF-Export** der Tasche möglich.
- Im Tab *G-Code* wird exakt diese Tasche geschnitten – inklusive Abbrandkompensation und Bezugsseite (symmetrisch/oben/unten). Kann die Tasche nicht berechnet werden, erscheint eine Warnung in der Vorschau. Bei großem Abbrand kann die Tasche im G-Code minimal vergrößert werden (orange Hinweiszeile in der Legende).

**Schnittablauf:** Oberzug mit Nasenverlängerung → zurück, Nasenrundung → Tasche von unten nach oben → senkrecht auf Sicherheitshöhe, Pause (Oberschale abnehmen, ggf. Holme) → durch die fertige Tasche zurück → Unterzug. Gilt im Standardablauf (von hinten, beide Seiten, kein Stapel).

## 2. Komplexe Form ausrichten (DXF-Formen)
Importierte DXF-Konturen lassen sich über Startpunkt und Höhenausrichtung positionieren; ein Mess-Overlay hilft bei der Kontrolle.

## 3. Kalibrier-Assistent (Werkstoffdatenbank)
1. Ein Rechteck schneiden (praxisgerecht).
2. Maße messen und eintragen.
3. Der Assistent berechnet den Abbrand; mit „Übernehmen“ wird er im Werkstoff gespeichert.
*Hinweis: in der echten Maschine noch zu validieren.*

## 4. Blockzuschnitt komplett (Tab Schneiden)
Schneidet aus dem Rohblock einen Quader: Draht fährt vorne unten ein, nach oben, schneidet die Oberseite bis hinten, fährt nach unten und schneidet die Unterseite. Parameter: Abstand, Y-Unterkante, Länge, Höhe, Vorschub. Abbrand wird kompensiert. Ohne Pause; am Ende fährt der Draht aus und auf Null.

## 5. Abplanen (Tab Schneiden)
Plant die Styrodur-Unterlage ab.
Parameter: **Länge**, **Tiefe** (negatives Y), **Sicherheitsabstand**, **Vorschub**.
Ablauf: Draht 10 mm hoch → X = Länge + Sicherheit → Heizung (Werkstoffprofil) + Vorheizzeit → Absenken um Tiefe → Schnitt mit Werkstoff-Schnittgeschwindigkeit zurück zu X0 → Absenken um den **halben** Abbrand (Schnittfläche liegt um k/2 unter der Drahtmitte) → Heizung aus → **neuer Nullpunkt** (`G10 L20 P0 X0 Y0 U0 V0`).
⚠ Das Nullpunkt-Setzen an der Maschine zuerst mit Vorsicht testen.

## 6. Simulations-Tempo
Im Schneiden-Monitor die Geschwindigkeit der Simulation wählbar (u. a. 25×, 50×, 200×).

## Hinweise
- Projekte aus älteren Versionen laden weiterhin; fehlende Einstellungen werden mit Standardwerten ergänzt.
- Nach Änderungen an den Quelldateien die Electron-App neu bauen (`BUILD_TOOL_ELECTRON.bat`).
