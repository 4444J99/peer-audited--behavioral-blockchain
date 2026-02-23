import p5 from 'p5';

export const techNetwork = (p: p5) => {
  const nodes = [
    { label: 'PostgreSQL' },
    { label: 'BullMQ' },
    { label: 'Cloudflare R2' },
    { label: 'HealthKit' },
    { label: 'Stripe FBO' },
  ];

  const getPositions = () => {
    const cx = p.width / 2;
    const cy = p.height / 2;
    const r = Math.min(180, p.width * 0.18);
    return nodes.map((_, i) => {
      const a = (i * p.TWO_PI) / nodes.length - p.PI / 2;
      return { x: cx + p.cos(a) * r, y: cy + p.sin(a) * r };
    });
  };

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
  };

  p.draw = () => {
    p.clear();
    const positions = getPositions();

    // Jittery connections
    p.strokeWeight(1.5);
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        p.stroke(251, 146, 60, 40);
        p.beginShape();
        p.vertex(positions[i].x, positions[i].y);
        const mx = (positions[i].x + positions[j].x) / 2 + p.random(-15, 15);
        const my = (positions[i].y + positions[j].y) / 2 + p.random(-15, 15);
        p.vertex(mx, my);
        p.vertex(positions[j].x, positions[j].y);
        p.endShape();
      }
    }

    // Nodes
    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      p.fill(20);
      p.stroke(251, 146, 60);
      p.strokeWeight(2);
      p.circle(pos.x, pos.y, 75);
      p.fill(255);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(11);
      p.text(nodes[i].label, pos.x, pos.y);
    }
  };

  p.windowResized = () => p.resizeCanvas(p.windowWidth, p.windowHeight);
};
