/* nasenleiste.js — Kerndesign: Tasche für eine Vierkant-Nasenleiste.
 *
 *   Die Nase des Kerns wird durch eine viereckige Tasche ersetzt (Kantenlänge =
 *   Breite, Höhe, Drehung, Einlasstiefe je Wurzel/Rand frei; Höhe nicht gesetzt =
 *   gleich der Kantenlänge, also quadratisch wie bisher). Die Vierkantleiste wird später
 *   eingeklebt und auf Profilform verschliffen. Die Bahn fährt auf der einen
 *   Profilseite in die Tasche, an deren hinteren Kanten entlang und auf der
 *   anderen Seite wieder hinaus — alles im selben Zug wie der Kernschnitt; die
 *   Nasenspitze davor (inkl. Nasen-Verlängerung) fällt als Verschnitt weg.
 *
 *   Abbrand: die Tasche wird um Abbrand/2 je Rippe nach innen versetzt (fertige
 *   Tasche = Kantenlänge + Spiel). Wurzel und Rand behalten gleich viele Punkte
 *   (Türme synchron). Nur Kerndesign (state.cfg.noseBar*, je Tragfläche).
 *   Aufrufe von außen nur geschützt (App.noseBarApply && …).
 *
 *   Zusätzlich: Menü „DXF Export“ (Kerndesign, ganz unten in der Seitenleiste):
 *   Innen-/Außenrippen je Segment mit Holmausschnitten und Nasenleisten-Tasche sowie
 *   frei definierbare TEILRIPPEN (Lage im Segment, Abstand zu Nasen- und Endleiste)
 *   als DXF zum Fräsen. Teilrippen liegen in state.cfg.partRibs (je Tragfläche).
 *   Im Kerndesign-Grundriss (render.js drawPlan) erscheint jede Teilrippe als
 *   gestrichelte grüne Linie (App.partRibPlan), die aktive mit den Abständen. */
