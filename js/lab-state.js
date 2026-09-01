/* Shared lab knobs — later tabs read what earlier tabs set. */
window.LabState = {
  T: 300,
  Eg: 1.12,
  gap: 'indirect',
  a: 5.431,
  lattice: 'diamond',
  curve: 1.15,
  doping: 'intrinsic',
  Nd: 1e16,
  Na: 1e12,
  Vs: 5,
  R: 330,
  _subs: [],
  set: function (partial, src) {
    Object.assign(this, partial);
    this._subs.forEach(function (fn) { fn(window.LabState, src || ''); });
  },
  on: function (fn) { this._subs.push(fn); },
};
