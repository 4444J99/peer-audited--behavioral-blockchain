import p5 from 'p5';

export const marketPipeline = (p: p5) => {
  const users: { x: number; y: number }[] = [];

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    for (let i = 0; i < 120; i++) {
      users.push({ x: p.random(0, p.width * 0.3), y: p.random(p.height) });
    }
  };

  p.draw = () => {
    p.clear();
    const mid = p.width / 2;

    // B2B grid on right
    p.stroke(163, 230, 53, 30);
    p.strokeWeight(1);
    for (let x = mid; x < p.width; x += 40) p.line(x, 0, x, p.height);
    for (let y = 0; y < p.height; y += 40) p.line(mid, y, p.width, y);

    // Particles
    for (const u of users) {
      u.x += p.random(2, 5);

      if (u.x < mid) {
        u.y += p.random(-8, 8);
        p.stroke(255, 120);
        p.strokeWeight(2);
        p.circle(u.x, u.y, 3);
      } else {
        u.y = p.lerp(u.y, p.round(u.y / 40) * 40, 0.08);
        p.stroke(163, 230, 53, 180);
        p.strokeWeight(1);
        p.noFill();
        p.rect(u.x, u.y - 2, 8, 4);
      }

      if (u.x > p.width + 10) {
        u.x = -10;
        u.y = p.random(p.height);
      }
    }
  };

  p.windowResized = () => p.resizeCanvas(p.windowWidth, p.windowHeight);
};
