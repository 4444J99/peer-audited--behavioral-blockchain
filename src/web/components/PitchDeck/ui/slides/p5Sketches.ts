import p5 from 'p5';

// Master sketch file containing the interactive, narrative animations for all 10 slides.
// These replace the broken HTML cards/grids.

export const sketchSlide1 = (p: p5) => {
  let particles: {x: number, y: number, vx: number, vy: number, tgtX: number, tgtY: number}[] = [];
  let font: p5.Font | null = null;

  // In instance mode, preload must be assigned before setup, but the type definition
  // in @types/p5 sometimes misses it on the instance itself. 
  // We can cast `p` to any to assign it, or handle loading in setup with callbacks.
  // We'll use loadFont in setup with a callback to be safe.
  
  p.setup = () => {
    p.createCanvas(p.windowWidth > 800 ? 800 : p.windowWidth, p.windowHeight > 600 ? 600 : p.windowHeight);
    
    p.loadFont('https://cdnjs.cloudflare.com/ajax/libs/topcoat/0.2.0/font/SourceCodePro-Bold.otf', 
      (loadedFont) => {
        font = loadedFont;
        // p5.js textToPoints returns an array of generic objects with x/y/alpha, we map it.
        let pts = font.textToPoints('STYX', p.width/2 - 180, p.height/2 + 50, { sampleFactor: 0.15, simplifyThreshold: 0 }) as {x: number, y: number}[];
        pts.forEach(pt => {
          particles.push({
             x: p.random(p.width), y: p.random(p.height),
             vx: 0, vy: 0,
             tgtX: pt.x, tgtY: pt.y
          });
        });
      },
      () => {
        // Fallback if font fails to load: precise geometric circle from chaos
        for(let i=0; i<200; i++) {
          let angle = p.map(i, 0, 200, 0, p.TWO_PI);
          particles.push({
             x: p.random(p.width), y: p.random(p.height),
             vx: 0, vy: 0,
             tgtX: p.width/2 + p.cos(angle) * 150, 
             tgtY: p.height/2 + p.sin(angle) * 150
          });
        }
      }
    );
  };

  p.draw = () => {
    p.clear();
    p.background(10, 10, 10, 0); // Transparent
    p.stroke(163, 230, 53, 200); // Lime-400
    p.strokeWeight(3);
    
    particles.forEach(pt => {
       // Magnetic pull toward target shape
       let forceX = pt.tgtX - pt.x;
       let forceY = pt.tgtY - pt.y;
       
       // Mouse repels particles to show chaos
       let dMouse = p.dist(p.mouseX, p.mouseY, pt.x, pt.y);
       if (dMouse < 100) {
         forceX -= (p.mouseX - pt.x) * 0.5;
         forceY -= (p.mouseY - pt.y) * 0.5;
       }

       pt.vx = p.lerp(pt.vx, forceX * 0.05, 0.1);
       pt.vy = p.lerp(pt.vy, forceY * 0.05, 0.1);
       
       pt.x += pt.vx;
       pt.y += pt.vy;
       
       p.point(pt.x, pt.y);
    });
  };
  p.windowResized = () => p.resizeCanvas(p.windowWidth > 800 ? 800 : p.windowWidth, p.windowHeight > 600 ? 600 : p.windowHeight);
};

export const sketchSlide2 = (p: p5) => {
  // Retention Curve drawing dynamically
  let points: {x: number, y: number}[] = [];
  let t = 0;
  
  p.setup = () => {
    p.createCanvas(p.windowWidth > 800 ? 800 : p.windowWidth, 400);
  };

  p.draw = () => {
    p.clear();
    
    // Draw Axis
    p.stroke(80); p.strokeWeight(2);
    p.line(50, 350, p.width - 50, 350); // X axis
    p.line(50, 50, 50, 350); // Y axis
    
    p.fill(150); p.noStroke(); p.textSize(12);
    p.text("100%", 10, 60);
    p.text("0%", 20, 350);
    p.text("Day 1", 50, 370);
    p.text("Day 30", p.width - 80, 370);

    // Bounded Rationality particles failing to stay high
    if (t < p.width - 100) {
       let x = 50 + t;
       // Exponential decay curve
       let y = p.map(p.exp(-t * 0.01), 1, 0, 50, 350) + p.random(-10, 10); 
       points.push({x: x, y: y});
       t += 2;
    } else {
       t = 0; points = []; // Restart loop
    }

    // Draw Curve
    p.noFill();
    p.stroke(248, 113, 113); // Red-400
    p.strokeWeight(4);
    p.beginShape();
    points.forEach(pt => p.vertex(pt.x, pt.y));
    p.endShape();
    
    // Draw dying off particles falling down
    p.stroke(248, 113, 113, 100);
    p.strokeWeight(2);
    if (points.length > 0) {
       let current = points[points.length-1];
       for(let i=0; i<5; i++) p.point(current.x + p.random(-20, 20), current.y + p.random(0, 50));
    }
  };
  p.windowResized = () => p.resizeCanvas(p.windowWidth > 800 ? 800 : p.windowWidth, 400);
};

