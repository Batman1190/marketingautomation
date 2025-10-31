(function(){
  const nEl = document.getElementById('n');
  const aEl = document.getElementById('rateA');
  const bEl = document.getElementById('rateB');
  const seedEl = document.getElementById('seed');
  const simulateBtn = document.getElementById('simulate');
  const calcBtn = document.getElementById('calc');
  const out = document.getElementById('out');

  function seededRandom(seed) {
    // Simple LCG
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return function() {
      s = s * 16807 % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  function binomial(n, p, rng = Math.random) {
    let k = 0;
    for (let i = 0; i < n; i++) {
      if (rng() < p) k++;
    }
    return k;
  }

  function twoPropZTest(x1, n1, x2, n2) {
    const p1 = x1 / n1;
    const p2 = x2 / n2;
    const p = (x1 + x2) / (n1 + n2);
    const se = Math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2));
    const z = (p2 - p1) / se;
    const pval = 2 * (1 - cdfStdNormal(Math.abs(z)));
    return { p1, p2, z, pval };
  }

  function cdfStdNormal(z) {
    // Abramowitz and Stegun approximation
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp(-z * z / 2);
    let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    if (z > 0) p = 1 - p;
    return p;
  }

  function fmtPct(x) { return (x * 100).toFixed(2) + '%'; }

  function render(x1, n1, x2, n2, label) {
    const { p1, p2, z, pval } = twoPropZTest(x1, n1, x2, n2);
    const lift = (p2 - p1) / p1;
    const winner = p2 > p1 ? 'B' : (p2 < p1 ? 'A' : 'Tie');
    out.innerHTML = `
<table>
  <tr><th></th><th>Opens</th><th>Sample</th><th>Rate</th></tr>
  <tr><td>A</td><td>${x1}</td><td>${n1}</td><td>${fmtPct(p1)}</td></tr>
  <tr><td>B</td><td>${x2}</td><td>${n2}</td><td>${fmtPct(p2)}</td></tr>
</table>
<p><strong>Winner:</strong> ${winner} | <strong>Lift:</strong> ${(lift*100).toFixed(2)}% | <strong>z:</strong> ${z.toFixed(2)} | <strong>p-value:</strong> ${pval.toExponential(2)}</p>
<p>${label}</p>
`;
  }

  simulateBtn.addEventListener('click', () => {
    const n = Math.max(10, parseInt(nEl.value || '0', 10));
    const pA = Math.max(0, Math.min(1, (parseFloat(aEl.value || '0') / 100)));
    const pB = Math.max(0, Math.min(1, (parseFloat(bEl.value || '0') / 100)));
    const seed = seedEl.value ? parseInt(seedEl.value, 10) : null;
    const rng = seed ? seededRandom(seed) : Math.random;
    const x1 = binomial(n, pA, rng);
    const x2 = binomial(n, pB, rng);
    render(x1, n, x2, n, 'Simulated draws may vary run-to-run.');
  });

  calcBtn.addEventListener('click', () => {
    const n = Math.max(10, parseInt(nEl.value || '0', 10));
    const pA = Math.max(0, Math.min(1, (parseFloat(aEl.value || '0') / 100)));
    const pB = Math.max(0, Math.min(1, (parseFloat(bEl.value || '0') / 100)));
    const x1 = Math.round(n * pA);
    const x2 = Math.round(n * pB);
    render(x1, n, x2, n, 'Deterministic calculation (rounded opens).');
  });
})();


