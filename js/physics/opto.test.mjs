import {
  C, MATERIALS, ePhoton, lambdaFromE, photonRegime, energySplit,
  alphaDirect, beer, absorbedFraction, depletion, pinWidth, collectionProb,
  diffusionLength, photocurrentApprox, sigmaOf, barResistance, photoconductorI,
  diodeCurrent, voc, iscSigned, illuminatedI, mpp, junctionCap, rcTime,
  transitTime, responsivityTeaching, qeTeaching, collectedFromPower,
  wienPeakNm, planckBlambda, integrateTable, AM15G, shockleyQueisser, am15Jsc,
  safeExp, vt,
} from './opto.js';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}
function near(a, b, tol, msg) {
  assert(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);
}

const Si = MATERIALS.Si;

near(ePhoton(1240).E, 1, 1e-12, 'E = 1240/λ');
near(lambdaFromE(1.12).lambdaNm, 1240 / 1.12, 1e-9, 'λg');
assert(photonRegime(0.8, 1.12).id === 'below', 'sub-gap transparent');
assert(photonRegime(2.0, 1.12).id === 'above', 'above-gap absorbed');
const split = energySplit(2.0, 1.12);
near(split.usable, 1.12, 1e-12, 'usable = Eg');
near(split.thermal, 0.88, 1e-12, 'thermal = Eph − Eg');
assert(energySplit(0.8, 1.12).transmitted === 0.8, 'below-gap all transmitted');

assert(alphaDirect(2000, 1.12) === 0, 'α = 0 below Eg');
assert(alphaDirect(500, 1.12) > 0, 'α > 0 above Eg');
near(beer(1, 1, 0), 1, 1e-12, 'I(0)=I0');
near(beer(1, Math.log(2), 1), 0.5, 1e-9, 'half from αx=ln2');
near(absorbedFraction(1, Math.log(2), 0, false).absorbed, 0.5, 1e-9, '1−e^{−αd}');

const d0 = depletion(1e16, 1e16, 0, 300, Si);
assert(d0.W > 0 && !d0.flat, 'equilibrium W');
const drev = depletion(1e16, 1e16, -5, 300, Si);
assert(drev.W > d0.W, 'reverse bias widens W');
const dfwd = depletion(1e16, 1e16, 0.9, 300, Si);
assert(dfwd.flat || dfwd.W < d0.W, 'forward shrinks or flattens');
const pin = pinWidth(2e-3, 1e16, 1e16, -2, 300, Si);
assert(pin.W >= 2e-3, 'PIN W ≥ Wi');

const Ln = diffusionLength(1350, 1e-6, 300).L;
assert(collectionProb(0, d0.xp, d0.xn, Ln, Ln).p === 1, 'depletion collects');
assert(collectionProb(-1, 0.1e-4, 0.1e-4, Ln, Ln).p < 1, 'far p-side can miss');

near(photocurrentApprox(1e-2, 1e19, 1e-4, 1e-4, 2e-4), C.Q * 1e-2 * 1e19 * 4e-4, 1e-20, 'Iph ≈ qA g (Ln+Lp+W)');

const sig = sigmaOf(1e16, 1e5, 1350, 480);
assert(sig.total > sig.elec * 0.99, 'n-type σ dominated by electrons');
near(photoconductorI(5, 1000).I, 0.005, 1e-12, 'Ohm');

const dark = diodeCurrent(0, 1e-12, 300, 0);
near(dark.I, 0, 1e-18, 'I(0)=0 in the dark');
const illum = diodeCurrent(0, 1e-12, 300, 1e-3);
near(illum.I, -1e-3, 1e-12, 'Isc = −Iph');
const Voc = voc(1e-3, 1e-12, 300);
near(diodeCurrent(Voc, 1e-12, 300, 1e-3).I, 0, 1e-14, 'I(Voc)=0');
assert(iscSigned(2e-3) === -2e-3, 'signed Isc');

const mp = mpp({ I0: 1e-12, T: 300, Iph: 0.03, Rs: 0, Rsh: Infinity, Pin: 0.1 });
assert(mp.V > 0 && mp.V < mp.Voc, 'MPP between 0 and Voc');
assert(mp.Pout > 0, 'Pout > 0');
assert(mp.FF > 0.5 && mp.FF < 1, 'sane FF');
const withRs = mpp({ I0: 1e-12, T: 300, Iph: 0.03, Rs: 8, Rsh: Infinity, Pin: 0.1 });
assert(withRs.Pout < mp.Pout, 'series R cuts Pmax');

const cj = junctionCap(Si.epsR * C.EPS0, 1e-2, drev.W);
assert(cj.Cj < junctionCap(Si.epsR * C.EPS0, 1e-2, d0.W).Cj, 'wider W, smaller Cj');
assert(rcTime(50, cj.Cj) > 0, 'RC');
assert(transitTime(drev.W, 1350, drev.Emax).t > 0, 'transit');

near(qeTeaching(responsivityTeaching(0.8, 900), 900), 0.8, 1e-9, 'QE ↔ R inverse');
const col = collectedFromPower(1e-3, 800, 0.5);
assert(col.nE > 0 && col.Iph > 0, 'collected electrons');

near(wienPeakNm(5800), C.WIEN_NM_K / 5800, 1e-6, 'Wien');
assert(planckBlambda(500, 5800) > planckBlambda(500, 300), 'hotter is brighter at 500 nm');
assert(planckBlambda(10000, 300) > planckBlambda(500, 300), '300 K peaks in IR');
const pinAM = integrateTable(AM15G);
assert(pinAM > 800 && pinAM < 1300, `AM1.5 table integrates to ~1000 W/m², got ${pinAM}`);

const sq11 = shockleyQueisser(1.1);
const sq04 = shockleyQueisser(0.4);
const sq22 = shockleyQueisser(2.2);
assert(sq11.eta > sq04.eta && sq11.eta > sq22.eta, 'SQ peaks at intermediate Eg');
assert(sq11.eta > 0.2 && sq11.eta < 0.45, `SQ ~30% class, got ${sq11.eta}`);
assert(sq04.Jsc > sq22.Jsc, 'small Eg, more current');
assert(sq22.Voc > sq04.Voc, 'large Eg, more voltage');
assert(am15Jsc(1.1) > am15Jsc(1.8), 'AM1.5 Jsc falls as Eg rises');

assert(safeExp(200).overflow, 'exp overflow flagged, not silent');
assert(vt(300) > 0.025 && vt(300) < 0.027, 'kT at 300 K');

const Ipos = diodeCurrent(0.7, 1e-12, 300, 0.002);
const Irev = diodeCurrent(-2, 1e-12, 300, 0.002);
assert(Ipos.I > 0, 'forward can still be positive if I0 exp beats Iph');
assert(Irev.I < 0, 'reverse illuminated current is negative');

console.log('opto physics tests ok');
console.log('  SQ(1.1 eV) eta', sq11.eta.toFixed(3), 'Voc', sq11.Voc.toFixed(3), 'Jsc', sq11.Jsc.toExponential(2));
console.log('  AM1.5 table Pin', pinAM.toFixed(1), 'W/m²');
console.log('  Si W(0)', d0.W.toExponential(2), 'cm  W(−5 V)', drev.W.toExponential(2), 'cm');
