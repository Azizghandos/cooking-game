// Dapur Kilat — the kitchen itself: where every counter, board, wok and window
// sits, and which one the chef is standing in front of. Counters are solid;
// the chef walks the open floor between them.

import { VIEW_W, VIEW_H } from './config.js';

// A station: a counter the chef can use. `kind` decides the interaction:
// ingredient (grab the raw item), chop, cook, plate (assemble / take a plate),
// window (serve a finished dish). `front` is where the chef stands to use it.
function station(id, kind, x, y, w, h, label, sub, extra) {
  return {
    id,
    kind,
    x,
    y,
    w,
    h,
    label,
    sub: sub || '',
    front: { x: x + w / 2, y: y + h + 26 },
    ...(extra || {}),
  };
}

export function buildKitchen() {
  const stations = [
    // Left wall: the raw-ingredient counters.
    station('nasi', 'ingredient', 8, 132, 132, 84, 'NASI', 'beras', { ingredient: 'nasi' }),
    station('mie', 'ingredient', 8, 236, 132, 84, 'MIE', 'mie kering', { ingredient: 'mie' }),
    station('ayam', 'ingredient', 8, 340, 132, 84, 'AYAM', 'ayam mentah', { ingredient: 'ayam' }),
    station('sayur', 'ingredient', 8, 444, 132, 84, 'SAYUR', 'sayur segar', { ingredient: 'sayur' }),
    // Right wall: more ingredients and the plate stack.
    station('telur', 'ingredient', 820, 132, 132, 84, 'TELUR', 'telur ayam', { ingredient: 'telur' }),
    station('bumbu', 'ingredient', 820, 236, 132, 84, 'BUMBU', 'bumbu rahasia', { ingredient: 'bumbu' }),
    station('teh', 'ingredient', 820, 340, 132, 84, 'TEH', 'teh melati', { ingredient: 'teh' }),
    station('piring', 'plate-stack', 820, 444, 132, 84, 'PIRING', 'piring bersih', {}),
    // Bottom row: the work stations.
    station('talenan', 'chop', 196, 500, 150, 76, 'TALENAN', 'potong di sini', {}),
    station('wok', 'cook', 386, 500, 150, 76, 'WOK', 'masak di sini', {}),
    station('rakit', 'plate', 576, 500, 150, 76, 'RAKIT', 'susun di piring', {}),
    // Bottom right: the serving window.
    station('jendela', 'window', 766, 500, 186, 76, 'ANTAR', 'sajikan di sini', {}),
  ];
  return {
    stations,
    bounds: { x: 8, y: 116, w: VIEW_W - 16, h: VIEW_H - 124 },
    byId(id) {
      return stations.find((s) => s.id === id);
    },
    // The nearest station whose front the chef can reach, or null.
    nearest(x, y, radius) {
      let best = null;
      let bestD = Infinity;
      for (const s of stations) {
        const dx = s.front.x - x;
        const dy = s.front.y - y;
        const d = Math.hypot(dx, dy);
        if (d < radius && d < bestD) {
          best = s;
          bestD = d;
        }
      }
      return best;
    },
    // Keep a circle out of every counter and inside the floor.
    collide(px, py, r) {
      let x = px;
      let y = py;
      const b = this.bounds;
      x = Math.max(b.x + r, Math.min(b.x + b.w - r, x));
      y = Math.max(b.y + r, Math.min(b.y + b.h - r, y));
      for (const s of stations) {
        const nx = Math.max(s.x, Math.min(x, s.x + s.w));
        const ny = Math.max(s.y, Math.min(y, s.y + s.h));
        const dx = x - nx;
        const dy = y - ny;
        const d2 = dx * dx + dy * dy;
        if (d2 < r * r) {
          if (d2 === 0) {
            y = s.y + s.h + r;
          } else {
            const d = Math.sqrt(d2);
            x = nx + (dx / d) * r;
            y = ny + (dy / d) * r;
          }
        }
      }
      return { x, y };
    },
  };
}
