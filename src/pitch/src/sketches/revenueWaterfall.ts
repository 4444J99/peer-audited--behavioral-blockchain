import p5 from 'p5';

export const revenueWaterfall = (p: p5) => {
  const drops: { col: number; y: number; isHouse: boolean }[] = [];
  const cols = 18;

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    for (let i = 0; i < 70; i++) {
      drops.push({
        col: p.floor(p.random(cols)),
        y: p.random(p.height),
        isHouse: p.random() < 0.15,
      });
    }
  };

  p.draw = () => {
    p.clear();
    const colW = p.width / cols;

    for (const d of drops) {
      d.y += 4;
      if (d.y > p.height) {
        d.y = -20;
        d.col = p.floor(p.random(cols));
        d.isHouse = p.random() < 0.15;
      }

      p.noStroke();
      if (d.isHouse) {
        p.fill(163, 230, 53, 200);
        p.rect(d.col * colW + 8, d.y, colW - 16, 18, 3);
      } else {
        p.fill(70);
        p.rect(d.col * colW + 8, d.y, colW - 16, 8, 2);
      }
    }
  };

  p.windowResized = () => p.resizeCanvas(p.windowWidth, p.windowHeight);
};
