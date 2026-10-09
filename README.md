# LatticeLab

A browser-based semiconductor physics study portal built alongside ESE 2180. It combines interactive diagrams, numerical models, homework visualizers, equation relationships, and exam practice. The code is plain HTML, CSS, and JavaScript; there is no application server or package-install step.

## Run locally

From the repository root, with Python 3 installed:

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`. Use an HTTP server rather than opening the files directly because several pages load JavaScript modules.

## Explore

- `index.html`: main portal.
- `fermi_visualizer.html`: Fermi-level visualization.
- `pn_junction.html` and `pn_lab.html`: carrier dynamics and PN-junction labs.
- `wafer_lab.html`: semiconductor wafer measurements.
- `latticelab_homeworks.html`: unit-cell, crystal, Miller-plane, Fermi, and band-structure visualizers.
- `eqrel.html`: relationships between semiconductor equations.
- `exam1.html`: practice questions and review tools.

Change the controls in each lab to compare diagrams and numerical outputs. Physics models are in `js/physics/`, interactive labs in `js/sims/`, and practice tools in `js/exam1/`.

## Limits

These are teaching models, not calibrated device simulators or an official course answer key. Check assumptions and units before using results. Pages load fonts and libraries such as Tailwind, KaTeX, Chart.js, Plotly, and Three.js from CDNs, so a fully offline experience is not guaranteed. This checkout has no automated test runner or dependency lockfile.