export const sketchSlide3 = (p: p5) => {
  let stakes: {x:number, y:number, r:number, isBonus:boolean}[] = [];
  
  p.setup = () => {
    p.createCanvas(p.windowWidth > 800 ? 800 : p.windowWidth, p.windowHeight > 600 ? 600 : p.windowHeight);
    for(let i=0; i<50; i++) {
       stakes.push({
         x: p.random(p.width), y: p.random(p.height),
         r: p.random(5, 12),
         isBonus: p.random() > 0.8
       });
    }
  };

  p.draw = () => {
    p.clear();
    let cx = p.width / 2; let cy = p.height / 2;
    
    // Escrow Gravity Well
    p.noFill(); p.strokeWeight(1);
    for(let i=0; i<5; i++) {
        p.stroke(163, 230, 53, 50 - i*10); // Lime pulse
        p.circle(cx, cy, 100 + (p.frameCount % 50) + i*20);
    }
    
    p.strokeWeight(2);
    stakes.forEach(s => {
       if (s.isBonus) {
         // Endowed progress: rapid acceleration outward then reset
         s.x += (s.x - cx) * 0.05;
         s.y += (s.y - cy) * 0.05;
         p.fill(163, 230, 53); p.noStroke(); // Lime
         if (s.x < 0 || s.x > p.width || s.y < 0 || s.y > p.height) {
            s.x = cx + p.random(-10, 10); s.y = cy + p.random(-10, 10);
         }
       } else {
         // Escrow: pulled tightly to center
         s.x = p.lerp(s.x, cx, 0.02);
         s.y = p.lerp(s.y, cy, 0.02);
         p.fill(248, 113, 113); p.noStroke(); // Red
         
         // Randomly jump out to visually simulate "putting at risk"
         if (p.random() > 0.99) {
           s.x = p.random(p.width); s.y = p.random(p.height);
         }
       }
       p.circle(s.x, s.y, s.r);
    });
  };
  p.windowResized = () => p.resizeCanvas(p.windowWidth > 800 ? 800 : p.windowWidth, p.windowHeight > 600 ? 600 : p.windowHeight);
};

