// Dapur Kilat — configuration: canvas size, kitchen palette, timings and tuning.
// One place for every number the rest of the game reads, so balancing is a one-file job.

export const VIEW_W = 960;
export const VIEW_H = 600;

export const CHEF_SPEED = 230; // pixels per second
export const CHEF_RADIUS = 16;
export const INTERACT_RADIUS = 52; // how close the chef must stand to use a station

export const CHOP_TIME = 1.4; // seconds on the chopping board
export const COOK_TIME = 2.2; // seconds in the wok
export const MAX_STRIKES = 3; // failed orders before the shift ends

// Orders: how fast new tickets arrive and how long a customer waits, by level.
export function orderInterval(level) {
  return Math.max(6, 15 - level);
}
export function orderPatience(level) {
  return Math.max(42, 78 - level * 3);
}
export function maxConcurrentOrders(level) {
  return Math.min(2 + Math.floor(level / 2), 4);
}
export function levelForDishes(dishesServed) {
  return 1 + Math.floor(dishesServed / 5);
}

// Coins: a dish pays its price, plus a tip for serving fast.
export function tipFor(order, servedAt) {
  const left = Math.max(0, order.patience - servedAt);
  return Math.round((left / order.maxPatience) * 10);
}

export const COLORS = {
  floorA: '#c98f5a',
  floorB: '#bd8148',
  wall: '#f2e3c6',
  board: '#3b2f2f',
  boardEdge: '#6b4f2a',
  counterTop: '#e8dcc3',
  counterFront: '#8a5a33',
  counterFrontDark: '#6e4525',
  steel: '#b9c4c9',
  steelDark: '#8d9aa0',
  wok: '#3a3a3a',
  window: '#fff3d6',
  ink: '#2b2118',
  cream: '#fff8e7',
  gold: '#f2b705',
  red: '#d64545',
  green: '#4caf50',
};
