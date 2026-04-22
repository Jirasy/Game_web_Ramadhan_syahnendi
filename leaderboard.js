// ==================== LEADERBOARD UTILITY ====================
// Shared leaderboard via Vercel API - semua user bisa saling bersaing!
// Fallback ke localStorage jika API tidak tersedia

const USER_KEY = 'kartini_username_v3';
const LOCAL_LB_KEY = 'kartini_lb_local_v3';

// Otomatis detect API base URL
function getApiBase() {
  // Jika di localhost, arahkan ke Vercel dev atau skip
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    return ''; // akan pakai localStorage saja saat dev
  }
  return '/api/leaderboard';
}

const API_URL = getApiBase();

async function apiFetch(method, body) {
  if (!API_URL) return null;
  try {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(API_URL, opts);
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

// ---- Local fallback ----
function localGet() {
  try { return JSON.parse(localStorage.getItem(LOCAL_LB_KEY)) || {}; } catch { return {}; }
}
function localSave(gameName, username, score) {
  const local = localGet();
  if (!local[gameName]) local[gameName] = [];
  const entry = { username, score, date: new Date().toLocaleDateString('id-ID', { day:'2-digit', month:'2-digit', year:'2-digit' }), ts: Date.now() };
  const idx = local[gameName].findIndex(e => e.username === username);
  if (idx >= 0) { if (score > local[gameName][idx].score) local[gameName][idx] = entry; }
  else local[gameName].push(entry);
  local[gameName].sort((a, b) => b.score - a.score);
  local[gameName] = local[gameName].slice(0, 100);
  try { localStorage.setItem(LOCAL_LB_KEY, JSON.stringify(local)); } catch {}
}

window.LB = {
  _cloudAvailable: !!API_URL,
  _cache: null,
  _cacheTime: 0,

  getUsername() { return localStorage.getItem(USER_KEY) || null; },
  setUsername(name) { if (name?.trim()) localStorage.setItem(USER_KEY, name.trim()); },

  async getAll() {
    // Cache 30 detik
    if (this._cache && Date.now() - this._cacheTime < 30000) return this._cache;
    if (API_URL) {
      const res = await apiFetch('GET');
      if (res?.ok && res.data) {
        this._cache = res.data;
        this._cacheTime = Date.now();
        return res.data;
      }
    }
    return localGet();
  },

  async save(gameName, score) {
    const username = this.getUsername();
    if (!username || score == null || score < 0) return;
    // Selalu simpan lokal dulu
    localSave(gameName, username, score);
    // Invalidate cache
    this._cache = null;
    // Kirim ke cloud
    if (API_URL) {
      apiFetch('POST', { gameName, username, score }); // fire & forget
    }
    this.showSavedToast(gameName, score);
  },

  async getTop(gameName, n = 10) {
    const all = await this.getAll();
    return (all[gameName] || []).slice(0, n);
  },

  showSavedToast(gameName, score) {
    const existing = document.getElementById('lb-toast');
    if (existing) existing.remove();
    const t = document.createElement('div');
    t.id = 'lb-toast';
    t.innerHTML = `🏆 Skor <b>${score.toLocaleString()}</b> tersimpan!`;
    Object.assign(t.style, {
      position:'fixed', bottom:'72px', left:'50%', transform:'translateX(-50%)',
      background:'rgba(10,10,20,0.92)', color:'#fff', padding:'10px 22px',
      borderRadius:'25px', fontSize:'14px', zIndex:'99999',
      border:'1px solid rgba(255,215,0,0.5)', backdropFilter:'blur(14px)',
      boxShadow:'0 6px 30px rgba(0,0,0,0.5)', fontFamily:'Poppins,sans-serif',
      whiteSpace:'nowrap', pointerEvents:'none'
    });
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2800);
  },

  async showGameLeaderboard(gameName) {
    const ex = document.getElementById('lb-modal-overlay');
    if (ex) { ex.remove(); return; }
    const overlay = document.createElement('div');
    overlay.id = 'lb-modal-overlay';
    overlay.innerHTML = `<div id="lb-modal-box">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h2 style="margin:0;font-size:1.05rem">🏆 Leaderboard – ${gameName}</h2>
        <button id="lb-modal-close" style="background:none;border:none;color:#fff;font-size:1.8rem;cursor:pointer;padding:0 4px;line-height:1">×</button>
      </div>
      <div id="lb-modal-body" style="text-align:center;padding:28px 0;opacity:0.6">⏳ Memuat...</div>
    </div>`;
    Object.assign(overlay.style, { position:'fixed',top:0,left:0,width:'100%',height:'100%',
      background:'rgba(0,0,0,0.78)',zIndex:'99998',display:'flex',
      alignItems:'center',justifyContent:'center',padding:'16px',boxSizing:'border-box' });
    const box = overlay.querySelector('#lb-modal-box');
    Object.assign(box.style, { background:'linear-gradient(135deg,#1a1a3e,#2d1b69)',
      border:'1px solid rgba(255,215,0,0.3)',borderRadius:'18px',padding:'20px',
      width:'100%',maxWidth:'400px',maxHeight:'88vh',overflowY:'auto',
      color:'#fff',fontFamily:'Poppins,sans-serif',boxShadow:'0 20px 60px rgba(0,0,0,0.8)' });
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    document.getElementById('lb-modal-close').onclick = close;
    overlay.onclick = e => { if (e.target === overlay) close(); };

    const top = await this.getTop(gameName, 10);
    const medals = ['🥇','🥈','🥉'];
    const myName = this.getUsername();
    const rows = top.length === 0
      ? '<tr><td colspan="4" style="text-align:center;opacity:0.45;padding:24px 0">Belum ada skor 🎮<br><small>Jadilah yang pertama!</small></td></tr>'
      : top.map((e,i) => `<tr style="background:${i%2===0?'rgba(255,255,255,0.06)':'transparent'};${e.username===myName?'outline:1px solid rgba(255,215,0,0.35)':''}">
          <td style="padding:9px 8px;text-align:center;font-size:1rem">${medals[i]||(i+1)}</td>
          <td style="padding:9px 8px;font-weight:600;font-size:0.84rem;${e.username===myName?'color:#ffd700':''}">${e.username}${e.username===myName?' 👈':''}</td>
          <td style="padding:9px 8px;text-align:right;color:#ffd700;font-weight:700;font-size:0.84rem">${e.score.toLocaleString()}</td>
          <td style="padding:9px 8px;text-align:right;opacity:0.35;font-size:0.68rem">${e.date||''}</td>
        </tr>`).join('');

    const src = API_URL ? '☁️ Data bersama semua pemain' : '💾 Lokal (dev mode)';
    document.getElementById('lb-modal-body').outerHTML = `
      <table style="width:100%;border-collapse:collapse;font-size:0.85rem">
        <thead><tr style="border-bottom:1px solid rgba(255,255,255,0.15)">
          <th style="padding:7px 8px;opacity:0.55">#</th>
          <th style="padding:7px 8px;text-align:left;opacity:0.55">Pemain</th>
          <th style="padding:7px 8px;text-align:right;opacity:0.55">Skor</th>
          <th style="padding:7px 8px;text-align:right;opacity:0.55">Tgl</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="margin-top:12px;font-size:0.68rem;opacity:0.32;text-align:center">${src}</div>
      <button id="lb-close2" style="margin-top:14px;width:100%;padding:12px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.18);color:#fff;border-radius:10px;cursor:pointer;font-size:0.95rem;font-family:Poppins,sans-serif">Tutup</button>`;
    document.getElementById('lb-close2').onclick = close;
  },

  addGameUI(gameName) {
    const s = document.createElement('style');
    s.textContent = `
      #game-nav-bar{position:fixed;top:0;left:0;right:0;z-index:9999;display:flex;justify-content:space-between;align-items:center;padding:8px 14px;box-sizing:border-box;min-height:50px;background:rgba(0,0,0,0.52);backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,0.12);}
      .gnav-btn{display:flex;align-items:center;gap:5px;padding:7px 13px;border-radius:22px;border:1px solid rgba(255,255,255,0.25);background:rgba(255,255,255,0.12);color:#fff;font-size:0.78rem;cursor:pointer;font-family:Poppins,sans-serif;font-weight:600;transition:background 0.2s;text-decoration:none;white-space:nowrap;-webkit-tap-highlight-color:transparent;}
      .gnav-btn:hover,.gnav-btn:active{background:rgba(255,255,255,0.28);}
      #game-nav-spacer{height:50px;}
      .gnav-title{color:#fff;font-size:0.85rem;font-weight:700;font-family:Poppins,sans-serif;opacity:0.9;flex:1;text-align:center;padding:0 8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
      @media(max-width:380px){.gnav-btn{padding:6px 10px;font-size:0.72rem;}}`;
    document.head.appendChild(s);
    const nav = document.createElement('div');
    nav.id = 'game-nav-bar';
    nav.innerHTML = `<a href="../index.html" class="gnav-btn">🏠 Menu</a><span class="gnav-title">${gameName}</span><button class="gnav-btn" id="gnav-lb-btn">🏆 Skor</button>`;
    document.body.insertBefore(nav, document.body.firstChild);
    const sp = document.createElement('div');
    sp.id = 'game-nav-spacer';
    document.body.insertBefore(sp, nav.nextSibling);
    document.getElementById('gnav-lb-btn').onclick = () => this.showGameLeaderboard(gameName);
  },

  ensureUsername(callback) {
    if (this.getUsername()) { callback?.(); return; }
    if (document.getElementById('lb-username-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'lb-username-overlay';
    overlay.innerHTML = `<div style="background:linear-gradient(135deg,#1a1a3e,#2d1b69);border:1px solid rgba(255,215,0,0.4);border-radius:20px;padding:28px 24px;width:90%;max-width:320px;text-align:center;color:#fff;font-family:Poppins,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,0.8)">
      <div style="font-size:2.5rem;margin-bottom:10px">👤</div>
      <h3 style="margin:0 0 6px;font-size:1.15rem;font-weight:700">Masukkan Namamu</h3>
      <p style="margin:0 0 18px;opacity:0.55;font-size:0.82rem;line-height:1.5">Agar skormu masuk leaderboard<br>bersama semua pemain! 🏆</p>
      <input id="lb-username-input" type="text" maxlength="20" placeholder="Nama kamu..."
        style="width:100%;padding:12px 16px;border-radius:12px;border:1.5px solid rgba(255,255,255,0.25);background:rgba(255,255,255,0.1);color:#fff;font-size:1rem;font-family:Poppins,sans-serif;box-sizing:border-box;outline:none;margin-bottom:14px">
      <button id="lb-username-save"
        style="width:100%;padding:13px;border-radius:12px;border:none;background:linear-gradient(90deg,#f093fb,#f5576c);color:#fff;font-weight:700;font-size:1rem;cursor:pointer;font-family:Poppins,sans-serif;box-shadow:0 4px 20px rgba(245,87,108,0.4)">
        Mulai Main! 🎮
      </button></div>`;
    Object.assign(overlay.style, { position:'fixed',top:0,left:0,width:'100%',height:'100%',
      background:'rgba(0,0,0,0.82)',zIndex:'999999',display:'flex',
      alignItems:'center',justifyContent:'center',padding:'16px',boxSizing:'border-box' });
    document.body.appendChild(overlay);
    const inp = document.getElementById('lb-username-input');
    const btn = document.getElementById('lb-username-save');
    inp.focus();
    const save = () => {
      const n = inp.value.trim();
      if (!n) { inp.style.border='1.5px solid #f5576c'; inp.focus(); return; }
      this.setUsername(n); overlay.remove(); callback?.();
    };
    btn.onclick = save;
    inp.onkeydown = e => { if (e.key==='Enter') save(); };
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  const isIndex = path === '/' || /\/Index\/?$/.test(path) || path.endsWith('index.html');
  if (!isIndex) window.LB.ensureUsername();
});
