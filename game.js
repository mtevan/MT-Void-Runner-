/**
 * VOID RUNNER : OP EDITION - Structural Stability & Mobile Fixes
 */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
// Automatically sync internal rendering coordinates with actual CSS scaling dimensions
function resizeCanvasToDisplaySize() {
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
        canvas.width = rect.width || 850;
        canvas.height = rect.height || 480;
    }
}

// Fire once immediately and link it to window resize adjustments
resizeCanvasToDisplaySize();
window.addEventListener('resize', resizeCanvasToDisplaySize);

const viewScreens = {
    menu: document.getElementById("menu-screen"),
    avatar: document.getElementById("avatar-screen"),
    levels: document.getElementById("levels-screen"),
    shop: document.getElementById("shop-screen"),
    pause: document.getElementById("pause-screen"),
    controls: document.getElementById("controls-screen"),
    gameover: document.getElementById("gameover-screen")
};
const hudContainer = document.getElementById("hud");
const progressContainer = document.getElementById("progress-container");
const progressBar = document.getElementById("progress-bar");
const scoreBar = document.getElementById("score-bar");
const pauseTriggerBtn = document.getElementById("pause-trigger-btn");
const mobileControlsLayer = document.getElementById("mobile-controls-layer");

const hudLevelVal = document.getElementById("hud-level-val");
const scoreVal = document.getElementById("hud-score-val");
const shardsVal = document.getElementById("hud-shards-val");
const shardRateVal = document.getElementById("hud-shard-rate");
const comboVal = document.getElementById("combo-val");
const dimIndicator = document.getElementById("dim-val");
const shieldIndicator = document.getElementById("shield-val");

const shieldTierEl = document.getElementById("shield-tier");
const phaseTierEl = document.getElementById("phase-tier");
const dashTierEl = document.getElementById("dash-tier");
const shopAlert = document.getElementById("shop-alert");

const scoreFinal = document.getElementById("final-score");
const comboFinal = document.getElementById("final-combo");
const scoreHighElement = document.getElementById("high-score-val");
const completionTitle = document.getElementById("completion-title");
const completionSubtitle = document.getElementById("completion-subtitle");
const shopCurrencyDisplay = document.getElementById("shop-currency-val");

// Configuration Maps
const SPEED_MODIFIERS = { startSpeed: 5.5, accel: 0.001, scoreMult: 1.0 };
function getLevelTargetDistance(level) { return 300 + (level * 150); }

// Meta State Configuration Engine
let currentGameState = "MENU";
let highScore = parseInt(localStorage.getItem("vrop_high")) || 0;
let unlockedLevel = parseInt(localStorage.getItem("vrop_level")) || 1;
let totalSavedShards = parseInt(localStorage.getItem("vrop_shards")) || 0;
let currentSelectedLevel = 1;
let selectedAvatarID = localStorage.getItem("vrop_avatar") || "cyber_sphere";

let coreUpgrades = JSON.parse(localStorage.getItem("vrop_upgrades")) || { shieldDur: 0, phaseExt: 0, dashCDReduction: 0 };

// Running Live Parameters
let score = 0, combo = 1, globalSpeed = 5.5, currentDimension = "SKY";
let distanceTraveled = 0, screenShakeTimer = 0, levelClearedNotificationTimer = 0;
let liveShardsCollectedThisRun = 0, runStartTimeStamp = 0;

let isShieldActive = false, shieldCooldownTimer = 0;
let isDashing = false, dashCooldownTimer = 0, dashDurationTimer = 0;

const DIMENSIONS = {
    SKY: { color: "#00f3ff", bg: "#020510", trail: "rgba(0, 243, 255, 0.25)" },
    VOID: { color: "#ff0055", bg: "#0c0107", trail: "rgba(255, 0, 85, 0.25)" }
};

