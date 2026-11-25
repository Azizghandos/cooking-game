// Dapur Kilat — fixed scenes for screenshots, and a scripted self-test.
// A shot is a URL query (?shot=start|play|serve|rush&seed=N) that builds one
// exact kitchen: same tickets, same food, same chef, every time. The test
// (?shot=playtest) plays a whole order through the game's own functions and
// reports pass/fail in the page, so a headless browser can check it.

import { RECIPES } from './orders.js';

// Put the chef in front of a station and use it, the way a player would.
function useStation(game, interact, audio, stationId) {
  const s = game.kitchen.byId(stationId);
  game.chef.x = s.front.x;
  game.chef.y = s.front.y;
  game.nearStation = s;
  return interact(game, audio);
}

// Advance the game clock in fixed steps, the way the loop does.
function step(game, updatePlaying, audio, seconds) {
  const dt = 1 / 60;
  let left = seconds;
  while (left > 0) {
    const h = Math.min(dt, left);
    game.time += h;
    updatePlaying(game, h, audio);
    left -= h;
  }
}

function stubInput(game) {
  game.input = {
    moveAxis: () => ({ x: 0, y: 0 }),
    moveTarget: null,
    clickStation: null,
    consumeClick: () => null,
  };
}

export function setupShot(game, shot, seed) {
  game.state = 'playing';
  game.time = 0;
  const board = game.board;
  const chef = game.chef;

  if (shot === 'start') {
    // Title screen over a calm kitchen: two tickets waiting, chef at rest.
    game.state = 'title';
    board.spawn('nasgor', 70);
    board.spawn('miegor', 60);
    chef.x = 480;
    chef.y = 330;
    return;
  }

  if (shot === 'play') {
    // A dish mid-assembly: ayam chopping, wok full, plate with two items.
    board.spawn('sate', 55);
    board.spawn('nasgor', 40);
    board.orders[1].patience = 40;
    game.chop.item = 'ayam';
    game.chop.progress = 0.9;
    game.chop.needed = 1.4;
    game.chop.done = false;
    game.wok.item = 'nasi';
    game.wok.progress = 1.2;
    game.wok.needed = 2.2;
    game.wok.done = false;
    game.plateOnCounter = { kind: 'plate', items: ['telur-matang', 'bumbu'] };
    game.hands = { kind: 'item', id: 'sayur-potong' };
    chef.x = 470;
    chef.y = 420;
    game.nearStation = game.kitchen.byId('rakit');
    game.coins = 34;
    game.streak = 2;
    game.dishesServed = 3;
    game.level = 1;
    return;
  }

  if (shot === 'serve') {
    // A finished nasi goreng on a plate at the serving window, bell waiting.
    const order = board.spawn('nasgor', 70);
    order.patience = 52;
    board.spawn('gado', 65);
    game.hands = { kind: 'plate', items: ['nasi-matang', 'telur-matang', 'bumbu'] };
    chef.x = 830;
    chef.y = 470;
    game.nearStation = game.kitchen.byId('jendela');
    game.coins = 52;
    game.streak = 3;
    game.dishesServed = 5;
    game.level = 2;
    return;
  }

  if (shot === 'rush') {
    // The dinner rush: four tickets, two nearly out of time, wok and board busy.
    board.spawn('nasgor', 70).patience = 12;
    board.spawn('miegor', 65).patience = 22;
    board.spawn('sate', 60).patience = 48;
    board.spawn('gado', 60).patience = 55;
    game.chop.item = 'sayur';
    game.chop.progress = 0.7;
    game.chop.needed = 1.4;
    game.wok.item = 'ayam-potong';
    game.wok.progress = 1.8;
    game.wok.needed = 2.2;
    game.plateOnCounter = { kind: 'plate', items: ['nasi-matang'] };
    game.hands = { kind: 'item', id: 'telur-matang' };
    chef.x = 480;
    chef.y = 380;
    game.nearStation = game.kitchen.byId('wok');
    game.coins = 96;
    game.streak = 5;
    game.dishesServed = 9;
    game.level = 2;
    game.strikes = 1;
    return;
  }

  // Unknown shot: the plain title scene.
  game.state = 'title';
  board.spawn('nasgor', 70);
}

