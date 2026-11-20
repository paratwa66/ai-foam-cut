# Building it yourself and publishing the exe (Paratwa Edition)

## A) Build the exe yourself (Windows)

The Paratwa Edition consists of modified source files only. The original build tools (`BUILD_TOOL_ELECTRON.bat`, `build_tool_electron.py`) work unchanged.

**One-time setup**
1. Install [Node.js](https://nodejs.org) (LTS) and [Python 3](https://www.python.org) (tick "Add to PATH").
2. Download your fork as ZIP (green **Code → Download ZIP**) and unpack it.
3. In the unpacked folder open a command window (address bar → `cmd` → Enter) and run `npm install`. This fetches Electron and the builder.

**Build**
1. Double-click `BUILD_TOOL_ELECTRON.bat`.
2. Enter a version (e.g. `2.16`).
3. Field **"Zusatz im Namen"** (suffix in the name): `Paratwa Edition` → the file is named `AI Foam Cut v2.16 Paratwa Edition.exe`.
4. Optionally enter `Paratwa` in the **"Edition"** field (shown in the window title).
5. Choose target "Windows (.exe)" and build. **Speichern** (save) stores these inputs as a profile.
6. The result is in `dist-electron\<name>\`.

No build file needs editing: all `.js` files and the HTML in the folder are bundled automatically.

> The older `BUILD_TOOL.bat` / `BUILD_EXE.bat` (Python variant) also work, but Electron is recommended.

## B) Publish the exe as a GitHub Release

Do **not** put the exe into the repository (too large, `*.exe` is in `.gitignore`); use a **Release**:
1. In your fork click **Releases → Create a new release**.
2. **Tag** e.g. `v2.16-paratwa`, **title** e.g. "Paratwa Edition 2.16", paste the description from the CHANGELOG.
3. Drag the exe into **"Attach binaries"** (up to 2 GB per file).
4. **Publish release**. The download link then appears on the fork's front page.

Build and publish only after testing on the machine.

## C) License
AI Foam Cut is licensed under **GPL-3.0**. When distributing the exe, keep `LICENSE` and `THIRD_PARTY_LICENSES.md` (the build tool bundles them automatically) and keep the source (your fork) available. Original author: Manuel Heinisch.
