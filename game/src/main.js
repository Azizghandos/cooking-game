// Dapur Kilat — the game itself: loop, state machine, movement and every
// interaction (grab, chop, cook, plate, serve). main.js wires the modules
// together; the kitchen, the recipes, the drawing and the sounds each live
// in their own file.

import { VIEW_W, VIEW_H, CHEF_SPEED, CHEF_RADIUS, INTERACT_RADIUS, CHOP_TIME, COOK_TIME, MAX_STRIKES, orderInterval, orderPatience, maxConcurrentOrders, levelForDishes, tipFor } from './config.js';
import { mulberry32 } from './random.js';
import { INGREDIENTS, PREPARED, RECIPES, createOrderBoard } from './orders.js';
import { buildKitchen } from './world.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { render } from './render.js';
import { setupShot, runSelfTest } from './shots.js';

export function createGame(seed) {
  const rng = mulberry32(seed || 20261125);
  const kitchen = buildKitchen();
  return {
    seed: seed || 20261125,
    rng,
    kitchen,
    board: createOrderBoard(rng),
    state: 'title',
    time: 0,
    chef: { x: VIEW_W / 2, y: 330, moving: false, face: 1 },
    hands: null, // { kind: 'item', id } or { kind: 'plate', items: [] }
    plateOnCounter: null,
    chop: { item: null, progress: 0, needed: CHOP_TIME, done: false, chopTick: 0 },
    wok: { item: null, progress: 0, needed: COOK_TIME, done: false },
    coins: 0,
    dishesServed: 0,
    streak: 0,
    bestStreak: 0,
    strikes: 0,
    level: 1,
    banner: null,
    bannerUntil: 0,
    nearStation: null,
    frozen: false, // screenshots: render a fixed scene, never advance it
    servedFlash: 0,
  };
}

function showBanner(game, text, sub, color) {
  game.banner = { text, sub: sub || '', color };
  game.bannerUntil = game.time + 1.6;
}

// What the chef's hands hold, in plain words (for the hint line and tests).
export function handsLabel(game) {
  if (!game.hands) return 'tangan kosong';
  if (game.hands.kind === 'plate') {
    return game.hands.items.length === 0 ? 'piring kosong' : `piring (${game.hands.items.length} isi)`;
  }
  const def = PREPARED[game.hands.id] || INGREDIENTS[game.hands.id];
  return def ? def.label : game.hands.id;
}