// Play a full order end to end through the game's own interact/update, and
// check every rule that matters: cook, chop-then-cook, plate, serve, reject.
export function runSelfTest(createGame, interact, updatePlaying, audio) {
  const failures = [];
  const check = (name, cond) => {
    if (!cond) failures.push(name);
  };
  const silent = {
    pickup() {}, place() {}, chop() {}, ding() {}, success() {}, fail() {},
    levelUp() {}, startSizzle() {}, stopSizzle() {}, unlock() {}, toggleMute() { return false; },
  };

  // --- Nasi goreng, the whole loop ---
  const game = createGame(7);
  stubInput(game);
  game.state = 'playing';
  game.board.spawn('nasgor', 90);
  game.board.spawnIn = 9999; // no surprise tickets during the test

  // Plate first: take one and set it on the assembly counter.
  check('take plate', useStation(game, interact, silent, 'piring') && game.hands.kind === 'plate');
  check('set plate down', useStation(game, interact, silent, 'rakit') && game.plateOnCounter !== null);

  check('grab nasi', useStation(game, interact, silent, 'nasi') && game.hands.id === 'nasi');
  check('wok takes nasi', useStation(game, interact, silent, 'wok') && game.wok.item === 'nasi');
  check('grab mie while wok busy', useStation(game, interact, silent, 'mie') && game.hands.id === 'mie');
  check('wok refuses second item', !useStation(game, interact, silent, 'wok'));
  check('hands still hold mie', game.hands.id === 'mie');
  step(game, updatePlaying, silent, 2.6);
  check('nasi cooks', game.wok.done === true);
  check('hands keep mie while wok done', game.hands.id === 'mie');
  game.hands = null; // put the mie back (test shortcut: drop it)
  check('pick cooked nasi', useStation(game, interact, silent, 'wok') && game.hands.id === 'nasi-matang');
  check('add nasi to plate', useStation(game, interact, silent, 'rakit') && game.plateOnCounter.items.includes('nasi-matang'));

  check('grab telur', useStation(game, interact, silent, 'telur') && game.hands.id === 'telur');
  useStation(game, interact, silent, 'wok');
  step(game, updatePlaying, silent, 2.6);
  check('telur cooks', game.wok.done === true);
  useStation(game, interact, silent, 'wok');
  check('hands hold telur-matang', game.hands.id === 'telur-matang');
  check('add telur to plate', useStation(game, interact, silent, 'rakit') && game.plateOnCounter.items.includes('telur-matang'));

  check('grab bumbu', useStation(game, interact, silent, 'bumbu') && game.hands.id === 'bumbu');
  check('add bumbu to plate', useStation(game, interact, silent, 'rakit') && game.plateOnCounter.items.includes('bumbu'));
  check('plate holds 3 steps', game.plateOnCounter.items.length === 3);
  check('pick plate up', useStation(game, interact, silent, 'rakit') && game.hands.kind === 'plate');
  const coinsBefore = game.coins;
  check('serve nasgor', useStation(game, interact, silent, 'jendela'));
  check('coins rise', game.coins > coinsBefore);
  check('dish counted', game.dishesServed === 1);
  check('ticket gone', game.board.orders.length === 0);

  // --- Chop then cook: sate ayam ---
  const g2 = createGame(8);
  stubInput(g2);
  g2.state = 'playing';
  g2.board.spawn('sate', 90);
  g2.board.spawnIn = 9999;
  check('grab ayam', useStation(g2, interact, silent, 'ayam') && g2.hands.id === 'ayam');
  check('wok refuses raw ayam', !useStation(g2, interact, silent, 'wok'));
  check('board takes ayam', useStation(g2, interact, silent, 'talenan') && g2.chop.item === 'ayam');
  step(g2, updatePlaying, silent, 1.8);
  check('ayam chops', g2.chop.done === true);
  check('pick chopped ayam', useStation(g2, interact, silent, 'talenan') && g2.hands.id === 'ayam-potong');
  check('wok takes chopped ayam', useStation(g2, interact, silent, 'wok') && g2.wok.item === 'ayam-potong');
  step(g2, updatePlaying, silent, 2.6);
  check('ayam cooks', g2.wok.done === true);
  check('pick ayam-matang', useStation(g2, interact, silent, 'wok') && g2.hands.id === 'ayam-matang');

  // --- Wrong dish is refused, right dish serves ---
  const g3 = createGame(9);
  stubInput(g3);
  g3.state = 'playing';
  g3.board.spawn('esteh', 90);
  g3.board.spawnIn = 9999;
  g3.hands = { kind: 'plate', items: ['nasi-matang', 'bumbu'] };
  check('wrong plate refused', !useStation(g3, interact, silent, 'jendela') && g3.dishesServed === 0);
  g3.hands = { kind: 'plate', items: ['teh'] };
  check('es teh serves', useStation(g3, interact, silent, 'jendela') && g3.dishesServed === 1);

  // --- An order that runs out costs a strike ---
  const g4 = createGame(10);
  stubInput(g4);
  g4.state = 'playing';
  g4.board.spawn('gado', 1.0);
  g4.board.spawnIn = 9999;
  step(g4, updatePlaying, silent, 1.5);
  check('expired order strikes', g4.strikes === 1 && g4.board.orders.length === 0);

  return {
    ok: failures.length === 0,
    failures,
    served: game.dishesServed,
    coins: game.coins,
    recipes: Object.keys(RECIPES).length,
  };
}
