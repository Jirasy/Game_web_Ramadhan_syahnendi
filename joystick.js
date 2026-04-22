// ==================== UNIVERSAL JOYSTICK SYSTEM ====================
// Auto-detect: Mobile → Virtual Joystick | PC/Laptop → WASD + Arrow + Numpad 8462
// Gunakan: window.Joystick.onDirection(callback) dan window.Joystick.onAction(callback)

(function() {
  'use strict';

  // Deteksi mobile (touch primary device)
  const isMobile = () => ('ontouchstart' in window) ||
    (navigator.maxTouchPoints > 0) ||
    window.matchMedia('(pointer: coarse)').matches;

  // State
  const state = {
    active: false,
    dir: { x: 0, y: 0 },      // -1 / 0 / 1
    angle: null,               // radian
    magnitude: 0,              // 0-1
    keys: {},                  // keyboard state
    listeners: { direction: [], action: [] },
    joystickEl: null,
    knobEl: null,
    touchId: null,
    centerX: 0,
    centerY: 0,
    radius: 0,
    hidden: false,
    _lastDir: null
  };

  // ---- EVENT EMITTER ----
  function emit(type, data) {
    state.listeners[type]?.forEach(fn => fn(data));
  }

  function dirChanged(nx, ny) {
    const prev = state._lastDir;
    if (!prev || prev.x !== nx || prev.y !== ny) {
      state._lastDir = { x: nx, y: ny };
      emit('direction', { x: nx, y: ny, angle: state.angle, magnitude: state.magnitude, raw: state.dir });
    }
  }

  // ==================== KEYBOARD CONTROLS (PC) ====================
  function getKeyDir(e) {
    switch (e.key || e.code) {
      case 'ArrowUp':    case 'w': case 'W': case '8': case 'Numpad8': return { x:0, y:-1, action: false };
      case 'ArrowDown':  case 's': case 'S': case '2': case 'Numpad2': return { x:0, y:1,  action: false };
      case 'ArrowLeft':  case 'a': case 'A': case '4': case 'Numpad4': return { x:-1,y:0,  action: false };
      case 'ArrowRight': case 'd': case 'D': case '6': case 'Numpad6': return { x:1, y:0,  action: false };
      // Diagonal numpad
      case '7': case 'Numpad7': return { x:-1, y:-1, action: false };
      case '9': case 'Numpad9': return { x:1,  y:-1, action: false };
      case '1': case 'Numpad1': return { x:-1, y:1,  action: false };
      case '3': case 'Numpad3': return { x:1,  y:1,  action: false };
      // Action
      case ' ': case 'Space': case 'Enter': case 'z': case 'Z': case 'x': case 'X':
        return { x:0, y:0, action: true };
      default: return null;
    }
  }

  function setupKeyboard() {
    document.addEventListener('keydown', e => {
      const k = e.key || e.code;
      if (state.keys[k]) return; // already pressed
      state.keys[k] = true;

      const dir = getKeyDir(e);
      if (!dir) return;
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();

      if (dir.action) {
        emit('action', { key: e.key });
        return;
      }

      // Compute combined direction from all held keys
      updateKeyDir();
    }, { passive: false });

    document.addEventListener('keyup', e => {
      delete state.keys[e.key || e.code];
      updateKeyDir();
    });
  }

  function updateKeyDir() {
    let x = 0, y = 0;
    // Check all pressed keys
    const keys = state.keys;
    if (keys['ArrowUp']    || keys['w'] || keys['W'] || keys['8'] || keys['Numpad8']) y -= 1;
    if (keys['ArrowDown']  || keys['s'] || keys['S'] || keys['2'] || keys['Numpad2']) y += 1;
    if (keys['ArrowLeft']  || keys['a'] || keys['A'] || keys['4'] || keys['Numpad4']) x -= 1;
    if (keys['ArrowRight'] || keys['d'] || keys['D'] || keys['6'] || keys['Numpad6']) x += 1;
    if (keys['7'] || keys['Numpad7']) { x -= 1; y -= 1; }
    if (keys['9'] || keys['Numpad9']) { x += 1; y -= 1; }
    if (keys['1'] || keys['Numpad1']) { x -= 1; y += 1; }
    if (keys['3'] || keys['Numpad3']) { x += 1; y += 1; }
    // Normalize
    if (x !== 0 && y !== 0) { x = x > 0 ? 1 : -1; y = y > 0 ? 1 : -1; }
    state.magnitude = (x !== 0 || y !== 0) ? 1 : 0;
    state.angle = (x !== 0 || y !== 0) ? Math.atan2(y, x) : null;
    dirChanged(x, y);
  }

  // ==================== VIRTUAL JOYSTICK (MOBILE) ====================
  function createJoystick(opts = {}) {
    const size = opts.size || Math.min(window.innerWidth * 0.28, 130);
    const knobSize = size * 0.44;
    const margin = opts.margin || 18;
    const side = opts.side || 'left'; // 'left' or 'right'

    // Wrapper
    const wrapper = document.createElement('div');
    wrapper.id = 'js-joystick-wrap';
    Object.assign(wrapper.style, {
      position: 'fixed',
      bottom: `${margin}px`,
      [side]: `${margin}px`,
      width: `${size}px`,
      height: `${size}px`,
      zIndex: '9990',
      touchAction: 'none',
      userSelect: 'none',
      webkitUserSelect: 'none',
    });

    // Base ring
    const base = document.createElement('div');
    Object.assign(base.style, {
      position: 'absolute', inset: 0,
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.06)',
      border: '2.5px solid rgba(255,255,255,0.2)',
      backdropFilter: 'blur(4px)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.35), inset 0 0 20px rgba(255,255,255,0.04)',
    });
    wrapper.appendChild(base);

    // Crosshair hints
    const hint = document.createElement('div');
    hint.innerHTML = `
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:75%;height:75%;opacity:0.12">
        <div style="position:absolute;top:50%;left:0;right:0;height:1px;background:#fff;transform:translateY(-50%)"></div>
        <div style="position:absolute;left:50%;top:0;bottom:0;width:1px;background:#fff;transform:translateX(-50%)"></div>
      </div>`;
    wrapper.appendChild(hint);

    // Knob
    const knob = document.createElement('div');
    Object.assign(knob.style, {
      position: 'absolute',
      width: `${knobSize}px`,
      height: `${knobSize}px`,
      borderRadius: '50%',
      background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.9), rgba(200,200,255,0.5))',
      boxShadow: '0 4px 16px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.6)',
      top: '50%', left: '50%',
      transform: `translate(-50%, -50%)`,
      transition: 'none',
      willChange: 'transform',
    });
    wrapper.appendChild(knob);

    document.body.appendChild(wrapper);
    state.joystickEl = wrapper;
    state.knobEl = knob;
    state.radius = size / 2 * 0.95;

    // ---- Touch events ----
    function getCenter() {
      const r = wrapper.getBoundingClientRect();
      state.centerX = r.left + r.width / 2;
      state.centerY = r.top + r.height / 2;
    }

    function processTouch(clientX, clientY) {
      const dx = clientX - state.centerX;
      const dy = clientY - state.centerY;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const angle = Math.atan2(dy, dx);
      const clamped = Math.min(dist, state.radius);
      const nx = (clamped * Math.cos(angle)) / state.radius;
      const ny = (clamped * Math.sin(angle)) / state.radius;

      // Move knob
      const kx = clamped * Math.cos(angle);
      const ky = clamped * Math.sin(angle);
      knob.style.transform = `translate(calc(-50% + ${kx}px), calc(-50% + ${ky}px))`;

      // Quantize to 8 directions
      const threshold = 0.35;
      const qx = nx > threshold ? 1 : nx < -threshold ? -1 : 0;
      const qy = ny > threshold ? 1 : ny < -threshold ? -1 : 0;

      state.magnitude = Math.min(dist / state.radius, 1);
      state.angle = angle;
      dirChanged(qx, qy);
    }

    function resetKnob() {
      knob.style.transition = 'transform 0.12s ease';
      knob.style.transform = 'translate(-50%, -50%)';
      setTimeout(() => { knob.style.transition = 'none'; }, 130);
      state.touchId = null;
      state.magnitude = 0;
      state.angle = null;
      dirChanged(0, 0);
    }

    wrapper.addEventListener('touchstart', e => {
      e.preventDefault();
      getCenter();
      const touch = e.changedTouches[0];
      state.touchId = touch.identifier;
      processTouch(touch.clientX, touch.clientY);
    }, { passive: false });

    wrapper.addEventListener('touchmove', e => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier === state.touchId) {
          processTouch(t.clientX, t.clientY);
          break;
        }
      }
    }, { passive: false });

    wrapper.addEventListener('touchend', e => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier === state.touchId) { resetKnob(); break; }
      }
    }, { passive: false });

    wrapper.addEventListener('touchcancel', e => {
      resetKnob();
    });
  }

  // Optional: Action button (misal tombol tembak/lompat) di kanan bawah
  function createActionButton(opts = {}) {
    const label = opts.label || '🔥';
    const color = opts.color || 'rgba(255,80,80,0.8)';
    const size = opts.size || Math.min(window.innerWidth * 0.16, 64);
    const margin = opts.margin || 22;

    const btn = document.createElement('button');
    btn.id = 'js-action-btn';
    btn.textContent = label;
    Object.assign(btn.style, {
      position: 'fixed',
      bottom: `${margin}px`,
      right: `${margin}px`,
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
      border: '2.5px solid rgba(255,255,255,0.3)',
      background: color,
      color: '#fff',
      fontSize: `${size * 0.38}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      zIndex: '9990',
      backdropFilter: 'blur(6px)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      touchAction: 'none',
      WebkitTapHighlightColor: 'transparent',
      userSelect: 'none',
      fontFamily: 'sans-serif',
      transition: 'transform 0.1s, opacity 0.1s',
    });

    btn.addEventListener('touchstart', e => {
      e.preventDefault();
      btn.style.transform = 'scale(0.9)';
      emit('action', { source: 'button' });
    }, { passive: false });
    btn.addEventListener('touchend', e => {
      e.preventDefault();
      btn.style.transform = 'scale(1)';
    }, { passive: false });
    btn.addEventListener('mousedown', () => {
      btn.style.transform = 'scale(0.9)';
      emit('action', { source: 'button' });
    });
    btn.addEventListener('mouseup', () => btn.style.transform = 'scale(1)');

    document.body.appendChild(btn);
    return btn;
  }

  // ==================== PUBLIC API ====================
  const Joystick = {
    _initialized: false,
    isMobile,

    // Inisialisasi joystick. Panggil satu kali di awal game.
    // opts: { actionButton: bool, actionLabel: '🔥', actionColor: '#f00', joystickSide: 'left', joystickSize: 120 }
    init(opts = {}) {
      if (this._initialized) return this;
      this._initialized = true;
      setupKeyboard();
      if (isMobile()) {
        createJoystick({ side: opts.joystickSide || 'left', size: opts.joystickSize });
        if (opts.actionButton !== false && opts.actionButton !== undefined) {
          createActionButton({ label: opts.actionLabel || '🔥', color: opts.actionColor });
        }
      }
      return this;
    },

    // callback(data): data = { x, y, angle, magnitude }
    // x,y adalah -1, 0, atau 1 (arah yang ditekan)
    onDirection(fn) { state.listeners.direction.push(fn); return this; },

    // callback(data): data = { key, source }
    onAction(fn) { state.listeners.action.push(fn); return this; },

    // Ambil state saat ini (untuk game loop)
    getDir() { return state._lastDir || { x:0, y:0 }; },
    getMagnitude() { return state.magnitude; },
    isKeyDown(key) { return !!state.keys[key]; },

    // Sembunyikan/tampilkan joystick
    hide() {
      if (state.joystickEl) state.joystickEl.style.display = 'none';
      const ab = document.getElementById('js-action-btn');
      if (ab) ab.style.display = 'none';
    },
    show() {
      if (state.joystickEl) state.joystickEl.style.display = 'block';
      const ab = document.getElementById('js-action-btn');
      if (ab) ab.style.display = 'flex';
    },

    destroy() {
      state.joystickEl?.remove();
      document.getElementById('js-action-btn')?.remove();
      state.listeners.direction = [];
      state.listeners.action = [];
      this._initialized = false;
    },

    // Helper: patch game yang pakai callback direction sederhana
    // Misal: Joystick.patchGame({ up: () => move(0,-1), down: ... })
    patchGame({ up, down, left, right, action } = {}) {
      this.onDirection(({ x, y }) => {
        if (y === -1 && up) up();
        else if (y === 1 && down) down();
        if (x === -1 && left) left();
        else if (x === 1 && right) right();
      });
      if (action) this.onAction(action);
      return this;
    }
  };

  window.Joystick = Joystick;
})();