// 10 Vector Character Definition Matrix Registry
const AVATAR_REGISTRY = [
    { id: "cyber_sphere", name: "Cyber Sphere", draw: (c, x, y, w, h, col) => { c.beginPath(); c.arc(x+w/2, y+h/2, w/2, 0, Math.PI*2); c.fillStyle = col; c.fill(); } },
    { id: "apex_vector", name: "Apex Vector", draw: (c, x, y, w, h, col) => { c.beginPath(); c.moveTo(x+w/2, y); c.lineTo(x+w, y+h); c.lineTo(x, y+h); c.closePath(); c.fillStyle = col; c.fill(); } },
    { id: "void_mech", name: "Void Mech Core", draw: (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); c.lineWidth = 2; c.strokeStyle = "#fff"; c.strokeRect(x+6, y+6, w-12, h-12); } },
    { id: "pulse_glitch", name: "Pulse Glitch", draw: (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); c.fillStyle = "#fff"; c.fillRect(x + Math.random()*10, y + Math.random()*10, 8, 8); } },
    { id: "quantum_ring", name: "Quantum Ring", draw: (c, x, y, w, h, col) => { c.lineWidth = 4; c.strokeStyle = col; c.beginPath(); c.arc(x+w/2, y+h/2, w/2 - 2, 0, Math.PI*2); c.stroke(); } },
    { id: "neon_cyclops", name: "Neon Cyclops", draw: (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); c.fillStyle = "#000"; c.fillRect(x+4, y+8, w-8, 10); c.fillStyle = "#ff0055"; c.fillRect(x+w/2-3, y+10, 6, 6); } },
    { id: "shardtroll", name: "Shard Hunter", draw: (c, x, y, w, h, col) => { c.beginPath(); c.moveTo(x+w/2, y); c.lineTo(x+w, y+h/2); c.lineTo(x+w/2, y+h); c.lineTo(x, y+h/2); c.closePath(); c.fillStyle = col; c.fill(); } },
    { id: "spectre_v", name: "Spectre V", draw: (c, x, y, w, h, col) => { c.fillStyle = col; c.beginPath(); c.moveTo(x, y); c.lineTo(x+w, y); c.lineTo(x+w/2, y+h); c.closePath(); c.fill(); } },
    { id: "plasma_cube", name: "Plasma Block", draw: (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x+3, y+3, w-6, h-6); c.strokeStyle = "#39ff14"; c.lineWidth = 1; c.strokeRect(x, y, w, h); } },
    { id: "alpha_omega", name: "Alpha Omega", draw: (c, x, y, w, h, col) => { c.lineWidth = 3; c.strokeStyle = col; c.strokeRect(x, y, w, h); c.beginPath(); c.moveTo(x, y); c.lineTo(x+w, y+h); c.stroke(); } }
];

const OBSTACLE_SHAPES = ["RECT", "SPIKE", "ORB"];
let platforms = [], obstacles = [], particles = [], crystalShards = [];

const player = {
    x: 120, y: 200, width: 32, height: 40, vy: 0, gravity: 0.7, jumpForce: -13.0,
    isGrounded: false, doubleJumpAvailable: true, trailHistory: [],
    reset() { this.x = 120; this.y = 200; this.vy = 0; this.isGrounded = false; this.doubleJumpAvailable = true; this.trailHistory = []; },
    draw(color) {
        let currentModel = AVATAR_REGISTRY.find(a => a.id === selectedAvatarID) || AVATAR_REGISTRY[0];
        currentModel.draw(ctx, this.x, this.y, this.width, this.height, color);
    }
};

class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y;
        this.vx = (Math.random() - 0.5) * 8; this.vy = (Math.random() - 0.5) * 8;
        this.radius = Math.random() * 3 + 1.5; this.color = color; this.alpha = 1.0;
        this.decay = Math.random() * 0.04 + 0.02;
    }
    update() { this.x += this.vx; this.y += this.vy; this.alpha -= this.decay; }
    draw() { ctx.save(); ctx.globalAlpha = this.alpha; ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
}

function switchUI(state) {
    Object.keys(viewScreens).forEach(k => {
        viewScreens[k].classList.remove("active");
        viewScreens[k].classList.add("hidden");
    });
    
    hudContainer.classList.add("hidden"); 
    progressContainer.classList.add("hidden"); 
    pauseTriggerBtn.classList.add("hidden");
    mobileControlsLayer.classList.add("hidden");

    if (state === "PLAYING" || state === "PAUSE") { 
        hudContainer.classList.remove("hidden"); 
        progressContainer.classList.remove("hidden"); 
        pauseTriggerBtn.classList.remove("hidden"); 
        
        // Show touch controls overlay on mobile devices during play
        if (window.innerWidth <= 1024) {
            mobileControlsLayer.classList.remove("hidden");
        }
        
        if (state === "PAUSE") {
            viewScreens.pause.classList.remove("hidden");
            viewScreens.pause.classList.add("active");
            mobileControlsLayer.classList.add("hidden"); // Hide buttons when suspended
        }
    } else {
        const selectedView = viewScreens[state.toLowerCase()];
        if(selectedView) {
            selectedView.classList.remove("hidden"); 
            selectedView.classList.add("active");
        }
    }
}