export const sketchSlide4 = (p: p5) => {
  let isFraud = false;
  let textAlpha = 0;
  
  p.setup = () => p.createCanvas(p.windowWidth > 800 ? 800 : p.windowWidth, p.windowHeight > 600 ? 600 : p.windowHeight);

  p.draw = () => {
    p.clear();
    let cx = p.width / 2; let cy = p.height / 2;
    let r = 150;
    
    // Draw connections
    p.stroke(50); p.strokeWeight(2);
    for(let i=0; i<3; i++) {
       let a = i * p.TWO_PI / 3 - p.PI/2;
       p.line(cx, cy, cx + p.cos(a)*r, cy + p.sin(a)*r);
    }
    
    // Central Node (User)
    p.fill(isFraud ? 248 : 50, isFraud ? 113 : 50, isFraud ? 113 : 50); // Red if fraud
    p.stroke(isFraud ? 248 : 200, isFraud ? 113 : 200, isFraud ? 113 : 200);
    p.circle(cx, cy, 60);
    p.fill(255); p.noStroke(); p.textAlign(p.CENTER, p.CENTER);
    p.text("USER", cx, cy);
    
    // 3 Auditor Nodes (Furies)
    for(let i=0; i<3; i++) {
       let a = i * p.TWO_PI / 3 - p.PI/2;
       let x = cx + p.cos(a)*r; let y = cy + p.sin(a)*r;
       
       p.fill(30);
       p.stroke(96, 165, 250); // Blue borders
       p.circle(x, y, 70);
       p.fill(255); p.noStroke();
       p.text("FURY", x, y);
       
       if (isFraud) {
          // Payout particles flowing from center to Furies
          let ptX = p.lerp(cx, x, (p.frameCount % 30) / 30);
          let ptY = p.lerp(cy, y, (p.frameCount % 30) / 30);
          p.fill(163, 230, 53); // Lime payouts
          p.circle(ptX + p.random(-5,5), ptY + p.random(-5,5), 8);
       }
    }

    p.fill(150); p.textSize(14);
    p.text("Hover over User node to simulate Fraud Detection", cx, p.height - 40);

    // Interaction
    let d = p.dist(p.mouseX, p.mouseY, cx, cy);
    if (d < 30) {
      isFraud = true;
      textAlpha = 255;
    } else {
      isFraud = false;
      textAlpha -= 5;
    }
    
    if(textAlpha > 0) {
       p.fill(248, 113, 113, textAlpha);
       p.textSize(24); p.textStyle(p.BOLD);
       p.text("FRAUD DETECTED: BOUNTY PAID", cx, cy - 100);
       p.textStyle(p.NORMAL);
    }
  };
  p.windowResized = () => p.resizeCanvas(p.windowWidth > 800 ? 800 : p.windowWidth, p.windowHeight > 600 ? 600 : p.windowHeight);
};

export const sketchSlide5 = (p: p5) => {
   // Minimalist geometric shield building itself
   p.setup = () => p.createCanvas(p.windowWidth > 800 ? 800 : p.windowWidth, p.windowHeight > 600 ? 600 : p.windowHeight);
   
   p.draw = () => {
     p.clear();
     let cx = p.width / 2; let cy = p.height / 2;
     let maxRadius = 200;
     
     // Draw the Aegis Shield
     p.noFill();
     p.strokeWeight(2);
     p.stroke(192, 132, 252, 150); // Purple
     
     p.beginShape();
     for(let a=0; a<p.TWO_PI; a+=p.PI/6) {
        let r = maxRadius + p.noise(a, p.frameCount*0.02) * 20;
        // The shield hard-stops at BMI 18.5 metaphorically
        if (r < maxRadius - 10) r = maxRadius - 10; 
        p.vertex(cx + p.cos(a)*r, cy + p.sin(a)*r);
     }
     p.endShape(p.CLOSE);
     
     // Inner core
     p.fill(192, 132, 252, 30);
     p.circle(cx, cy, maxRadius - 50);
     p.fill(255); p.noStroke(); p.textAlign(p.CENTER, p.CENTER);
     p.textSize(18); p.text("THE AEGIS PROTOCOL", cx, cy);
     
     // Outside chaos hitting the shield and vanishing
     p.stroke(248, 113, 113, 200); p.strokeWeight(3);
     for(let i=0; i<10; i++) {
        let a = p.random(p.TWO_PI);
        let dist = 300 - (p.frameCount*5 + i*50) % 150;
        if (dist > maxRadius + 20) {
           p.point(cx + p.cos(a)*dist, cy + p.sin(a)*dist);
        } else {
           // Flash when destroyed
           p.stroke(255); p.circle(cx + p.cos(a)*(maxRadius+20), cy + p.sin(a)*(maxRadius+20), 5);
        }
     }
   };
   p.windowResized = () => p.resizeCanvas(p.windowWidth > 800 ? 800 : p.windowWidth, p.windowHeight > 600 ? 600 : p.windowHeight);
};

