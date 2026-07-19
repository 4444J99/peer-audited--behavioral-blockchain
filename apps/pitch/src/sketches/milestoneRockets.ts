import p5 from 'p5';

export const milestoneRockets = (p: p5) => {
  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
  };

  p.draw = () => {
    p.clear();
    const w = p.width / 6;
    p.strokeWeight(2);

    for (let i = 0; i < 5; i++) {
      const x = w + i * w;
      const targetY = p.height - 120 - i * 50;

      // Trail
      p.stroke(60);
      p.line(x, p.height, x, targetY);

      // Booster particle
      const travel = p.height - targetY + 50;
      const py = p.height - ((p.frameCount * (1.5 + i * 0.4)) % travel);
      if (py > targetY) {
        p.fill(163, 230, 53);
        p.noStroke();
        p.circle(x, py, 8);
      }

      // Milestone node
      p.fill(20);
      p.stroke(163, 230, 53);
      p.strokeWeight(2);
      p.circle(x, targetY, 40);
      p.fill(255);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(13);
      p.text(`M${i + 1}`, x, targetY);
    }
  };

  p.windowResized = () => p.resizeCanvas(p.windowWidth, p.windowHeight);
};
