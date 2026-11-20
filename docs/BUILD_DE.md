# Selbst bauen und als exe veröffentlichen (Paratwa Edition)

## A) Die exe selbst bauen (Windows)

Die Paratwa Edition besteht nur aus geänderten Quelldateien. Die Build-Werkzeuge des Originals (`BUILD_TOOL_ELECTRON.bat`, `build_tool_electron.py`) funktionieren unverändert.

**Einmalig installieren**
1. [Node.js](https://nodejs.org) (LTS) und [Python 3](https://www.python.org) installieren (bei Python „Add to PATH“ ankreuzen).
2. Den Fork als ZIP laden (grüner Button **Code → Download ZIP**) und entpacken.
3. Im entpackten Ordner ein Eingabefenster öffnen (Adresszeile → `cmd` → Enter) und `npm install` ausführen. Das lädt Electron und den Builder.

**Bauen**
1. `BUILD_TOOL_ELECTRON.bat` doppelklicken.
2. Version eintragen (z. B. `2.16`).
3. Feld **„Zusatz im Namen“**: `Paratwa Edition` → die Datei heißt dann `AI Foam Cut v2.16 Paratwa Edition.exe`.
4. Optional im Feld **„Edition“** `Paratwa` eintragen (steht im Fenstertitel).
5. Ziel „Windows (.exe)“ wählen und bauen. Mit **Speichern** kann man diese Eingaben als Profil merken.
6. Die fertige Datei liegt in `dist-electron\<Name>\`.

Es muss keine Datei der Batch-Werkzeuge geändert werden: alle `.js`-Dateien und die HTML im Ordner werden automatisch eingebunden.

> Die älteren Werkzeuge `BUILD_TOOL.bat` / `BUILD_EXE.bat` (Python-Variante) funktionieren ebenfalls, empfohlen ist aber Electron.

## B) Die exe als Release auf GitHub veröffentlichen

Die exe gehört **nicht** ins Repository (zu groß, und `*.exe` steht in der `.gitignore`), sondern in ein **Release**:
1. Im Fork rechts auf **Releases → Create a new release**.
2. **Tag** z. B. `v2.16-paratwa`, **Titel** z. B. „Paratwa Edition 2.16“, Beschreibung aus dem CHANGELOG kopieren.
3. Die exe in das Feld **„Attach binaries“** ziehen (bis 2 GB pro Datei).
4. **Publish release**. Der Download-Link steht danach auf der Startseite des Forks.

Erst nach dem Test an der Maschine bauen und veröffentlichen.

## C) Lizenz
AI Foam Cut steht unter **GPL-3.0**. Beim Weitergeben der exe müssen `LICENSE` und `THIRD_PARTY_LICENSES.md` erhalten bleiben (das Build-Werkzeug packt sie automatisch mit ein) und der Quellcode (dein Fork) muss verfügbar sein. Urheber des Originals: Manuel Heinisch.