export const sketchSlide6 = (p: p5) => {
   // Pipeline funneling from chaotic left (B2C) to ordered right grid (B2B)
   let users: {x:number, y:number}[] = [];
   p.setup = () => {
     p.createCanvas(p.windowWidth > 800 ? 800 : p.windowWidth, p.windowHeight > 600 ? 600 : p.windowHeight);
     for(let i=0; i<100; i++) users.push({x: p.random(0, 200), y: p.random(p.height)});
   };
   
   p.draw = () => {
      p.clear();
      
      // Draw B2B Grid on the right side
      p.stroke(163, 230, 53, 50); p.strokeWeight(1);
      for(let x = p.width/2; x < p.width; x += 40) {
         p.line(x, 0, x, p.height);
      }
      for(let y = 0; y < p.height; y += 40) {
         p.line(p.width/2, y, p.width, y);
      }
      
      p.textSize(24); p.fill(255, 100); p.noStroke();
      p.textAlign(p.LEFT, p.BOTTOM); p.text("Phase 1: B2C Chaos", 20, p.height - 20);
      p.textAlign(p.RIGHT, p.BOTTOM); p.text("Phase 2: B2B Order", p.width - 20, p.height - 20);

      // Funnel particles
      users.forEach(u => {
         // Move right
         u.x += p.random(2, 6);
         
         // If in the left half, chaotic Y movement
         if (u.x < p.width/2) {
            u.y += p.random(-10, 10);
            p.stroke(255, 150);
            p.circle(u.x, u.y, 4);
         } else {
            // Once they cross over, snap to the grid
            u.y = p.lerp(u.y, p.round(u.y/40)*40, 0.1); 
            p.stroke(163, 230, 53, 200); // Turn Lime
            p.rect(u.x, u.y-2, 8, 4); // Turn into enterprise data blocks
         }
         
         // Reset
         if (u.x > p.width) {
            u.x = 0; u.y = p.random(p.height);
         }
      });
   };
   p.windowResized = () => p.resizeCanvas(p.windowWidth > 800 ? 800 : p.windowWidth, p.windowHeight > 600 ? 600 : p.windowHeight);
};

export const sketchSlide7 = (p: p5) => {
  // Cascading block columns (Unit Economics)
  let drops: {col:number, y:number, isHouse:boolean}[] = [];
  let cols = 15;
  
  p.setup = () => {
    p.createCanvas(p.windowWidth > 800 ? 800 : p.windowWidth, p.windowHeight > 600 ? 600 : p.windowHeight);
    for(let i=0; i<50; i++) drops.push({ col: p.floor(p.random(cols)), y: p.random(p.height), isHouse: p.random() < 0.15 });
  };
  
  p.draw = () => {
     p.clear();
     let colW = p.width / cols;
     
     drops.forEach(d => {
        d.y += 5;
        if (d.y > p.height) { d.y = -20; d.col = p.floor(p.random(cols)); d.isHouse = p.random() < 0.15; }
        
        p.noStroke();
        if (d.isHouse) {
           p.fill(163, 230, 53); // 15% House Cut in bright lime
           p.rect(d.col * colW + 10, d.y, colW - 20, 20, 4);
        } else {
           p.fill(80); // Rest in dull gray to Furies
           p.rect(d.col * colW + 10, d.y, colW - 20, 10, 2);
        }
     });
     
     p.fill(255); p.textAlign(p.CENTER, p.CENTER);
     p.textSize(48); p.textStyle(p.BOLD);
     p.text("15% HOUSE CUT", p.width/2, p.height/2);
     p.textStyle(p.NORMAL);
  };
  p.windowResized = () => p.resizeCanvas(p.windowWidth > 800 ? 800 : p.windowWidth, p.windowHeight > 600 ? 600 : p.windowHeight);
};

export const sketchSlide8 = (p: p5) => {
   // Tech stack interconnected lightning nodes
   let nodes = [
     {x: 200, y: 150, n: "PostgreSQL"}, 
     {x: 600, y: 150, n: "BullMQ"}, 
     {x: 400, y: 350, n: "Cloudflare R2"},
     {x: 400, y: 500, n: "Open APIs"}
   ];
   
   p.setup = () => p.createCanvas(p.windowWidth > 800 ? 800 : p.windowWidth, p.windowHeight > 600 ? 600 : p.windowHeight);
   
   p.draw = () => {
      p.clear();
      p.stroke(251, 146, 60, 50); // Orange connections
      p.strokeWeight(2);
      
      // Draw jittery connections between all nodes
      for(let i=0; i<nodes.length; i++) {
         for(let j=i+1; j<nodes.length; j++) {
            p.beginShape();
            p.vertex(nodes[i].x, nodes[i].y);
            // Midpoint jitter
            let mx = (nodes[i].x + nodes[j].x)/2 + p.random(-20, 20);
            let my = (nodes[i].y + nodes[j].y)/2 + p.random(-20, 20);
            p.vertex(mx, my);
            p.vertex(nodes[j].x, nodes[j].y);
            p.endShape();
         }
      }
      
      // Draw Nodes
      p.fill(20); p.stroke(251, 146, 60); p.strokeWeight(3);
      nodes.forEach(n => {
         p.circle(n.x, n.y, 80);
         p.fill(255); p.noStroke(); p.textAlign(p.CENTER, p.CENTER);
         p.textSize(14); p.text(n.n, n.x, n.y);
         p.fill(20); p.stroke(251, 146, 60); // Reset for next loop
      });
   };
   p.windowResized = () => p.resizeCanvas(p.windowWidth > 800 ? 800 : p.windowWidth, p.windowHeight > 600 ? 600 : p.windowHeight);
};

