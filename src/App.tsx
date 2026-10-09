import { useEffect, useRef, useState, useCallback } from 'react';

type GameState = 'menu' | 'playing' | 'paused' | 'levelComplete' | 'gameOver' | 'victory';

type Level = {
  id: number;
  platforms: { x: number; y: number; w: number; h: number; color: string }[];
  enemies: { x: number; y: number; vx: number; range: number; start: number; color: string }[];
  gems: { x: number; y: number; collected: boolean }[];
  key: { x: number; y: number; collected: boolean };
  exit: { x: number; y: number };
  spawn: { x: number; y: number };
  bgGradient: string;
};

const W = 960;
const H = 540;

const LEVELS: Level[] = [
  {
    id: 1,
    bgGradient: 'linear-gradient(180deg, #2d1b4e 0%, #4a2c6e 40%, #7c3fa8 100%)',
    platforms: [
      { x: 60, y: 420, w: 200, h: 30, color: '#2ec4b6' },
      { x: 320, y: 340, w: 140, h: 30, color: '#ff4fa3' },
      { x: 520, y: 440, w: 260, h: 30, color: '#ffd166' },
      { x: 160, y: 250, w: 160, h: 30, color: '#c084fc' },
      { x: 400, y: 150, w: 120, h: 30, color: '#2ec4b6' },
      { x: 720, y: 320, w: 140, h: 30, color: '#ff4fa3' },
    ],
    enemies: [
      { x: 360, y: 310, vx: 1.2, range: 120, start: 360, color: '#c084fc' },
      { x: 560, y: 400, vx: 1.5, range: 120, start: 560, color: '#c084fc' },
    ],
    gems: [
      { x: 170, y: 210, collected: false },
      { x: 400, y: 110, collected: false },
      { x: 580, y: 400, collected: false },
      { x: 780, y: 280, collected: false },
    ],
    key: { x: 400, y: 110, collected: false },
    exit: { x: 820, y: 260 },
    spawn: { x: 80, y: 390 },
  },
  {
    id: 2,
    bgGradient: 'linear-gradient(180deg, #1a0b2e 0%, #2d1452 40%, #4a2c7a 100%)',
    platforms: [
      { x: 40, y: 460, w: 300, h: 30, color: '#2ec4b6' },
      { x: 400, y: 370, w: 180, h: 30, color: '#ffd166' },
      { x: 660, y: 290, w: 200, h: 30, color: '#ff4fa3' },
      { x: 180, y: 220, w: 140, h: 30, color: '#c084fc' },
      { x: 480, y: 150, w: 160, h: 30, color: '#2ec4b6' },
      { x: 720, y: 420, w: 200, h: 30, color: '#ffd166' },
    ],
    enemies: [
      { x: 450, y: 340, vx: 1.8, range: 140, start: 450, color: '#c084fc' },
      { x: 720, y: 400, vx: -1.4, range: 120, start: 720, color: '#ff4fa3' },
      { x: 220, y: 190, vx: 1.1, range: 100, start: 220, color: '#c084fc' },
    ],
    gems: [
      { x: 480, y: 320, collected: false },
      { x: 720, y: 250, collected: false },
      { x: 250, y: 180, collected: false },
      { x: 540, y: 110, collected: false },
      { x: 780, y: 380, collected: false },
    ],
    key: { x: 740, y: 250, collected: false },
    exit: { x: 110, y: 420 },
    spawn: { x: 60, y: 420 },
  },
  {
    id: 3,
    bgGradient: 'linear-gradient(180deg, #0f0018 0%, #2d0b3d 30%, #5a1a7d 70%, #7c3fa8 100%)',
    platforms: [
      { x: 50, y: 460, w: 340, h: 30, color: '#2ec4b6' },
      { x: 460, y: 360, w: 160, h: 30, color: '#ff4fa3' },
      { x: 680, y: 260, w: 220, h: 30, color: '#ffd166' },
      { x: 200, y: 180, w: 160, h: 30, color: '#c084fc' },
      { x: 420, y: 100, w: 140, h: 30, color: '#2ec4b6' },
      { x: 60, y: 270, w: 120, h: 30, color: '#ffd166' },
      { x: 800, y: 380, w: 140, h: 30, color: '#ff4fa3' },
    ],
    enemies: [
      { x: 500, y: 330, vx: 1.6, range: 130, start: 500, color: '#c084fc' },
      { x: 240, y: 150, vx: 1.3, range: 110, start: 240, color: '#ff4fa3' },
      { x: 720, y: 230, vx: -1.8, range: 140, start: 720, color: '#c084fc' },
      { x: 880, y: 350, vx: -1.2, range: 100, start: 880, color: '#ff4fa3' },
    ],
    gems: [
      { x: 260, y: 140, collected: false },
      { x: 480, y: 60, collected: false },
      { x: 760, y: 220, collected: false },
      { x: 120, y: 230, collected: false },
      { x: 880, y: 340, collected: false },
    ],
    key: { x: 520, y: 60, collected: false },
    exit: { x: 850, y: 330 },
    spawn: { x: 70, y: 420 },
  },
];

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const keys = useRef<Set<string>>(new Set());
  const raf = useRef<number>(0);

  const [gameState, setGameState] = useState<GameState>('menu');
  const [levelIndex, setLevelIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [bubblesUsed, setBubblesUsed] = useState(0);
  const [showTutorial, setShowTutorial] = useState(true);

  // Game objects refs
  const player = useRef({
    x: 80,
    y: 390,
    vx: 0,
    vy: 0,
    w: 28,
    h: 36,
    grounded: false,
    facing: 1,
    anim: 0,
    dead: false,
  });
  const bubbles = useRef<{ x: number; y: number; vx: number; vy: number; life: number; color: string }[]>([]);
  const particles = useRef<{ x: number; y: number; vx: number; vy: number; life: number; color: string; size: number }[]>([]);
  const levelData = useRef<Level | null>(null);

  const resetLevel = useCallback((lvl: Level) => {
    player.current = {
      x: lvl.spawn.x,
      y: lvl.spawn.y,
      vx: 0,
      vy: 0,
      w: 28,
      h: 36,
      grounded: false,
      facing: 1,
      anim: 0,
      dead: false,
    };
    bubbles.current = [];
    particles.current = [];
    levelData.current = JSON.parse(JSON.stringify(lvl)) as Level;
  }, []);

  const spawnParticles = (x: number, y: number, color: string, count = 8) => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 1.5 + Math.random() * 2.5;
      particles.current.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30 + Math.random() * 20,
        color,
        size: 3 + Math.random() * 4,
      });
    }
  };

  const spawnBubble = (dir: number) => {
    const p = player.current;
    if (p.dead) return;
    bubbles.current.push({
      x: p.x + p.w / 2 + dir * 12,
      y: p.y + p.h / 2 - 6,
      vx: dir * 7,
      vy: -1 + Math.random() * 2,
      life: 60,
      color: '#ff4fa3',
    });
    setBubblesUsed((s) => s + 1);
  };

  // Main game loop
  useEffect(() => {
    if (gameState !== 'playing') return;
    if (!levelData.current) resetLevel(LEVELS[levelIndex]);

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    let lastFire = 0;
    let prevTime = performance.now();

    const tick = (time: number) => {
      const dt = Math.min((time - prevTime) / 16.67, 3); // normalized
      prevTime = time;

      const ctrl = keys.current;
      const p = player.current;
      const lvl = levelData.current!;

      // Movement with dt
      if (ctrl.has('ArrowLeft') || ctrl.has('a')) { p.vx = -3.2; p.facing = -1; }
      else if (ctrl.has('ArrowRight') || ctrl.has('d')) { p.vx = 3.2; p.facing = 1; }
      else { p.vx = 0; }

      // Jump
      if ((ctrl.has('ArrowUp') || ctrl.has('w') || ctrl.has(' ') || ctrl.has('k')) && p.grounded && !p.dead && time - lastFire > 200) {
        p.vy = -10.5;
        p.grounded = false;
        lastFire = time;
      }

      // Shoot bubble
      if ((ctrl.has('Shift') || ctrl.has('Enter') || ctrl.has('j')) && !p.dead) {
        if (time - lastFire > 220) {
          spawnBubble(p.facing);
          lastFire = time;
        }
      }

      // Physics
      if (!p.dead) {
        p.vy += 0.5; // gravity
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // Bounds
        if (p.x < 0) p.x = 0;
        if (p.x + p.w > W) p.x = W - p.w;

        // Platforms collision
        p.grounded = false;
        for (const plat of lvl.platforms) {
          if (p.x + p.w > plat.x && p.x < plat.x + plat.w && p.y + p.h > plat.y && p.y + p.h < plat.y + plat.h + p.vy * dt + 4 && p.vy >= 0) {
            p.y = plat.y - p.h;
            p.vy = 0;
            p.grounded = true;
          }
        }

        // Fall death
        if (p.y > H + 40) {
          p.dead = true;
          spawnParticles(p.x + 14, p.y, '#ffd166', 20);
          setLives((l) => {
            const nl = l - 1;
            if (nl <= 0) {
              setGameState('gameOver');
              return 0;
            }
            // Respawn after delay handled by effect below
            return nl;
          });
          // Respawn timer handled by separate effect
        }

        // Enemy collision
        for (const en of lvl.enemies) {
          if (p.x + p.w > en.x && p.x < en.x + 28 && p.y + p.h > en.y && p.y < en.y + 28) {
            if (!p.dead) {
              p.dead = true;
              spawnParticles(p.x + 14, p.y + 14, '#ff4fa3', 15);
              setLives((l) => {
                const nl = l - 1;
                if (nl <= 0) {
                  setGameState('gameOver');
                  return 0;
                }
                return nl;
              });
            }
          }
        }

        // Gem collection
        for (const gem of lvl.gems) {
          if (!gem.collected && p.x + p.w > gem.x && p.x < gem.x + 20 && p.y + p.h > gem.y && p.y < gem.y + 20) {
            gem.collected = true;
            spawnParticles(gem.x + 10, gem.y + 10, '#ffd166', 10);
            setScore((s) => s + 150);
          }
        }

        // Key collection
        if (!lvl.key.collected && p.x + p.w > lvl.key.x && p.x < lvl.key.x + 28 && p.y + p.h > lvl.key.y && p.y < lvl.key.y + 28) {
          lvl.key.collected = true;
          spawnParticles(lvl.key.x + 14, lvl.key.y + 14, '#ffd166', 12);
          setScore((s) => s + 300);
        }

        // Exit
        if (lvl.key.collected && p.x + p.w > lvl.exit.x && p.x < lvl.exit.x + 48 && p.y + p.h > lvl.exit.y && p.y < lvl.exit.y + 48) {
          setGameState('levelComplete');
          spawnParticles(lvl.exit.x + 24, lvl.exit.y + 24, '#ff4fa3', 30);
        }
      }

      // Bubbles update
      for (let i = bubbles.current.length - 1; i >= 0; i--) {
        const b = bubbles.current[i];
        b.x += b.vx;
        b.y += b.vy;
        b.life--;
        if (b.life <= 0) {
          bubbles.current.splice(i, 1);
          continue;
        }
        // Hit enemy
        for (const en of lvl.enemies) {
          if (b.x > en.x && b.x < en.x + 28 && b.y > en.y && b.y < en.y + 28) {
            bubbles.current.splice(i, 1);
            spawnParticles(en.x + 14, en.y + 14, en.color, 12);
            setScore((s) => s + 250);
            // Reset enemy position slightly or just leave it defeated? Let's respawn later by resetting start
            en.start = en.x + Math.random() * 60 - 30;
            break;
          }
        }
        // Hit platform
        for (const plat of lvl.platforms) {
          if (b.x > plat.x && b.x < plat.x + plat.w && b.y > plat.y && b.y < plat.y + plat.h) {
            bubbles.current.splice(i, 1);
            spawnParticles(b.x, b.y, b.color, 6);
            break;
          }
        }
        // Boundaries
        if (b.x < -20 || b.x > W + 20 || b.y < -20 || b.y > H + 20) {
          bubbles.current.splice(i, 1);
        }
      }

      // Render
      // (Render code moved above; but for consistency we render inside loop)
      // Actually to avoid double draw, I'll put render at top of loop and call render at end
      // Wait I already put render at start; I need to redraw with updated positions.
      // For simplicity I'll redraw everything after updates.
      // To simplify, I'll create a separate renderSection and call at end.
      // Given the complexity, let's just redraw after updates by copying render block below.

      // Redraw with updated state
      ctx.save();
      // Clear
      ctx.fillStyle = lvl.bgGradient;
      ctx.fillRect(0, 0, W, H);

      // Background decorative orbs
      const t = Date.now() / 1000;
      for (let i = 0; i < 5; i++) {
        const cx = 120 + i * 170 + Math.sin(t + i) * 30;
        const cy = 60 + Math.cos(t * 0.7 + i * 1.3) * 40;
        const r = 30 + Math.sin(t * 2 + i) * 10;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, 'rgba(255,255,255,0.08)');
        g.addColorStop(0.6, 'rgba(255,79,163,0.15)');
        g.addColorStop(1, 'rgba(255,79,163,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Platforms
      for (const plat of lvl.platforms) {
        const grad = ctx.createLinearGradient(plat.x, plat.y, plat.x, plat.y + plat.h);
        grad.addColorStop(0, plat.color);
        grad.addColorStop(0.4, '#fff');
        grad.addColorStop(1, plat.color);
        ctx.fillStyle = grad;
        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillRect(plat.x + 4, plat.y + 4, plat.w - 8, 6);
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = 2;
        ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
      }

      // Enemies
      for (const en of lvl.enemies) {
        const bob = Math.sin(Date.now() / 200 + en.start * 0.1) * 3;
        const ex = en.x;
        const ey = en.y + bob;
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(ex + 14, ey + 24, 14, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        const eg = ctx.createRadialGradient(ex + 14, ey + 12, 4, ex + 14, ey + 12, 24);
        eg.addColorStop(0, '#fff');
        eg.addColorStop(0.3, en.color);
        eg.addColorStop(1, '#3d0854');
        ctx.fillStyle = eg;
        ctx.beginPath();
        ctx.arc(ex + 14, ey + 10, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(ex + 9, ey + 7, 4, 0, Math.PI * 2);
        ctx.arc(ex + 19, ey + 7, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#3d0854';
        ctx.beginPath();
        ctx.arc(ex + 10, ey + 7, 1.5, 0, Math.PI * 2);
        ctx.arc(ex + 20, ey + 7, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(ex + 14, ey + 13, 5, 0.2, Math.PI - 0.2);
        ctx.stroke();
      }

      // Gems
      for (const gem of lvl.gems) {
        if (gem.collected) continue;
        const cx = gem.x + 10;
        const cy = gem.y + 10;
        const gl = ctx.createRadialGradient(cx, cy, 0, cx, cy, 24);
        gl.addColorStop(0, 'rgba(255,209,102,0.7)');
        gl.addColorStop(0.5, 'rgba(255,209,102,0.2)');
        gl.addColorStop(1, 'rgba(255,209,102,0)');
        ctx.fillStyle = gl;
        ctx.beginPath();
        ctx.arc(cx, cy, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffd166';
        ctx.beginPath();
        ctx.moveTo(cx, cy - 12);
        ctx.lineTo(cx + 12, cy);
        ctx.lineTo(cx, cy + 12);
        ctx.lineTo(cx - 12, cy);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(cx, cy - 6);
        ctx.lineTo(cx + 6, cy);
        ctx.lineTo(cx, cy + 6);
        ctx.lineTo(cx - 6, cy);
        ctx.closePath();
        ctx.fill();
      }

      // Key
      const k = lvl.key;
      if (!k.collected) {
        const cx = k.x + 14;
        const cy = k.y + 14;
        const gl = ctx.createRadialGradient(cx, cy, 0, cx, cy, 24);
        gl.addColorStop(0, 'rgba(255,215,0,0.8)');
        gl.addColorStop(1, 'rgba(255,215,0,0)');
        ctx.fillStyle = gl;
        ctx.beginPath();
        ctx.arc(cx, cy, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffd166';
        ctx.fillRect(cx - 4, cy - 8, 18, 14);
        ctx.beginPath();
        ctx.arc(cx + 10, cy - 2, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a0b2e';
        ctx.beginPath();
        ctx.arc(cx + 14, cy - 2, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillRect(cx + 12, cy + 5, 3, 3);
        ctx.fillRect(cx + 16, cy + 5, 3, 3);
      }

      // Exit
      const ex = lvl.exit;
      const etime = Date.now() / 500;
      const ringR = 22 + Math.sin(etime) * 5;
      const gradExit = ctx.createRadialGradient(ex.x + 24, ex.y + 24, 5, ex.x + 24, ex.y + 24, 30);
      gradExit.addColorStop(0, 'rgba(255,255,255,0.7)');
      gradExit.addColorStop(0.4, 'rgba(255,79,163,0.5)');
      gradExit.addColorStop(1, 'rgba(255,79,163,0)');
      ctx.fillStyle = gradExit;
      ctx.beginPath();
      ctx.arc(ex.x + 24, ex.y + 24, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ff4fa3';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(ex.x + 24, ex.y + 24, ringR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(ex.x + 24, ex.y + 24, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff4fa3';
      ctx.beginPath();
      ctx.arc(ex.x + 24, ex.y + 24, 8, 0, Math.PI * 2);
      ctx.fill();

      // Player draw
      if (!p.dead) {
        const bob = Math.sin(p.anim) * 2;
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.ellipse(p.x + 14, p.y + 36 + bob, 14, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        const bodyGrad = ctx.createRadialGradient(p.x + 14, p.y + 12, 3, p.x + 14, p.y + 18, 18);
        bodyGrad.addColorStop(0, '#fff0b3');
        bodyGrad.addColorStop(0.5, '#ffd166');
        bodyGrad.addColorStop(1, '#f5a623');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.roundRect(p.x + 4, p.y + 6 + bob, 20, 22, 10);
        ctx.fill();
        ctx.fillStyle = '#fff0b3';
        ctx.beginPath();
        ctx.arc(p.x + 14, p.y + 2 + bob, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffd166';
        ctx.beginPath();
        ctx.arc(p.x + 2, p.y + 8 + bob, 5, 0, Math.PI * 2);
        ctx.arc(p.x + 26, p.y + 8 + bob, 5, 0, Math.PI * 2);
        ctx.fill();
        const eyeOff = p.facing === 1 ? 4 : -4;
        ctx.fillStyle = '#1a0b2e';
        ctx.beginPath();
        ctx.arc(p.x + 10 + eyeOff, p.y + 2 + bob, 3, 0, Math.PI * 2);
        ctx.arc(p.x + 18 + eyeOff, p.y + 2 + bob, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(p.x + 11 + eyeOff, p.y + 1 + bob, 1, 0, Math.PI * 2);
        ctx.arc(p.x + 19 + eyeOff, p.y + 1 + bob, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,100,150,0.35)';
        ctx.beginPath();
        ctx.arc(p.x + 6 + eyeOff, p.y + 6 + bob, 3, 0, Math.PI * 2);
        ctx.arc(p.x + 22 + eyeOff, p.y + 6 + bob, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#1a0b2e';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.x + 14, p.y + 7 + bob, 3, 0.2, Math.PI - 0.2);
        ctx.stroke();
        ctx.fillStyle = '#f5a623';
        ctx.fillRect(p.x + 6, p.y + 27 + bob, 6, 7);
        ctx.fillRect(p.x + 16, p.y + 27 + bob, 6, 7);
      } else {
        // Death animation: falling pieces
        // Handled by particles already
      }

      // Bubbles
      for (const b of bubbles.current) {
        const gl = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, 16);
        gl.addColorStop(0, 'rgba(255,255,255,0.9)');
        gl.addColorStop(0.3, b.color);
        gl.addColorStop(1, 'rgba(255,79,163,0)');
        ctx.fillStyle = gl;
        ctx.beginPath();
        ctx.arc(b.x, b.y, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(b.x, b.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.beginPath();
        ctx.arc(b.x - 2, b.y - 2, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Particles
      for (let i = particles.current.length - 1; i >= 0; i--) {
        const pt = particles.current[i];
        pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.06; pt.life--;
        if (pt.life <= 0) { particles.current.splice(i, 1); continue; }
        ctx.globalAlpha = pt.life / 50;
        ctx.fillStyle = pt.color;
        ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
        ctx.globalAlpha = 1;
      }

      // HUD
      ctx.fillStyle = 'rgba(13,2,33,0.3)';
      ctx.fillRect(0, 0, W, 42);
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(0, 42, W, 2);
      ctx.font = 'bold 14px "Orbitron", sans-serif';
      ctx.fillStyle = '#ffd166';
      ctx.textAlign = 'left';
      ctx.fillText(`NÍVEL ${lvl.id}  •  PONTOS ${score}`, 14, 26);
      ctx.fillStyle = '#ff4fa3';
      ctx.fillText(`❤️ ${lives}  •  BOLHAS ${bubblesUsed}`, 14, 44);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'right';
      ctx.fillText('WASD / SETAS + ESPAÇO', W - 14, 26);
      ctx.fillText('ESC para pausar', W - 14, 44);

      ctx.restore();

      raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, levelIndex]);

  // Handle respawn after death with delay
  useEffect(() => {
    if (gameState !== 'playing') return;
    if (player.current.dead) {
      const timer = setTimeout(() => {
        const lvl = levelData.current!;
        player.current.y = lvl.spawn.y;
        player.current.x = lvl.spawn.x;
        player.current.vy = 0;
        player.current.vx = 0;
        player.current.grounded = false;
        player.current.dead = false;
        player.current.anim = 0;
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [gameState, lives]);

  // Keyboard inputs
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      keys.current.add(e.key);
      if (e.key === 'Escape' || e.key === 'p') {
        e.preventDefault();
        if (gameState === 'playing') setGameState('paused');
        else if (gameState === 'paused') setGameState('playing');
      }
      if (e.key === ' ' && gameState === 'menu') {
        e.preventDefault();
        startGame();
      }
      if (e.key === 'r' || e.key === 'R') {
        if (gameState === 'gameOver' || gameState === 'victory') {
          startGame();
        }
      }
    };
    const onUp = (e: KeyboardEvent) => keys.current.delete(e.key);
    window.addEventListener('keydown', onDown, { passive: false });
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [gameState]);

  const startGame = () => {
    setLevelIndex(0);
    setScore(0);
    setLives(3);
    setBubblesUsed(0);
    resetLevel(LEVELS[0]);
    setGameState('playing');
    setShowTutorial(false);
  };

  const goNextLevel = () => {
    const next = levelIndex + 1;
    if (next >= LEVELS.length) {
      setGameState('victory');
    } else {
      setLevelIndex(next);
      setScore((s) => s + 500);
      resetLevel(LEVELS[next]);
      setGameState('playing');
    }
  };

  // Touch controls
  const handleTouchMove = (dir: number) => {
    if (gameState !== 'playing') return;
    keys.current.add(dir === -1 ? 'ArrowLeft' : 'ArrowRight');
    keys.current.delete(dir === -1 ? 'ArrowRight' : 'ArrowLeft');
  };

  const handleJump = () => {
    if (gameState === 'playing') {
      keys.current.add(' ');
      setTimeout(() => keys.current.delete(' '), 100);
    }
  };

  const handleShoot = () => {
    if (gameState === 'playing') {
      keys.current.add('Shift');
      setTimeout(() => keys.current.delete('Shift'), 150);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-screen overflow-hidden bg-void scanlines flex items-center justify-center select-none">
      {/* Background decorative gradient */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 20%, rgba(192,132,252,0.15), transparent 60%)' }} />

      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="rounded-2xl shadow-[0_0_60px_rgba(255,79,163,0.35),0_0_120px_rgba(192,132,252,0.25)] border border-white/10 bg-ink/60 backdrop-blur-[2px] z-10"
      />

      {/* Menu overlay */}
      {gameState === 'menu' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-void/80 backdrop-blur-md p-6">
          <div className="text-center space-y-6 max-w-xl">
            <h1 className="display-text text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-bubble-soft via-bubble to-phantom glow-text leading-tight">
              BUBBLE BOOST
            </h1>
            <div className="flex items-center justify-center gap-3 text-gold text-sm md:text-xl font-display tracking-widest">
              <span>63</span>
              <span className="w-8 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />
              <span>EDITION</span>
            </div>
            <p className="text-white/70 text-base md:text-lg font-body leading-relaxed max-w-md mx-auto">
              Ajude o Luki a resgatar seus amigos no Reino das Sombras. Use suas <span className="text-bubble font-semibold">Bolhas Mágicas</span>, colete <span className="text-gold font-semibold">Gemas</span> e encontre a <span className="text-phantom font-semibold">Chave</span> para abrir a saída.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={startGame} className="px-8 py-3 rounded-full bg-gradient-to-br from-bubble to-phantom text-white font-display font-bold text-lg shadow-[0_0_30px_rgba(255,79,163,0.5)] hover:scale-105 transition-transform active:scale-95">JOGAR</button>
              <button onClick={() => setShowTutorial(!showTutorial)} className="px-6 py-3 rounded-full bg-white/10 text-white font-display font-bold text-lg border border-white/20 hover:bg-white/15 transition">COMO JOGAR</button>
            </div>
            {showTutorial && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-sm text-white/80 text-left space-y-2 backdrop-blur-sm">
                <h3 className="font-display text-gold text-base">Controles</h3>
                <p>• <strong className="text-bubble">WASD / Setas</strong> — Mover</p>
                <p>• <strong className="text-gold">Espaço / W / K</strong> — Pular</p>
                <p>• <strong className="text-phantom">Shift / J / Enter</strong> — Atirar Bolha</p>
                <p>• <strong className="text-white/60">ESC / P</strong> — Pausar</p>
                <p>• Derrote os <strong className="text-phantom">Fantasmas</strong> com bolhas, colete a <strong className="text-gold">Chave</strong> e saia pelo portal!</p>
              </div>
            )}
          </div>
          <div className="fixed bottom-4 text-white/30 text-xs font-body">BUBBLE BOOST © 63 EDITION — CRIADO COM REACT + CANVAS</div>
        </div>
      )}

      {/* Paused */}
      {gameState === 'paused' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-void/70 backdrop-blur-md">
          <div className="text-center space-y-4">
            <h2 className="display-text text-5xl text-white glow-text">PAUSADO</h2>
            <p className="text-white/60">Pressione ESC ou P para continuar</p>
            <button onClick={() => setGameState('playing')} className="px-8 py-3 rounded-full bg-gradient-to-br from-bubble to-phantom text-white font-display font-bold shadow-lg hover:scale-105 transition">CONTINUAR</button>
          </div>
        </div>
      )}

      {/* Level Complete */}
      {gameState === 'levelComplete' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-void/80 backdrop-blur-md p-6">
          <div className="text-center space-y-4 animate-[fadeIn_0.5s_ease]">
            <h2 className="display-text text-5xl md:text-7xl text-transparent bg-clip-text bg-gradient-to-b from-gold via-gold-soft to-bubble glow-gold">NÍVEL COMPLETADO!</h2>
            <p className="text-white/70 text-xl font-display">Bônus de Nível: <span className="text-gold font-bold">+500</span></p>
            <div className="flex gap-3 justify-center pt-2">
              <button onClick={goNextLevel} className="px-8 py-3 rounded-full bg-gradient-to-br from-gold to-amber-400 text-ink font-display font-bold text-lg shadow-[0_0_30px_rgba(255,209,102,0.5)] hover:scale-105 transition-transform">PRÓXIMO NÍVEL</button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over */}
      {gameState === 'gameOver' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-void/90 backdrop-blur-md p-6">
          <div className="text-center space-y-4">
            <h2 className="display-text text-5xl md:text-7xl text-red-400 glow-text">GAME OVER</h2>
            <p className="text-white/70 text-xl">Luki perdeu todas as vidas.</p>
            <p className="text-gold font-display text-2xl">Pontuação Final: <strong>{score}</strong></p>
            <button onClick={startGame} className="px-8 py-3 rounded-full bg-gradient-to-br from-bubble to-phantom text-white font-display font-bold text-xl shadow-lg hover:scale-105 transition">TENTAR NOVAMENTE</button>
          </div>
        </div>
      )}

      {/* Victory */}
      {gameState === 'victory' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-gradient-to-b from-void via-[#2d1452] to-void p-6">
          <div className="text-center space-y-6 animate-[fadeIn_0.6s_ease]">
            <div className="text-6xl md:text-9xl animate-bounce">🎉</div>
            <h2 className="display-text text-5xl md:text-8xl text-transparent bg-clip-text bg-gradient-to-b from-gold via-gold-soft to-amber-300 glow-gold">VICTORY!</h2>
            <p className="text-white/80 text-xl md:text-2xl font-body max-w-md mx-auto">Você resgatou todos os amigos do Luki e derrotou os fantasmas do Reino das Sombras!</p>
            <div className="bg-white/10 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
              <div className="font-display text-3xl text-gold">Pontuação Final</div>
              <div className="font-pixel text-2xl text-white mt-2">{score}</div>
              <div className="text-white/50 text-sm mt-1">Bolhas usadas: {bubblesUsed}</div>
            </div>
            <button onClick={startGame} className="px-10 py-4 rounded-full bg-gradient-to-br from-gold to-amber-400 text-ink font-display font-extrabold text-xl shadow-[0_0_40px_rgba(255,209,102,0.6)] hover:scale-105 transition-transform">JOGAR DE NOVO</button>
          </div>
        </div>
      )}

      {/* Touch controls (visible when playing) */}
      {gameState === 'playing' && (
        <div className="absolute bottom-4 left-4 right-4 z-20 flex items-end justify-between pointer-events-none md:hidden">
          <div className="flex gap-3 pointer-events-auto">
            <button onTouchStart={() => handleTouchMove(-1)} onTouchEnd={() => keys.current.delete('ArrowLeft')} className="w-16 h-16 rounded-full bg-white/15 backdrop-blur border border-white/10 text-white flex items-center justify-center text-2xl shadow-lg active:scale-95">◄</button>
            <button onTouchStart={() => handleJump()} className="w-16 h-16 rounded-full bg-gradient-to-br from-bubble to-phantom text-white flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(255,79,163,0.4)] active:scale-95">▲</button>
            <button onTouchStart={() => handleTouchMove(1)} onTouchEnd={() => keys.current.delete('ArrowRight')} className="w-16 h-16 rounded-full bg-white/15 backdrop-blur border border-white/10 text-white flex items-center justify-center text-2xl shadow-lg active:scale-95">►</button>
          </div>
          <button onTouchStart={() => handleShoot()} className="w-16 h-16 rounded-full bg-gradient-to-br from-gold to-amber-300 text-ink flex items-center justify-center text-xl font-bold shadow-lg active:scale-95">💫</button>
        </div>
      )}
    </div>
  );
}
