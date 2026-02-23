import p5 from 'p5';

export const competitiveGrid = (p: p5) => {
  // 2D positioning chart: x = Verification Rigor, y = Financial Stakes
  // Styx in the upper-right quadrant; competitors scattered elsewhere

  interface Competitor {
    name: string;
    x: number; // 0–1 verification rigor
    y: number; // 0–1 financial stakes
    r: number; // bubble size
    color: [number, number, number];
    isStyx?: boolean;
  }

  const competitors: Competitor[] = [
    { name: 'Habitica', x: 0.1, y: 0.05, r: 18, color: [251, 146, 60] },
    { name: 'Stickk', x: 0.15, y: 0.4, r: 16, color: [251, 146, 60] },
    { name: 'Beeminder', x: 0.2, y: 0.35, r: 14, color: [251, 146, 60] },
    { name: 'HealthyWage', x: 0.25, y: 0.55, r: 16, color: [56, 189, 248] },
    { name: 'DietBet', x: 0.2, y: 0.45, r: 15, color: [56, 189, 248] },
    { name: 'Virgin Pulse', x: 0.35, y: 0.1, r: 22, color: [192, 132, 252] },
    { name: 'Limeade', x: 0.3, y: 0.08, r: 18, color: [192, 132, 252] },
    { name: 'Wellable', x: 0.28, y: 0.12, r: 14, color: [192, 132, 252] },
    { name: 'STYX', x: 0.85, y: 0.82, r: 28, color: [163, 230, 53], isStyx: true },
  ];

  let progress = 0;
  let hoveredIdx = -1;

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.textFont('monospace');
  };

  p.draw = () => {
    p.clear();
    if (progress < 1) progress += 0.006;

    const margin = 80;
    const chartL = margin + 40;
    const chartR = p.width - margin;
    const chartT = margin;
    const chartB = p.height - margin - 20;
    const chartW = chartR - chartL;
    const chartH = chartB - chartT;

    // Quadrant shading
    const midX = chartL + chartW / 2;
    const midY = chartT + chartH / 2;

    p.noStroke();
    p.fill(163, 230, 53, 6);
    p.rect(midX, chartT, chartW / 2, chartH / 2); // upper-right (target)
    p.fill(100, 116, 139, 4);
    p.rect(chartL, midY, chartW / 2, chartH / 2); // lower-left (commodity)

    // Grid lines
    p.stroke(60, 40);
    p.strokeWeight(0.5);
    for (let i = 0; i <= 4; i++) {
      const gx = chartL + (chartW * i) / 4;
      const gy = chartT + (chartH * i) / 4;
      p.line(gx, chartT, gx, chartB);
      p.line(chartL, gy, chartR, gy);
    }

    // Axes
    p.stroke(80);
    p.strokeWeight(1);
    p.line(chartL, chartB, chartR, chartB); // x-axis
    p.line(chartL, chartT, chartL, chartB); // y-axis

    // Axis labels
    p.noStroke();
    p.fill(100, 116, 139);
    p.textSize(11);
    p.textAlign(p.CENTER, p.TOP);
    p.text('Verification Rigor →', (chartL + chartR) / 2, chartB + 10);

    p.push();
    p.translate(chartL - 30, (chartT + chartB) / 2);
    p.rotate(-p.HALF_PI);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.text('Financial Stakes →', 0, 0);
    p.pop();

    // Quadrant labels
    p.fill(100, 116, 139, 60);
    p.textSize(10);
    p.textAlign(p.CENTER, p.CENTER);
    p.text('Self-Report + Free', chartL + chartW * 0.25, chartB - 20);
    p.text('Verified + Staked', chartL + chartW * 0.75, chartT + 20);

    // Competitor bubbles
    hoveredIdx = -1;
    const mx = p.mouseX;
    const my = p.mouseY;

    for (let i = 0; i < competitors.length; i++) {
      const c = competitors[i];
      const eased = Math.min(1, Math.max(0, progress * (competitors.length + 2) - i * 0.5));
      if (eased <= 0) continue;

      const cx = chartL + c.x * chartW;
      const cy = chartB - c.y * chartH;
      const r = c.r * eased;

      // Hover detection
      const d = p.dist(mx, my, cx, cy);
      if (d < r + 4) hoveredIdx = i;

      // Glow for Styx
      if (c.isStyx) {
        const pulse = p.sin(p.frameCount * 0.03) * 4 + 8;
        p.noFill();
        p.stroke(163, 230, 53, 30);
        p.strokeWeight(2);
        p.ellipse(cx, cy, r * 2 + pulse, r * 2 + pulse);
      }

      // Bubble
      const alpha = hoveredIdx === i ? 220 : 140;
      p.fill(c.color[0], c.color[1], c.color[2], alpha * eased);
      p.noStroke();
      p.ellipse(cx, cy, r * 2, r * 2);

      // Label
      const labelAlpha = hoveredIdx === i ? 255 : c.isStyx ? 220 : 120;
      p.fill(c.isStyx ? 163 : 200, c.isStyx ? 230 : 200, c.isStyx ? 53 : 200, labelAlpha * eased);
      p.textSize(c.isStyx ? 13 : 10);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(c.name, cx, cy - r - 10);
    }

    // Legend
    const legendY = chartT + 10;
    const legendX = chartR - 160;
    const categories: [string, [number, number, number]][] = [
      ['Habit Apps', [251, 146, 60]],
      ['Health Betting', [56, 189, 248]],
      ['Corp Wellness', [192, 132, 252]],
      ['Styx', [163, 230, 53]],
    ];

    p.textSize(9);
    p.textAlign(p.LEFT, p.CENTER);
    for (let i = 0; i < categories.length; i++) {
      const [label, col] = categories[i];
      const ly = legendY + i * 18;
      p.fill(col[0], col[1], col[2], 160);
      p.noStroke();
      p.ellipse(legendX, ly, 8, 8);
      p.fill(150);
      p.text(label, legendX + 10, ly);
    }
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    progress = 0;
  };
};