export const sketchSlide9 = (p: p5) => {
   // Interlocking Gears (Team)
   p.setup = () => p.createCanvas(p.windowWidth > 800 ? 800 : p.windowWidth, p.windowHeight > 600 ? 600 : p.windowHeight);
   
   let drawGear = (cx:number, cy:number, r:number, teeth:number, speed:number, color: number[]) => {
      p.push();
      p.translate(cx, cy);
      p.rotate(p.frameCount * speed);
      p.fill(color[0], color[1], color[2], 50);
      p.stroke(color[0], color[1], color[2]);
      p.strokeWeight(2);
      
      p.beginShape();
      for(let i=0; i<360; i+= 360/teeth) {
         let angle = p.radians(i);
         let nextAngle = p.radians(i + 360/teeth/2);
         p.vertex(p.cos(angle)*r, p.sin(angle)*r);
         p.vertex(p.cos(nextAngle)*(r+15), p.sin(nextAngle)*(r+15));
      }
      p.endShape(p.CLOSE);
      p.fill(20); p.circle(0,0, r/2); // inner hole
      p.pop();
   };

   p.draw = () => {
      p.clear();
      let cx = p.width / 2; let cy = p.height / 2;
      
      // 3 deeply interlocked gears
      drawGear(cx - 80, cy - 50, 80, 16, 0.02, [163, 230, 53]); // Operator
      drawGear(cx + 80, cy - 50, 80, 16, -0.02, [56, 189, 248]); // Compliance
      drawGear(cx, cy + 85, 80, 16, 0.02, [250, 204, 21]); // Vision
      
      p.fill(255); p.noStroke(); p.textAlign(p.CENTER, p.CENTER);
      p.text("THE OPERATOR", cx - 80, cy - 50);
      p.text("COMPLIANCE", cx + 80, cy - 50);
      p.text("VISION", cx, cy + 85);
   };
   p.windowResized = () => p.resizeCanvas(p.windowWidth > 800 ? 800 : p.windowWidth, p.windowHeight > 600 ? 600 : p.windowHeight);
};

export const sketchSlide10 = (p: p5) => {
   // Milestones rocketing up
   let m = [5, 4, 3, 2, 1]; // Months
   p.setup = () => p.createCanvas(p.windowWidth > 800 ? 800 : p.windowWidth, p.windowHeight > 600 ? 600 : p.windowHeight);
   
   p.draw = () => {
      p.clear();
      p.strokeWeight(2);
      
      let w = p.width / 6;
      for(let i=0; i<5; i++) {
         let x = w + i*w;
         let targetY = p.height - 100 - (i*50);
         
         // Launch trail
         p.stroke(80);
         p.line(x, p.height, x, targetY);
         
         // Animated booster particle
         let py = p.height - (p.frameCount * (1 + i*0.5)) % (p.height - targetY + 50);
         if (py > targetY) {
            p.fill(163, 230, 53); p.noStroke();
            p.circle(x, py, 10);
         }
         
         // Milestone node
         p.fill(20); p.stroke(163, 230, 53); p.strokeWeight(3);
         p.circle(x, targetY, 40);
         p.fill(255); p.noStroke(); p.textAlign(p.CENTER, p.CENTER);
         p.text("M"+(i+1), x, targetY);
      }
   };
   p.windowResized = () => p.resizeCanvas(p.windowWidth > 800 ? 800 : p.windowWidth, p.windowHeight > 600 ? 600 : p.windowHeight);
};
