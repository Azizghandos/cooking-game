// Dapur Kilat — keyboard and mouse. WASD or arrows to walk, E or Space to
// use a station, Enter to start, P or Escape to pause, R to restart, M to mute.
// A mouse click sets a walk target; clicking a station walks there and uses it.

export function createInput(canvas) {
  const keys = new Set();
  const input = {
    keys,
    click: null, // { x, y } in canvas pixels, consumed once
    moveTarget: null, // { x, y } the chef walks toward, or null
    clickStation: null, // station id to use on arrival, or null
    onKey: null, // (code) => void, set by the game for one-press actions

    isDown(code) {
      return keys.has(code);
    },
    moveAxis() {
      let x = 0;
      let y = 0;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
      if (keys.has('KeyW') || keys.has('ArrowUp')) y -= 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) y += 1;
      if (x !== 0 && y !== 0) {
        const inv = 1 / Math.hypot(x, y);
        x *= inv;
        y *= inv;
      }
      return { x, y };
    },
    consumeClick() {
      const c = this.click;
      this.click = null;
      return c;
    },
  };

  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    if (!e.repeat) {
      keys.add(e.code);
      if (input.onKey) input.onKey(e.code);
    }
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    input.click = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  });

  return input;
}
