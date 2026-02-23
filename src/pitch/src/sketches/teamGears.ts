import p5 from 'p5';

export const teamGears = (p: p5) => {
  const drawGear = (
    cx: number,
    cy: number,
    r: number,
    teeth: number,
    speed: number,
    color: [number, number, number],
  ) => {
    p.push();
    p.translate(cx, cy);
    p.rotate(p.frameCount * speed);
    p.fill(color[0], color[1], color[2], 40);
    p.stroke(color[0], color[1], color[2]);
    p.strokeWeight(1.5);

    p.beginShape();
    for (let i = 0; i < 360; i += 360 / teeth) {
      const angle = p.radians(i);
      const nextAngle = p.radians(i + 360 / teeth / 2);
      p.vertex(p.cos(angle) * r, p.sin(angle) * r);
      p.vertex(p.cos(nextAngle) * (r + 12), p.sin(nextAngle) * (r + 12));
    }
    p.endShape(p.CLOSE);
    p.fill(15);
    p.noStroke();
    p.circle(0, 0, r / 2);
    p.pop();
  };

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
  };

  p.draw = () => {
    p.clear();
    const cx = p.width / 2;
    const cy = p.height / 2;
    const sz = Math.min(80, p.width * 0.08);

    drawGear(cx - sz, cy - sz * 0.6, sz, 16, 0.015, [163, 230, 53]);
    drawGear(cx + sz, cy - sz * 0.6, sz, 16, -0.015, [56, 189, 248]);
    drawGear(cx, cy + sz * 0.9, sz, 16, 0.015, [250, 204, 21]);
  };

  p.windowResized = () => p.resizeCanvas(p.windowWidth, p.windowHeight);
};
