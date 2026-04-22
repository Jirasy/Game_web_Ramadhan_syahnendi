 // ==================== TIME-BASED BACKGROUND SYSTEM ====================

    function getCurrentTimeClass() {
      const now = new Date();
      const hours = now.getHours();

      if (hours >= 4 && hours < 6) {
        return 'time-fajar';
      } else if (hours >= 6 && hours < 11) {
        return 'time-pagi';
      } else if (hours >= 11 && hours < 17) {
        return 'time-siang';
      } else if (hours >= 17 && hours < 18) {
        return 'time-sore';
      } else if (hours >= 18 && hours < 20) {
        return 'time-maghrib';
      } else if (hours >= 20 && hours < 24) {
        return 'time-malam';
      } else {
        return 'time-tengah-malam';
      }
    }

    function getInterpolatedBackground(currentClass, nextClass, progress) {
      // Light mode colors
      const lightModeColors = {
        'time-fajar': { r1: 26, g1: 58, b1: 82, r2: 74, g2: 111, b2: 165, r3: 135, g3: 206, b3: 235 },
        'time-pagi': { r1: 45, g1: 90, b1: 140, r2: 91, g2: 159, b2: 213, r3: 135, g3: 206, b3: 235 },
        'time-siang': { r1: 74, g1: 144, b1: 226, r2: 135, g2: 206, b2: 235, r3: 224, g3: 246, b3: 255 },
        'time-sore': { r1: 255, g1: 140, b1: 66, r2: 255, g2: 184, b2: 77, r3: 255, g3: 214, b3: 153 },
        'time-maghrib': { r1: 217, g1: 119, b1: 6, r2: 249, g2: 115, b2: 22, r3: 251, g3: 146, b3: 60 },
        'time-malam': { r1: 91, g1: 58, b1: 157, r2: 124, g2: 58, b2: 237, r3: 167, g3: 139, b3: 250 },
        'time-tengah-malam': { r1: 15, g1: 15, b1: 35, r2: 26, g2: 26, b2: 63, r3: 45, g3: 27, b3: 105 }
      };

      // Dark mode colors (lebih gelap)
      const darkModeColors = {
        'time-fajar': { r1: 13, g1: 31, b1: 45, r2: 26, g2: 58, b2: 82, r3: 45, g3: 90, b3: 140 },
        'time-pagi': { r1: 26, g1: 58, b1: 82, r2: 45, g2: 90, b2: 140, r3: 74, g3: 111, b3: 165 },
        'time-siang': { r1: 45, g1: 90, b1: 140, r2: 74, g2: 144, b2: 226, r3: 91, g3: 159, b3: 213 },
        'time-sore': { r1: 204, g1: 102, b1: 0, r2: 217, g2: 119, b2: 6, r2: 249, g2: 115, b2: 22 },
        'time-maghrib': { r1: 139, g1: 64, b1: 0, r2: 180, g2: 94, b2: 0, r3: 217, g3: 119, b3: 6 },
        'time-malam': { r1: 61, g1: 37, b1: 112, r2: 91, g2: 58, b2: 157, r3: 109, g3: 40, b3: 217 },
        'time-tengah-malam': { r1: 10, g1: 10, b1: 26, r2: 15, g2: 15, b2: 35, r3: 26, g3: 26, b3: 63 }
      };

      // Pilih palette berdasarkan dark mode
      const isDarkMode = document.body.classList.contains('dark-mode');
      const colors = isDarkMode ? darkModeColors : lightModeColors;

      const c1 = colors[currentClass];
      const c2 = colors[nextClass];

      const interpolateChannel = (c1Val, c2Val) => Math.round(c1Val + (c2Val - c1Val) * progress);

      const r1 = interpolateChannel(c1.r1, c2.r1);
      const g1 = interpolateChannel(c1.g1, c2.g1);
      const b1 = interpolateChannel(c1.b1, c2.b1);
      const r2 = interpolateChannel(c1.r2, c2.r2);
      const g2 = interpolateChannel(c1.g2, c2.g2);
      const b2 = interpolateChannel(c1.b2, c2.b2);
      const r3 = interpolateChannel(c1.r3, c2.r3);
      const g3 = interpolateChannel(c1.g3, c2.g3);
      const b3 = interpolateChannel(c1.b3, c2.b3);

      return `linear-gradient(180deg, rgba(${r1}, ${g1}, ${b1}, 0.8) 0%, rgba(${r2}, ${g2}, ${b2}, 0.6) 50%, rgba(${r3}, ${g3}, ${b3}, 1) 100%)`;
    }

    const timeTransitions = {
      'time-fajar': 'time-pagi',
      'time-pagi': 'time-siang',
      'time-siang': 'time-sore',
      'time-sore': 'time-maghrib',
      'time-maghrib': 'time-malam',
      'time-malam': 'time-tengah-malam',
      'time-tengah-malam': 'time-fajar'
    };

    const timeClassHours = {
      'time-fajar': 4,
      'time-pagi': 6,
      'time-siang': 11,
      'time-sore': 17,
      'time-maghrib': 18,
      'time-malam': 20,
      'time-tengah-malam': 0
    };

    function updateTimeBasedBackground() {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();

      // Update time display
      const timeDisplay = document.getElementById('time-display');
      timeDisplay.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

      const currentClass = getCurrentTimeClass();
      const nextClass = timeTransitions[currentClass];
      
      const currentHourStart = timeClassHours[currentClass];
      const nextHourStart = timeClassHours[nextClass];
      
      let progressToNext = 0;
      if (nextClass === 'time-fajar' && currentClass === 'time-tengah-malam') {
        // Khusus untuk transisi tengah malam ke fajar
        progressToNext = (hours === 23 ? (minutes * 60 + seconds) / 3600 : (hours * 3600 + minutes * 60 + seconds) / (4 * 3600));
      } else {
        const minutesInCurrentPeriod = minutes + (seconds / 60);
        progressToNext = Math.min(minutesInCurrentPeriod / 60, 1);
      }

      // Remove all time classes
      document.body.classList.remove('time-fajar', 'time-pagi', 'time-siang', 'time-sore', 'time-maghrib', 'time-malam', 'time-tengah-malam');
      
      // Add current class
      document.body.classList.add(currentClass);

      // Apply interpolated background
      const skyElement = document.querySelector('.sky');
      skyElement.style.background = getInterpolatedBackground(currentClass, nextClass, progressToNext);
    }

    // Update setiap detik untuk gradasi smooth
    updateTimeBasedBackground();
    setInterval(updateTimeBasedBackground, 1000);

    // ==================== CLOUDS GENERATION ====================

    function generateClouds() {
      const cloudsContainer = document.getElementById('clouds');
      for (let i = 0; i < 5; i++) {
        const cloud = document.createElement('div');
        cloud.className = 'cloud';
        cloudsContainer.appendChild(cloud);
      }
    }

    generateClouds();

    // ==================== STARS GENERATION ====================

    function generateStars() {
      const starsContainer = document.getElementById('stars');
      for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 50 + '%';
        star.style.animationDelay = Math.random() * 3 + 's';
        starsContainer.appendChild(star);
      }
    }

    generateStars();

    // ==================== PARTICLES GENERATION ====================

    function generateParticles() {
      const particlesContainer = document.getElementById('particles');
      for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDuration = (Math.random() * 5 + 10) + 's';
        particle.style.animationDelay = Math.random() * 5 + 's';
        particlesContainer.appendChild(particle);
      }
    }

    generateParticles();

    // ==================== VEHICLES GENERATION ====================

    const vehicleColors = [
      { body: '#e74c3c', dark: '#c0392b', light: '#ff6b6b' },  // Red
      { body: '#3498db', dark: '#2980b9', light: '#5dade2' },  // Blue
      { body: '#27ae60', dark: '#229954', light: '#2ecc71' },  // Green
      { body: '#f39c12', dark: '#e67e22', light: '#f5b041' },  // Orange
      { body: '#9b59b6', dark: '#8e44ad', light: '#af7ac5' },  // Purple
      { body: '#e67e22', dark: '#d35400', light: '#f8b88b' },  // Dark Orange
      { body: '#1abc9c', dark: '#16a085', light: '#48c9b0' },  // Turquoise
      { body: '#c0392b', dark: '#a93226', light: '#fadbd8' },  // Dark Red
    ];

    function getRandomColor() {
      return vehicleColors[Math.floor(Math.random() * vehicleColors.length)];
    }

    function generateCarSVG(color) {
      return `<svg viewBox="0 0 80 40" xmlns="http://www.w3.org/2000/svg">
        <path d="M 10 25 L 15 15 L 35 12 L 65 15 L 70 25 Z" fill="${color.body}" stroke="${color.dark}" stroke-width="1.5"/>
        <path d="M 20 20 L 25 12 L 55 12 L 60 20 Z" fill="${color.light}" stroke="${color.dark}" stroke-width="1"/>
        <rect x="22" y="13" width="8" height="6" fill="#87ceeb" opacity="0.7"/>
        <rect x="32" y="13" width="8" height="6" fill="#87ceeb" opacity="0.7"/>
        <rect x="42" y="13" width="8" height="6" fill="#87ceeb" opacity="0.7"/>
        <rect x="52" y="13" width="6" height="6" fill="#87ceeb" opacity="0.7"/>
        <circle cx="18" cy="28" r="4" fill="#222" stroke="#666" stroke-width="1"/>
        <circle cx="62" cy="28" r="4" fill="#222" stroke="#666" stroke-width="1"/>
        <circle cx="18" cy="28" r="2.5" fill="#888"/>
        <circle cx="62" cy="28" r="2.5" fill="#888"/>
        <rect x="8" y="25" width="3" height="3" fill="#222"/>
        <rect x="69" y="25" width="3" height="3" fill="#222"/>
      </svg>`;
    }

    function generateMotorSVG(color) {
      return `<svg viewBox="0 0 60 35" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="30" cy="18" rx="16" ry="10" fill="${color.body}" stroke="${color.dark}" stroke-width="1.5"/>
        <rect x="24" y="12" width="12" height="4" rx="2" fill="${color.dark}" stroke="${color.dark}" stroke-width="1"/>
        <circle cx="12" cy="24" r="5" fill="#222" stroke="#666" stroke-width="1.5"/>
        <circle cx="48" cy="24" r="5" fill="#222" stroke="#666" stroke-width="1.5"/>
        <circle cx="12" cy="24" r="2.5" fill="#888"/>
        <circle cx="48" cy="24" r="2.5" fill="#888"/>
        <line x1="8" y1="15" x2="8" y2="18" stroke="#333" stroke-width="1.5"/>
        <circle cx="8" cy="14" r="2" fill="#ffdb3a" stroke="#e6c200" stroke-width="0.5"/>
        <path d="M 32 10 L 36 8 L 36 12 Z" fill="#87ceeb" opacity="0.6"/>
      </svg>`;
    }

    function generateVehicles() {
      const roadContainer = document.querySelector('.road-container');
      const numCars = 3;
      const numMotors = 2;

      // Generate cars
      for (let i = 0; i < numCars; i++) {
        const vehicle = document.createElement('div');
        const color = getRandomColor();
        const isMovingLeft = Math.random() > 0.5;
        
        vehicle.className = 'vehicle vehicle-car';
        vehicle.innerHTML = generateCarSVG(color);
        
        // Random animation
        const duration = Math.random() * 10 + 20; // 20-30s
        const delay = Math.random() * 15; // 0-15s
        const bottomPos = Math.random() * 30 + 15; // 15-45px
        
        vehicle.style.animation = `${isMovingLeft ? 'move-car-ltr' : 'move-car-rtl'} ${duration}s linear infinite ${delay}s`;
        vehicle.style.bottom = bottomPos + 'px';
        vehicle.style.transform = isMovingLeft ? 'scaleX(1)' : 'scaleX(-1)';
        
        roadContainer.appendChild(vehicle);
      }

      // Generate motors
      for (let i = 0; i < numMotors; i++) {
        const vehicle = document.createElement('div');
        const color = getRandomColor();
        const isMovingLeft = Math.random() > 0.5;
        
        vehicle.className = 'vehicle vehicle-motor';
        vehicle.innerHTML = generateMotorSVG(color);
        
        // Random animation
        const duration = Math.random() * 8 + 18; // 18-26s
        const delay = Math.random() * 12; // 0-12s
        const bottomPos = Math.random() * 35 + 25; // 25-60px
        
        vehicle.style.animation = `${isMovingLeft ? 'move-car-ltr' : 'move-car-rtl'} ${duration}s linear infinite ${delay}s`;
        vehicle.style.bottom = bottomPos + 'px';
        vehicle.style.transform = isMovingLeft ? 'scaleX(1)' : 'scaleX(-1)';
        
        roadContainer.appendChild(vehicle);
      }
    }

    generateVehicles();

    // ==================== USERNAME & LEADERBOARD BUTTONS ====================
    const lbBtn = document.getElementById('lb-btn');
    const userBtn = document.getElementById('user-btn');

    // Prompt username on load if not set
    if (!window.LB.getUsername()) {
      setTimeout(() => window.LB.ensureUsername(), 800);
    }

    lbBtn && lbBtn.addEventListener('click', () => showGlobalLeaderboard());
    userBtn && userBtn.addEventListener('click', () => {
      localStorage.removeItem('kartini_username_v3');
      window.LB.ensureUsername();
    });

    async function showGlobalLeaderboard() {
      const existing = document.getElementById('lb-global-overlay');
      if (existing) { existing.remove(); return; }

      // Show overlay immediately with loading state
      const overlay = document.createElement('div');
      overlay.id = 'lb-global-overlay';
      overlay.innerHTML = `
        <div id="lb-global-box">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;position:sticky;top:0;background:linear-gradient(135deg,#1a1a3e,#2d1b69);padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.15);z-index:1">
            <h2 style="margin:0;font-size:1.1rem">🏆 Leaderboard Global</h2>
            <button id="lb-global-close" style="background:none;border:none;color:#fff;font-size:1.8rem;cursor:pointer;padding:0 4px;line-height:1">×</button>
          </div>
          <div id="lb-global-content" style="text-align:center;padding:30px;opacity:0.6">⏳ Memuat data...</div>
        </div>`;
      Object.assign(overlay.style, {
        position:'fixed',top:'0',left:'0',width:'100%',height:'100%',
        background:'rgba(0,0,0,0.78)',zIndex:'99999',display:'flex',
        alignItems:'center',justifyContent:'center',padding:'16px',boxSizing:'border-box'
      });
      const box = overlay.querySelector('#lb-global-box');
      Object.assign(box.style, {
        background:'linear-gradient(135deg,#1a1a3e,#2d1b69)',
        border:'1px solid rgba(255,215,0,0.3)',borderRadius:'18px',
        padding:'20px',width:'100%',maxWidth:'440px',maxHeight:'85vh',
        overflowY:'auto',color:'#fff',fontFamily:'Poppins,sans-serif',
        boxShadow:'0 20px 60px rgba(0,0,0,0.8)'
      });
      document.body.appendChild(overlay);
      document.getElementById('lb-global-close').onclick = () => overlay.remove();
      overlay.onclick = e => { if(e.target===overlay) overlay.remove(); };

      // Load data async
      const lb = await window.LB.getAll();
      const games = Object.keys(lb);
      const medals = ['🥇','🥈','🥉'];
      const myName = window.LB.getUsername();

      let content = '';
      if (games.length === 0) {
        content = '<p style="text-align:center;opacity:0.5;padding:30px 0">Belum ada skor tersimpan 🎮<br><small style="opacity:0.6">Main dulu dan ukir skor!</small></p>';
      } else {
        games.forEach(game => {
          const top = lb[game].slice(0, 5);
          const rows = top.map((e,i) => `
            <tr style="background:${i%2===0?'rgba(255,255,255,0.05)':'transparent'}">
              <td style="padding:7px 8px;text-align:center;font-size:1rem">${medals[i]||(i+1)}</td>
              <td style="padding:7px 8px;font-weight:600;font-size:0.83rem;${e.username===myName?'color:#ffd700':''}">${e.username}${e.username===myName?' 👈':''}</td>
              <td style="padding:7px 8px;text-align:right;color:#ffd700;font-weight:700;font-size:0.83rem">${e.score.toLocaleString()}</td>
            </tr>`).join('');
          content += `
            <div style="margin-bottom:18px">
              <h3 style="font-size:0.82rem;margin:0 0 7px;opacity:0.55;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:5px">${game}</h3>
              <table style="width:100%;border-collapse:collapse">${rows}</table>
            </div>`;
        });
        const isCloud = window.LB && window.LB._hasStorage;
        content += `<div style="margin-top:10px;font-size:0.68rem;opacity:0.35;text-align:center">${isCloud ? '☁️ Data bersama semua pemain' : '💾 Data lokal device ini'}</div>`;
      }

      const contentEl = document.getElementById('lb-global-content');
      if (contentEl) contentEl.innerHTML = content;
    }

    const cards = document.querySelectorAll('.game-card');
    const popup = document.getElementById('popup');
    const popupText = document.getElementById('popup-text');

    function showPopup(text) {
      popupText.textContent = text;
      popup.classList.remove('hidden');
      popup.classList.add('show');
    }

    function hidePopup() {
      popup.classList.remove('show');
      setTimeout(() => {
        popup.classList.add('hidden');
      }, 300);
    }

    cards.forEach(card => {
      // Mouse events
      card.addEventListener('mousedown', () => {
        showPopup(card.getAttribute('data-desc'));
      });
      card.addEventListener('mouseup', hidePopup);
      card.addEventListener('mouseleave', hidePopup);

      // Touch events
      card.addEventListener('touchstart', (e) => {
        e.preventDefault();
        showPopup(card.getAttribute('data-desc'));
      });
      card.addEventListener('touchend', hidePopup);
    });

    // ==================== THEME TOGGLE ====================

    const toggleBtn = document.getElementById('theme-toggle');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (prefersDark) {
      document.body.classList.add('dark-mode');
      toggleBtn.textContent = '☀️';
    } else {
      toggleBtn.textContent = '🌙';
    }

    toggleBtn.addEventListener('click', () => {
      toggleBtn.classList.add('rotate');
      setTimeout(() => toggleBtn.classList.remove('rotate'), 600);

      document.body.classList.toggle('dark-mode');

      // Refresh background dengan warna mode baru
      updateTimeBasedBackground();

      if (document.body.classList.contains('dark-mode')) {
        toggleBtn.textContent = '☀️';
      } else {
        toggleBtn.textContent = '🌙';
      }
    });

    // ==================== SKYLINE SVG GENERATION ====================

    function generateSkyline() {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');

      // Draw buildings
      ctx.fillStyle = 'rgba(30, 30, 50, 0.8)';
      const buildings = [
        { x: 0, y: 100, w: 60, h: 100 },
        { x: 70, y: 80, w: 80, h: 120 },
        { x: 160, y: 120, w: 50, h: 80 },
        { x: 220, y: 90, w: 90, h: 110 },
        { x: 320, y: 110, w: 70, h: 90 }
      ];

      buildings.forEach(b => {
        ctx.fillRect(b.x, b.y, b.w, b.h);
        
        // Draw windows
        ctx.fillStyle = 'rgba(255, 200, 0, 0.6)';
        for (let row = 0; row < b.h / 20; row++) {
          for (let col = 0; col < b.w / 15; col++) {
            if (Math.random() > 0.3) {
              ctx.fillRect(b.x + col * 15 + 3, b.y + row * 20 + 3, 8, 8);
            }
          }
        }
      });

      const url = canvas.toDataURL();
      document.querySelector('.skyline').style.backgroundImage = `url('${url}')`;
    }

    generateSkyline();