function renderBuildAvatarGrid() {
    const container = document.getElementById("avatar-grid-container");
    container.innerHTML = "";
    AVATAR_REGISTRY.forEach(av => {
        const div = document.createElement("div");
        div.className = `avatar-card ${av.id === selectedAvatarID ? 'selected' : ''}`;
        
        const cardCanvas = document.createElement("canvas");
        cardCanvas.width = 40; cardCanvas.height = 40;
        const cCtx = cardCanvas.getContext("2d");
        av.draw(cCtx, 4, 4, 32, 32, "#00f3ff");

        const label = document.createElement("div");
        label.className = "avatar-name"; label.innerText = av.name;

        div.appendChild(cardCanvas); div.appendChild(label);
        div.onclick = () => { selectedAvatarID = av.id; localStorage.setItem("vrop_avatar", av.id); renderBuildAvatarGrid(); };
        container.appendChild(div);
    });
}

function renderBuildLevelsMatrixGrid() {
    const container = document.getElementById("levels-grid-container");
    container.innerHTML = "";
    for (let i = 1; i <= 200; i++) {
        const box = document.createElement("div"); box.innerText = i;
        if (i <= unlockedLevel) {
            box.className = "lvl-box unlocked";
            box.onclick = () => { currentSelectedLevel = i; initGame(); currentGameState = "PLAYING"; switchUI("PLAYING"); };
        } else { box.className = "lvl-box"; }
        container.appendChild(box);
    }
}

function initGame() {
    score = 0; combo = 1; distanceTraveled = 0; liveShardsCollectedThisRun = 0; runStartTimeStamp = Date.now();
    globalSpeed = SPEED_MODIFIERS.startSpeed;
    isShieldActive = false; shieldCooldownTimer = 0; isDashing = false;
    currentDimension = "SKY";
    platforms = [{ x: 0, y: 380, width: 900, height: 100 }, { x: 1050, y: 330, width: 600, height: 150 }];
    obstacles = [{ x: 600, y: 345, width: 28, height: 35, dimension: "SKY", shape: "SPIKE", passed: false }];
    crystalShards = [{ x: 400, y: 340, width: 16, height: 16, picked: false }];
    particles = []; player.reset(); hudLevelVal.innerText = currentSelectedLevel;
    updateHUDDisplays();
}

function triggerShieldActivation() {
    if (shieldCooldownTimer > 0 || currentGameState !== "PLAYING") return;
    isShieldActive = true;
    setTimeout(() => { isShieldActive = false; shieldCooldownTimer = Math.max(100, 360 - (coreUpgrades.dashCDReduction * 30)); }, 1200 * (1 + (coreUpgrades.shieldDur * 0.25)));
}

function triggerNitroDashBoost() {
    if (dashCooldownTimer > 0 || currentGameState !== "PLAYING") return;
    isDashing = true; dashDurationTimer = 15; dashCooldownTimer = Math.max(120, 240 - (coreUpgrades.dashCDReduction * 30));
}

function togglePauseState() {
    if (currentGameState === "PLAYING") { currentGameState = "PAUSED"; switchUI("PAUSE"); } 
    else if (currentGameState === "PAUSED") { currentGameState = "PLAYING"; viewScreens.pause.classList.remove("active"); viewScreens.pause.classList.add("hidden"); pauseTriggerBtn.classList.remove("hidden"); if(window.innerWidth <= 1024) mobileControlsLayer.classList.remove("hidden"); }
}

function executeJumpAction() {
    if (player.isGrounded) { player.vy = player.jumpForce; } 
    else if (player.doubleJumpAvailable) { player.vy = player.jumpForce * 0.85; player.doubleJumpAvailable = false; }
}

function executeDimensionToggle() {
    currentDimension = currentDimension === "SKY" ? "VOID" : "SKY";
}

