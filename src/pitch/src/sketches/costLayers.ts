import p5 from 'p5';

export const costLayers = (p: p5) => {
  // Stacked cost bars that build up across 4 milestone phases
  const phases = [
    { label: 'MVP', total: 50, layers: [15, 10, 0, 7, 18] },
    { label: '10K', total: 200, layers: [50, 30, 5, 65, 50] },
    { label: '100K', total: 1000, layers: [300, 100, 50, 350, 200] },
    { label: '500K+', total: 5000, layers: [1500, 400, 200, 1500, 1400] },
  ];
  const colors: [number, number, number][] = [
    [163, 230, 53],  // lime — Postgres
    [56, 189, 248],  // sky — Redis
    [251, 146, 60],  // orange — R2
    [192, 132, 252], // purple — Compute
    [100, 116, 139], // slate — Other
  ];

  let progress = 0;

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.textFont('monospace');
  };

  p.draw = () => {
    p.clear();
    if (progress < 1) progress += 0.008;

    const cx = p.width / 2;
    const barAreaW = Math.min(p.width * 0.7, 700);
    const barW = barAreaW / phases.length - 20;
    const baseY = p.height * 0.75;
    const maxH = p.height * 0.45;
    const maxTotal = phases[phases.length - 1].total;
    const startX = cx - barAreaW / 2 + 10;

    for (let pi = 0; pi < phases.length; pi++) {
      const phase = phases[pi];
      const x = startX + pi * (barW + 20);
      const phaseProgress = Math.min(1, progress * phases.length - pi * 0.6);
      if (phaseProgress <= 0) continue;

      const eased = Math.min(1, phaseProgress);

      // Stack layers bottom-up
      let y = baseY;
      for (let li = 0; li < phase.layers.length; li++) {
        const layerH = (phase.layers[li] / maxTotal) * maxH * eased;
        const c = colors[li];
        p.fill(c[0], c[1], c[2], 160);
        p.noStroke();
        p.rect(x, y - layerH, barW, layerH, 3, 3, 0, 0);
        y -= layerH;
      }

      // Phase label below
      p.fill(150);
      p.noStroke();
      p.textAlign(p.CENTER, p.TOP);
      p.textSize(12);
      p.text(phase.label, x + barW / 2, baseY + 8);

      // Total above
      if (eased > 0.5) {
        p.fill(163, 230, 53, 200);
        p.textSize(14);
        p.textAlign(p.CENTER, p.BOTTOM);
        p.text('$' + phase.total + '/mo', x + barW / 2, y - 6);
      }
    }

    // Baseline
    p.stroke(60);
    p.strokeWeight(1);
    p.line(startX - 10, baseY, startX + barAreaW, baseY);
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    progress = 0;
  };
};
