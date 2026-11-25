// Dapur Kilat — every pixel on screen. Canvas only, no images: the floor,
// the counters, the order board, the chef, the food and the overlays are all
// drawn shapes, so the game loads nothing and runs anywhere.

import { VIEW_W, VIEW_H, COLORS } from './config.js';
import { INGREDIENTS, PREPARED, RECIPES } from './orders.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align, weight) {
  ctx.fillStyle = color || COLORS.ink;
  ctx.font = `${weight || 'bold'} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// One ingredient, drawn as a little dish of food with its label under it
// (pass showLabel=false for the tiny items on a carried plate).
export function drawFood(ctx, id, x, y, s, showLabel) {
  const def = PREPARED[id] || INGREDIENTS[id] || { label: id.toUpperCase(), color: '#ccc' };
  const r = s / 2;
  ctx.save();
  ctx.translate(x, y);
  // plate
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.25, r * 1.05, r * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d8cfc0';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  if (id === 'nasi-matang' || id === 'nasi') {
    ctx.fillStyle = '#fff8e0';
    ctx.beginPath();
    ctx.arc(0, -r * 0.1, r * 0.62, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f2c94c';
    ctx.beginPath();
    ctx.arc(r * 0.25, -r * 0.3, r * 0.16, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'mie-matang' || id === 'mie') {
    ctx.strokeStyle = '#e8a33d';
    ctx.lineWidth = r * 0.18;
    ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(-r * 0.6, i * r * 0.28);
      ctx.quadraticCurveTo(0, i * r * 0.28 - r * 0.25, r * 0.6, i * r * 0.28);
      ctx.stroke();
    }
  } else if (id === 'ayam-matang' || id === 'ayam-potong' || id === 'ayam') {
    ctx.fillStyle = id === 'ayam-matang' ? '#b85c38' : '#e07856';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.arc(i * r * 0.45, -r * 0.08, r * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = '#8a5a33';
    ctx.lineWidth = r * 0.1;
    ctx.beginPath();
    ctx.moveTo(-r * 0.8, r * 0.1);
    ctx.lineTo(r * 0.8, r * 0.1);
    ctx.stroke();
  } else if (id === 'sayur-potong' || id === 'sayur') {
    ctx.fillStyle = '#7fae4c';
    for (const [dx, dy] of [[-0.35, 0], [0.3, -0.15], [0, 0.2]]) {
      ctx.beginPath();
      ctx.arc(dx * r, dy * r, r * 0.32, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#e2574c';
    ctx.beginPath();
    ctx.arc(r * 0.4, r * 0.2, r * 0.16, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'telur-matang' || id === 'telur') {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.05, r * 0.62, r * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd94d';
    ctx.beginPath();
    ctx.arc(0, -r * 0.05, r * 0.3, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'bumbu') {
    ctx.fillStyle = '#a05a2c';
    for (const [dx, dy] of [[-0.3, 0], [0.25, -0.1], [0.05, 0.2], [-0.05, -0.25]]) {
      ctx.beginPath();
      ctx.arc(dx * r, dy * r, r * 0.14, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'teh') {
    ctx.fillStyle = 'rgba(201,138,75,0.9)';
    rr(ctx, -r * 0.45, -r * 0.55, r * 0.9, r * 1.1, r * 0.15);
    ctx.fill();
    ctx.fillStyle = '#fff8e7';
    ctx.beginPath();
    ctx.arc(-r * 0.15, -r * 0.25, r * 0.14, 0, Math.PI * 2);
    ctx.arc(r * 0.2, -r * 0.05, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  if (showLabel !== false) text(ctx, def.label, x, y + r + 12, Math.max(9, s * 0.22), COLORS.ink, 'center', 'bold');
}

function drawProgressRing(ctx, x, y, r, frac, color) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.arc(x, y, r + 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawTicket(ctx, order, x, y, w, h, time) {
  const frac = Math.max(0, order.patience / order.maxPatience);
  const urgent = frac < 0.25;
  const pulse = urgent ? 0.5 + 0.5 * Math.sin(time * 10) : 0;
  ctx.save();
  if (urgent) {
    ctx.shadowColor = '#ff5252';
    ctx.shadowBlur = 10 + pulse * 14;
  }
  ctx.fillStyle = '#fff8e7';
  rr(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = urgent ? '#d64545' : '#d8cfc0';
  ctx.lineWidth = urgent ? 2.5 : 1.5;
  rr(ctx, x, y, w, h, 8);
  ctx.stroke();
  ctx.fillStyle = order.color;
  rr(ctx, x, y, w, 22, 8);
  ctx.fill();
  ctx.fillRect(x, y + 14, w, 8);
  text(ctx, order.name.toUpperCase(), x + w / 2, y + 12, 12, '#ffffff', 'center', '800');
  text(ctx, `Rp${order.price}k`, x + w - 8, y + 36, 11, COLORS.ink, 'right', 'bold');
  // recipe steps as chips
  let cx = x + 8;
  for (const step of order.steps) {
    const def = PREPARED[step];
    ctx.fillStyle = def.color;
    rr(ctx, cx, y + 30, 34, 16, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1;
    rr(ctx, cx, y + 30, 34, 16, 8);
    ctx.stroke();
    text(ctx, def.label, cx + 17, y + 39, 8, '#2b2118', 'center', '800');
    cx += 38;
  }
  // patience bar
  const barY = y + h - 12;
  ctx.fillStyle = '#e5dcc8';
  rr(ctx, x + 8, barY, w - 16, 7, 3.5);
  ctx.fill();
  ctx.fillStyle = frac > 0.5 ? '#4caf50' : frac > 0.25 ? '#f2b705' : '#d64545';
  if (frac > 0) {
    rr(ctx, x + 8, barY, (w - 16) * frac, 7, 3.5);
    ctx.fill();
  }
}

function drawChef(ctx, chef, hands, time) {
  const { x, y } = chef;
  const bob = chef.moving ? Math.sin(time * 14) * 2 : 0;
  ctx.save();
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(x, y + 20, 18, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // body + apron
  ctx.fillStyle = '#ffffff';
  rr(ctx, x - 13, y - 6 + bob, 26, 24, 8);
  ctx.fill();
  ctx.fillStyle = '#e2574c';
  rr(ctx, x - 13, y + 2 + bob, 26, 8, 4);
  ctx.fill();
  // head
  ctx.fillStyle = '#f2c89b';
  ctx.beginPath();
  ctx.arc(x, y - 16 + bob, 11, 0, Math.PI * 2);
  ctx.fill();
  // chef hat
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x - 6, y - 24 + bob, 6, 0, Math.PI * 2);
  ctx.arc(x + 6, y - 24 + bob, 6, 0, Math.PI * 2);
  ctx.arc(x, y - 27 + bob, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 11, y - 25 + bob, 22, 4);
  // eyes
  ctx.fillStyle = '#2b2118';
  ctx.beginPath();
  ctx.arc(x - 4, y - 16 + bob, 1.6, 0, Math.PI * 2);
  ctx.arc(x + 4, y - 16 + bob, 1.6, 0, Math.PI * 2);
  ctx.fill();
  // carried item floats above the hands
  if (hands) {
    if (hands.kind === 'plate') {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(x, y - 34 + bob, 20, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#d8cfc0';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      hands.items.forEach((item, i) => {
        drawFood(ctx, item, x - 12 + i * 12, y - 42 + bob, 16, false);
      });
    } else {
      drawFood(ctx, hands.id, x, y - 44 + bob, 30, false);
    }
  }
  ctx.restore();
}

function drawCounter(ctx, s, time, game) {
  ctx.save();
  // front
  ctx.fillStyle = COLORS.counterFront;
  rr(ctx, s.x, s.y + 14, s.w, s.h - 14, 6);
  ctx.fill();
  ctx.fillStyle = COLORS.counterFrontDark;
  ctx.fillRect(s.x + 6, s.y + s.h - 10, s.w - 12, 4);
  // top
  ctx.fillStyle = COLORS.counterTop;
  rr(ctx, s.x - 3, s.y, s.w + 6, 22, 8);
  ctx.fill();
  ctx.strokeStyle = '#c9b896';
  ctx.lineWidth = 1;
  rr(ctx, s.x - 3, s.y, s.w + 6, 22, 8);
  ctx.stroke();

  if (s.kind === 'ingredient') {
    drawFood(ctx, s.ingredient, s.x + s.w / 2, s.y + 34, 34, false);
    text(ctx, s.label, s.x + s.w / 2, s.y + 56, 13, '#fff8e7', 'center', '800');
    text(ctx, s.sub, s.x + s.w / 2, s.y + 72, 9, '#e8dcc3', 'center', '600');
  } else if (s.kind === 'plate-stack') {
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(s.x + s.w / 2, s.y + 26 - i * 5, 26, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#d8cfc0';
      ctx.stroke();
    }
    text(ctx, s.label, s.x + s.w / 2, s.y + 56, 13, '#fff8e7', 'center', '800');
    text(ctx, s.sub, s.x + s.w / 2, s.y + 72, 9, '#e8dcc3', 'center', '600');
  } else if (s.kind === 'chop') {
    // wooden board
    ctx.fillStyle = '#d9a066';
    rr(ctx, s.x + 14, s.y - 2, s.w - 28, 26, 6);
    ctx.fill();
    const job = game.chop;
    if (job.item) {
      drawFood(ctx, job.item, s.x + s.w / 2, s.y + 8, 26);
      if (!job.done) drawProgressRing(ctx, s.x + s.w / 2, s.y + 8, 20, job.progress / job.needed, '#ffd94d');
    }
    text(ctx, s.label, s.x + s.w / 2, s.y + 56, 13, '#fff8e7', 'center', '800');
    text(ctx, s.sub, s.x + s.w / 2, s.y + 72, 9, '#e8dcc3', 'center', '600');
  } else if (s.kind === 'cook') {
    // stove + wok
    ctx.fillStyle = '#3a3a3a';
    rr(ctx, s.x + 12, s.y - 4, s.w - 24, 28, 10);
    ctx.fill();
    const job = game.wok;
    if (job.item) {
      drawFood(ctx, job.item, s.x + s.w / 2, s.y + 6, 26);
      if (!job.done) {
        drawProgressRing(ctx, s.x + s.w / 2, s.y + 6, 20, job.progress / job.needed, '#ff8a3d');
        // flame flicker
        ctx.fillStyle = `rgba(255,${120 + Math.floor(60 * Math.sin(time * 18))},40,0.85)`;
        ctx.beginPath();
        ctx.moveTo(s.x + s.w / 2 - 14, s.y + 22);
        ctx.quadraticCurveTo(s.x + s.w / 2, s.y + 2, s.x + s.w / 2 + 14, s.y + 22);
        ctx.closePath();
        ctx.fill();
      }
    }
    text(ctx, s.label, s.x + s.w / 2, s.y + 56, 13, '#fff8e7', 'center', '800');
    text(ctx, s.sub, s.x + s.w / 2, s.y + 72, 9, '#e8dcc3', 'center', '600');
  } else if (s.kind === 'plate') {
    const plate = game.plateOnCounter;
    if (plate) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(s.x + s.w / 2, s.y + 10, 34, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#d8cfc0';
      ctx.stroke();
      plate.items.forEach((item, i) => {
        drawFood(ctx, item, s.x + 34 + i * 34, s.y + 2, 24, false);
      });
    } else {
      ctx.strokeStyle = 'rgba(255,248,231,0.7)';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(s.x + s.w / 2, s.y + 10, 34, 10, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    text(ctx, s.label, s.x + s.w / 2, s.y + 56, 13, '#fff8e7', 'center', '800');
    text(ctx, s.sub, s.x + s.w / 2, s.y + 72, 9, '#e8dcc3', 'center', '600');
  } else if (s.kind === 'window') {
    // serving window: warm opening with a bell
    ctx.fillStyle = COLORS.window;
    rr(ctx, s.x + 10, s.y - 6, s.w - 20, 30, 6);
    ctx.fill();
    ctx.fillStyle = '#f2b705';
    ctx.beginPath();
    ctx.arc(s.x + s.w / 2, s.y + 8, 9, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(s.x + s.w / 2 - 11, s.y + 8, 22, 3);
    text(ctx, s.label, s.x + s.w / 2, s.y + 56, 13, '#fff8e7', 'center', '800');
    text(ctx, s.sub, s.x + s.w / 2, s.y + 72, 9, '#e8dcc3', 'center', '600');
  }
  ctx.restore();
}

function drawHud(ctx, game) {
  ctx.save();
  // top strip
  // top strip: kept above the ticket row (tickets start at y=30)
  ctx.fillStyle = 'rgba(43,33,24,0.85)';
  rr(ctx, 8, 6, 250, 24, 8);
  ctx.fill();
  // coin dot + balance, level, streak
  ctx.fillStyle = '#ffd94d';
  ctx.beginPath();
  ctx.arc(22, 18, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8a6d00';
  ctx.beginPath();
  ctx.arc(22, 18, 3, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, `Rp${game.coins}k`, 34, 19, 14, '#ffd94d', 'left', '800');
  text(ctx, `Lv ${game.level}`, 130, 19, 14, '#fff8e7', 'left', '800');
  if (game.streak > 1) text(ctx, `STREAK x${game.streak}`, 168, 19, 11, '#ff8a3d', 'left', '800');
  // strikes (hearts) top right
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < 3 - game.strikes ? '#e2574c' : 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.arc(920 - i * 30, 18, 9, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, '✕', 920 - i * 30, 19, 11, '#fff8e7', 'center', '800');
  }
  ctx.restore();
}

function drawBanner(ctx, str, sub, color) {
  ctx.save();
  ctx.fillStyle = color || 'rgba(43,33,24,0.92)';
  rr(ctx, VIEW_W / 2 - 260, 220, 520, 92, 14);
  ctx.fill();
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 2;
  rr(ctx, VIEW_W / 2 - 260, 220, 520, 92, 14);
  ctx.stroke();
  text(ctx, str, VIEW_W / 2, 256, 34, '#ffd94d', 'center', '800');
  if (sub) text(ctx, sub, VIEW_W / 2, 292, 15, '#fff8e7', 'center', '600');
  ctx.restore();
}

function drawOverlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(30,20,12,0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#fff8e7';
  rr(ctx, VIEW_W / 2 - 300, 110, 600, 380, 16);
  ctx.fill();
  ctx.strokeStyle = accent || COLORS.gold;
  ctx.lineWidth = 3;
  rr(ctx, VIEW_W / 2 - 300, 110, 600, 380, 16);
  ctx.stroke();
  text(ctx, title, VIEW_W / 2, 160, 40, COLORS.ink, 'center', '800');
  let y = 210;
  for (const line of lines) {
    text(ctx, line, VIEW_W / 2, y, 16, '#5a4632', 'center', line.startsWith('—') ? '600' : '600');
    y += 30;
  }
}

export function render(ctx, game, time) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  // floor tiles
  for (let ty = 0; ty < 6; ty++) {
    for (let tx = 0; tx < 8; tx++) {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? COLORS.floorA : COLORS.floorB;
      ctx.fillRect(tx * 120, 110 + ty * 82, 120, 82);
    }
  }
  // wall band above the floor
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 0, VIEW_W, 110);
  ctx.fillStyle = '#e2574c';
  ctx.fillRect(0, 104, VIEW_W, 6);
  text(ctx, 'DAPUR KILAT  —  WARUNG CEPAT SAJI', VIEW_W / 2, 18, 13, '#8a5a33', 'center', '800');

  // order board tickets
  const board = game.board;
  const n = board.orders.length;
  const tw = 168;
  const gap = 10;
  const totalW = n * tw + (n - 1) * gap;
  let tx = (VIEW_W - totalW) / 2;
  for (const order of board.orders) {
    drawTicket(ctx, order, tx, 30, tw, 68, time);
    tx += tw + gap;
  }
  if (n === 0) {
    text(ctx, 'Belum ada pesanan — bersiaplah!', VIEW_W / 2, 64, 14, '#8a5a33', 'center', '600');
  }

  // counters and stations
  for (const s of game.kitchen.stations) drawCounter(ctx, s, time, game);

  // chef
  drawChef(ctx, game.chef, game.hands, time);

  // interaction hint
  if (game.nearStation && game.state === 'playing') {
    const s = game.nearStation;
    ctx.save();
    ctx.fillStyle = 'rgba(43,33,24,0.9)';
    const label = `E — ${s.label}`;
    const w = ctx.measureText(label).width + 24;
    rr(ctx, s.front.x - w / 2, s.front.y - 34, w, 24, 12);
    ctx.fill();
    text(ctx, label, s.front.x, s.front.y - 21, 12, '#fff8e7', 'center', '700');
    ctx.restore();
  }

  drawHud(ctx, game);

  // transient banner (level up / served / wrong dish)
  if (game.banner && game.bannerUntil > time) {
    drawBanner(ctx, game.banner.text, game.banner.sub, game.banner.color);
  }

  // rush vignette: red edges when a ticket is about to expire
  const urgent = board.orders.some((o) => o.patience / o.maxPatience < 0.2);
  if (urgent && game.state === 'playing') {
    const a = 0.12 + 0.08 * Math.sin(time * 8);
    const grad = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.35, VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.75);
    grad.addColorStop(0, 'rgba(214,69,69,0)');
    grad.addColorStop(1, `rgba(214,69,69,${a})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  if (game.state === 'title') {
    drawOverlay(ctx, 'DAPUR KILAT', [
      'Warung paling kilat di kota! Layani pesanan sebelum pelanggan kabur.',
      '',
      'Gerak: WASD / panah  •  Ambil & pakai: E atau Spasi  •  Klik juga bisa',
      'Ambil bahan → potong di TALENAN → masak di WOK',
      'susun di RAKIT → ANTAR ke jendela',
      'Sajikan cepat = tip besar. 3 pesanan gagal = shift selesai!',
      '',
      '— Tekan ENTER atau klik untuk mulai —',
    ]);
  } else if (game.state === 'paused') {
    drawOverlay(ctx, 'ISTIRAHAT', [
      'Permainan dijeda. Ambil napas, chef!',
      '',
      '— Tekan P / Esc untuk lanjut —',
    ]);
  } else if (game.state === 'gameover') {
    drawOverlay(ctx, 'SHIFT SELESAI!', [
      `Kamu menyajikan ${game.dishesServed} piring dan mengumpulkan Rp${game.coins}k.`,
      `Streak terbaik: x${game.bestStreak}  •  Level tercapai: ${game.level}`,
      '',
      'Pelanggan sudah pulang. Besok coba lagi, chef!',
      '',
      '— Tekan R untuk main lagi —',
    ], '#d64545');
  }
}

export { RECIPES };