function update() {
    let currentSpeed = globalSpeed * (isDashing ? 2.0 : 1.0);

    distanceTraveled += currentSpeed * 0.06;
    let targetDist = getLevelTargetDistance(currentSelectedLevel);
    
    progressBar.style.width = `${Math.min((distanceTraveled / targetDist) * 100, 100)}%`;
    scoreBar.style.width = `${Math.min((score / (5000 * currentSelectedLevel)) * 100, 100)}%`;

    if (distanceTraveled >= targetDist) {
        levelClearedNotificationTimer = 90;
        currentSelectedLevel = Math.min(200, currentSelectedLevel + 1);
        hudLevelVal.innerText = currentSelectedLevel;
        if (currentSelectedLevel > unlockedLevel) { unlockedLevel = currentSelectedLevel; localStorage.setItem("vrop_level", unlockedLevel); }
        distanceTraveled = 0;
    }

    if (levelClearedNotificationTimer > 0) levelClearedNotificationTimer--;

    globalSpeed += SPEED_MODIFIERS.accel;
    if (shieldCooldownTimer > 0) shieldCooldownTimer--;
    if (dashCooldownTimer > 0) dashCooldownTimer--;

    if (isDashing) { dashDurationTimer--; player.vy = 0; if (dashDurationTimer <= 0) isDashing = false; } 
    else { player.vy += player.gravity; }
    player.y += player.vy;

    player.trailHistory.push({ x: player.x, y: player.y });
    if (player.trailHistory.length > 6) player.trailHistory.shift();

    player.isGrounded = false;
    platforms.forEach(p => {
        p.x -= currentSpeed;
        if (player.x + player.width > p.x && player.x < p.x + p.width) {
            if (player.y + player.height >= p.y && (player.y + player.height - player.vy) <= p.y + 14) {
                player.isGrounded = true; player.doubleJumpAvailable = true; player.vy = 0; player.y = p.y - player.height;
            }
        }
    });
    platforms = platforms.filter(p => p.x + p.width > -100);

    obstacles.forEach(o => {
        o.x -= currentSpeed;
        let isColliding = player.x < o.x + o.width && player.x + player.width > o.x && player.y < o.y + o.height && player.y + player.height > o.y;
        if (isColliding) {
            if (isShieldActive || isDashing) {
                screenShakeTimer = 12; score += 400 * combo;
                for(let i=0; i<12; i++) particles.push(new Particle(o.x + 10, o.y + 15, DIMENSIONS[o.dimension].color));
                o.x = -5000;
            } else if (currentDimension === o.dimension) { executeFatalCollapse(); }
        } else if (!o.passed && o.x < player.x) {
            o.passed = true; combo++; score += 100 * combo * SPEED_MODIFIERS.scoreMult;
        }
    });
    obstacles = obstacles.filter(o => o.x + o.width > -100);

    crystalShards.forEach(s => {
        s.x -= currentSpeed;
        if (!s.picked && player.x < s.x + s.width && player.x + player.width > s.x && player.y < s.y + s.height && player.y + player.height > s.y) {
            s.picked = true; liveShardsCollectedThisRun++; totalSavedShards += 10;
            localStorage.setItem("vrop_shards", totalSavedShards);
            score += 250;
            for(let i=0; i<6; i++) particles.push(new Particle(s.x + 8, s.y + 8, "#cc00ff"));
        }
    });
    crystalShards = crystalShards.filter(s => s.x + s.width > -100);

    let lastPlatform = platforms[platforms.length - 1];
    if (lastPlatform && lastPlatform.x + lastPlatform.width < canvas.width + 300) {
        let gap = Math.random() * 110 + 90, nextW = Math.random() * 400 + 400;
        let nextY = Math.min(410, Math.max(260, lastPlatform.y + (Math.random() * 120 - 60)));
        platforms.push({ x: lastPlatform.x + lastPlatform.width + gap, y: nextY, width: nextW, height: 150 });
        
        if (Math.random() < 0.7) {
            let obsH = Math.random() * 15 + 25;
            obstacles.push({
                x: lastPlatform.x + lastPlatform.width + gap + (nextW * 0.3), y: nextY - obsH, width: 26, height: obsH,
                dimension: Math.random() < 0.5 ? "SKY" : "VOID", shape: OBSTACLE_SHAPES[Math.floor(Math.random() * 3)], passed: false
            });
        }
        if (Math.random() < 0.95) { 
             for (let i = 0; i < 3; i++) {
             crystalShards.push({ 
                 x: lastPlatform.x + lastPlatform.width + gap + (nextW * 0.4) + (i * 35), 
                 y: nextY - 35, 
                 width: 14, 
                 height: 18, 
                 picked: false 
             });
        }
    }
}

    particles.forEach(p => p.update()); particles = particles.filter(p => p.alpha > 0);
    if (player.y > canvas.height + 40) executeFatalCollapse();
    updateHUDDisplays();
}