(function () {
  'use strict';
  const App = (window.App = window.App || {});
  const { T, state } = App;
  const C = () => state.cfg;
  const num = (v, d) => (v == null || !isFinite(+v)) ? d : +v;

  function noseBarOn() { return !!C().noseBarOn; }
  function params() {
    const c = C();
    const aR = Math.max(0.5, num(c.noseBarA, 10)), aT = Math.max(0.5, num(c.noseBarATip, aR));
    // Höhe der Tasche (senkrecht zur Breite). Nicht gesetzt -> gleich der Kantenlänge (quadratisch).
    const hR = c.noseBarH != null ? Math.max(0.5, num(c.noseBarH, aR)) : aR;
    const hT = c.noseBarHTip != null ? Math.max(0.5, num(c.noseBarHTip, hR)) : (c.noseBarH != null ? hR : aT);
    // Höhenversatz der Tasche gegenüber der Mittellinie (mm, positiv = nach oben). Rand folgt der Wurzel, solange er nicht gesetzt ist.
    const yR = num(c.noseBarDy, 0), yT = c.noseBarDyTip != null ? num(c.noseBarDyTip, yR) : yR;
    return {
      aR, aT, hR, hT, yR, yT,
      dR: Math.max(0, num(c.noseBarDepth, 8)), dT: Math.max(0, num(c.noseBarDepthTip, num(c.noseBarDepth, 8))),
      rot: num(c.noseBarRot, 45), gap: Math.max(0, num(c.noseBarGap, 0.2)),
      // 'square' = Vierkant-Tasche, 'cut' = gerader Nasenabschnitt (Balsa-Nasenleiste aufkleben)
      shape: c.noseBarShape === 'cut' ? 'cut' : 'square'
    };
  }

  // Profil-Nase (kleinstes x) und Mittellinien-Höhe bei x.
  function noseOf(P) { let k = 0; for (let i = 1; i < P.length; i++) if (P[i].x < P[k].x) k = i; return P[k]; }
  function camberAt(P, x) {
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i < P.length; i++) {
      const a = P[i], b = P[(i + 1) % P.length];
      if ((a.x - x) * (b.x - x) > 0 || a.x === b.x) continue;
      const y = a.y + (b.y - a.y) * (x - a.x) / (b.x - a.x);
      if (y < lo) lo = y; if (y > hi) hi = y;
    }
    return isFinite(lo) ? (lo + hi) / 2 : null;
  }
  /* Rechteck (Ecken gegen den Uhrzeigersinn) für Profil P: Breite a, Höhe b, Einlasstiefe d
   * (hinterster Punkt der Leiste hinter der Nase), Drehung rot, Halbkante-Zugabe add,
   * Höhenversatz dy (positiv = nach oben). b = a, dy = 0 ergibt das bisherige Quadrat. */
  function square(P, a, b, d, rot, add, dy) {
    const n = noseOf(P), th = rot * Math.PI / 180, c = Math.cos(th), s = Math.sin(th);
    const hx = a / 2 * Math.abs(c) + b / 2 * Math.abs(s);
    const xc = n.x + d - hx;
    let yc = camberAt(P, Math.max(xc, n.x + 1e-3));
    if (yc == null) yc = n.y;
    yc += dy || 0;
    const ha = a / 2 + add, hb = b / 2 + add;
    return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => ({ x: xc + ha * u * c - hb * v * s, y: yc + ha * u * s + hb * v * c }));
  }
  /* Gerader Nasenabschnitt: senkrechte Fläche bei x = Nase + d (Fertigmaß). Die
   * Drahtbahn liegt um den halben Abbrand davor (auf der Verschnittseite), damit
   * die fertige Fläche genau bei Nase + d steht. Das „Quadrat" ist ein großes
   * Rechteck vor der Fläche -> crossings() liefert Ein-/Austritt an der Fläche,
   * ohne Ecken = gerade Linie oben -> unten. */
  function cutBox(P, d, kh) {
    const n = noseOf(P), xf = n.x + d - kh, B = 1e4;
    return [{ x: n.x - B, y: -B }, { x: xf, y: -B }, { x: xf, y: B }, { x: n.x - B, y: B }];
  }
  function surfAt(P, x) {
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i < P.length; i++) {
      const a = P[i], b = P[(i + 1) % P.length];
      if ((a.x - x) * (b.x - x) > 0 || a.x === b.x) continue;
      const y = a.y + (b.y - a.y) * (x - a.x) / (b.x - a.x);
      if (y < lo) lo = y; if (y > hi) hi = y;
    }
    return isFinite(lo) ? { lo, hi } : null;
  }
  function inside(Q, p) {
    for (let k = 0; k < 4; k++) {
      const a = Q[k], b = Q[(k + 1) % 4];
      if ((b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x) < 0) return false;
    }
    return true;
  }
  // Schnittpunkt Strecke p→q mit Quadratrand; nearP: den p-nächsten nehmen.
  function hit(Q, p, q, nearP) {
    let best = null;
    for (let k = 0; k < 4; k++) {
      const a = Q[k], b = Q[(k + 1) % 4];
      const rx = q.x - p.x, ry = q.y - p.y, sx = b.x - a.x, sy = b.y - a.y;
      const den = rx * sy - ry * sx; if (Math.abs(den) < 1e-12) continue;
      const t = ((a.x - p.x) * sy - (a.y - p.y) * sx) / den, u = ((a.x - p.x) * ry - (a.y - p.y) * rx) / den;
      if (t < -1e-9 || t > 1 + 1e-9 || u < -1e-9 || u > 1 + 1e-9) continue;
      const sc = nearP ? t : 1 - t;
      if (!best || sc < best.sc) best = { sc, e: k, p: { x: p.x + rx * t, y: p.y + ry * t } };
    }
    return best;
  }
  // Ein- und Austritt der offenen Bahn P in das Quadrat Q.
  function crossings(P, Q) {
    let iE = -1, iX = -1;
    for (let i = 0; i < P.length - 1; i++) if (!inside(Q, P[i]) && inside(Q, P[i + 1])) { iE = i; break; }
    for (let i = P.length - 2; i >= 0; i--) if (inside(Q, P[i]) && !inside(Q, P[i + 1])) { iX = i; break; }
    if (iE < 0 || iX < 0 || iX < iE) return null;
    const hE = hit(Q, P[iE], P[iE + 1], false), hX = hit(Q, P[iX], P[iX + 1], true);
    if (!hE || !hX) return null;
    // Weg am Quadratrand: die Richtung, die NICHT über die vordere (Nasen-)Ecke führt.
    const fwd = [], bwd = [];
    for (let k = hE.e; k !== hX.e; k = (k + 1) % 4) fwd.push(Q[(k + 1) % 4]);
    for (let k = hE.e; k !== hX.e; k = (k + 3) % 4) bwd.push(Q[k]);
    const mx = L => L.length ? L.reduce((s, p) => s + p.x, 0) / L.length : (hE.p.x + hX.p.x) / 2;
    const corners = mx(fwd) >= mx(bwd) ? fwd : bwd;
    return { iE, iX, entry: hE.p, exit: hX.p, corners };
  }
  // Polylinie gleichmäßig nach Bogenlänge: m Punkte bei t = j/m (j = 1..m).
  function resample(L, m) {
    const cum = [0];
    for (let i = 1; i < L.length; i++) cum.push(cum[i - 1] + Math.hypot(L[i].x - L[i - 1].x, L[i].y - L[i - 1].y));
    const tot = cum[cum.length - 1], out = [];
    let i = 1;
    for (let j = 1; j <= m; j++) {
      const s = tot * j / m;
      while (i < L.length - 1 && cum[i] < s) i++;
      const seg = cum[i] - cum[i - 1], t = seg > 1e-12 ? (s - cum[i - 1]) / seg : 1;
      out.push({ x: L[i - 1].x + (L[i].x - L[i - 1].x) * t, y: L[i - 1].y + (L[i].y - L[i - 1].y) * t });
    }
    return out;
  }
  const NE = 12;   // Punkte je Taschenkante


  // Neuer Schnittablauf (Nasentasche): Oberzug komplett -> waagerecht vor die Nase und zurück ->
  // senkrecht auf Sicherheitshöhe (Pause, Oberschale/Holme) -> Tasche + Unterzug in einem Zug.
  // Nur im Standardablauf (von hinten, beide Seiten, kein Stapel, Oberseite zuerst, keine Werkstück-Drehung);
  // sonst bleibt die Tasche wie bisher in die Bahn eingespleißt.
  function newFlowOk() {
    const c = C();
    return c.cutDir !== 'front' && (c.cutSides || 'both') === 'both' && !((c.stackCount | 0) > 1)
      && c.profileDir !== 'bottom' && !c.sweepRot && !(App.kernTeileOn && App.kernTeileOn());
  }
  function startsLowP(P) {
    const n = P.length; if (n < 3) return false;
    const dy = P[0].y - P[n - 1].y;
    if (dy > 1e-3) return false; if (dy < -1e-3) return true;
    let iLE = 0; for (let k = 1; k < n; k++) if (P[k].x < P[iLE].x) iLE = k;
    if (iLE === 0 || iLE === n - 1) return false;
    const m = (a, b) => { let s = 0; for (let k = a; k <= b; k++) s += P[k].y; return s / (b - a + 1); };
    return m(0, iLE) < m(iLE, n - 1);
  }

  /* Neuer Ablauf (Bahn je Rippe, Oberseite zuerst):
   *   Oberzug + Nasenverlängerung (unverändert)
   *   -> zurück, Nasenrundung bis zum Austritt X der Tasche (Unterseite)
   *   -> Tasche von unten nach oben (X -> Ecken -> Eintritt E)         [hier: senkrecht hoch, Pause, Holme]
   *   -> Rückfahrt durch die bereits geschnittene Tasche (E -> Ecken -> X)
   *   -> Unterzug.
   * Rückgabe null = nicht möglich (alter Ablauf). nosePk.iK = Index von E (Ende des Teils vor der Pause). */
  function buildNewFlow(pr, cut, root, tip, cR, cT) {
    const argmin = P => { let k = 0; for (let i = 1; i < P.length; i++) if (P[i].x < P[k].x) k = i; return k; };
    const iLE = argmin(root);
    const iB = Math.max(cR.iX, cT.iX) + 1;
    if (iB >= root.length || !(iLE < Math.min(cR.iX, cT.iX))) return null;
    const maxC = Math.max(cR.corners.length, cT.corners.length);
    const nPre = Math.max(cR.iX, cT.iX) - iLE + 1;      // Rückfahrt + Nasenrundung bis X (letzter Punkt = X)
    const n2 = iB - Math.min(cR.iX, cT.iX);
    const parts = (P, c) => {
      const ring = [c.entry].concat(c.corners, [c.exit]);
      const nE = ring.length - 1, R = NE * (maxC + 1);
      const cnt = new Array(nE).fill(Math.floor(R / nE));
      for (let k = 0; k < R - cnt[0] * nE; k++) cnt[k]++;
      let ringF = [{ x: c.entry.x, y: c.entry.y }];                      // E ... X
      for (let k = 0; k < nE; k++) ringF = ringF.concat(resample([ring[k], ring[k + 1]], cnt[k]));
      const pre = resample(P.slice(iLE, c.iX + 1).concat([c.exit]), nPre);
      const post = resample([c.exit].concat(P.slice(c.iX + 1, iB + 1)), n2);
      const up = ringF.slice().reverse().slice(1);                       // nach X: ... E (von unten nach oben)
      const down = ringF.slice(1);                                       // nach E: ... X (virtuell zurück)
      return { pre, up, down, post, R: ringF.length - 1 };
    };
    const pr_ = parts(root, cR), pt_ = parts(tip, cT);
    if (pr_.pre.length !== pt_.pre.length || pr_.up.length !== pt_.up.length || pr_.post.length !== pt_.post.length) return null;
    const kr = root[0].k, kt = tip[0].k;
    const build = (P, o, k) => {
      const all = o.pre.concat(o.up, o.down, o.post);
      if (k != null) all.forEach(q => { q.k = k; });
      return P.slice(0, iLE + 1).concat(all, P.slice(iB + 1));
    };
    const R2 = build(root, pr_, kr), T2 = build(tip, pt_, kt);
    if (argmin(R2) !== iLE) return null;      // Nasenindex im G-Code-Schreiber muss derselbe bleiben
    const iK = iLE + pr_.pre.length + pr_.up.length;                     // Index von E
    const rootPath = R2.concat([{ x: R2[0].x, y: R2[0].y }]);
    const tipPath = T2.concat([{ x: T2[0].x, y: T2[0].y }]);
    const zR = pr.zRoot, zT = pr.zTip, mw = state.cfg.machineWidth;
    const prj = (vr, vt, zp) => vr + ((zp - zR) / ((zT - zR) || 1)) * (vt - vr);
    const left = [], right = [];
    for (let k = 0; k < rootPath.length; k++) {
      const r = rootPath[k], t = tipPath[k];
      left.push({ x: prj(r.x, t.x, 0), y: prj(r.y, t.y, 0) });
      right.push({ x: prj(r.x, t.x, mw), y: prj(r.y, t.y, mw) });
    }
    return { rootPath, tipPath, left, right, nosePk: { iLE, iK } };
  }

  /* Bahn einrechnen (compute.js projectCut, nach den Holmausschnitten). */
  function noseBarApply(pr, cut) {
    if (!noseBarOn() || !pr || !pr.rootPath || state.cfg.sparOnly) return pr;
    try {
      const p = params();
      const ck = App.cutKerf(cut.root.chord, cut.tip.chord), ki = pr.kerfInfo || {};
      const khR = (ki.root != null ? ki.root : ck.root) / 2, khT = (ki.tip != null ? ki.tip : ck.tip) / 2;
      // Bezugsseite (kerfDatum top/bottom): hotwire.js verschiebt die ganze Bahn vertikal -> Tasche mitnehmen
      const shR = (ki.shift && ki.shift.root) || 0, shT = (ki.shift && ki.shift.tip) || 0;
      let root = pr.rootPath.slice(0, -1), tip = pr.tipPath.slice(0, -1);
      const useNew = newFlowOk();
      if (useNew && startsLowP(root)) { root.reverse(); tip.reverse(); }   // Oberseite zuerst (wie startAtTop)
      if (root.length !== tip.length) return Object.assign({}, pr, { noseBarErr: true });
      // Tasche je Seite bestimmen. Schneidet die Bahn die um den Abbrand verkleinerte Tasche
      // nicht (Tasche liegt dann ganz innerhalb der Drahtbahn, z. B. bei großem Abbrand und
      // Taschenecke an der Nase), wird sie schrittweise vergrößert, bis die Bahn sie trifft.
      // Die Vergrößerung (mm) wird als noseBarGrow gemeldet (Warnung in der Vorschau).
      const mkQ = (isRoot, grow) => p.shape === 'cut'
        ? (isRoot ? cutBox(cut.root.pts, p.dR, khR - grow) : cutBox(cut.tip.pts, p.dT, khT - grow))
        : (isRoot ? square(cut.root.pts, p.aR, p.hR, p.dR, p.rot, p.gap / 2 - khR + grow, p.yR + shR)
                  : square(cut.tip.pts, p.aT, p.hT, p.dT, p.rot, p.gap / 2 - khT + grow, p.yT + shT));
      const fit = (P, isRoot) => {
        for (let g = 0; g <= 3.0001; g += 0.05) { const c = crossings(P, mkQ(isRoot, g)); if (c) return { c, g }; }
        return null;
      };
      const fR = fit(root, true), fT = fit(tip, false);
      if (!fR || !fT) return Object.assign({}, pr, { noseBarErr: true });
      const cR = fR.c, cT = fT.c, grow = Math.max(fR.g, fT.g);
      if (useNew) {
        const r = buildNewFlow(pr, cut, root, tip, cR, cT);
        if (r) return Object.assign({}, pr, r, grow > 1e-9 ? { noseBarGrow: grow } : {});
        if (startsLowP(pr.rootPath.slice(0, -1))) { root.reverse(); tip.reverse(); }   // Rückfall: Original-Reihenfolge für das Einspleißen
      }
      const iA = Math.min(cR.iE, cT.iE), iB = Math.max(cR.iX, cT.iX) + 1;
      if (iB >= root.length) return Object.assign({}, pr, { noseBarErr: true });
      const n1 = Math.max(cR.iE, cT.iE) - iA + 1, n2 = iB - Math.min(cR.iX, cT.iX);
      const maxC = Math.max(cR.corners.length, cT.corners.length);
      const chainOf = (P, c) => {
        const pre = P.slice(iA, c.iE + 1).concat([c.entry]);
        const ring = [c.entry].concat(c.corners, [c.exit]);
        const post = [c.exit].concat(P.slice(c.iX + 1, iB + 1));
        return { pre, ring, post };
      };
      const build = (P, c, M) => {
        const ch = chainOf(P, c);
        // Ein-/Austritt und Ecken immer exakt treffen (sonst läuft die Bahn schräg in
        // die Tasche statt senkrecht). Ungleiche Eckenzahl: Punkte je Kante verteilen.
        let out = resample(ch.pre, n1);
        const nE = ch.ring.length - 1, R = NE * (maxC + 1);
        const cnt = new Array(nE).fill(Math.floor(R / nE));
        for (let k = 0; k < R - cnt[0] * nE; k++) cnt[k]++;
        for (let k = 0; k < nE; k++) out = out.concat(resample([ch.ring[k], ch.ring[k + 1]], cnt[k]));
        return out.concat(resample(ch.post, n2));
      };
      const M = n1 + n2 + NE * (maxC + 1);
      const kOf = P => P[iA].k;
      const nr = build(root, cR, M), nt = build(tip, cT, M);
      if (nr.length !== nt.length) return Object.assign({}, pr, { noseBarErr: true });
      const kr = kOf(root), kt = kOf(tip);
      if (kr != null) nr.forEach(q => { q.k = kr; });
      if (kt != null) nt.forEach(q => { q.k = kt; });
      root.splice(iA + 1, iB - iA, ...nr);
      tip.splice(iA + 1, iB - iA, ...nt);
      const rootPath = root.concat([{ x: root[0].x, y: root[0].y }]);
      const tipPath = tip.concat([{ x: tip[0].x, y: tip[0].y }]);
      const zR = pr.zRoot, zT = pr.zTip, mw = state.cfg.machineWidth;
      const prj = (vr, vt, zp) => vr + ((zp - zR) / ((zT - zR) || 1)) * (vt - vr);
      const left = [], right = [];
      for (let k = 0; k < rootPath.length; k++) {
        const r = rootPath[k], t = tipPath[k];
        left.push({ x: prj(r.x, t.x, 0), y: prj(r.y, t.y, 0) });
        right.push({ x: prj(r.x, t.x, mw), y: prj(r.y, t.y, mw) });
      }
      return Object.assign({}, pr, { rootPath, tipPath, left, right }, grow > 1e-9 ? { noseBarGrow: grow } : {});
    } catch (e) { return Object.assign({}, pr, { noseBarErr: true }); }
  }

  /* Vorschau im Kerndesign: Nennlage der Leiste (Kantenlänge, ohne Spiel). */
  function noseBarDraw(ctx, V, leg, o) {
    if (!noseBarOn()) return;
    const cut = App.wing && App.wing.cuts[Math.min(o.idx, App.wing.cuts.length - 1)];
    if (!cut) return;
    const p = params(), col = '#c8a165';
    const sh = (Q, dy) => Q.map(q => ({ x: q.x, y: q.y + dy }));
    ctx.save();
    ctx.lineWidth = 1.4; ctx.strokeStyle = col; ctx.fillStyle = 'rgba(200,161,101,0.18)';
    const draw = (Q, dash) => { ctx.setLineDash(dash); App.poly(ctx, V, Q, true); ctx.fill(); ctx.stroke(); };
    if (p.shape === 'cut') {
      const face = (P, d, dy, dash) => {
        const x = noseOf(P).x + d, s = surfAt(P, x); if (!s) return;
        ctx.setLineDash(dash); ctx.lineWidth = 2;
        App.poly(ctx, V, [{ x, y: s.lo + dy }, { x, y: s.hi + dy }], false); ctx.stroke();
      };
      if (o.shR) face(cut.root.pts, p.dR, o.dyR, []);
      if (o.shT) face(cut.tip.pts, p.dT, o.dyT, [5, 3]);
      ctx.restore();
      leg.push([col, T('Nasenabschnitt ') + p.dR.toFixed(1) + ' / ' + p.dT.toFixed(1) + T(' mm hinter der Nase')]);
      if (o.grow) leg.push(['#ffb020', T('! Nasenleiste: Tasche im G-Code um ') + o.grow.toFixed(2) + T(' mm vergrößert (Abbrand — verkleinerte Tasche würde die Drahtbahn nicht schneiden)')]);
    if (o.err) leg.push(['#ff5a3c', T('! Nasenabschnitt: Schnittfläche trifft die Profilbahn nicht — Abstand prüfen')]);
      return;
    }
    if (o.shR) draw(sh(square(cut.root.pts, p.aR, p.hR, p.dR, p.rot, 0, p.yR), o.dyR), []);
    if (o.shT) draw(sh(square(cut.tip.pts, p.aT, p.hT, p.dT, p.rot, 0, p.yT), o.dyT), [5, 3]);
    ctx.restore();
    leg.push([col, T('Nasenleiste (Vierkant) ') + p.aR.toFixed(1) + '×' + p.hR.toFixed(1) + ' / ' + p.aT.toFixed(1) + '×' + p.hT.toFixed(1) + T(' mm · Drehung ') + p.rot + '°'
      + (p.yR || p.yT ? ' · ' + T('Höhenversatz ') + p.yR.toFixed(1) + ' / ' + p.yT.toFixed(1) + ' mm' : '')]);
    if (o.grow) leg.push(['#ffb020', T('! Nasenleiste: Tasche im G-Code um ') + o.grow.toFixed(2) + T(' mm vergrößert (Abbrand — verkleinerte Tasche würde die Drahtbahn nicht schneiden)')]);
    if (o.err) leg.push(['#ff5a3c', T('! Nasenleiste: Tasche schneidet die Profilbahn nicht — Einlasstiefe oder Kantenlänge prüfen')]);
  }



  // ---------- Teilrippen -----------------------------------------------------
  // Eine Teilrippe ist der Streifen einer Rippe zwischen zwei senkrechten Schnitten:
  // Abstand dN hinter der Nase bis Abstand dE vor der Endleiste, an beliebiger Stelle
  // im Segment (pos = mm ab der Innenrippe). Das Profil dort ist die Interpolation
  // gleichindizierter Punkte von Innen- und Außenrippe — genau der Schnitt, den der
  // Heißdraht durch den Kern legt (die Mantelfläche ist eine Regelfläche).
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const rnd = (v, n) => { const f = Math.pow(10, n); return Math.round(v * f) / f; };
  const partLabel = i => { const pr = prList()[i], nm = pr && pr.name ? String(pr.name).trim() : ''; return T('Teilrippe') + ' ' + (i + 1) + (nm ? ' · ' + nm : ''); };
  function prList() { const c = C(); if (!Array.isArray(c.partRibs)) c.partRibs = []; return c.partRibs; }
  function segSpan(i) { const sg = state.segments && state.segments[i]; return sg && sg.span > 0 ? +sg.span : 0; }
  function interpPts(cut, t) {
    const A = cut.root && cut.root.pts, B = cut.tip && cut.tip.pts;
    if (!A || !B || A.length !== B.length || A.length < 3) return null;
    const out = A.map((p, i) => ({ x: lerp(p.x, B[i].x, t), y: lerp(p.y, B[i].y, t) }));
    if (A.flipY) out.flipY = true;
    return out;
  }
  function xRange(P) { let lo = Infinity, hi = -Infinity; P.forEach(q => { if (q.x < lo) lo = q.x; if (q.x > hi) hi = q.x; }); return { lo, hi, chord: hi - lo }; }
  // Sutherland-Hodgman gegen die Halbebenen x >= xa und x <= xb (Profil/Holm gegen den Streifen).
  function clipHalf(poly, keep, xl) {
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length], ia = keep(a), ib = keep(b);
      if (ia) out.push(a);
      if (ia !== ib) { const t = (xl - a.x) / (b.x - a.x); out.push({ x: xl, y: a.y + (b.y - a.y) * t }); }
    }
    return out;
  }
  function clipStrip(poly, xa, xb) {
    let r = clipHalf(poly, p => p.x >= xa, xa); if (r.length < 3) return [];
    r = clipHalf(r, p => p.x <= xb, xb); return r.length < 3 ? [] : r;
  }
  // Lage einer Teilrippe im Grundriss (Weltkoordinaten: z = Spannweite, x = Sehnenrichtung, Nase = kleinstes x).
  function partRibPlanGeom(pr) {
    const st = App.wing && App.wing.stations, span = segSpan(pr.seg);
    if (!st || st.length < 2 || !span) return null;
    const k = clamp(pr.seg | 0, 0, st.length - 2), a = st[k], b = st[k + 1]; if (!a || !b || !a.pts || !b.pts) return null;
    const t = clamp(pr.pos / span, 0, 1);
    let r = null;
    const P = interpPts({ root: { pts: a.pts }, tip: { pts: b.pts } }, t);
    if (P) r = xRange(P);
    else { const ra = xRange(a.pts), rb = xRange(b.pts); r = { lo: lerp(ra.lo, rb.lo, t), hi: lerp(ra.hi, rb.hi, t) }; r.chord = r.hi - r.lo; }
    const dN = Math.max(0, pr.dN), dE = Math.max(0, pr.dE);
    return { z: lerp(a.z, b.z, t), lo: r.lo, hi: r.hi, xa: r.lo + dN, xb: r.hi - dE, dN, dE, L: r.chord - dN - dE, ok: r.chord - dN - dE >= 0.05 };
  }
  // Zeichnet alle Teilrippen als gestrichelte grüne Linien in den Grundriss (Kerndesign). Rückgabe: Legendeneintrag.
  const PART_COL = '#35d07f';
  function partRibPlan(o) {
    const prs = prList(); if (!prs.length) return null;
    const { ctx, V, poly } = o; let any = false;
    prs.forEach((pr, i) => {
      const g = partRibPlanGeom(pr); if (!g) return;
      any = true;
      const active = state.activePartRib === i, col = g.ok ? PART_COL : '#ff5a3c', px = V.X(g.z);
      ctx.save();
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = active ? 2.8 : 1.5; ctx.setLineDash([6, 4]);
      const y0 = g.ok ? g.xa : g.lo, y1 = g.ok ? g.xb : g.hi;
      poly(ctx, V, [{ x: g.z, y: -y0 }, { x: g.z, y: -y1 }], false); ctx.stroke();
      // Endmarken (kurze Querstriche) an Vorder- und Hinterkante des Streifens
      ctx.setLineDash([]); ctx.lineWidth = active ? 2.2 : 1.3;
      [y0, y1].forEach(y => { ctx.beginPath(); ctx.moveTo(px - 5, V.Y(-y)); ctx.lineTo(px + 5, V.Y(-y)); ctx.stroke(); });
      ctx.font = '11px Segoe UI';
      ctx.fillText('T' + (i + 1), px + 7, V.Y(-y0) + 11);
      if (active && g.ok) {
        // Abstände zur Nasenleiste und zur Endleiste (fein gepunktet) mit Zahlenwerten
        ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
        poly(ctx, V, [{ x: g.z, y: -g.lo }, { x: g.z, y: -g.xa }], false); ctx.stroke();
        poly(ctx, V, [{ x: g.z, y: -g.xb }, { x: g.z, y: -g.hi }], false); ctx.stroke();
        ctx.setLineDash([]); ctx.font = '11px Segoe UI';
        const f1 = v => (Math.round(v * 10) / 10).toFixed(1).replace('.', ',');
        ctx.fillText(T('Nase') + ' ' + f1(g.dN), px + 7, V.Y(-(g.lo + g.xa) / 2) + 4);
        ctx.fillText(T('Ende') + ' ' + f1(g.dE), px + 7, V.Y(-(g.xb + g.hi) / 2) + 4);
        ctx.fillText('L ' + f1(g.L), px + 7, V.Y(-(g.xa + g.xb) / 2) + 4);
      }
      ctx.restore();
    });
    return any ? [PART_COL, T('Teilrippen (Lage, Abstand Nase/Ende)'), [6, 4], 'line', 1.6] : null;
  }
  // Maße einer Teilrippe für die Anzeige: Sehne an der Stelle und Länge des Streifens.
  function partRibInfo(pr) {
    const cuts = App.wing && App.wing.cuts, span = segSpan(pr.seg);
    if (!cuts || !cuts.length || !span) return null;
    const cut = cuts[Math.min(pr.seg, cuts.length - 1)];
    const P = cut && interpPts(cut, clamp(pr.pos / span, 0, 1)); if (!P) return null;
    const r = xRange(P);
    return { chord: r.chord, L: Math.max(0, r.chord - pr.dN - pr.dE), span };
  }
  function partRibGeom(pr) {
    const cuts = App.wing && App.wing.cuts, span = segSpan(pr.seg);
    if (!cuts || !cuts.length || !span) return null;
    const idx = Math.min(pr.seg, cuts.length - 1), cut = cuts[idx], t = clamp(pr.pos / span, 0, 1);
    const pts = interpPts(cut, t); if (!pts) return null;
    const r = xRange(pts), n = noseOf(pts);
    const xa = r.lo + Math.max(0, pr.dN), xb = r.hi - Math.max(0, pr.dE);
    if (xb - xa < 0.05) return null;
    const sh = q => ({ x: q.x - r.lo, y: q.y - n.y });   // Nase = Nullpunkt wie bei den Vollrippen
    const polys = []; let nCut = 0;
    const put = (layer, arr, closed, aci, isCut) => {
      const c2 = clipStrip(arr, xa, xb);
      if (c2.length > 2) { polys.push({ layer, aci, closed, pts: c2.map(sh) }); if (isCut) nCut++; }
    };
    put('Teilrippe', pts, true, 30, false);
    // Beplankungsabzug (Kern) mit zwischen Innen- und Außenrippe interpolierten Werten
    let core = null;
    try {
      const sf = App.sheetFor && App.sheetFor(state.segments[idx]);
      if (sf && sf.root && sf.tip && App.sparCoreFromSheet)
        core = App.sparCoreFromSheet(pts, { top: lerp(sf.root.top || 0, sf.tip.top || 0, t), bot: lerp(sf.root.bot || 0, sf.tip.bot || 0, t), dbox: sf.root.dbox });
    } catch (e) { core = null; }
    if (core) put('Kern', core, true, 4, false);
    if (App.sparOnProfile && App.sparAppliesTo) (state.spars || []).forEach((sp, si) => {
      if (!App.sparAppliesTo(sp, idx)) return;
      let g = null;
      try {
        const fl = lerp(App.sparFromLE(sp, idx, 'root'), App.sparFromLE(sp, idx, 'tip'), t);
        g = App.sparOnProfile(sp, pts, core || null, fl, App.sparYc(sp), t < 0.5 ? 'root' : 'tip', core);
      } catch (e) { g = null; }
      if (!g) return;
      (App.sparPolys ? App.sparPolys(g) : [g.poly]).forEach(pl => put('Holm_' + (si + 1), pl, true, SPAR_ACI[si % SPAR_ACI.length], true));
    });
    if (noseBarOn()) {
      const p = params();
      if (p.shape === 'cut') {
        const x = n.x + lerp(p.dR, p.dT, t), sf2 = surfAt(pts, x);
        if (sf2 && x >= xa && x <= xb) { polys.push({ layer: 'Nasenleiste', aci: 1, closed: false, pts: [{ x, y: sf2.lo }, { x, y: sf2.hi }].map(sh) }); nCut++; }
      } else {
        put('Nasenleiste', square(pts, lerp(p.aR, p.aT, t), lerp(p.hR, p.hT, t), lerp(p.dR, p.dT, t), p.rot, p.gap / 2, lerp(p.yR, p.yT, t)), true, 1, true);
      }
    }
    return { polys, nCut, front: xa - r.lo, length: xb - xa, chord: r.chord };
  }

  // ---------- DXF-Export der Ausschnitte je Rippe (zum Fräsen) ---------------
  // Geometrie je Segment-Rippe (Wurzel; optional Rand), Nase = Nullpunkt, Einheit mm.
  // Layer: Kontur (Profil), Kern (nach Beplankungsabzug), Holm_n, Nasenleiste, Beschriftung.
  const SPAR_ACI = [5, 3, 6, 2, 4, 1];
  function ribDxfGeom(segIdx, which, withOutline) {
    const cuts = App.wing && App.wing.cuts; if (!cuts || !cuts.length) return null;
    const cut = cuts[Math.min(segIdx, cuts.length - 1)]; if (!cut) return null;
    const r = which === 'tip' ? cut.tip : cut.root;
    const pts = r && r.pts; if (!pts || pts.length < 3) return null;
    const n = noseOf(pts), sh = q => ({ x: q.x - n.x, y: q.y - n.y });
    const polys = [];
    const put = (layer, arr, closed, aci) => { if (arr && arr.length > 1) polys.push({ layer, aci, closed, pts: arr.map(sh) }); };
    const core = App.sparCoreOf ? App.sparCoreOf(pts, segIdx, which) : null;
    if (withOutline) {
      put('Kontur', pts, true, 7);
      if (core) put('Kern', core, true, 4);
    }
    let nCut = 0;
    // Holmausschnitte: gleicher Aufruf wie die Kerndesign-Ansicht (spars.js drawSpars).
    if (App.sparOnProfile && App.sparAppliesTo) (state.spars || []).forEach((sp, si) => {
      if (!App.sparAppliesTo(sp, segIdx)) return;
      let g = null;
      try { g = App.sparOnProfile(sp, pts, core || null, App.sparFromLE(sp, segIdx, which), App.sparYc(sp), which, core); } catch (e) { g = null; }
      if (!g) return;
      (App.sparPolys ? App.sparPolys(g) : [g.poly]).forEach(pl => { put('Holm_' + (si + 1), pl, true, SPAR_ACI[si % SPAR_ACI.length]); nCut++; });
    });
    // Nasenleiste: fertige Tasche (Kantenlänge + Spiel) bzw. gerade Schnittfläche.
    if (noseBarOn()) {
      const p = params(), tip = which === 'tip';
      const d = tip ? p.dT : p.dR;
      if (p.shape === 'cut') {
        const x = n.x + d, sf = surfAt(pts, x);
        if (sf) { put('Nasenleiste', [{ x, y: sf.lo }, { x, y: sf.hi }], false, 1); nCut++; }
      } else {
        put('Nasenleiste', square(pts, tip ? p.aT : p.aR, tip ? p.hT : p.hR, d, p.rot, p.gap / 2, tip ? p.yT : p.yR), true, 1); nCut++;
      }
    }
    return { polys, nCut };
  }
  function exportRibsDxf() {
    const c = C(), withFull = c.dxfRibFull !== false, withOutline = c.dxfRibOutline !== false, withTip = c.dxfRibTip !== false, withPart = c.dxfRibPart !== false;
    const say = m => { if (App.toast) App.toast(m); else alert(m); };
    if (!window.Dxf || !window.Dxf.write) { say(T('DXF-Modul nicht verfügbar.')); return; }
    const cuts = App.wing && App.wing.cuts;
    if (!cuts || !cuts.length) { say(T('Keine Tragfläche vorhanden.')); return; }
    const items = [];
    let fullCuts = 0;
    if (withFull) cuts.forEach((cut, i) => {
      const w = [['root', T('Innenrippe (Wurzel)')]];
      if (withTip) w.push(['tip', T('Außenrippe (Rand)')]);
      w.forEach(([which, nm]) => {
        const g = ribDxfGeom(i, which, withOutline);
        if (g && g.polys.length) { items.push({ title: T('Segment') + ' ' + (i + 1) + ' ' + nm, g, front: 0 }); fullCuts += g.nCut; }
      });
    });
    if (withFull && !fullCuts) items.length = 0;   // Segmentrippen ohne jeden Ausschnitt nicht exportieren
    let skipped = 0;
    let nPartOn = 0;
    if (withPart) prList().forEach((pr, i) => {
      if (pr.export === false) return;
      nPartOn++;
      const g = partRibGeom(pr);
      if (!g || !g.polys.length) { skipped++; return; }
      items.push({ title: partLabel(i) + ' · ' + T('Segment') + ' ' + (pr.seg + 1) + ' · ' + rnd(pr.pos, 1) + ' mm · ' + T('Länge') + ' ' + rnd(g.length, 1) + ' mm', g, front: g.front });
    });
    if (!items.length) {
      say(withPart && nPartOn ? T('Nichts zu exportieren — Teilrippen prüfen (Abstände zu groß?).')
        : T('Keine Ausschnitte vorhanden — Holm oder Nasenleiste im Kerndesign einschalten oder eine Teilrippe anlegen.'));
      return;
    }
    // Rippen nebeneinander; Vollrippen mit der Nase, Teilrippen mit ihrer Vorderkante bei cursor.
    const byLayer = {}, lay = (name, aci) => (byLayer[name] = byLayer[name] || { name, color: aci != null ? aci : 7, polys: [], texts: [] });
    let cursor = 0;
    items.forEach(it => {
      let maxx = -Infinity, maxy = -Infinity;
      it.g.polys.forEach(pl => pl.pts.forEach(q => { if (q.x > maxx) maxx = q.x; if (q.y > maxy) maxy = q.y; }));
      const ox = cursor - it.front, w = maxx - it.front;
      it.g.polys.forEach(pl => lay(pl.layer, pl.aci).polys.push({ closed: pl.closed, pts: pl.pts.map(q => ({ x: q.x + ox, y: q.y })) }));
      lay('Beschriftung', 2).texts.push({ x: cursor + w / 2, y: maxy + 8, h: 4, text: it.title, rot: 0 });
      cursor += w + 30;
    });
    const layers = Object.values(byLayer);
    const text = window.Dxf.write(layers, { precision: c.precision != null ? c.precision : 4 });
    const base = String(state.projectName || 'Tragflaeche').replace(/[\\/:*?"<>|]+/g, '_');
    const fn = base + (withFull && withPart && nPartOn ? '_Rippen_Teilrippen' : withFull ? (withTip ? '_Rippen' : '_Innenrippen') : '_Teilrippen') + '.dxf';
    if (App.exportViaPicker) App.exportViaPicker(fn, text, 'application/dxf', 'svDxf');
    else if (App.anchorDownload) App.anchorDownload(fn, text, 'application/dxf');
    else { say(T('Export nicht verfügbar.')); return; }
    if (skipped) say(skipped + ' ' + T('Teilrippe(n) übersprungen (keine Geometrie).'));
  }

  // ---------- Seitenleiste (Reiter Kerndesign) -------------------------------
  function noseBarSidebar(side) {
    const { grp, hint, boolRow, numRow, buildSidebar } = App;
    const c = C();
    const g = grp('Nasenabschnitt', false, 'core');
    hint(g.body, 'Schneidet an der Nase eine viereckige Tasche in den Kern, in die eine Vierkantleiste (z. B. Balsa) eingeklebt '
      + 'und danach auf Profilform verschliffen wird. Die Tasche läuft im selben Zug wie der Kernschnitt; die Nasenspitze davor '
      + 'fällt als Verschnitt weg. Der Abbrand wird nach innen ausgeglichen (fertige Tasche = Kantenlänge + Spiel).');
    boolRow(g.body, 'Nasenleiste einschneiden', () => !!c.noseBarOn, v => { c.noseBarOn = v; buildSidebar(); });
    if (c.noseBarOn) App.selectRow(g.body, 'Form',
      [['square', 'Vierkant-Tasche'], ['cut', 'Gerader Nasenabschnitt']],
      () => params().shape, v => { c.noseBarShape = v; buildSidebar(); },
      '„Gerader Nasenabschnitt": die Nase wird senkrecht abgeschnitten, z. B. um eine Balsa-Nasenleiste stumpf aufzukleben. '
      + 'Der Abbrand wird ausgeglichen: die fertige Schnittfläche liegt genau im eingestellten Abstand hinter der Nase.');
    if (c.noseBarOn && params().shape === 'cut') {
      const p = params();
      numRow(g.body, 'Abschnitt hinter der Nase Wurzel (mm)', () => p.dR, v => { c.noseBarDepth = Math.max(0, v); },
        { step: 0.5, min: 0, enter: true, hint: 'Abstand der fertigen Schnittfläche hinter der Profilnase (= Dicke der Nasenleiste vor dem Verschleifen).' });
      numRow(g.body, 'Abschnitt hinter der Nase Rand (mm)', () => p.dT, v => { c.noseBarDepthTip = Math.max(0, v); }, { step: 0.5, min: 0, enter: true });
    } else if (c.noseBarOn) {
      const p = params();
      numRow(g.body, 'Kantenlänge Wurzel (mm)', () => p.aR, v => { c.noseBarA = Math.max(0.5, v); }, { step: 0.5, min: 0.5, enter: true });
      numRow(g.body, 'Kantenlänge Rand (mm)', () => p.aT, v => { c.noseBarATip = Math.max(0.5, v); }, { step: 0.5, min: 0.5, enter: true });
      numRow(g.body, 'Höhe Wurzel (mm)', () => p.hR, v => { c.noseBarH = Math.max(0.5, v); },
        { step: 0.5, min: 0.5, enter: true, hint: 'Höhe der Tasche, senkrecht zur Kantenlänge (bei Drehung 0° also die Höhe in Profilrichtung). '
          + 'Gleich der Kantenlänge = quadratisch. Die Tasche muss die Profilkontur oben und unten anschneiden, sonst erscheint die Warnung '
          + '„Tasche schneidet die Profilbahn nicht“. Ist sie höher als das Profil an der Taschenvorderkante, entsteht statt der Tasche nur ein gerader Abschnitt.' });
      numRow(g.body, 'Höhe Rand (mm)', () => p.hT, v => { c.noseBarHTip = Math.max(0.5, v); }, { step: 0.5, min: 0.5, enter: true });
      numRow(g.body, 'Einlasstiefe Wurzel (mm)', () => p.dR, v => { c.noseBarDepth = Math.max(0, v); },
        { step: 0.5, min: 0, enter: true, hint: 'Wie weit die Leiste hinter die Profilnase in den Kern reicht (hinterster Punkt der Tasche). Kleinere Werte = mehr Überstand vor der Nase zum Verschleifen.' });
      numRow(g.body, 'Einlasstiefe Rand (mm)', () => p.dT, v => { c.noseBarDepthTip = Math.max(0, v); }, { step: 0.5, min: 0, enter: true });
      numRow(g.body, 'Höhenlage Wurzel (mm)', () => p.yR, v => { c.noseBarDy = v; },
        { step: 0.1, enter: true, hint: 'Verschiebt die Tasche senkrecht zur Sehne: positiv = nach oben, negativ = nach unten, 0 = mittig auf der Profilmittellinie. '
          + 'Mit den Pfeilen ▲▼ rechts im Feld geht es in Schritten von 0,1 mm (Taste gedrückt halten = fortlaufend).' });
      numRow(g.body, 'Höhenlage Rand (mm)', () => p.yT, v => { c.noseBarDyTip = v; }, { step: 0.1, enter: true });
      numRow(g.body, 'Drehung (°)', () => p.rot, v => { c.noseBarRot = v; },
        { step: 0.1, enter: true, hint: '45° = über Eck (Spitze nach vorne), 0° = Kanten parallel zur Sehne. '
          + 'Die Pfeile ▲▼ im Feld ändern in Schritten von 0,1°; eingetippt sind beliebige Werte möglich.' });
      numRow(g.body, 'Spiel / Klebefuge (mm)', () => p.gap, v => { c.noseBarGap = Math.max(0, v); }, { step: 0.1, min: 0, enter: true });
    }
    side.appendChild(g.g);

    // Menü „DXF Export": normalerweise ganz unten (sidebar.js ruft es am Ende auf); ohne diesen Aufruf hier.
    if (!App.dxfEndHook) dxfExportSidebar(side);
  }


  // ---------- Menü „DXF Export“ (Kerndesign, ganz unten in der Seitenleiste) ----
  function dxfExportSidebar(side) {
    const { grp, hint, boolRow, numRow, buildSidebar } = App;
    const c = C(), ex = grp('DXF Export', false, 'core');
    hint(ex.body, 'Schreibt Rippen mit ihren Ausschnitten als DXF zum Fräsen: je Segment die Innen- und Außenrippe (mit Holmausschnitten und Nasenleisten-Tasche) '
      + 'und frei definierbare Teilrippen. Die Rippen liegen nebeneinander, die erste mit der Profilnase im Nullpunkt, Einheit mm. '
      + 'Layer: Kontur, Kern, Teilrippe, Holm_1…, Nasenleiste, Beschriftung. Die Nasenleisten-Tasche hat das fertige Maß (Kantenlänge + Spiel). '
      + 'Fräserradius und Bahn legst du im CAM fest.');
    boolRow(ex.body, 'Segmentrippen (innen/außen) exportieren', () => c.dxfRibFull !== false, v => { c.dxfRibFull = v; });
    boolRow(ex.body, 'Rippenumriss mitexportieren', () => c.dxfRibOutline !== false, v => { c.dxfRibOutline = v; });
    boolRow(ex.body, 'Außenrippen (Rand) mitexportieren', () => c.dxfRibTip !== false, v => { c.dxfRibTip = v; });
    boolRow(ex.body, 'Teilrippen mitexportieren', () => c.dxfRibPart !== false, v => { c.dxfRibPart = v; });

    // --- Teilrippen definieren (Aufbau wie bei den Holmen: Karten, nur die aktive ist aufgeklappt) ---
    App.subhead(ex.body, 'Teilrippen');
    hint(ex.body, 'Eine Teilrippe ist ein Streifen einer Rippe an beliebiger Stelle im Segment: von „Abstand Nasenleiste“ bis „Abstand Endleiste“. '
      + 'Das Profil dort ist zwischen Innen- und Außenrippe interpoliert, also genau der Querschnitt des Kerns an dieser Stelle. '
      + 'Es lassen sich beliebig viele Teilrippen anlegen; alle mit gesetztem Haken „In DXF exportieren“ kommen in die Datei.');
    hint(ex.body, 'Auf die Kopfzeile tippen zum Aktivieren – nur die aktive Teilrippe ist aufgeklappt. Die Pfeile ▲▼ in den Feldern ändern den Wert um 0,1 mm; '
      + '„Länge“ verschiebt die Hinterkante, der Abstand zur Nasenleiste bleibt.');
    const prs = prList(), segs = state.segments || [];
    if (state.activePartRib != null && state.activePartRib >= prs.length) state.activePartRib = null;
    prs.forEach((pr, i) => {
      const open = state.activePartRib === i, span = segSpan(pr.seg), info = partRibInfo(pr);
      const card = document.createElement('div');
      card.style.cssText = 'border:1px solid var(--line);border-radius:7px;padding:0;margin:2px 0;background:var(--panel2);overflow:hidden';
      const hd = document.createElement('div');
      hd.style.cssText = 'display:flex;align-items:center;cursor:pointer;padding:7px 8px';
      if (open) hd.style.background = 'rgba(74,163,255,.14)';
      const caret = document.createElement('span');
      caret.textContent = open ? '▾' : '▸';
      caret.style.cssText = 'color:var(--muted);margin-right:6px;font-size:10px';
      const lab = document.createElement('b'); lab.style.fontSize = '12px'; lab.textContent = partLabel(i);
      if (open) lab.style.color = 'var(--accent)';
      const sum = document.createElement('span');
      sum.style.cssText = 'color:var(--muted);font-size:11px;margin-left:8px';
      sum.textContent = info ? 'Seg ' + (pr.seg + 1) + ' · ' + rnd(pr.pos, 1) + ' mm · L ' + rnd(info.L, 1) + ' mm' : '';
      const spc = document.createElement('div'); spc.style.flex = '1';
      const del = App.mkMini('✕', () => {
        prs.splice(i, 1);
        if (state.activePartRib === i) state.activePartRib = null;
        else if (state.activePartRib != null && state.activePartRib > i) state.activePartRib--;
        buildSidebar(); App.render && App.render();
      });
      del.style.color = 'var(--bad)';
      hd.appendChild(caret); hd.appendChild(lab); hd.appendChild(sum); hd.appendChild(spc); hd.appendChild(del);
      hd.onclick = () => { state.activePartRib = open ? null : i; buildSidebar(); App.render && App.render(); };
      card.appendChild(hd);
      ex.body.appendChild(card);
      if (!open) return;
      const sb = document.createElement('div');
      sb.style.cssText = 'padding:8px;display:grid;gap:8px';
      card.appendChild(sb);
      App.txtRow(sb, 'Name (frei)', () => pr.name || '', v => { pr.name = v; lab.textContent = partLabel(i); });
      App.selectRow(sb, 'Segment', segs.map((sg, k) => [String(k), T('Segment') + ' ' + (k + 1)]),
        () => String(pr.seg), v => { pr.seg = +v; pr.pos = clamp(pr.pos, 0, segSpan(pr.seg)); buildSidebar(); });
      numRow(sb, 'Lage ab Innenrippe (mm)', () => rnd(pr.pos, 3), v => { pr.pos = clamp(v, 0, span); buildSidebar(); },
        { step: 0.1, min: 0, max: span || undefined, enter: true,
          hint: 'Abstand der Teilrippe von der Innenrippe dieses Segments (Spannweitenrichtung, Segmentlänge ' + rnd(span, 1) + ' mm).' });
      numRow(sb, 'Abstand Nasenleiste (mm)', () => rnd(pr.dN, 3), v => { pr.dN = Math.max(0, v); buildSidebar(); }, { step: 0.1, min: 0, enter: true });
      numRow(sb, 'Abstand Endleiste (mm)', () => rnd(pr.dE, 3), v => { pr.dE = Math.max(0, v); buildSidebar(); }, { step: 0.1, min: 0, enter: true });
      if (info) numRow(sb, 'Länge (mm)', () => rnd(info.L, 2), v => { pr.dE = Math.max(0, rnd(info.chord - pr.dN - Math.max(0, v), 3)); buildSidebar(); },
        { step: 0.1, min: 0, enter: true, hint: 'Länge des Streifens = Sehne an dieser Stelle (' + rnd(info.chord, 1) + ' mm) − Abstand Nasenleiste − Abstand Endleiste.' });
      boolRow(sb, 'In DXF exportieren', () => pr.export !== false, v => { pr.export = v; });
    });
    const bar = document.createElement('div'); bar.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;margin-top:6px';
    const addBtn = document.createElement('button'); addBtn.className = 'primary'; addBtn.textContent = T('+ Teilrippe hinzufügen');
    addBtn.onclick = () => {
      const k = Math.max(0, Math.min(segs.length - 1, prs.length ? prs[prs.length - 1].seg : 0)), span = segSpan(k);
      const pr = { seg: k, pos: rnd(span / 2, 1), dN: 0, dE: 0 };
      const inf = partRibInfo(pr);
      if (inf) { pr.dN = rnd(inf.chord * 0.15, 1); pr.dE = rnd(inf.chord * 0.15, 1); }
      prs.push(pr); state.activePartRib = prs.length - 1; buildSidebar(); App.render && App.render();
    };
    bar.appendChild(addBtn);
    if (prs.length) {
      const dupBtn = App.mkMini(T('Aktive duplizieren'), () => {
        const k = state.activePartRib != null && prs[state.activePartRib] ? state.activePartRib : prs.length - 1;
        const src = prs[k], cp = Object.assign({}, src, { name: src.name ? src.name + ' (2)' : '' });
        cp.pos = clamp(src.pos + 10, 0, segSpan(src.seg));
        prs.splice(k + 1, 0, cp); state.activePartRib = k + 1; buildSidebar(); App.render && App.render();
      });
      dupBtn.style.marginLeft = '0'; bar.appendChild(dupBtn);
    }
    ex.body.appendChild(bar);
    const btn = App.mkMini(T('Rippen als DXF exportieren'), exportRibsDxf);
    btn.style.marginLeft = '0'; btn.style.marginTop = '10px'; btn.style.fontWeight = '700';
    ex.body.appendChild(btn);
    side.appendChild(ex.g);
  }

  Object.assign(App, { noseBarOn, noseBarApply, noseBarDraw, noseBarSidebar, dxfExportSidebar, exportRibsDxf, partRibPlan });
})();