// The one interaction: E / Space / click on a station.
export function interact(game, audio) {
  const s = game.nearStation;
  if (!s || game.state !== 'playing') return false;
  const hands = game.hands;

  if (s.kind === 'ingredient') {
    if (hands) return false;
    game.hands = { kind: 'item', id: s.ingredient };
    audio.pickup();
    return true;
  }

  if (s.kind === 'plate-stack') {
    if (hands) return false;
    game.hands = { kind: 'plate', items: [] };
    audio.pickup();
    return true;
  }

  if (s.kind === 'chop') {
    const job = game.chop;
    if (!job.item && hands && hands.kind === 'item') {
      const def = INGREDIENTS[hands.id];
      if (def && (def.prep === 'chop' || def.prep === 'chop-cook')) {
        job.item = hands.id;
        job.progress = 0;
        job.done = false;
        game.hands = null;
        audio.place();
        return true;
      }
      return false;
    }
    if (job.item && job.done && !hands) {
      game.hands = { kind: 'item', id: INGREDIENTS[job.item].chopped };
      job.item = null;
      job.progress = 0;
      job.done = false;
      audio.pickup();
      return true;
    }
    return false;
  }

  if (s.kind === 'cook') {
    const job = game.wok;
    if (!job.item && hands && hands.kind === 'item') {
      const def = INGREDIENTS[hands.id];
      const chopped = hands.id.endsWith('-potong');
      // Raw food that only needs cooking goes straight in; anything chopped
      // goes in as its chopped form; raw chop-then-cook food must be chopped
      // on the talenan first and is refused here.
      if ((def && def.prep === 'cook') || chopped) {
        job.item = hands.id;
        job.progress = 0;
        job.done = false;
        game.hands = null;
        audio.place();
        audio.startSizzle();
        return true;
      }
      return false;
    }
    if (job.item && job.done && !hands) {
      const def = INGREDIENTS[job.item];
      const base = job.item.endsWith('-potong') ? INGREDIENTS[job.item.replace('-potong', '')] : def;
      const cooked = base && base.cooked;
      if (!cooked) return false;
      game.hands = { kind: 'item', id: cooked };
      job.item = null;
      job.progress = 0;
      job.done = false;
      audio.pickup();
      return true;
    }
    return false;
  }

  if (s.kind === 'plate') {
    // Put a prepared ingredient onto the plate that sits on the counter.
    if (hands && hands.kind === 'item' && game.plateOnCounter && PREPARED[hands.id]) {
      if (game.plateOnCounter.items.length >= 3) return false;
      if (game.plateOnCounter.items.includes(hands.id)) return false;
      game.plateOnCounter.items.push(hands.id);
      game.hands = null;
      audio.place();
      return true;
    }
    // Pick the plate up, or set it down.
    if (!hands && game.plateOnCounter) {
      game.hands = game.plateOnCounter;
      game.plateOnCounter = null;
      audio.pickup();
      return true;
    }
    if (hands && hands.kind === 'plate' && !game.plateOnCounter) {
      game.plateOnCounter = hands;
      game.hands = null;
      audio.place();
      return true;
    }
    return false;
  }

  if (s.kind === 'window') {
    if (!hands || hands.kind !== 'plate' || hands.items.length === 0) return false;
    const order = game.board.findMatch(hands.items);
    if (!order) {
      showBanner(game, 'SALAH PESANAN!', 'Piring ini tidak cocok dengan tiket mana pun.', 'rgba(120,30,20,0.92)');
      game.streak = 0;
      audio.fail();
      return false;
    }
    const tip = tipFor(order, order.age);
    const earned = order.price + tip;
    game.coins += earned;
    game.dishesServed += 1;
    game.streak += 1;
    game.bestStreak = Math.max(game.bestStreak, game.streak);
    game.board.remove(order);
    game.hands = null;
    audio.ding();
    audio.success();
    showBanner(game, `TERSANTAP! +Rp${earned}k`, tip > 0 ? `Termasuk tip Rp${tip}k — streak x${game.streak}` : `Streak x${game.streak}`, 'rgba(30,90,40,0.92)');
    const newLevel = levelForDishes(game.dishesServed);
    if (newLevel > game.level) {
      game.level = newLevel;
      audio.levelUp();
      showBanner(game, `LEVEL ${newLevel}!`, 'Pesanan datang lebih cepat — tetap kilat!', 'rgba(90,50,10,0.92)');
    }
    return true;
  }

  return false;
}

