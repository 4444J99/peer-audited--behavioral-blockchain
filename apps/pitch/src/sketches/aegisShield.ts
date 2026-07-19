import p5 from 'p5';

export const aegisShield = (p: p5) => {
  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
  };

  p.draw = () => {
    p.clear();
    const cx = p.width / 2;
    const cy = p.height / 2;
    const maxR = Math.min(200, p.width * 0.18);

    // Shield shape
    p.noFill();
    p.strokeWeight(2);
    p.stroke(192, 132, 252, 120);
    p.beginShape();
    for (let a = 0; a < p.TWO_PI; a += p.PI / 6) {
      const r = maxR + p.noise(a, p.frameCount * 0.02) * 25;
      p.vertex(cx + p.cos(a) * r, cy + p.sin(a) * r);
    }
    p.endShape(p.CLOSE);

    // Inner core
    p.fill(192, 132, 252, 20);
    p.noStroke();
    p.circle(cx, cy, maxR - 40);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.text('AEGIS', cx, cy);

    // Attacks hitting shield
    p.strokeWeight(3);
    for (let i = 0; i < 12; i++) {
      const a = p.random(p.TWO_PI);
      const dist = 350 - ((p.frameCount * 4 + i * 50) % 180);
      if (dist > maxR + 25) {
        p.stroke(248, 113, 113, 160);
        p.point(cx + p.cos(a) * dist, cy + p.sin(a) * dist);
      } else {
        p.stroke(255, 255, 255, 100);
        p.circle(cx + p.cos(a) * (maxR + 25), cy + p.sin(a) * (maxR + 25), 4);
      }
    }
  };

  p.windowResized = () => p.resizeCanvas(p.windowWidth, p.windowHeight);
};
