# AI Foam Cut – Paratwa Edition

**DE:** Persönlicher Fork von *AI Foam Cut (AIFC)* – einer Software zur Konstruktion und zum CNC-Schneiden mit dem Heißdraht (Electron/JavaScript, GRBL/grblHAL). Das Original stammt von **Manuel** (siehe Upstream-Repository). Diese Edition ergänzt Funktionen für den praktischen Werkstattbetrieb.

**EN:** Personal fork of *AI Foam Cut (AIFC)* – software for designing and CNC-cutting foam parts with a hot wire (Electron/JavaScript, GRBL/grblHAL). The original was written by **Manuel** (see upstream repository). This edition adds features for day-to-day workshop use.

> Upstream / Original: [https://github.com/aifoamcut/ai-foam-cut](https://github.com/aifoamcut/ai-foam-cut)

## Neu in der Paratwa Edition / What's new

| DE | EN |
|---|---|
| **Nasentasche** (Nasenleiste): Höhe, Höhenlage, Tiefe frei, Drehung in 0,1°-Schritten, Teilrippen, DXF-Export; Tasche im G-Code folgt der Konstruktion auch bei Abbrand-Bezugsseite oben/unten | **Nose pocket**: free height, vertical offset, depth, rotation in 0.1° steps, partial ribs, DXF export; the pocket in the G-code now matches the design also with kerf datum top/bottom |
| **Komplexe Form ausrichten** (DXF-Formen) | **Align complex shape** (DXF shapes) |
| **Kalibrier-Assistent** für den Abbrand in der Werkstoffdatenbank | **Kerf calibration assistant** in the material database |
| **Blockzuschnitt komplett** (Quader aus dem Rohblock, mit Abbrandkompensation) | **Full block trim** (cuboid from the raw block, with kerf compensation) |
| **Abplanen** der Styrodur-Unterlage inkl. automatischem neuen Nullpunkt | **Surfacing** of the foam bed incl. automatic new work zero |
| **Tempo-Wahl** der Simulation im Schneiden-Monitor (u. a. 25×, 50×, 200×) | **Simulation speed selector** in the cutting monitor (e.g. 25×, 50×, 200×) |

Details: [CHANGELOG.md](CHANGELOG.md) · [docs/HANDBUCH_DE.md](docs/HANDBUCH_DE.md) · [docs/MANUAL_EN.md](docs/MANUAL_EN.md) · [CHANGED_FILES.md](CHANGED_FILES.md)

## Start / Run

```
python launcher.py          # Test / test
BUILD_TOOL_ELECTRON.bat     # Windows-Build / Windows build
```

## Lizenz / License

GPL-3.0 – wie das Original. Dieses Projekt ist ein abgeleitetes Werk; alle Änderungen stehen ebenfalls unter GPL-3.0. Copyright des Originals bleibt bei den ursprünglichen Autoren.
GPL-3.0 – same as the original. This is a derivative work; all modifications are also GPL-3.0. Original copyright remains with the original authors.

## Haftung / Disclaimer

DE: Heißdraht-Maschinen und G-Code sind sicherheitsrelevant. Neue Funktionen (insbesondere Abplanen mit Nullpunkt-Setzen über `G10 L20`) vor dem Einsatz immer erst im Trockenlauf/Simulation prüfen. Nutzung auf eigene Verantwortung.
EN: Hot-wire machines and G-code are safety-relevant. Always check new features (especially surfacing with work-zero setting via `G10 L20`) in simulation/dry run first. Use at your own risk.

## Weiterführend
- Selbst bauen und exe als Release veröffentlichen: `docs/BUILD_DE.md`

## See also
- Building it yourself and publishing the exe as a release: `docs/BUILD_EN.md`
