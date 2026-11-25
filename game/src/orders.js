// Dapur Kilat — recipes, ingredients and the order board.
// A recipe is a set of prepared ingredients; a plate serves when its contents
// match a ticket exactly, in any order. Each raw ingredient names the prep it
// needs: none (straight to the plate), chop, cook, or chop-then-cook.

export const INGREDIENTS = {
  nasi: { label: 'NASI', color: '#f5ecd7', prep: 'cook', cooked: 'nasi-matang' },
  mie: { label: 'MIE', color: '#f2c94c', prep: 'cook', cooked: 'mie-matang' },
  ayam: { label: 'AYAM', color: '#e07856', prep: 'chop-cook', chopped: 'ayam-potong', cooked: 'ayam-matang' },
  sayur: { label: 'SAYUR', color: '#7fae4c', prep: 'chop', chopped: 'sayur-potong' },
  telur: { label: 'TELUR', color: '#fff3c4', prep: 'cook', cooked: 'telur-matang' },
  bumbu: { label: 'BUMBU', color: '#a05a2c', prep: 'none' },
  teh: { label: 'TEH', color: '#c98a4b', prep: 'none' },
};

// What a prepared item looks like on a plate or in the chef's hands.
export const PREPARED = {
  'nasi-matang': { label: 'NASI', color: '#f5ecd7' },
  'mie-matang': { label: 'MIE', color: '#f2c94c' },
  'ayam-matang': { label: 'AYAM', color: '#b85c38' },
  'ayam-potong': { label: 'AYAM', color: '#e07856' },
  'sayur-potong': { label: 'SAYUR', color: '#7fae4c' },
  'telur-matang': { label: 'TELUR', color: '#ffd94d' },
  bumbu: { label: 'BUMBU', color: '#a05a2c' },
  teh: { label: 'TEH', color: '#c98a4b' },
};

export const RECIPES = {
  nasgor: { name: 'Nasi Goreng', price: 18, color: '#e8a33d', steps: ['nasi-matang', 'telur-matang', 'bumbu'] },
  miegor: { name: 'Mie Goreng', price: 16, color: '#d97b2f', steps: ['mie-matang', 'sayur-potong', 'bumbu'] },
  sate: { name: 'Sate Ayam', price: 20, color: '#b85c38', steps: ['ayam-matang', 'bumbu'] },
  gado: { name: 'Gado-Gado', price: 15, color: '#7fae4c', steps: ['sayur-potong', 'telur-matang', 'bumbu'] },
  esteh: { name: 'Es Teh', price: 8, color: '#c98a4b', steps: ['teh'] },
};

export const RECIPE_KEYS = Object.keys(RECIPES);

let nextOrderId = 1;

export function makeOrder(recipeKey, patience, rng) {
  const recipe = RECIPES[recipeKey];
  return {
    id: nextOrderId++,
    recipeKey,
    name: recipe.name,
    price: recipe.price,
    color: recipe.color,
    steps: recipe.steps.slice(),
    patience,
    maxPatience: patience,
    age: 0,
    // A little wobble so tickets do not all tick in lockstep.
    jitter: rng ? rng() * 0.4 : 0,
  };
}

// Two sets of steps match when they hold the same items, order aside.
export function stepsMatch(plateSteps, recipeSteps) {
  if (plateSteps.length !== recipeSteps.length) return false;
  const a = plateSteps.slice().sort();
  const b = recipeSteps.slice().sort();
  return a.every((step, i) => step === b[i]);
}

// The order board: spawns tickets on a timer, ages them, drops the expired.
export function createOrderBoard(rng) {
  return {
    rng,
    orders: [],
    spawnIn: 1.5,
    spawn(recipeKey, patience) {
      const key = recipeKey || RECIPE_KEYS[Math.floor(this.rng() * RECIPE_KEYS.length)];
      const order = makeOrder(key, patience, this.rng);
      this.orders.push(order);
      return order;
    },
    tick(dt, level, interval, patience, maxOrders) {
      const expired = [];
      for (const order of this.orders) {
        order.age += dt;
        order.patience -= dt;
        if (order.patience <= 0) expired.push(order);
      }
      this.orders = this.orders.filter((o) => o.patience > 0);
      this.spawnIn -= dt;
      if (this.spawnIn <= 0 && this.orders.length < maxOrders) {
        this.spawn(null, patience);
        this.spawnIn = interval * (0.85 + this.rng() * 0.3);
      }
      return expired;
    },
    findMatch(plateSteps) {
      return this.orders.find((o) => stepsMatch(plateSteps, o.steps)) || null;
    },
    remove(order) {
      this.orders = this.orders.filter((o) => o !== order);
    },
  };
}
