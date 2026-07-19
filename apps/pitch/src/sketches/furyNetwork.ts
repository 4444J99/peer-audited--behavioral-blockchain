import p5 from 'p5';

export const furyNetwork = (p: p5) => {
  let isFraud = false;
  let flashAlpha = 0;

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
  };

  p.draw = () => {
    p.clear();
    const cx = p.width / 2;
    const cy = p.height / 2;
    const r = Math.min(180, p.width * 0.2);

    // Connection lines
    p.stroke(50);
    p.strokeWeight(2);
    for (let i = 0; i < 3; i++) {
      const a = (i * p.TWO_PI) / 3 - p.PI / 2;
      p.line(cx, cy, cx + p.cos(a) * r, cy + p.sin(a) * r);
    }

    // Central node (user)
    p.fill(isFraud ? p.color(248, 113, 113) : p.color(40, 40, 40));
    p.stroke(isFraud ? p.color(248, 113, 113) : p.color(180, 180, 180));
    p.strokeWeight(2);
    p.circle(cx, cy, 60);
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(13);
    p.text('USER', cx, cy);

    // 3 Fury nodes
    for (let i = 0; i < 3; i++) {
      const a = (i * p.TWO_PI) / 3 - p.PI / 2;
      const x = cx + p.cos(a) * r;
      const y = cy + p.sin(a) * r;

      p.fill(25);
      p.stroke(96, 165, 250);
      p.strokeWeight(2);
      p.circle(x, y, 70);
      p.fill(255);
      p.noStroke();
      p.textSize(12);
      p.text('FURY', x, y);

      // Bounty particles on fraud
      if (isFraud) {
        const progress = (p.frameCount % 30) / 30;
        const ptX = p.lerp(cx, x, progress);
        const ptY = p.lerp(cy, y, progress);
        p.fill(163, 230, 53);
        p.noStroke();
        p.circle(ptX + p.random(-4, 4), ptY + p.random(-4, 4), 7);
      }
    }

    // Flash text
    if (flashAlpha > 0) {
      p.fill(248, 113, 113, flashAlpha);
      p.textSize(18);
      p.textStyle(p.BOLD);
      p.textAlign(p.CENTER, p.CENTER);
      p.text('FRAUD DETECTED: BOUNTY PAID', cx, cy - r - 40);
      p.textStyle(p.NORMAL);
      flashAlpha -= 4;
    }

    // Mouse interaction
    const d = p.dist(p.mouseX, p.mouseY, cx, cy);
    if (d < 35) {
      isFraud = true;
      flashAlpha = 255;
    } else {
      isFraud = false;
    }
  };

  p.windowResized = () => p.resizeCanvas(p.windowWidth, p.windowHeight);
};
