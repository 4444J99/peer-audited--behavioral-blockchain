import p5 from 'p5';

export const escrowGravity = (p: p5) => {
  const stakes: { x: number; y: number; r: number; isBonus: boolean }[] = [];

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    for (let i = 0; i < 60; i++) {
      stakes.push({
        x: p.random(p.width),
        y: p.random(p.height),
        r: p.random(4, 10),
        isBonus: p.random() > 0.8,
      });
    }
  };

  p.draw = () => {
    p.clear();
    const cx = p.width / 2;
    const cy = p.height / 2;

    // Gravity well rings
    p.noFill();
    p.strokeWeight(1);
    for (let i = 0; i < 5; i++) {
      p.stroke(163, 230, 53, 40 - i * 8);
      p.circle(cx, cy, 120 + (p.frameCount % 60) + i * 25);
    }

    p.strokeWeight(0);
    for (const s of stakes) {
      if (s.isBonus) {
        s.x += (s.x - cx) * 0.04;
        s.y += (s.y - cy) * 0.04;
        p.fill(163, 230, 53, 200);
        if (s.x < -20 || s.x > p.width + 20 || s.y < -20 || s.y > p.height + 20) {
          s.x = cx + p.random(-10, 10);
          s.y = cy + p.random(-10, 10);
        }
      } else {
        s.x = p.lerp(s.x, cx, 0.015);
        s.y = p.lerp(s.y, cy, 0.015);
        p.fill(248, 113, 113, 180);
        if (p.random() > 0.995) {
          s.x = p.random(p.width);
          s.y = p.random(p.height);
        }
      }
      p.circle(s.x, s.y, s.r);
    }
  };

  p.windowResized = () => p.resizeCanvas(p.windowWidth, p.windowHeight);
};
