import p5 from 'p5';

export const retentionCurve = (p: p5) => {
  let points: { x: number; y: number }[] = [];
  let t = 0;

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
  };

  p.draw = () => {
    p.clear();
    const margin = 80;
    const chartW = p.width - margin * 2;

    // Axes
    p.stroke(60);
    p.strokeWeight(1);
    p.line(margin, margin, margin, p.height - margin);
    p.line(margin, p.height - margin, p.width - margin, p.height - margin);

    p.fill(80);
    p.noStroke();
    p.textSize(11);
    p.textAlign(p.RIGHT, p.CENTER);
    p.text('100%', margin - 8, margin);
    p.text('0%', margin - 8, p.height - margin);
    p.textAlign(p.CENTER, p.TOP);
    p.text('Day 1', margin, p.height - margin + 8);
    p.text('Day 30', p.width - margin, p.height - margin + 8);

    // Animate curve
    if (t < chartW) {
      const x = margin + t;
      const decay = p.exp(-t * 0.008);
      const y = p.map(decay, 1, 0, margin, p.height - margin) + p.random(-8, 8);
      points.push({ x, y });
      t += 3;
    } else {
      t = 0;
      points = [];
    }

    // Draw curve
    p.noFill();
    p.stroke(248, 113, 113);
    p.strokeWeight(3);
    p.beginShape();
    for (const pt of points) p.vertex(pt.x, pt.y);
    p.endShape();

    // Falling particles
    p.stroke(248, 113, 113, 80);
    p.strokeWeight(2);
    if (points.length > 0) {
      const last = points[points.length - 1];
      for (let i = 0; i < 6; i++) {
        p.point(last.x + p.random(-25, 25), last.y + p.random(0, 60));
      }
    }
  };

  p.windowResized = () => p.resizeCanvas(p.windowWidth, p.windowHeight);
};
