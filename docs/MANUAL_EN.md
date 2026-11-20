# Manual – Paratwa Edition (English)

## 1. Nose pocket (Core design → Wings)
A rectangular pocket can be defined at the nose.
- Free **height, vertical offset (Dy), depth**; **rotation** in 0.1° steps.
- **Partial ribs** are shown as green dashed lines; the pocket can be exported as **DXF**.
- The *G-code* tab cuts exactly this pocket, including kerf compensation and kerf datum (symmetric/top/bottom). If the pocket cannot be computed, a warning is shown in the preview. With a large kerf the pocket may be enlarged slightly in the G-code (orange note in the legend).

**Cut sequence:** top pass with nose extension → back along the nose radius → pocket cut bottom-to-top → vertical rise to safe height, pause (remove top shell, spar pockets) → retrace through the finished pocket → bottom pass. Standard flow only (from rear, both sides, no stack).

## 2. Align complex shape (DXF shapes)
Imported DXF contours can be positioned by start point and height alignment; a measurement overlay helps verify.

## 3. Kerf calibration assistant (material database)
1. Cut a rectangle.
2. Measure and enter the dimensions.
3. The assistant computes the kerf; "Apply" stores it in the material.
*Note: still to be validated on a real machine.*

## 4. Full block trim (Cut tab)
Cuts a cuboid out of the raw block: the wire enters at front-bottom, moves up, cuts the top to the rear, moves down and cuts the bottom. Parameters: distance, bottom Y, length, height, feed. Kerf is compensated. No pause; at the end the wire retracts to zero.

## 5. Surfacing (Cut tab)
Levels the foam bed.
Parameters: **length**, **depth** (negative Y), **safety distance**, **feed**.
Sequence: wire up 10 mm → X = length + safety → heat (material profile) + preheat dwell → down by depth → cut back to X0 at the material's cutting speed → down by the kerf → heat off → **new work zero** (`G10 L20 P0 X0 Y0 U0 V0`).
⚠ Test the work-zero setting carefully on your machine first.

## 6. Simulation speed
The cutting monitor offers a selectable simulation speed (e.g. 25×, 50×, 200×).

## Notes
- Projects from older versions still load; missing settings are filled with defaults.
- After changing source files, rebuild the Electron app (`BUILD_TOOL_ELECTRON.bat`).