function draw() {
    ctx.save();
    if (screenShakeTimer > 0) { ctx.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6); screenShakeTimer--; }
    ctx.fillStyle = DIMENSIONS[currentDimension].bg; ctx.fillRect(0, 0, canvas.width, canvas.height);

    platforms.forEach(p => {
        ctx.fillStyle = "#040814"; ctx.fillRect(p.x, p.y, p.width, p.height);
        ctx.strokeStyle = DIMENSIONS[currentDimension].color; ctx.lineWidth = 2; ctx.strokeRect(p.x, p.y, p.width, p.height);
    });

    obstacles.forEach(o => {
        ctx.fillStyle = DIMENSIONS[o.dimension].color;
        if (o.shape === "SPIKE") {
            ctx.beginPath(); ctx.moveTo(o.x, o.y + o.height); ctx.lineTo(o.x + o.width/2, o.y); ctx.lineTo(o.x + o.width, o.y + o.height); ctx.closePath(); ctx.fill();
        } else if (o.shape === "ORB") {
            ctx.beginPath(); ctx.arc(o.x + o.width/2, o.y + o.height/2, o.width/2, 0, Math.PI*2); ctx.fill();
        } else {
            ctx.fillRect(o.x, o.y, o.width, o.height);
        }
    });

    crystalShards.forEach(s => {
        if (s.picked) return;
        ctx.fillStyle = "#cc00ff"; ctx.beginPath();
        ctx.moveTo(s.x + s.width/2, s.y); ctx.lineTo(s.x + s.width, s.y + s.height/2); ctx.lineTo(s.x + s.width/2, s.y + s.height); ctx.lineTo(s.x, s.y + s.height/2); ctx.closePath(); ctx.fill();
    });

    particles.forEach(p => p.draw());

    player.trailHistory.forEach((pos, idx) => {
        ctx.save(); ctx.fillStyle = DIMENSIONS[currentDimension].trail; ctx.globalAlpha = (idx / player.trailHistory.length) * 0.25;
        let model = AVATAR_REGISTRY.find(a => a.id === selectedAvatarID) || AVATAR_REGISTRY[0];
        model.draw(ctx, pos.x, pos.y, player.width, player.height, DIMENSIONS[currentDimension].trail); ctx.restore();
    });

    player.draw(isShieldActive ? "#ffea00" : (isDashing ? "#39ff14" : "#ffffff"));

    if (levelClearedNotificationTimer > 0) {
        ctx.fillStyle = "rgba(57, 255, 20, 0.8)"; ctx.font = "bold 18px Courier New"; ctx.textAlign = "center";
        ctx.fillText("SECTOR MATRIX EXPANDED -> MOVING TO NEXT THRESHOLD DATASTREAM", canvas.width/2, 160);
    }
    ctx.restore();
}

function updateHUDDisplays() {
    scoreVal.innerText = Math.floor(score); comboVal.innerText = `${combo}x`; shardsVal.innerText = totalSavedShards;
    dimIndicator.innerText = currentDimension; dimIndicator.style.color = DIMENSIONS[currentDimension].color;
    shieldIndicator.innerText = shieldCooldownTimer > 0 ? `CHARGING (${Math.ceil(shieldCooldownTimer/60)}s)` : "READY";
    shieldIndicator.style.color = shieldCooldownTimer > 0 ? "#ff0055" : "#39ff14";

    let elapsedMins = (Date.now() - runStartTimeStamp) / 60000;
    shardRateVal.innerText = elapsedMins > 0.05 ? Math.floor(liveShardsCollectedThisRun / elapsedMins) : 0;
    
    shopCurrencyDisplay.innerText = totalSavedShards;
    shieldTierEl.innerText = coreUpgrades.shieldDur; phaseTierEl.innerText = coreUpgrades.phaseExt; dashTierEl.innerText = coreUpgrades.dashCDReduction;
}

function throwShopAlert() { shopAlert.classList.remove("hidden"); setTimeout(() => shopAlert.classList.add("hidden"), 2000); }

function executeFatalCollapse() {
    currentGameState = "GAMEOVER"; switchUI("GAMEOVER");
    scoreFinal.innerText = Math.floor(score); comboFinal.innerText = `${combo}x`;
    if (score > highScore) { highScore = Math.floor(score); localStorage.setItem("vrop_high", highScore); }
    scoreHighElement.innerText = highScore;
}

