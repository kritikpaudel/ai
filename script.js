function shuffle(items) {
    const next = items.slice();

    for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
    }

    return next;
}

/* ═══════════════════════════════════════════════════════
   STARFIELD
═══════════════════════════════════════════════════════ */
(function () {
    const c = document.getElementById('starfield');
    if (!c) return;

    const ctx = c.getContext('2d');
    let stars = [];

    function resize() {
        c.width = window.innerWidth;
        c.height = window.innerHeight;
        createStars();
    }

    function createStars() {
        stars = [];

        for (let i = 0; i < 180; i++) {
            stars.push({
                x: Math.random() * c.width,
                y: Math.random() * c.height,
                r: Math.random() * 1.8 + 0.3,
                a: Math.random(),
                da: (0.003 + Math.random() * 0.006) * (Math.random() < 0.5 ? 1 : -1)
            });
        }
    }

    function draw() {
        ctx.clearRect(0, 0, c.width, c.height);

        stars.forEach(s => {
            s.a += s.da;

            if (s.a <= 0 || s.a >= 1) {
                s.da *= -1;
            }

            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${s.a})`;
            ctx.fill();
        });

        requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize);

    resize();
    draw();
})();

/* ═══════════════════════════════════════════════════════
   AUDIO
═══════════════════════════════════════════════════════ */
const Audio = {
    ctx: null,
    muted: false,

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    },

    play(type) {
        if (this.muted) return;

        try {
            this.init();

            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();

            o.connect(g);
            g.connect(this.ctx.destination);

            const now = this.ctx.currentTime;

            const configs = {
                correct: { freq: 523, freq2: 659, dur: 0.25, type: 'sine' },
                wrong: { freq: 200, freq2: 180, dur: 0.3, type: 'sawtooth' },
                drop: { freq: 440, freq2: 440, dur: 0.1, type: 'sine' },
                complete: { freq: 523, freq2: 784, dur: 0.5, type: 'sine' },
                click: { freq: 380, freq2: 380, dur: 0.08, type: 'sine' },
                badge: { freq: 659, freq2: 880, dur: 0.4, type: 'triangle' }
            };

            const c = configs[type] || configs.click;

            o.type = c.type;
            o.frequency.setValueAtTime(c.freq, now);
            o.frequency.linearRampToValueAtTime(c.freq2, now + c.dur);

            g.gain.setValueAtTime(0.15, now);
            g.gain.exponentialRampToValueAtTime(0.001, now + c.dur);

            o.start(now);
            o.stop(now + c.dur);
        } catch (e) {
            console.warn('Audio failed:', e);
        }
    },

    toggle() {
        this.muted = !this.muted;

        const btn = document.getElementById('soundBtn');
        if (btn) {
            btn.textContent = this.muted ? '🔇' : '🔊';
        }
    }
};

const soundBtn = document.getElementById('soundBtn');
if (soundBtn) {
    soundBtn.addEventListener('click', () => Audio.toggle());
}

/* ═══════════════════════════════════════════════════════
   CONFETTI
═══════════════════════════════════════════════════════ */
const Confetti = (() => {
    const c = document.getElementById('confetti-canvas');

    if (!c) {
        return {
            burst() { }
        };
    }

    const ctx = c.getContext('2d');
    let pieces = [];
    let running = false;

    c.width = window.innerWidth;
    c.height = window.innerHeight;

    window.addEventListener('resize', () => {
        c.width = window.innerWidth;
        c.height = window.innerHeight;
    });

    const COLORS = [
        '#f8d84a',
        '#00d4c8',
        '#7c4dff',
        '#ff4081',
        '#00e676',
        '#2979ff',
        '#ff9100'
    ];

    function spawn() {
        for (let i = 0; i < 90; i++) {
            pieces.push({
                x: Math.random() * c.width,
                y: -20,
                r: Math.random() * 8 + 4,
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                vx: (Math.random() - 0.5) * 6,
                vy: Math.random() * 4 + 3,
                rotation: Math.random() * 360,
                vr: (Math.random() - 0.5) * 8,
                shape: Math.random() < 0.5 ? 'rect' : 'circle',
                life: 1
            });
        }
    }

    function draw() {
        ctx.clearRect(0, 0, c.width, c.height);

        pieces = pieces.filter(p => p.y < c.height + 30 && p.life > 0);

        pieces.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.12;
            p.rotation += p.vr;
            p.life -= 0.006;

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation * Math.PI / 180);
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;

            if (p.shape === 'rect') {
                ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2);
            } else {
                ctx.beginPath();
                ctx.arc(0, 0, p.r / 2, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        });

        if (running || pieces.length > 0) {
            requestAnimationFrame(draw);
        } else {
            ctx.clearRect(0, 0, c.width, c.height);
        }
    }

    return {
        burst() {
            running = true;
            spawn();
            draw();

            setTimeout(() => {
                running = false;
            }, 3000);
        }
    };
})();

/* ═══════════════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════════════ */
let toastTimer = null;

function hideToast() {
    const t = document.getElementById('toast');
    if (!t) return;

    t.classList.remove('show');

    clearTimeout(toastTimer);

    setTimeout(() => {
        if (!t.classList.contains('show')) {
            t.innerHTML = '';
            t.className = 'toast';
        }
    }, 350);
}

function showToast(msg, type = 'info', duration = 2200) {
    const t = document.getElementById('toast');
    if (!t) return;

    clearTimeout(toastTimer);

    t.className = 'toast ' + type;
    t.innerHTML = msg;

    requestAnimationFrame(() => {
        t.classList.add('show');
    });

    toastTimer = setTimeout(() => {
        hideToast();
    }, duration);
}

/* ═══════════════════════════════════════════════════════
   SCREEN TRANSITIONS
═══════════════════════════════════════════════════════ */
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.add('hidden');
    });

    const target = document.getElementById(id);

    if (target) {
        target.classList.remove('hidden');
    }
}

/* ═══════════════════════════════════════════════════════
   GAME STATE
═══════════════════════════════════════════════════════ */
const MISSIONS = [
    {
        id: 'school',
        name: 'AI or Not?',
        icon: '🏫',
        color: '#7c4dff',
        nodeA: '#7c4dff',
        nodeB: '#2979ff',
        desc: 'Sort what is and isn\'t AI'
    },
    {
        id: 'studio',
        name: 'Choose the Right AI Tool',
        icon: '🎨',
        color: '#ff4081',
        nodeA: '#ff4081',
        nodeB: '#ff9100',
        desc: 'Match scenarios to AI tools'
    },
    {
        id: 'prompt',
        name: 'Prompt Rescue',
        icon: '✍️',
        color: '#00d4c8',
        nodeA: '#00d4c8',
        nodeB: '#00a89e',
        desc: 'Build better prompts with COSTAR'
    },
    {
        id: 'lab',
        name: 'Output Detective',
        icon: '🔬',
        color: '#f8d84a',
        nodeA: '#f8d84a',
        nodeB: '#ff9100',
        desc: 'Match outputs to prompt quality'
    },
    {
        id: 'safety',
        name: 'Safety Center',
        icon: '🛡️',
        color: '#00e676',
        nodeA: '#00e676',
        nodeB: '#00c853',
        desc: 'Catch responsible AI behaviors'
    }
];

const BADGES = [
    { id: 'school', icon: '🎓', name: 'AI Detector' },
    { id: 'studio', icon: '🎨', name: 'Creative Master' },
    { id: 'prompt', icon: '✍️', name: 'Prompt Pro' },
    { id: 'lab', icon: '🔬', name: 'Quality Analyst' },
    { id: 'safety', icon: '🛡️', name: 'AI Guardian' }
];

let state = {
    player: 'Hero',
    stars: {},
    badges: [],
    currentMission: null,
    missionScores: {},
    totalStars: 0
};

function loadState() {
    // Game progress is per-session only.
}

function saveState() {
    // No localStorage for game progress.
}

/* ═══════════════════════════════════════════════════════
   WELCOME / START
═══════════════════════════════════════════════════════ */
function startGame() {
    const input = document.getElementById('playerNameInput');
    const n = input ? input.value.trim() : '';

    if (n) {
        state.player = n;
    }

    saveState();
    Audio.play('click');
    showScreen('screen-map');
    renderMap();
}

function showHowToPlay() {
    showToast(
        '🎮 Drag items to complete each mission. Click parts of the screen to interact. Earn ⭐ stars and 🏅 badges to unlock the celebration page!',
        'info',
        4000
    );
}

function restartGame() {
    state.stars = {};
    state.badges = [];
    state.missionScores = {};
    state.totalStars = 0;

    saveState();

    showScreen('screen-welcome');

    const input = document.getElementById('playerNameInput');
    if (input) {
        input.value = state.player;
    }
}

/* ═══════════════════════════════════════════════════════
   REGISTRATION TO GOOGLE SHEETS
═══════════════════════════════════════════════════════ */
const GOOGLE_SHEET_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzJEaBzDQ-osQ-eJsKUYd9-fknni-mnHOVyWHTGsIDQaQDC9BanywnUqOv8MZAXLXYh/exec';
const ADMIN_PAGE_URL = 'admin.html';
const GOOGLE_SHEET_ADMIN_URL = 'https://docs.google.com/spreadsheets/d/12pLzLhB4-k_F-9lY31iY2K_R1x82-Y7c43-4-934nI/edit?usp=sharing';

const REG_COOKIE_NAME = 'aiHeroRegisteredUser';
const REG_COOKIE_DAYS = 7;

function setRegistrationCookie(fullName) {
    const payload = {
        fullName,
        registeredAt: new Date().toISOString()
    };

    const encodedValue = encodeURIComponent(JSON.stringify(payload));
    const maxAge = REG_COOKIE_DAYS * 24 * 60 * 60;

    document.cookie = `${REG_COOKIE_NAME}=${encodedValue}; max-age=${maxAge}; path=/; SameSite=Lax`;
}

function getRegistrationCookie() {
    const cookies = document.cookie ? document.cookie.split('; ') : [];

    for (const cookie of cookies) {
        const parts = cookie.split('=');
        const name = parts.shift();
        const value = parts.join('=');

        if (name === REG_COOKIE_NAME) {
            try {
                return JSON.parse(decodeURIComponent(value));
            } catch (error) {
                return null;
            }
        }
    }

    return null;
}

function clearRegistrationCookie() {
    document.cookie = `${REG_COOKIE_NAME}=; max-age=0; path=/; SameSite=Lax`;
}

function isGoogleSheetConfigured() {
    return GOOGLE_SHEET_WEB_APP_URL &&
        !GOOGLE_SHEET_WEB_APP_URL.includes('PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE') &&
        /^https:\/\/script\.google\.com\/macros\/s\//.test(GOOGLE_SHEET_WEB_APP_URL);
}

function clearRegFieldErrors() {
    ['Name', 'Email', 'School', 'Phone'].forEach(f => {
        const field = document.getElementById('regField' + f);
        const err = document.getElementById('regErr' + f);

        if (field) {
            field.classList.remove('error');
        }

        if (err) {
            err.textContent = '';
        }
    });
}

function setRegFieldError(field, msg) {
    const wrapper = document.getElementById('regField' + field);
    const err = document.getElementById('regErr' + field);

    if (wrapper) {
        wrapper.classList.add('error');
    }

    if (err) {
        err.textContent = msg;
    }
}

function validateRegistrationForm(fullName, email, school, phone) {
    let valid = true;

    if (!fullName) {
        setRegFieldError('Name', 'Please enter your full name.');
        valid = false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
        setRegFieldError('Email', 'Please enter your email address.');
        valid = false;
    } else if (!emailPattern.test(email)) {
        setRegFieldError('Email', 'Please enter a valid email address.');
        valid = false;
    }

    if (!school) {
        setRegFieldError('School', 'Please enter your school name.');
        valid = false;
    }

    const phoneDigits = phone.replace(/[^0-9]/g, '');

    if (!phone) {
        setRegFieldError('Phone', 'Please enter your contact number.');
        valid = false;
    } else if (phoneDigits.length < 7 || phoneDigits.length > 15) {
        setRegFieldError('Phone', 'Please enter a valid contact number.');
        valid = false;
    }

    return valid;
}

async function sendRegistrationToGoogleSheet(record) {
    if (!isGoogleSheetConfigured()) {
        throw new Error('Google Sheet Web App URL is not configured.');
    }

    await fetch(GOOGLE_SHEET_WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(record)
    });

    return true;
}

async function submitRegistration() {
    clearRegFieldErrors();

    const fullName = document.getElementById('regFullName')?.value.trim() || '';
    const email = document.getElementById('regEmail')?.value.trim() || '';
    const school = document.getElementById('regSchool')?.value.trim() || '';
    const phone = document.getElementById('regPhone')?.value.trim() || '';

    const valid = validateRegistrationForm(fullName, email, school, phone);

    if (!valid) {
        Audio.play('wrong');
        return;
    }

    const submitBtn = document.querySelector('.reg-submit-row .btn');
    const oldBtnText = submitBtn ? submitBtn.innerHTML : '';

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Registering...';
    }

    const record = {
        id: 'reg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
        fullName,
        email,
        school,
        phone
    };

    try {
        await sendRegistrationToGoogleSheet(record);

        state.player = fullName;

        setRegistrationCookie(fullName);

        const playerNameInput = document.getElementById('playerNameInput');
        const welcomeGreeting = document.getElementById('welcomeGreeting');

        if (playerNameInput) {
            playerNameInput.value = fullName;
        }

        if (welcomeGreeting) {
            welcomeGreeting.textContent = `Welcome, ${fullName}!`;
        }

        Audio.play('click');
        hideToast();
        showScreen('screen-welcome');
    } catch (error) {
        console.error(error);
        Audio.play('wrong');
        showToast('Registration failed. Please check the Google Sheet setup.', 'wrong', 4000);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = oldBtnText;
        }
    }
}

/* ═══════════════════════════════════════════════════════
   ADMIN HANDOFF
═══════════════════════════════════════════════════════ */
function openAdminPage() {
    window.location.href = ADMIN_PAGE_URL;
}

function openGoogleSheetAdmin() {
    if (GOOGLE_SHEET_ADMIN_URL && !GOOGLE_SHEET_ADMIN_URL.includes('PASTE_YOUR_GOOGLE_SHEET_URL_HERE')) {
        window.open(GOOGLE_SHEET_ADMIN_URL, '_blank', 'noopener');
    } else {
        showToast('Add your Google Sheet URL inside GOOGLE_SHEET_ADMIN_URL.', 'info', 3500);
    }
}

function renderAdminLogin() {
    const panel = document.getElementById('adminPanel');

    if (!panel) {
        openAdminPage();
        return;
    }

    panel.innerHTML = `
        <div class="admin-login-card">
            <h2 style="font-family:var(--head);font-size:22px;margin-bottom:6px">Admin Panel</h2>
            <p style="font-size:12.5px;color:var(--text2);margin-bottom:16px;line-height:1.6">
                Registrations are now saved directly to Google Sheets.
                The old browser-only admin table has been disabled.
            </p>
            <button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:6px" onclick="openGoogleSheetAdmin()">Open Google Sheet</button>
            <button class="btn btn-secondary" style="width:100%;justify-content:center;margin-top:10px" onclick="openAdminPage()">Open admin.html</button>
            <button class="admin-link" onclick="showScreen('screen-register')">Back to Registration</button>
        </div>
    `;
}

function adminLogin() {
    renderAdminLogin();
}

function renderAdminTable() {
    renderAdminLogin();
}

function exportRegistrationsToExcel() {
    showToast('Registrations are stored in Google Sheets now. Export from the Sheet.', 'info', 3500);
}

function clearAllRegistrations() {
    showToast('Local registration storage has been removed. Manage records in Google Sheets.', 'info', 3500);
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
}

function isMissionUnlocked(missionId) {
    const idx = MISSIONS.findIndex(m => m.id === missionId);

    if (idx < 0) return false;
    if (idx === 0) return true;

    for (let i = 0; i < idx; i++) {
        if (state.stars[MISSIONS[i].id] === undefined) {
            return false;
        }
    }

    return true;
}

/* ═══════════════════════════════════════════════════════
   MISSION CLEANUP
═══════════════════════════════════════════════════════ */
let activeMissionCleanup = null;

function cleanupActiveMission() {
    if (typeof stopAutoScroll === 'function') {
        stopAutoScroll();
    }

    if (typeof activeMissionCleanup === 'function') {
        try {
            activeMissionCleanup();
        } catch (error) {
            console.error('Mission cleanup failed:', error);
        }
    }

    activeMissionCleanup = null;
}

/* ═══════════════════════════════════════════════════════
   LEVEL SELECT
═══════════════════════════════════════════════════════ */
let lastUnlockedSnapshot = null;

function renderMap() {
    const mapPlayerName = document.getElementById('mapPlayerName');
    const mapScore = document.getElementById('mapScore');
    const globalProgress = document.getElementById('globalProgress');
    const progressPct = document.getElementById('progressPct');
    const progressLevelsLabel = document.getElementById('progressLevelsLabel');
    const path = document.getElementById('levelPath');
    const shelf = document.getElementById('badgesShelf');

    if (mapPlayerName) {
        mapPlayerName.textContent = state.player;
    }

    const total = MISSIONS.reduce((a, m) => a + (state.stars[m.id] || 0), 0);
    state.totalStars = total;

    if (mapScore) {
        mapScore.textContent = total;
    }

    const completedCount = Object.keys(state.stars).length;
    const pct = Math.round((completedCount / MISSIONS.length) * 100);

    if (globalProgress) {
        globalProgress.style.width = pct + '%';
    }

    if (progressPct) {
        progressPct.textContent = pct + '%';
    }

    if (progressLevelsLabel) {
        progressLevelsLabel.textContent = `${completedCount} of ${MISSIONS.length} Levels Completed`;
    }

    const currentlyUnlocked = new Set(
        MISSIONS.filter(m => isMissionUnlocked(m.id)).map(m => m.id)
    );

    const newlyUnlocked = new Set();

    if (lastUnlockedSnapshot) {
        currentlyUnlocked.forEach(id => {
            if (!lastUnlockedSnapshot.has(id)) {
                newlyUnlocked.add(id);
            }
        });
    }

    lastUnlockedSnapshot = currentlyUnlocked;

    if (!path) return;

    path.innerHTML = '';

    MISSIONS.forEach((m, idx) => {
        const unlocked = isMissionUnlocked(m.id);
        const done = state.stars[m.id] !== undefined;
        const active = unlocked && !done;
        const locked = !unlocked;
        const stars = state.stars[m.id] || 0;

        if (idx > 0) {
            const connector = document.createElement('div');
            connector.className = 'level-connector' + (isMissionUnlocked(m.id) ? ' filled' : '');
            path.appendChild(connector);
        }

        const card = document.createElement('div');
        card.className = 'level-card' + (done ? ' completed' : active ? ' active' : ' locked');

        if (newlyUnlocked.has(m.id)) {
            card.classList.add('just-unlocked');
        }

        card.style.setProperty('--node-a', m.nodeA);
        card.style.setProperty('--node-b', m.nodeB);
        card.style.setProperty('--zz', idx % 2 === 0 ? '-38px' : '38px');

        let statusHtml;

        if (locked) {
            statusHtml = `<span class="level-lock-icon">🔒</span><span>Locked</span>`;
        } else if (done) {
            statusHtml = `<span class="level-stars-mini">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</span>`;
        } else {
            statusHtml = `<span>✨ Ready to play</span>`;
        }

        card.innerHTML = `
            <div class="level-node">
                <span class="level-number">${idx + 1}</span>
                <span>${locked ? '🔒' : m.icon}</span>
            </div>
            <div class="level-info">
                <div class="level-title">Level ${idx + 1} — ${m.name}</div>
                <div class="level-status">${statusHtml}</div>
            </div>
            ${done ? '<div class="level-checkmark">✓</div>' : ''}
        `;

        if (!locked) {
            card.addEventListener('click', () => {
                Audio.play('click');
                launchMission(m.id);
            });
        }

        path.appendChild(card);
    });

    if (!shelf) return;

    shelf.innerHTML = '';

    BADGES.forEach(b => {
        const earned = state.badges.includes(b.id);
        const chip = document.createElement('div');

        chip.className = 'badge-chip' + (earned ? ' earned' : '');
        chip.innerHTML = `<span class="badge-icon">${b.icon}</span>${b.name}`;

        shelf.appendChild(chip);
    });
}

function goToMap() {
    cleanupActiveMission();

    Audio.play('click');
    showScreen('screen-map');
    renderMap();
}

/* ═══════════════════════════════════════════════════════
   MISSION LAUNCHER
═══════════════════════════════════════════════════════ */
function launchMission(id) {
    if (!isMissionUnlocked(id)) {
        showToast('🔒 Complete the previous section first to unlock this one.', 'info', 2600);
        Audio.play('wrong');
        return;
    }

    cleanupActiveMission();

    state.currentMission = id;

    const m = MISSIONS.find(x => x.id === id);

    if (!m) {
        showToast('Mission not found.', 'wrong', 2500);
        return;
    }

    const missionIconSm = document.getElementById('missionIconSm');
    const missionNameSm = document.getElementById('missionNameSm');
    const screenMission = document.getElementById('screen-mission');
    const body = document.getElementById('missionBody');

    if (missionIconSm) {
        missionIconSm.textContent = m.icon;
    }

    if (missionNameSm) {
        missionNameSm.textContent = m.name;
    }

    if (screenMission) {
        screenMission.style.setProperty('--mission-color', m.color + '44');
    }

    showScreen('screen-mission');

    if (!body) {
        console.error('Mission body not found.');
        return;
    }

    body.innerHTML = '<div class="spinner"></div>';

    setTimeout(() => {
        try {
            switch (id) {
                case 'school':
                    buildMission1(body);
                    break;

                case 'studio':
                    buildMission2(body);
                    break;

                case 'prompt':
                    buildMission3(body);
                    break;

                case 'lab':
                    buildMission4(body);
                    break;

                case 'safety':
                    buildMission5(body);
                    break;

                default:
                    throw new Error('Unknown mission id: ' + id);
            }
        } catch (error) {
            console.error('Mission loading failed:', error);

            body.innerHTML = `
                <div class="mission-instruction">
                    <h2>Level loading error</h2>
                    <p style="color:var(--text2)">
                        Something broke while loading this level.
                        Open the browser console to see the exact error.
                    </p>
                    <p style="color:var(--red);font-family:monospace;font-size:13px;margin-top:12px">
                        ${escapeHtml(error.message)}
                    </p>
                </div>
            `;
        }
    }, 400);
}

function setMiniProg(done, total) {
    const safeTotal = Number(total) || 0;
    const safeDone = Number(done) || 0;
    const pct = safeTotal > 0 ? Math.round((safeDone / safeTotal) * 100) : 0;

    const fill = document.getElementById('miniProgFill');
    const label = document.getElementById('miniProgLabel');

    if (fill) {
        fill.style.width = pct + '%';
    }

    if (label) {
        label.textContent = `${safeDone} / ${safeTotal}`;
    }
}

/* ═══════════════════════════════════════════════════════
   DRAG AND DROP ENGINE — MOBILE FRIENDLY
═══════════════════════════════════════════════════════ */
let dragState = {
    el: null,
    ghost: null,
    ox: 0,
    oy: 0,
    onDrop: null,
    lastX: 0,
    lastY: 0,
    scrollTimer: null
};

function makeDraggable(el, onDrop) {
    if (!el) return;
    if (el.dataset.draggableBound === '1') return;

    el.dataset.draggableBound = '1';
    el.classList.add('draggable');

    el.addEventListener('mousedown', e => startDrag(e, el, onDrop));
    el.addEventListener('touchstart', e => startDrag(e, el, onDrop), { passive: false });
}

function startDrag(e, el, onDrop) {
    if (el.classList.contains('used') || el.classList.contains('matched')) return;

    e.preventDefault();

    Audio.play('click');

    const isTouch = e.touches && e.touches.length;
    const cx = isTouch ? e.touches[0].clientX : e.clientX;
    const cy = isTouch ? e.touches[0].clientY : e.clientY;

    const rect = el.getBoundingClientRect();

    dragState.ox = cx - rect.left;
    dragState.oy = cy - rect.top;
    dragState.el = el;
    dragState.onDrop = onDrop;
    dragState.lastX = cx;
    dragState.lastY = cy;

    const ghost = el.cloneNode(true);

    ghost.classList.add('ghost');
    ghost.style.width = rect.width + 'px';
    ghost.style.left = (cx - dragState.ox) + 'px';
    ghost.style.top = (cy - dragState.oy) + 'px';

    document.body.appendChild(ghost);

    dragState.ghost = ghost;
    el.classList.add('dragging');

    document.addEventListener('mousemove', moveDrag);
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchmove', moveDrag, { passive: false });
    document.addEventListener('touchend', endDrag);

    startAutoScroll();
}

function moveDrag(e) {
    if (!dragState.ghost) return;

    e.preventDefault();

    const isTouch = e.touches && e.touches.length;
    const cx = isTouch ? e.touches[0].clientX : e.clientX;
    const cy = isTouch ? e.touches[0].clientY : e.clientY;

    dragState.lastX = cx;
    dragState.lastY = cy;

    dragState.ghost.style.left = (cx - dragState.ox) + 'px';
    dragState.ghost.style.top = (cy - dragState.oy) + 'px';

    updateDropHover(cx, cy);
}

function endDrag(e) {
    if (!dragState.ghost) return;

    const isTouch = e.changedTouches && e.changedTouches.length;
    const cx = isTouch ? e.changedTouches[0].clientX : dragState.lastX;
    const cy = isTouch ? e.changedTouches[0].clientY : dragState.lastY;

    stopAutoScroll();

    let dropped = false;

    document.querySelectorAll('.drop-zone,.sort-zone,.tool-card,.costar-drop,.quality-zone').forEach(z => {
        z.classList.remove('drag-over');

        const r = z.getBoundingClientRect();
        const over = cx > r.left && cx < r.right && cy > r.top && cy < r.bottom;

        if (over && !dropped) {
            dropped = true;

            if (dragState.onDrop) {
                dragState.onDrop(dragState.el, z);
            }
        }
    });

    if (dragState.ghost) {
        dragState.ghost.remove();
    }

    if (dragState.el) {
        dragState.el.classList.remove('dragging');
    }

    dragState = {
        el: null,
        ghost: null,
        ox: 0,
        oy: 0,
        onDrop: null,
        lastX: 0,
        lastY: 0,
        scrollTimer: null
    };

    document.removeEventListener('mousemove', moveDrag);
    document.removeEventListener('mouseup', endDrag);
    document.removeEventListener('touchmove', moveDrag);
    document.removeEventListener('touchend', endDrag);
}

function updateDropHover(cx, cy) {
    document.querySelectorAll('.drop-zone,.sort-zone,.tool-card,.costar-drop,.quality-zone').forEach(z => {
        const r = z.getBoundingClientRect();
        const over = cx > r.left && cx < r.right && cy > r.top && cy < r.bottom;

        z.classList.toggle('drag-over', over);
    });
}

function getMissionScrollContainer() {
    return document.querySelector('#screen-mission:not(.hidden) .mission-body') || document.scrollingElement;
}

function startAutoScroll() {
    stopAutoScroll();

    dragState.scrollTimer = setInterval(() => {
        if (!dragState.ghost) return;

        const container = getMissionScrollContainer();
        if (!container) return;

        const y = dragState.lastY;
        const edgeSize = 90;
        const speed = 18;
        const viewportHeight = window.innerHeight;

        if (y > viewportHeight - edgeSize) {
            container.scrollTop += speed;
        } else if (y < edgeSize) {
            container.scrollTop -= speed;
        }

        updateDropHover(dragState.lastX, dragState.lastY);
    }, 16);
}

function stopAutoScroll() {
    if (dragState.scrollTimer) {
        clearInterval(dragState.scrollTimer);
        dragState.scrollTimer = null;
    }
}

/* ═══════════════════════════════════════════════════════
   MISSION 1
═══════════════════════════════════════════════════════ */
function buildMission1(body) {
    const items = [
        { id: 'chatgpt', label: 'ChatGPT', icon: '💬', isAI: true },
        { id: 'calc', label: 'Calculator', icon: '🔢', isAI: false },
        { id: 'gmaps', label: 'Google Maps', icon: '🗺️', isAI: true },
        { id: 'vacuum', label: 'Robot Vacuum', icon: '🤖', isAI: true },
        { id: 'teacher', label: 'Teacher', icon: '👩‍🏫', isAI: false },
        { id: 'selfcar', label: 'Self-driving Car', icon: '🚗', isAI: true },
        { id: 'spam', label: 'Spam Filter', icon: '📧', isAI: true },
        { id: 'toaster', label: 'Toaster', icon: '🍞', isAI: false }
    ];

    let sorted = {
        ai: [],
        notai: []
    };

    const total = items.length;

    body.innerHTML = `
        <div class="mission-instruction">
            <h2>🏫 The Sorting Challenge</h2>
            <p>
                Drag each card into the correct category.
                <strong>Which ones are AI?</strong><br>
                Remember: true AI <em>learns</em> from data.
                It does not just follow fixed rules.
            </p>
        </div>

        <div class="cards-bank" id="m1Bank"></div>

        <div class="sort-arena">
            <div class="sort-zone" id="zone-ai" style="border-color:rgba(0,212,200,0.3)">
                <div class="sort-zone-header">
                    <div class="zone-dot" style="background:var(--teal)"></div>
                    🤖 AI
                </div>
                <div class="sort-items" id="items-ai">
    <span class="sort-placeholder">Drop AI items here</span>
</div>
            </div>

            <div class="sort-zone" id="zone-notai" style="border-color:rgba(255,145,0,0.3)">
                <div class="sort-zone-header">
                    <div class="zone-dot" style="background:var(--orange)"></div>
                    🚫 Not AI
                </div>
               <div class="sort-items" id="items-notai">
    <span class="sort-placeholder">Drop non-AI items here</span>
</div>
            </div>
        </div>

        <div class="submit-row">
            <button class="btn btn-primary hidden" id="m1Submit">Check My Answers ✓</button>
        </div>
    `;

    const bank = document.getElementById('m1Bank');

    items.forEach(item => {
        const card = document.createElement('div');

        card.className = 'sort-card draggable';
        card.id = 'card-' + item.id;
        card.dataset.id = item.id;
        card.innerHTML = `<span class="sort-card-icon">${item.icon}</span><span>${item.label}</span>`;

        bank.appendChild(card);

        makeDraggable(card, (el, zone) => dropM1(el, zone, item));
    });

    setMiniProg(0, total);

    function dropM1(el, zone, item) {
        const targetType = zone.id === 'zone-ai' || zone.id === 'items-ai' ? 'ai' : 'notai';
        const container = document.getElementById('items-' + targetType);

        if (!container) return;

        const ph = container.querySelector('.sort-placeholder');

        if (ph) {
            ph.remove();
        }

        el.style.cursor = 'default';
        container.appendChild(el);

        ['ai', 'notai'].forEach(t => {
            sorted[t] = sorted[t].filter(x => x !== item.id);
        });

        sorted[targetType].push(item.id);

        const totalSorted = sorted.ai.length + sorted.notai.length;

        setMiniProg(totalSorted, total);
        Audio.play('drop');

        const submit = document.getElementById('m1Submit');

        if (totalSorted === total && submit) {
            submit.classList.remove('hidden');
        }
    }

    const submit = document.getElementById('m1Submit');

    if (submit) {
        submit.addEventListener('click', () => {
            Audio.play('complete');

            let score = 0;

            items.forEach(item => {
                const expectedZone = item.isAI ? 'ai' : 'notai';
                const correct = sorted[expectedZone].includes(item.id);
                const el = document.getElementById('card-' + item.id);

                if (el) {
                    el.style.border = '2px solid ' + (correct ? 'var(--green)' : 'var(--red)');
                    el.style.background = correct ? 'rgba(0,200,83,0.15)' : 'rgba(255,82,82,0.15)';
                }

                if (correct) {
                    score++;
                }
            });

            setTimeout(() => {
                const stars = score >= 7 ? 3 : score >= 5 ? 2 : 1;

                completeMission(
                    'school',
                    stars,
                    score,
                    total,
                    `You correctly identified ${score} out of ${total} items. AI systems learn from data. That is what makes them different from regular software.`
                );
            }, 800);
        });
    }
}

/* ═══════════════════════════════════════════════════════
   MISSION 2
═══════════════════════════════════════════════════════ */
function buildMission2(body) {
    const tools = [
        { id: 'chatgpt', name: 'ChatGPT', icon: '💬', hint: 'Best for writing, brainstorming and text generation' },
        { id: 'canva', name: 'Canva AI', icon: '🎨', hint: 'Best for visual design, posters and presentations' },
        { id: 'copilot', name: 'Microsoft Copilot', icon: '🪟', hint: 'Best for Office docs, summaries and spreadsheets' },
        { id: 'gemini', name: 'Google Gemini', icon: '♊', hint: 'Best for research, web queries and lesson planning' },
        { id: 'dalle', name: 'DALL-E / Image AI', icon: '🖼️', hint: 'Best for generating original images and artwork' }
    ];

    const scenarios = [
        { id: 's1', text: '📊 Summarise a 20-page school inspection report into 5 bullet points', correct: 'copilot' },
        { id: 's2', text: '🎓 Create a differentiated lesson plan for mixed-ability Year 8 students', correct: 'gemini' },
        { id: 's3', text: '✍️ Write engaging feedback comments for 30 student essays', correct: 'chatgpt' },
        { id: 's4', text: '🖼️ Design a colourful classroom poster about growth mindset', correct: 'canva' },
        { id: 's5', text: '🌄 Generate a fantasy illustration for a creative writing class', correct: 'dalle' }
    ];

    let matched = 0;

    body.innerHTML = `
        <div class="mission-instruction">
            <h2>🎨 Creative Studio</h2>
            <p>Drag each classroom scenario onto the best AI tool.</p>
        </div>

        <div class="match-layout">
            <div>
                <h3>📋 Scenarios</h3>
                <div class="scenario-list" id="scenList"></div>
            </div>
            <div>
                <h3>🤖 AI Tools</h3>
                <div class="tool-list" id="toolList"></div>
            </div>
        </div>
    `;

    const scenList = document.getElementById('scenList');
    const toolList = document.getElementById('toolList');

    setMiniProg(0, scenarios.length);

    scenarios.forEach(s => {
        const card = document.createElement('div');

        card.className = 'scenario-card';
        card.id = 'sc-' + s.id;
        card.dataset.correct = s.correct;
        card.innerHTML = `<span>📌</span>${s.text}`;

        scenList.appendChild(card);

        makeDraggable(card, (el, zone) => dropM2(el, zone, s));
    });

    tools.forEach(t => {
        const card = document.createElement('div');

        card.className = 'tool-card drop-zone';
        card.id = 'tool-' + t.id;
        card.dataset.toolId = t.id;
        card.innerHTML = `
            <span class="tool-icon">${t.icon}</span>
            <div class="tool-info">
                <div class="tool-name">${t.name}</div>
                <div class="tool-hint">${t.hint}</div>
            </div>
            <span class="match-badge" id="mb-${t.id}">✅</span>
        `;

        toolList.appendChild(card);
    });

    function dropM2(el, zone, scenario) {
        const toolId = zone.dataset.toolId || zone.id.replace('tool-', '');
        if (!toolId) return;

        const isCorrect = toolId === scenario.correct;

        Audio.play(isCorrect ? 'correct' : 'wrong');

        if (isCorrect) {
            el.classList.add('matched');
            zone.classList.add('correct-match');

            const badge = document.getElementById('mb-' + toolId);
            if (badge) {
                badge.classList.add('show');
            }

            matched++;

            setMiniProg(matched, scenarios.length);
            showToast('✅ Correct! Great thinking!', 'correct');

            if (matched === scenarios.length) {
                setTimeout(() => {
                    completeMission(
                        'studio',
                        3,
                        matched,
                        scenarios.length,
                        'You matched every scenario to the right AI tool. Knowing which tool to use is a key part of AI literacy.'
                    );
                }, 600);
            }
        } else {
            zone.classList.add('wrong-match');

            setTimeout(() => {
                zone.classList.remove('wrong-match');
            }, 600);

            const tool = tools.find(t => t.id === toolId);

            showToast(
                `🤔 Not quite. Think about what ${tool ? tool.name : 'this tool'} is best for.`,
                'wrong',
                3000
            );
        }
    }
}

/* ═══════════════════════════════════════════════════════
   MISSION 3
═══════════════════════════════════════════════════════ */
function buildMission3(body) {
    const costarParts = [
        { id: 'role', label: 'Role', emoji: '🎭', desc: 'Act as a Year 9 science teacher' },
        { id: 'context', label: 'Context', emoji: '📚', desc: 'My class has just finished the unit on ecosystems' },
        { id: 'task', label: 'Task', emoji: '📝', desc: 'Create a 10-question revision quiz' },
        { id: 'output', label: 'Output Format', emoji: '📋', desc: 'Numbered list with answer key at the end' },
        { id: 'audience', label: 'Audience', emoji: '👥', desc: 'for 13–14 year old students' },
        { id: 'constraints', label: 'Constraints', emoji: '⛔', desc: 'Use simple language, no jargon' }
    ];

    const weakPrompt = 'Write me a quiz on ecosystem.';

    const strongOutputLines = [
        '<strong>✅ STRONG PROMPT OUTPUT:</strong>',
        'Acting as a Year 9 science teacher...',
        '1. What is a food chain? Energy flow through organisms.',
        '2. Which term describes an organism that makes its own food? Producer.',
        '3. What happens when a species is removed from an ecosystem?',
        'Answer key included at the end.',
        'Generated in the correct format for 13–14 year olds.'
    ];

    const weakOutputLines = [
        '<strong>❌ WEAK PROMPT OUTPUT:</strong>',
        '1. What is an ecosystem?',
        '2. What is photosynthesis?',
        '3. Name a producer.',
        '4. What is a food web?',
        'Vague, no age consideration, no format, no difficulty level specified.'
    ];

    let filled = {};
    let reviewTimer = null;
    let reviewEndsAt = 0;

    activeMissionCleanup = () => {
        if (reviewTimer) {
            clearInterval(reviewTimer);
        }

        reviewTimer = null;
    };

    body.innerHTML = `
        <div class="mission-instruction">
            <h2>✍️ Prompt Workshop</h2>
            <p>A weak prompt gives weak results. Drag the COSTAR components into the prompt template below.</p>
        </div>

        <div class="prompt-layout">
            <div class="prompt-box">
                <div class="prompt-box-label" style="color:var(--red)">❌ Weak Prompt</div>
                <div class="prompt-text" style="color:var(--text2);font-style:italic">"${weakPrompt}"</div>
            </div>

            <div class="prompt-box" style="border-color:var(--purple)">
                <div class="prompt-box-label" style="color:var(--purple)">Build Your COSTAR Prompt</div>
                <div class="prompt-text" id="costarPromptDisplay">
                    <span class="costar-drop" id="drop-role" data-part="role">[Role]</span>:
                    <span class="costar-drop" id="drop-context" data-part="context">[Context]</span>.
                    <span class="costar-drop" id="drop-task" data-part="task">[Task]</span>
                    <span class="costar-drop" id="drop-audience" data-part="audience">[Audience]</span>.
                    Format: <span class="costar-drop" id="drop-output" data-part="output">[Output Format]</span>.
                    Note: <span class="costar-drop" id="drop-constraints" data-part="constraints">[Constraints]</span>.
                </div>
            </div>

            <div class="costar-bank" id="costarBank">
                <div style="width:100%;font-size:11px;color:var(--text2);text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px">
                    COSTAR Components
                </div>
            </div>

            <div id="outputCompareArea" class="output-compare hidden">
                <div class="output-box">
                    <div class="output-label" style="color:var(--red)">Before</div>
                    ${weakOutputLines.map(l => `<p style="margin-bottom:4px">${l}</p>`).join('')}
                </div>

                <div class="output-box enhanced">
                    <div class="output-label" style="color:var(--teal)">After</div>
                    ${strongOutputLines.map(l => `<p style="margin-bottom:4px">${l}</p>`).join('')}
                </div>
            </div>

            <div class="submit-row" style="flex-direction:column;gap:10px;align-items:center">
                <div id="m3ReviewTimer" style="font-size:13px;color:var(--text2);text-align:center">Finish the prompt first.</div>
                <button class="btn btn-primary hidden" id="m3Submit">Continue to AI Lab →</button>
            </div>
        </div>
    `;

    const bank = document.getElementById('costarBank');

    costarParts.forEach(part => {
        const chip = document.createElement('div');

        chip.className = 'costar-chip draggable';
        chip.id = 'chip-' + part.id;
        chip.dataset.partId = part.id;
        chip.innerHTML = `${part.emoji} <span>${part.label}</span>`;
        chip.title = part.desc;

        bank.appendChild(chip);

        makeDraggable(chip, (el, zone) => dropM3(el, zone, part));
    });

    setMiniProg(0, costarParts.length);

    function dropM3(el, zone, part) {
        const targetPart = zone.dataset.part;

        if (!targetPart) return;

        if (targetPart !== part.id) {
            showToast(`❌ "${part.label}" does not fit here.`, 'wrong', 2500);
            Audio.play('wrong');
            return;
        }

        el.classList.add('used');

        zone.textContent = part.emoji + ' ' + part.desc;
        zone.classList.add('filled');

        filled[part.id] = true;

        Audio.play('correct');

        showToast(`✅ ${part.label} added!`, 'correct', 1500);

        const done = Object.keys(filled).length;

        setMiniProg(done, costarParts.length);

        if (done === costarParts.length) {
            startReviewCountdown();
        }
    }

    const m3Submit = document.getElementById('m3Submit');

    if (m3Submit) {
        m3Submit.addEventListener('click', () => {
            Audio.play('complete');

            clearInterval(reviewTimer);

            m3Submit.classList.add('hidden');

            completeMission(
                'prompt',
                3,
                6,
                6,
                'You built a complete COSTAR prompt. A clear prompt gives AI a clear briefing.'
            );
        });
    }

    function startReviewCountdown() {
        const timerEl = document.getElementById('m3ReviewTimer');
        const btn = document.getElementById('m3Submit');
        const compareArea = document.getElementById('outputCompareArea');

        reviewEndsAt = Date.now() + 30000;

        if (compareArea) {
            compareArea.classList.remove('hidden');
        }

        if (btn) {
            btn.classList.add('hidden');
        }

        reviewTimer = setInterval(() => {
            const remaining = Math.max(0, reviewEndsAt - Date.now());
            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000).toString().padStart(2, '0');

            if (timerEl) {
                timerEl.textContent = remaining > 0
                    ? `Review time remaining: ${minutes}:${seconds}.`
                    : 'Review time complete. You can now move forward.';
            }

            if (remaining <= 0) {
                clearInterval(reviewTimer);

                if (btn) {
                    btn.classList.remove('hidden');
                }
            }
        }, 250);
    }
}

/* ═══════════════════════════════════════════════════════
   MISSION 4
═══════════════════════════════════════════════════════ */
function buildMission4(body) {
    if (!body) {
        console.error('Mission body not found.');
        return;
    }

    const outputs = shuffle([
        {
            id: 'out-weak',
            quality: 'weak',
            title: 'Output A',
            icon: 'A',
            text: 'Here is a lesson on fractions. Fractions are parts of a whole. Example: 1/2 means one out of two. You can add fractions. Teach this to students.'
        },
        {
            id: 'out-average',
            quality: 'average',
            title: 'Output B',
            icon: 'B',
            text: 'Lesson: Introduction to Fractions. Grade 4. Learning objective: Students understand what a fraction is. Activity: Use pizza slices to show 1/2, 1/3, and 1/4. Duration: 45 minutes.'
        },
        {
            id: 'out-strong',
            quality: 'strong',
            title: 'Output C',
            icon: 'C',
            text: 'Grade 4 Fractions Lesson. Duration: 45 minutes. Objective: Compare and order fractions. Warm-up: Pizza fraction game. Activity: Fraction cooking challenge. Assessment: Exit ticket. Differentiation included.'
        }
    ]);

    const qualities = [
        {
            id: 'weak',
            label: 'Weak Prompt',
            color: 'var(--red)',
            clue: 'The prompt is too short. It does not mention role, audience, format, duration, or success criteria.'
        },
        {
            id: 'average',
            label: 'Average Prompt',
            color: 'var(--star)',
            clue: 'The prompt has topic, grade, and duration, but it still lacks strong structure, assessment, and differentiation.'
        },
        {
            id: 'strong',
            label: 'Strong Prompt',
            color: 'var(--green)',
            clue: 'The prompt is clear. It includes role, audience, duration, structure, assessment, and differentiation.'
        }
    ];

    let matched = 0;
    const total = outputs.length;

    body.innerHTML = `
        <div class="mission-instruction">
            <h2>AI Lab — Prompt Quality Test</h2>
            <p>
                Scan each case clue, then drag the matching output card to the correct tray.
                Better prompts usually create better AI responses.
            </p>
        </div>

        <div class="lab-layout">
            <div class="lab-outputs" id="labOutputs"></div>
            <div class="lab-quality-zones" id="labZones"></div>
        </div>
    `;

    const labOutputs = document.getElementById('labOutputs');
    const labZones = document.getElementById('labZones');

    if (!labOutputs || !labZones) {
        console.error('Mission 4 containers missing.');
        return;
    }

    setMiniProg(0, total);

    outputs.forEach(output => {
        const card = document.createElement('div');

        card.className = 'lab-output-card draggable';
        card.id = output.id;
        card.dataset.quality = output.quality;

        card.innerHTML = `
            <div class="lab-output-title">
                <span>${output.icon}</span>
                <span>${output.title}</span>
            </div>
            <div class="lab-output-text">${escapeHtml(output.text)}</div>
        `;

        labOutputs.appendChild(card);

        makeDraggable(card, function (el, zone) {
            dropM4(el, zone, output);
        });
    });

    qualities.forEach(quality => {
        const zone = document.createElement('div');

        zone.className = 'quality-zone drop-zone';
        zone.id = 'qzone-' + quality.id;
        zone.dataset.quality = quality.id;

        zone.innerHTML = `
            <div class="lab-zone-head">
                <div class="quality-label" style="color:${quality.color}">
                    ${quality.label}
                </div>

                <button class="lab-clue-btn" type="button" data-clue="${quality.id}">
                    Scan clue
                </button>
            </div>

            <div class="lab-clue" id="labClue-${quality.id}">
                ${escapeHtml(quality.clue)}
            </div>

            <div class="lab-zone-note">
                Use the clue to choose the best match.
            </div>

            <div class="quality-slot" id="qslot-${quality.id}">
                Drop output here
            </div>
        `;

        labZones.appendChild(zone);
    });

    document.querySelectorAll('.lab-clue-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            toggleLabClue(this.dataset.clue);
        });
    });

    function dropM4(el, zone, output) {
        const targetQuality = zone.dataset.quality;

        if (!targetQuality) return;

        const isCorrect = targetQuality === output.quality;

        Audio.play(isCorrect ? 'correct' : 'wrong');

        if (isCorrect) {
            const slot = document.getElementById('qslot-' + targetQuality);

            if (slot) {
                slot.innerHTML = '';

                const clone = el.cloneNode(true);

                clone.classList.remove('draggable', 'dragging', 'ghost');
                clone.style.pointerEvents = 'none';
                clone.style.opacity = '1';

                slot.appendChild(clone);
                slot.classList.add('filled-slot');
            }

            el.style.opacity = '0.3';
            el.style.pointerEvents = 'none';

            zone.style.borderColor = 'var(--green)';

            matched++;

            setMiniProg(matched, total);

            showToast('Correct match. Great analysis.', 'correct', 1800);

            if (matched === total) {
                setTimeout(() => {
                    completeMission(
                        'lab',
                        3,
                        total,
                        total,
                        'Excellent. You can now see the direct relationship between prompt quality and output quality.'
                    );
                }, 700);
            }
        } else {
            zone.style.borderColor = 'var(--red)';

            setTimeout(() => {
                zone.style.borderColor = '';
            }, 600);

            const quality = qualities.find(q => q.id === targetQuality);

            showToast(
                'Not quite. Review the clue: ' + (quality ? quality.clue : ''),
                'wrong',
                4000
            );
        }
    }
}

function toggleLabClue(id) {
    const clue = document.getElementById('labClue-' + id);

    if (!clue) return;

    clue.classList.toggle('revealed');
}

/* ═══════════════════════════════════════════════════════
   MISSION 5
═══════════════════════════════════════════════════════ */
function buildMission5(body) {
    const allItems = [
        { text: '✅ Verify AI outputs before sharing with students', safe: true },
        { text: '✅ Protect student privacy — never share names with AI', safe: true },
        { text: '✅ Cite AI assistance when submitting AI-helped work', safe: true },
        { text: '✅ Review AI-generated lesson plans before teaching', safe: true },
        { text: '✅ Teach students to fact-check AI responses', safe: true },
        { text: '✅ Use anonymised data when prompting AI tools', safe: true },
        { text: '✅ Apply professional judgement over AI suggestions', safe: true },
        { text: '❌ Upload confidential student data to free AI tools', safe: false },
        { text: '❌ Share AI-generated work without reviewing it first', safe: false },
        { text: '❌ Trust AI outputs as 100% factually accurate', safe: false },
        { text: '❌ Let AI make final decisions about student grades', safe: false },
        { text: '❌ Use student photos in AI image generators', safe: false },
        { text: '❌ Submit AI-written content as entirely your own work', safe: false }
    ];

    let caught = 0;
    let lives = 3;
    let activeFallers = [];
    let gameRunning = false;
    let spawnTimer = null;
    let difficultyTimer = null;
    let speed = 8000;
    const targetCaught = 6;

    activeMissionCleanup = () => {
        gameRunning = false;

        clearInterval(spawnTimer);
        clearInterval(difficultyTimer);

        activeFallers.forEach(el => {
            if (el && el.parentNode) {
                el.remove();
            }
        });

        activeFallers = [];
    };

    body.innerHTML = `
        <div class="mission-instruction">
            <h2>🛡️ Safety Center</h2>
            <p>Click only the ✅ good practices before they disappear. Avoid clicking ❌ unsafe behaviours.</p>
        </div>

        <div class="safety-hud">
            <div class="safety-stat">🎯 Caught: <span id="caughtCount" style="color:var(--green)">0</span>/${targetCaught}</div>
            <div class="safety-stat">❤️ Lives: <div class="safety-lives" id="livesDisplay">❤️❤️❤️</div></div>
            <div class="safety-stat">⚡ Speed: <span id="speedLabel" style="color:var(--star)">Normal</span></div>
        </div>

        <div id="safety-arena"></div>
    `;

    const arena = document.getElementById('safety-arena');

    if (!arena) {
        throw new Error('Safety arena not found.');
    }

    setMiniProg(0, targetCaught);

    gameRunning = true;

    function updateLives() {
        const lv = document.getElementById('livesDisplay');

        if (lv) {
            lv.innerHTML = '❤️'.repeat(Math.max(0, lives));
        }
    }

    function spawnItem() {
        if (!gameRunning) return;

        const item = allItems[Math.floor(Math.random() * allItems.length)];
        const el = document.createElement('div');

        el.className = 'falling-item ' + (item.safe ? 'safe' : 'unsafe');
        el.innerHTML = item.text;
        el.style.left = Math.random() * 70 + '%';
        el.style.animationDuration = speed + 'ms';

        arena.appendChild(el);

        el.addEventListener('animationend', () => {
            if (el.parentNode && gameRunning) {
                el.remove();
                activeFallers = activeFallers.filter(x => x !== el);
            }
        });

        el.addEventListener('click', () => {
            if (!gameRunning) return;

            if (item.safe) {
                Audio.play('correct');

                caught++;

                const caughtCount = document.getElementById('caughtCount');

                if (caughtCount) {
                    caughtCount.textContent = caught;
                }

                setMiniProg(caught, targetCaught);

                showToast('✅ Great catch! ' + item.text.substring(2), 'correct', 2000);

                el.remove();
                activeFallers = activeFallers.filter(x => x !== el);

                if (caught >= targetCaught) {
                    endSafety(true);
                }
            } else {
                Audio.play('wrong');

                lives--;

                updateLives();

                el.classList.add('clicked-wrong');

                showToast('❌ That is an unsafe practice. Avoid it.', 'wrong', 2500);

                setTimeout(() => {
                    if (el.parentNode) {
                        el.remove();
                    }
                }, 500);

                if (lives <= 0) {
                    endSafety(false);
                }
            }
        });

        activeFallers.push(el);
    }

    spawnTimer = setInterval(() => {
        if (gameRunning) {
            spawnItem();
        }
    }, 1800);

    spawnItem();

    difficultyTimer = setInterval(() => {
        if (!gameRunning) return;

        speed = Math.max(4000, speed - 800);

        const sl = document.getElementById('speedLabel');

        if (sl) {
            sl.textContent = speed < 5500 ? 'Fast!' : speed < 6500 ? 'Medium' : 'Normal';
        }
    }, 6000);

    function endSafety(success) {
        gameRunning = false;

        clearInterval(spawnTimer);
        clearInterval(difficultyTimer);

        activeMissionCleanup = null;

        arena.innerHTML = '';

        const stars = lives === 3 ? 3 : lives === 2 ? 2 : 1;
        const successStars = success ? stars : 1;

        setTimeout(() => {
            completeMission(
                'safety',
                successStars,
                caught,
                targetCaught,
                success
                    ? `Outstanding. You caught ${caught} responsible AI practices.`
                    : `You caught ${caught} practices. Remember to verify AI outputs, protect student data, and use professional judgement.`
            );
        }, 600);
    }
}

/* ═══════════════════════════════════════════════════════
   MISSION COMPLETE
═══════════════════════════════════════════════════════ */
function completeMission(missionId, stars, score, total, message) {
    Audio.play('badge');
    Confetti.burst();

    state.stars[missionId] = stars;

    if (!state.badges.includes(missionId)) {
        state.badges.push(missionId);
    }

    state.missionScores[missionId] = {
        score,
        total,
        stars
    };

    saveState();

    const ov = document.getElementById('completeOverlay');
    const icon = document.getElementById('completeIcon');
    const title = document.getElementById('completeTitle');
    const starEl = document.getElementById('completeStars');
    const msg = document.getElementById('completeMessage');

    if (icon) {
        icon.textContent = MISSIONS.find(m => m.id === missionId)?.icon || '🎉';
    }

    if (title) {
        title.textContent = 'Mission Complete! ' + '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    }

    if (starEl) {
        starEl.textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    }

    if (msg) {
        msg.innerHTML = `<strong>${score}/${total} correct</strong><br><br>${message}`;
    }

    if (ov) {
        ov.classList.add('show');
    }
}

function dismissComplete() {
    const ov = document.getElementById('completeOverlay');

    if (ov) {
        ov.classList.remove('show');
    }

    cleanupActiveMission();

    if (MISSIONS.every(m => state.stars[m.id] !== undefined)) {
        setTimeout(showCelebration, 900);
    } else {
        goToMap();
    }
}

/* ═══════════════════════════════════════════════════════
   CELEBRATION
═══════════════════════════════════════════════════════ */
function showCelebration() {
    Audio.play('badge');
    Confetti.burst();

    const totalStars = MISSIONS.reduce((a, m) => a + (state.stars[m.id] || 0), 0);
    const maxStars = MISSIONS.length * 3;
    const playerName = document.getElementById('playerNameInput')?.value.trim() || state.player || 'Hero';

    state.player = playerName;

    saveState();

    showScreen('screen-results');

    const celebrationBadge = document.getElementById('celebrationBadge');
    const celebrationTitle = document.getElementById('celebrationTitle');
    const celebrationSubtitle = document.getElementById('celebrationSubtitle');
    const celebrationMessage = document.getElementById('celebrationMessage');
    const celebrationStars = document.getElementById('celebrationStars');
    const stats = document.getElementById('celebrationStats');

    if (celebrationBadge) {
        celebrationBadge.textContent = '🎉';
    }

    if (celebrationTitle) {
        celebrationTitle.textContent = 'You finished the AI Journey';
    }

    if (celebrationSubtitle) {
        celebrationSubtitle.textContent = `Great work, ${playerName}`;
    }

    if (celebrationMessage) {
        celebrationMessage.textContent = 'You explored what AI is, how to prompt it well, how to evaluate outputs, and how to stay responsible while using it.';
    }

    if (celebrationStars) {
        celebrationStars.textContent = '⭐'.repeat(totalStars) + '☆'.repeat(maxStars - totalStars);
    }

    if (stats) {
        stats.innerHTML = '';

        [
            { label: 'Total stars', value: `${totalStars}/${maxStars}` },
            { label: 'Missions complete', value: Object.keys(state.stars).length },
            { label: 'AI confidence', value: totalStars >= 12 ? 'High' : 'Growing' }
        ].forEach(item => {
            const chip = document.createElement('div');

            chip.className = 'celebration-chip';
            chip.innerHTML = `<strong>${item.value}</strong> ${item.label}`;

            stats.appendChild(chip);
        });
    }

    setTimeout(() => Confetti.burst(), 800);
}

/* ═══════════════════════════════════════════════════════
   REGISTER NEW PARTICIPANT
═══════════════════════════════════════════════════════ */
function registerAsNewParticipant() {
    clearRegistrationCookie();

    state.player = 'Hero';
    state.stars = {};
    state.badges = [];
    state.currentMission = null;
    state.missionScores = {};
    state.totalStars = 0;

    ['regFullName', 'regEmail', 'regSchool', 'regPhone'].forEach(id => {
        const el = document.getElementById(id);

        if (el) {
            el.value = '';
        }
    });

    const playerNameInput = document.getElementById('playerNameInput');
    const welcomeGreeting = document.getElementById('welcomeGreeting');

    if (playerNameInput) {
        playerNameInput.value = '';
    }

    if (welcomeGreeting) {
        welcomeGreeting.textContent = '';
    }

    clearRegFieldErrors();
    cleanupActiveMission();
    showScreen('screen-register');
}

/* ═══════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════ */
loadState();

const savedRegistration = getRegistrationCookie();

if (savedRegistration && savedRegistration.fullName) {
    state.player = savedRegistration.fullName;

    const playerNameInput = document.getElementById('playerNameInput');
    const welcomeGreeting = document.getElementById('welcomeGreeting');

    if (playerNameInput) {
        playerNameInput.value = savedRegistration.fullName;
    }

    if (welcomeGreeting) {
        welcomeGreeting.textContent = `Welcome back, ${savedRegistration.fullName}!`;
    }

    showScreen('screen-welcome');
} else {
    showScreen('screen-register');
}

/* ═══════════════════════════════════════════════════════
   EXPOSE FUNCTIONS FOR HTML onclick ATTRIBUTES
═══════════════════════════════════════════════════════ */
Object.assign(window, {
    startGame,
    showHowToPlay,
    restartGame,
    submitRegistration,
    openAdminPage,
    openGoogleSheetAdmin,
    renderAdminLogin,
    adminLogin,
    renderAdminTable,
    exportRegistrationsToExcel,
    clearAllRegistrations,
    goToMap,
    launchMission,
    dismissComplete,
    showCelebration,
    clearRegistrationCookie,
    registerAsNewParticipant,
    toggleLabClue
});