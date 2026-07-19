import p5 from 'p5';

export const titleParticles = (p: p5) => {
  const particles: { x: number; y: number; vx: number; vy: number; tgtX: number; tgtY: number }[] = [];

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    // Fallback: geometric circle from chaos
    for (let i = 0; i < 300; i++) {
      const angle = p.map(i, 0, 300, 0, p.TWO_PI);
      const r = 150 + p.random(-20, 20);
      particles.push({
        x: p.random(p.width),
        y: p.random(p.height),
        vx: 0,
        vy: 0,
        tgtX: p.width / 2 + p.cos(angle) * r,
        tgtY: p.height / 2 + p.sin(angle) * r,
      });
    }
  };

  p.draw = () => {
    p.clear();
    p.stroke(163, 230, 53, 180);
    p.strokeWeight(2.5);

    for (const pt of particles) {
      let forceX = pt.tgtX - pt.x;
      let forceY = pt.tgtY - pt.y;

      const dMouse = p.dist(p.mouseX, p.mouseY, pt.x, pt.y);
      if (dMouse < 120) {
        forceX -= (p.mouseX - pt.x) * 0.4;
        forceY -= (p.mouseY - pt.y) * 0.4;
      }

      pt.vx = p.lerp(pt.vx, forceX * 0.05, 0.08);
      pt.vy = p.lerp(pt.vy, forceY * 0.05, 0.08);
      pt.x += pt.vx;
      pt.y += pt.vy;

      p.point(pt.x, pt.y);
    }
  };

  p.windowResized = () => p.resizeCanvas(p.windowWidth, p.windowHeight);
};