window.addEventListener("keydown", (e) => {
    if (e.code === "Escape") { e.preventDefault(); togglePauseState(); return; }
    if (currentGameState !== "PLAYING") return;
    if (e.code === "Space") { e.preventDefault(); executeJumpAction(); }
    if (e.code === "KeyQ" || e.code === "KeyE") executeDimensionToggle();
    if (e.code === "ShiftLeft" || e.code === "ShiftRight") triggerShieldActivation();
    if (e.code === "KeyF") triggerNitroDashBoost();
});

// =================================================================
// MOBILE PLATFORM INTERACTION PAD BINDINGS
// =================================================================
document.getElementById("mobile-jump-btn").addEventListener("touchstart", (e) => { e.preventDefault(); executeJumpAction(); });
document.getElementById("mobile-shift-btn").addEventListener("touchstart", (e) => { e.preventDefault(); executeDimensionToggle(); });
document.getElementById("mobile-shield-btn").addEventListener("touchstart", (e) => { e.preventDefault(); triggerShieldActivation(); });
document.getElementById("mobile-dash-btn").addEventListener("touchstart", (e) => { e.preventDefault(); triggerNitroDashBoost(); });


// =================================================================
// SYSTEM INTERFACE EVENT CONTROLLER MATRIX
// =================================================================

pauseTriggerBtn.onclick = () => togglePauseState();
document.getElementById("resume-btn").onclick = () => togglePauseState();

document.getElementById("pause-exit-btn").onclick = () => { 
    currentGameState = "MENU"; 
    switchUI("MENU"); 
};

document.getElementById("gameover-menu-btn").onclick = () => { 
    currentGameState = "MENU"; 
    switchUI("MENU"); 
};

document.getElementById("avatar-back-btn").onclick = () => {
    currentGameState = "MENU";
    switchUI("MENU");
};

// Core Flow Routes
document.getElementById("play-btn").onclick = () => { initGame(); currentGameState = "PLAYING"; switchUI("PLAYING"); };
document.getElementById("char-select-btn").onclick = () => { renderBuildAvatarGrid(); switchUI("AVATAR"); };
document.getElementById("levels-btn").onclick = () => { renderBuildLevelsMatrixGrid(); switchUI("LEVELS"); };
document.getElementById("levels-back-btn").onclick = () => switchUI("MENU");
document.getElementById("controls-btn").onclick = () => { switchUI("CONTROLS"); };
document.getElementById("controls-back-btn").onclick = () => switchUI("MENU");
document.getElementById("retry-btn").onclick = () => { initGame(); currentGameState = "PLAYING"; switchUI("PLAYING"); };
document.getElementById("shop-btn").onclick = () => { updateHUDDisplays(); switchUI("SHOP"); };
document.getElementById("shop-back-btn").onclick = () => switchUI("MENU");

document.getElementById("exit-terminate-btn").onclick = () => {
    window.close();
    window.location.href = "about:blank";
};

// Shop Stat Upgrade Module Updaters
document.getElementById("up-shield-btn").onclick = () => {
    if (totalSavedShards >= 1000) { totalSavedShards -= 1000; coreUpgrades.shieldDur += 1; localStorage.setItem("vrop_upgrades", JSON.stringify(coreUpgrades)); localStorage.setItem("vrop_shards", totalSavedShards); updateHUDDisplays(); } else { throwShopAlert(); }
};
document.getElementById("up-phase-btn").onclick = () => {
    if (totalSavedShards >= 1500) { totalSavedShards -= 1500; coreUpgrades.phaseExt += 1; localStorage.setItem("vrop_upgrades", JSON.stringify(coreUpgrades)); localStorage.setItem("vrop_shards", totalSavedShards); updateHUDDisplays(); } else { throwShopAlert(); }
};
document.getElementById("up-dash-btn").onclick = () => {
    if (totalSavedShards >= 2000) { totalSavedShards -= 2000; coreUpgrades.dashCDReduction += 1; localStorage.setItem("vrop_upgrades", JSON.stringify(coreUpgrades)); localStorage.setItem("vrop_shards", totalSavedShards); updateHUDDisplays(); } else { throwShopAlert(); }
};

// Main Loop Frame Initializer Call
function runGlobalFrameTickLoop() {
    if (currentGameState === "PLAYING") update();
    draw(); 
    requestAnimationFrame(runGlobalFrameTickLoop);
}
requestAnimationFrame(runGlobalFrameTickLoop);