function updatePlaying(game, dt, audio) {
  // Orders age and expire.
  const expired = game.board.tick(dt, game.level, orderInterval(game.level), orderPatience(game.level), maxConcurrentOrders(game.level));
  for (const order of expired) {
    game.strikes += 1;
    game.streak = 0;
    audio.fail();
    showBanner(game, 'PESANAN GAGAL!', `${order.name} keburu kabur... (${game.strikes}/${MAX_STRIKES})`, 'rgba(120,30,20,0.92)');
    if (game.strikes >= MAX_STRIKES) {
      game.state = 'gameover';
      audio.stopSizzle();
      return;
    }
  }

  // Chopping and cooking tick on their own once food is placed.
  const chop = game.chop;
  if (chop.item && !chop.done) {
    chop.progress += dt;
    chop.chopTick += dt;
    if (chop.chopTick > 0.35) {
      chop.chopTick = 0;
      audio.chop();
    }
    if (chop.progress >= chop.needed) {
      chop.done = true;
      audio.ding();
    }
  }
  const wok = game.wok;
  if (wok.item && !wok.done) {
    wok.progress += dt;
    if (wok.progress >= wok.needed) {
      wok.done = true;
      audio.stopSizzle();
      audio.ding();
    }
  } else if (!wok.item) {
    audio.stopSizzle();
  }

  // Movement: keys first, then a click target.
  const chef = game.chef;
  const axis = game.input.moveAxis();
  let vx = 0;
  let vy = 0;
  if (axis.x !== 0 || axis.y !== 0) {
    vx = axis.x * CHEF_SPEED;
    vy = axis.y * CHEF_SPEED;
    game.input.moveTarget = null;
    game.input.clickStation = null;
  } else if (game.input.moveTarget) {
    const dx = game.input.moveTarget.x - chef.x;
    const dy = game.input.moveTarget.y - chef.y;
    const d = Math.hypot(dx, dy);
    if (d < 6) {
      game.input.moveTarget = null;
      if (game.input.clickStation) {
        const target = game.kitchen.byId(game.input.clickStation);
        game.input.clickStation = null;
        if (target) {
          game.nearStation = target;
          interact(game, audio);
        }
      }
    } else {
      vx = (dx / d) * CHEF_SPEED;
      vy = (dy / d) * CHEF_SPEED;
    }
  }
  chef.moving = vx !== 0 || vy !== 0;
  if (vx !== 0) chef.face = vx > 0 ? 1 : -1;
  const next = game.kitchen.collide(chef.x + vx * dt, chef.y + vy * dt, CHEF_RADIUS);
  chef.x = next.x;
  chef.y = next.y;

  // A click walks the chef, or uses a station right away when close.
  const click = game.input.consumeClick();
  if (click) {
    audio.unlock();
    const clicked = game.kitchen.nearest(click.x, click.y, 70);
    if (clicked && Math.hypot(clicked.front.x - chef.x, clicked.front.y - chef.y) < INTERACT_RADIUS + 30) {
      game.nearStation = clicked;
      interact(game, audio);
    } else if (clicked) {
      game.input.moveTarget = { x: clicked.front.x, y: clicked.front.y };
      game.input.clickStation = clicked.id;
    } else {
      game.input.moveTarget = { x: click.x, y: click.y };
      game.input.clickStation = null;
    }
  }

  game.nearStation = game.kitchen.nearest(chef.x, chef.y, INTERACT_RADIUS);
}

function startGame(game, audio) {
  game.state = 'playing';
  game.time = 0;
  audio.unlock();
  audio.ding();
}

function resetGame(game) {
  const fresh = createGame(game.seed);
  Object.assign(game, fresh);
  game.state = 'playing';
}

export function boot(canvas) {
  const ctx = canvas.getContext('2d');
  const params = new URLSearchParams(window.location.search);
  const seed = Number(params.get('seed') || 20261125);
  const game = createGame(seed);
  game.input = createInput(canvas);
  const audio = createAudio();
  game.audio = audio;

  // One-press keys.
  game.input.onKey = (code) => {
    audio.unlock();
    if (code === 'Enter') {
      if (game.state === 'title') startGame(game, audio);
      return;
    }
    if (code === 'KeyM') {
      audio.toggleMute();
      return;
    }
    if (code === 'KeyR' && game.state === 'gameover') {
      resetGame(game);
      return;
    }
    if ((code === 'KeyP' || code === 'Escape') && (game.state === 'playing' || game.state === 'paused')) {
      game.state = game.state === 'playing' ? 'paused' : 'playing';
      return;
    }
    if ((code === 'KeyE' || code === 'Space') && game.state === 'playing') {
      interact(game, audio);
    }
  };

  canvas.addEventListener('mousedown', () => {
    if (game.state === 'title') startGame(game, audio);
  });

  // Deterministic screenshot scenes, or the self-test, from the URL.
  const shot = params.get('shot');
  if (shot === 'playtest') {
    const result = runSelfTest(createGame, interact, updatePlaying, audio);
    const pre = document.createElement('pre');
    pre.id = 'selftest';
    pre.textContent = JSON.stringify(result);
    document.body.appendChild(pre);
    document.title = result.ok ? 'SELFTEST PASS' : `SELFTEST FAIL: ${result.failures.join('; ')}`;
    render(ctx, game, 0);
    return { game, audio };
  }
  if (shot) {
    setupShot(game, shot, seed);
    game.frozen = true;
    render(ctx, game, 1.2);
    return { game, audio };
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!game.frozen) {
      game.time += dt;
      if (game.state === 'playing') updatePlaying(game, dt, audio);
    }
    render(ctx, game, game.time);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return { game, audio };
}
