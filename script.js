/**
 * Stickman Fight: Pro Animation Upgrade
 * System: Hierarchical Keyframe Animation with State Blending
 */

// ============================================================
// CONFIGURATION
// ============================================================
const CONFIG = {
    GRAVITY: 0.5,
    GROUND_Y: 0,
    JUMP_STRENGTH: -13, // Slightly reduced for weight
    MAX_SPEED: 3.5,     // Slower, grounded speed
    ACCELERATION: 0.25, // Heavier feel
    DECELERATION: 0.15,
    GAME_TIME_SCALE: 0.85, // Cinema speed

    MAX_HEALTH: 100,
    MAX_STAMINA: 100,
    BLOCK_REDUCTION: 0.7,
    STAMINA_DRAIN: 0.5,
    STAMINA_REGEN: 0.3,

    HIT_STUN: 350,
    BLEND_DEFAULT: 200, // ms
    SLOW_MO_DUR: 1500
};

// ============================================================
// ANIMATION DATA (Keyframes)
// ============================================================
// Poses are relative angles. Hips Y is offset from 0.
const POSE_DEFAULT = {
    hipsY: 0, torso: 0, head: 0,
    lArmU: 0, lArmL: 0, rArmU: 0, rArmL: 0,
    lLegU: 0, lLegL: 0, rLegU: 0, rLegL: 0
};

const ANIMATIONS = {
    IDLE: {
        loop: true,
        bgBlend: 300,
        frames: [
            { t: 900, p: { ...POSE_DEFAULT, hipsY: 2, torso: 4, lArmU: -70, lArmL: -80, rArmU: -40, rArmL: -70, lLegU: 10, lLegL: 15, rLegU: -10, rLegL: 20 } },
            { t: 900, p: { ...POSE_DEFAULT, hipsY: 6, torso: 8, lArmU: -65, lArmL: -85, rArmU: -35, rArmL: -75, lLegU: 15, lLegL: 25, rLegU: -5, rLegL: 30 } }
        ]
    },
    RUN: {
        loop: true,
        bgBlend: 200,
        frames: [
            // Stride 1
            { t: 150, p: { ...POSE_DEFAULT, hipsY: 4, torso: 25, lArmU: 45, lArmL: -45, rArmU: -45, rArmL: -45, lLegU: -30, lLegL: 10, rLegU: 45, rLegL: 10 } },
            { t: 150, p: { ...POSE_DEFAULT, hipsY: 0, torso: 25, lArmU: -20, lArmL: -20, rArmU: 20, rArmL: -20, lLegU: 10, lLegL: 60, rLegU: -10, rLegL: 10 } }, // Cross
            // Stride 2
            { t: 150, p: { ...POSE_DEFAULT, hipsY: 4, torso: 25, lArmU: -45, lArmL: -45, rArmU: 45, rArmL: -45, lLegU: 45, rLegU: 10, rLegU: -30, rLegL: 10 } },
            { t: 150, p: { ...POSE_DEFAULT, hipsY: 0, torso: 25, lArmU: 20, lArmL: -20, rArmU: -20, rArmL: -20, lLegU: -10, lLegL: 10, rLegU: 10, rLegL: 60 } }
        ]
    },
    RUN_BACK: {
        loop: true,
        bgBlend: 250,
        frames: [
            { t: 200, p: { ...POSE_DEFAULT, hipsY: 2, torso: -5, lArmU: -70, lArmL: -80, rArmU: -40, rArmL: -70, lLegU: -20, lLegL: 10, rLegU: 10, rLegL: 10 } },
            { t: 200, p: { ...POSE_DEFAULT, hipsY: 4, torso: -5, lArmU: -72, lArmL: -82, rArmU: -42, rArmL: -72, lLegU: 10, lLegL: 10, rLegU: -20, rLegL: 20 } }
        ]
    },
    JUMP: {
        loop: false,
        frames: [
            { t: 100, p: { ...POSE_DEFAULT, hipsY: 10, torso: 15, lLegU: -45, lLegL: 90, rLegU: -20, rLegL: 80, lArmU: -120, rArmU: -120 } },
            { t: 500, p: { ...POSE_DEFAULT, hipsY: 0, torso: 0, lLegU: -10, lLegL: 10, rLegU: 5, rLegL: 10, lArmU: -45, rArmU: -45 } } // Land prep
        ]
    },
    BLOCK: {
        loop: true,
        bgBlend: 100,
        frames: [
            { t: 1000, p: { ...POSE_DEFAULT, hipsY: 10, torso: 15, head: 10, lArmU: -130, lArmL: -120, rArmU: -120, rArmL: -120, lLegU: 20, lLegL: 45, rLegU: -10, rLegL: 45 } }
        ]
    },
    PUNCH: {
        loop: false,
        frames: [
            { t: 100, p: { ...POSE_DEFAULT, torso: -20, rArmU: 45, rArmL: 120, hipsY: 5 } }, // Windup
            { t: 80, p: { ...POSE_DEFAULT, torso: 35, rArmU: -10, rArmL: 0, hipsY: 2, head: 5 } }, // CONNECT
            { t: 250, p: { ...POSE_DEFAULT, torso: 10, rArmU: -20, rArmL: -40, hipsY: 0 } } // Recover
        ]
    },
    KICK: {
        loop: false,
        frames: [
            { t: 120, p: { ...POSE_DEFAULT, torso: 10, rLegU: -60, rLegL: 120, hipsY: 5 } }, // Chamber
            { t: 100, p: { ...POSE_DEFAULT, torso: -30, rLegU: -90, rLegL: 0, hipsY: 8, lArmU: 40 } }, // EXTEND
            { t: 400, p: { ...POSE_DEFAULT, torso: 0, rLegU: 0, rLegL: 0, hipsY: 0 } } // Recover
        ]
    },
    HURT: {
        loop: false,
        frames: [
            { t: 150, p: { ...POSE_DEFAULT, torso: -20, head: -30, lArmU: -20, rArmU: -20, hipsY: 5 } },
            { t: 250, p: { ...POSE_DEFAULT, torso: -10, head: -10, hipsY: 2 } }
        ]
    }
};

// ============================================================
// ANIMATOR ENGINE
// ============================================================
class Animator {
    constructor() {
        this.currentAnim = 'IDLE';
        this.frameIdx = 0;
        this.frameTime = 0;
        this.blending = false;
        this.blendTimer = 0;
        this.blendDuration = 0;

        // Poses
        this.pose = { ...POSE_DEFAULT };      // The final output pose
        this.blendStartPose = { ...POSE_DEFAULT }; // Snapshot for blending
    }

    play(name, force = false) {
        if (this.currentAnim === name && !force) return;

        // Start blending
        this.blending = true;
        this.blendTimer = 0;
        this.blendDuration = ANIMATIONS[name].bgBlend || CONFIG.BLEND_DEFAULT;

        // Capture current state
        this.blendStartPose = { ...this.pose };

        // Switch
        this.currentAnim = name;
        this.frameIdx = 0;
        this.frameTime = 0;
    }

    update(dt) {
        const anim = ANIMATIONS[this.currentAnim];
        const frame = anim.frames[this.frameIdx];

        // Advance Frame
        this.frameTime += dt;
        if (this.frameTime >= frame.t) {
            this.frameTime -= frame.t;
            this.frameIdx++;
            if (this.frameIdx >= anim.frames.length) {
                if (anim.loop) {
                    this.frameIdx = 0;
                } else {
                    this.frameIdx = anim.frames.length - 1; // Hold last frame
                    // Return to Idle auto? handled by fighter state machine
                }
            }
        }

        // Interpolate Keyframes
        const nextIdx = (this.frameIdx + 1) % anim.frames.length;
        const nextFrame = anim.loop ? anim.frames[nextIdx] : (this.frameIdx < anim.frames.length - 1 ? anim.frames[nextIdx] : frame);

        let progress = this.frameTime / frame.t;
        // Ease (QuadInOut for smooth, Linear for impact)
        // Simple Quad ease for now
        if (this.currentAnim !== 'PUNCH' && this.currentAnim !== 'KICK') {
            progress = progress < .5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
        }

        // Calculate Target Pose for this moment
        const targetPose = {};
        for (let k in POSE_DEFAULT) {
            targetPose[k] = frame.p[k] + (nextFrame.p[k] - frame.p[k]) * progress;
        }

        // Apply Blending (State Transition)
        if (this.blending) {
            this.blendTimer += dt;
            let blendPct = this.blendTimer / this.blendDuration;
            if (blendPct >= 1) {
                this.blending = false;
                blendPct = 1;
            } else {
                // Smooth step blend
                blendPct = blendPct * blendPct * (3 - 2 * blendPct);
            }

            for (let k in POSE_DEFAULT) {
                this.pose[k] = this.blendStartPose[k] + (targetPose[k] - this.blendStartPose[k]) * blendPct;
            }
        } else {
            this.pose = targetPose;
        }
    }
}

// ============================================================
// GAME GLOBALS
// ============================================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let gameState = 'INIT';
let p1Wins = 0, p2Wins = 0, currentRound = 1;
let lastTime = 0, slowMoTimer = 0, gamePaused = false;

const keys = {};
const particles = [];

// ============================================================
// FIGHTER
// ============================================================
class Fighter {
    constructor(id, x, color, facingRight) {
        this.id = id; this.startX = x; this.color = color; this.startFace = facingRight;
        this.animator = new Animator();
        this.reset(true);
    }

    reset(full) {
        this.x = this.startX; this.y = 0;
        this.vx = 0; this.vy = 0;
        this.w = 40; this.h = 150; // Narrower body for realism
        this.facingRight = this.startFace;
        if (full) { this.health = CONFIG.MAX_HEALTH; this.stamina = CONFIG.MAX_STAMINA; }

        this.state = 'IDLE';
        this.animator.play('IDLE', true);
        this.cooldown = 0; this.invincible = 0; this.hitActive = false;
    }

    update(dt) {
        const gdt = dt * CONFIG.GAME_TIME_SCALE * (slowMoTimer > 0 ? 0.2 : 1.0);

        // Physics
        this.x += this.vx * (gdt / 16);
        this.y += this.vy * (gdt / 16);

        // Ground
        if (this.y + this.h >= CONFIG.GROUND_Y) {
            this.y = CONFIG.GROUND_Y - this.h;
            this.vy = 0;
        } else {
            this.vy += CONFIG.GRAVITY * (gdt / 16);
        }

        // Walls
        this.x = Math.max(0, Math.min(canvas.width - this.w, this.x));

        // State Machine
        if (this.cooldown > 0) this.cooldown -= gdt;
        if (this.invincible > 0) this.invincible -= gdt;
        if (this.stamina < CONFIG.MAX_STAMINA && this.state !== 'BLOCK') this.stamina += CONFIG.STAMINA_REGEN * (gdt / 16);

        // Input Logic / State Transition
        if (this.state !== 'HURT' && this.state !== 'PUNCH' && this.state !== 'KICK') {
            if (this.y < CONFIG.GROUND_Y - this.h - 10) {
                if (this.state !== 'JUMP') { this.state = 'JUMP'; this.animator.play('JUMP'); }
            }
            else if (keys[this.id === 'p1' ? 's' : 'arrowdown'] && this.stamina > 0) {
                if (this.state !== 'BLOCK') { this.state = 'BLOCK'; this.animator.play('BLOCK'); }
                this.stamina -= CONFIG.STAMINA_DRAIN * (gdt / 16);
            }
            else if (Math.abs(this.vx) > 0.5) {
                const fwd = (this.vx > 0 && this.facingRight) || (this.vx < 0 && !this.facingRight);
                const runAnim = fwd ? 'RUN' : 'RUN_BACK';
                if (this.state !== runAnim) { this.state = runAnim; this.animator.play(runAnim); }
            }
            else {
                if (this.state !== 'IDLE') { this.state = 'IDLE'; this.animator.play('IDLE'); }
            }
        }

        // Auto Recover
        if ((this.state === 'PUNCH' || this.state === 'KICK') && this.animator.frameIdx === ANIMATIONS[this.state].frames.length - 1) {
            this.state = 'IDLE'; this.animator.play('IDLE');
            this.hitActive = false;
        }
        if (this.state === 'HURT' && this.animator.frameIdx === ANIMATIONS.HURT.frames.length - 1) {
            this.state = 'IDLE'; this.animator.play('IDLE');
        }

        this.animator.update(gdt);
    }

    attack(type) {
        if (this.state === 'HURT' || this.cooldown > 0) return;
        this.state = type;
        this.animator.play(type, true); // Force replay
        this.cooldown = 400; // Attack delay
    }

    hit(dmg) {
        if (this.invincible > 0) return { dead: false };
        let finalDmg = dmg;
        let blocked = false;

        if (this.state === 'BLOCK' && this.stamina > 10) {
            blocked = true;
            finalDmg *= (1 - CONFIG.BLOCK_REDUCTION);
            spawnSpark(this.x + this.w / 2, this.y + 40, '#0af');
        } else {
            spawnSpark(this.x + this.w / 2, this.y + 40, '#f00', 12);
        }

        this.health -= finalDmg;
        this.invincible = CONFIG.HIT_STUN;
        this.state = 'HURT';
        this.animator.play('HURT', true);

        const dir = this.facingRight ? -1 : 1;
        this.vx = dir * (blocked ? 4 : 8);

        return { dead: this.health <= 0 };
    }

    draw() {
        const cx = this.x + this.w / 2;
        const cy = this.y + 35; // Shoulder/Hips anchor area
        const p = this.animator.pose;
        const dir = this.facingRight ? 1 : -1;

        // Hips Offset (Root Motion)
        const rootY = cy + p.hipsY;

        ctx.save();

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath(); ctx.ellipse(cx, CONFIG.GROUND_Y, 25, 6, 0, 0, Math.PI * 2); ctx.fill();

        ctx.translate(cx, rootY); // Move to HIPS

        ctx.strokeStyle = this.color;
        ctx.lineWidth = 11;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';

        // --- HIERARCHY RENDERING ---

        // 1. LEGS (Relative to Hips)
        const drawLeg = (u, l) => {
            ctx.save();
            ctx.rotate(u * Math.PI / 180 * dir); // Hip Joint
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 50); ctx.stroke();
            ctx.translate(0, 50); // Knee Joint
            ctx.rotate(l * Math.PI / 180 * dir);
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 50); ctx.stroke();
            ctx.restore();
        };

        // Draw Back Leg
        ctx.save(); ctx.translate(0, 30); // Hip socket offset
        drawLeg(p.lLegU, p.lLegL); ctx.restore();

        // 2. TORSO (Relative to Hips)
        ctx.save();
        ctx.rotate(p.torso * Math.PI / 180 * dir);
        ctx.beginPath(); ctx.moveTo(0, 30); ctx.lineTo(0, -40); ctx.stroke(); // Spine

        // Head (Relative to Torso)
        ctx.save();
        ctx.translate(0, -40); // Neck
        ctx.rotate(p.head * Math.PI / 180 * dir);
        ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(0, -18, 16, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        // 3. ARMS (Relative to Torso)
        const drawArm = (u, l) => {
            ctx.save();
            ctx.rotate(u * Math.PI / 180 * dir); // Shoulder
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 40); ctx.stroke();
            ctx.translate(0, 40); // Elbow
            ctx.rotate(l * Math.PI / 180 * dir);
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 40); ctx.stroke();
            ctx.restore();
        };

        // Back Arm
        ctx.save(); ctx.translate(0, -35); // Shoulder Socket
        drawArm(p.lArmU, p.lArmL); ctx.restore();

        // Front Leg (Draw over torso logic? Stickman style usually legs separated)
        // Actually for stickman, usually Front Leg is drawn last

        ctx.restore(); // Pop Torso

        // Draw Front Leg (Attached to Hips)
        ctx.save(); ctx.translate(0, 30);
        drawLeg(p.rLegU, p.rLegL); ctx.restore();

        // Re-enter Torso context for Front Arm? No, easier to just draw front arm relative to Torso
        // Need to reconstruct torso transform for Front Arm
        ctx.save(); ctx.rotate(p.torso * Math.PI / 180 * dir); ctx.translate(0, -35);
        drawArm(p.rArmU, p.rArmL);
        ctx.restore();

        ctx.restore(); // Global
    }

    getHitbox() {
        // Simple hitbox for now
        return { x: this.facingRight ? this.x + 30 : this.x - 60, y: this.y, w: 70, h: 80 };
    }
}

// ============================================================
// MAIN LOOP & INPUT (Preserved from Arcade Update)
// ============================================================
const p1 = new Fighter('p1', 150, '#222', true);
const p2 = new Fighter('p2', 600, '#666', false);

window.onkeydown = e => { keys[e.key.toLowerCase()] = true; if (e.key === 'p') togglePause(); };
window.onkeyup = e => keys[e.key.toLowerCase()] = false;

function handleInput() {
    if (p1.state === 'HURT') return;

    // Attack
    if (keys['j']) p1.attack('PUNCH');
    if (keys['k']) p1.attack('KICK');

    // Block handled in Fighter.update() via 's' key check

    // Move
    if (p1.state !== 'BLOCK') {
        if (keys['a']) { p1.vx -= CONFIG.ACCELERATION; p1.facingRight = false; }
        else if (keys['d']) { p1.vx += CONFIG.ACCELERATION; p1.facingRight = true; }
        else { p1.vx *= CONFIG.DECELERATION; }
        // Clamp
        p1.vx = Math.max(-CONFIG.MAX_SPEED, Math.min(CONFIG.MAX_SPEED, p1.vx));
        if (keys['w'] && p1.vy === 0) p1.vy = CONFIG.JUMP_STRENGTH;
    }
}

function handleAI() {
    if (p2.state === 'HURT') return;
    const dist = Math.abs(p1.x - p2.x);
    p2.facingRight = p1.x > p2.x;
    if (dist > 80) p2.vx += (p2.facingRight ? 1 : -1) * CONFIG.ACCELERATION * 0.8;
    else {
        p2.vx *= 0.5;
        if (Math.random() < 0.02 && !p2.hitActive) p2.attack(Math.random() > 0.5 ? 'PUNCH' : 'KICK');
    }
    p2.vx = Math.max(-CONFIG.MAX_SPEED * 0.7, Math.min(CONFIG.MAX_SPEED * 0.7, p2.vx));
}

function checkHits() {
    // Basic hit check based on animation frame
    if (p1.state === 'PUNCH' && p1.animator.frameIdx === 1 && !p1.hitActive) {
        checkHit(p1, p2, CONFIG.DMG_PUNCH);
        p1.hitActive = true;
    }
    if (p1.state === 'KICK' && p1.animator.frameIdx === 1 && !p1.hitActive) {
        checkHit(p1, p2, CONFIG.DMG_KICK);
        p1.hitActive = true;
    }
    // AI Hits
    if (p2.state === 'PUNCH' && p2.animator.frameIdx === 1 && !p2.hitActive) {
        checkHit(p2, p1, CONFIG.DMG_PUNCH);
        p2.hitActive = true;
    }
    if (p2.state === 'KICK' && p2.animator.frameIdx === 1 && !p2.hitActive) {
        checkHit(p2, p1, CONFIG.DMG_KICK);
        p2.hitActive = true;
    }
}

function checkHit(atk, vic, dmg) {
    const hb = atk.getHitbox();
    if (hb.x < vic.x + vic.w && hb.x + hb.w > vic.x && hb.y < vic.y + vic.h && hb.y + hb.h > vic.y) {
        const res = vic.hit(dmg);
        updateUI();
        if (res.dead) endRound(atk);
    }
}

// Spark VFX
function spawnSpark(x, y, c, n = 8) {
    for (let i = 0; i < n; i++) {
        const a = Math.random() * 6.28;
        const s = Math.random() * 5 + 2;
        particles.push({ x, y, dx: Math.cos(a) * s, dy: Math.sin(a) * s, l: 1, c });
    }
}

function loop(ts) {
    if (!lastTime) lastTime = ts;
    const dt = Math.min(ts - lastTime, 50);
    lastTime = ts;

    if (!gamePaused) {
        if (slowMoTimer > 0) slowMoTimer -= dt;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // BG
        const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
        g.addColorStop(0, '#444'); g.addColorStop(1, '#111');
        ctx.fillStyle = g; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#000'; ctx.fillRect(0, CONFIG.GROUND_Y, canvas.width, canvas.height);

        if (gameState === 'FIGHT') {
            handleInput(); handleAI(); checkHits();
        }

        p1.update(dt); p2.update(dt);
        p1.draw(); p2.draw();

        // Particles
        particles.forEach((p, i) => {
            p.x += p.dx; p.y += p.dy; p.l -= 0.05;
            ctx.globalAlpha = p.l; ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, 6.28); ctx.fill();
            if (p.l <= 0) particles.splice(i, 1);
        });
        ctx.globalAlpha = 1;
    }
    requestAnimationFrame(loop);
}

// UI Helpers (Start/End Round)
function updateUI() {
    document.getElementById('p1-health').style.width = p1.health + '%';
    document.getElementById('p1-stamina').style.width = p1.stamina + '%';
    document.getElementById('p2-health').style.width = p2.health + '%';
    document.getElementById('p2-health').style.width = p2.health + '%';

    // Safety check for stamina bars (User HTML might not have them)
    const p1Stamina = document.getElementById('p1-stamina');
    if (p1Stamina) p1Stamina.style.width = p1.stamina + '%';

    const p2Stamina = document.getElementById('p2-stamina');
    if (p2Stamina) p2Stamina.style.width = p2.stamina + '%';
    // Rounds ... (reuse existing logic from index.html structure)
}
function endRound(winner) {
    gameState = 'ROUND_OVER'; slowMoTimer = 1000;
    if (winner === p1) p1Wins++; else p2Wins++;
    setTimeout(() => {
        if (p1Wins >= 2 || p2Wins >= 2) {
            if (p1Wins >= 2 || p2Wins >= 2) {
                const gameOverScreen = document.getElementById('game-over-screen');
                const gameOverText = document.getElementById('game-over-text');
                if (gameOverScreen && gameOverText) {
                    gameOverText.innerText = (winner === p1 ? "YOU WIN" : "YOU LOSE");
                    gameOverScreen.classList.remove('hidden');
                } else {
                    // Fallback to old overlay if exists
                    const ov = document.getElementById('overlay-container');
                    const tx = document.getElementById('overlay-text');
                    if (ov && tx) {
                        tx.innerText = (winner === p1 ? "YOU WIN" : "LOSE");
                        ov.classList.add('show');
                        document.getElementById('restart-btn')?.classList.remove('hidden');
                    }
                }
            } else {
            } else {
                currentRound++; startRound();
            }
        }, 1500);
}
function startRound() {
    gameState = 'START'; p1.reset(); p2.reset(); updateUI();
    gameState = 'START'; p1.reset(); p2.reset(); updateUI();
    // Use generic overlay if exists, otherwise just console or title
    const overlay = document.getElementById('overlay-container');
    const overlayText = document.getElementById('overlay-text');

    if (overlay && overlayText) {
        overlayText.innerText = `ROUND ${currentRound}`;
        overlay.classList.add('show');
    }
    setTimeout(() => {
        // Safe check for overlay
        const overlay = document.getElementById('overlay-container');
        if (overlay) {
            document.getElementById('overlay-text').innerText = "FIGHT!";
            setTimeout(() => {
                overlay.classList.remove('show');
                gameState = 'FIGHT';
            }, 800);
        } else {
            gameState = 'FIGHT';
        }
    }, 1500);
}
function togglePause() { gamePaused = !gamePaused; document.getElementById('pause-overlay').classList.toggle('hidden'); }

// Init
function init() {
    const c = document.getElementById('game-container');
    canvas.width = c.offsetWidth; canvas.height = c.offsetHeight;
    CONFIG.GROUND_Y = canvas.height - 50;
    startRound();
    requestAnimationFrame(loop);
}
window.onresize = init;
document.getElementById('restart-btn').onclick = () => location.reload();
document.querySelector('#pause-btn').onclick = togglePause; // fix selector

// Mobile mappings
const mapBtn = (id, k) => {
    const b = document.getElementById(id); if (!b) return;
    const s = (v) => { keys[k] = v; b.classList.toggle('pressed', v); };
    b.ontouchstart = e => { e.preventDefault(); s(true); };
    b.ontouchend = e => { e.preventDefault(); s(false); };
    b.onmousedown = e => { e.preventDefault(); s(true); };
    b.onmouseup = e => { e.preventDefault(); s(false); };
};
mapBtn('btn-left', 'a'); mapBtn('btn-right', 'd'); mapBtn('btn-jump', 'w');
mapBtn('btn-block', 's'); mapBtn('btn-punch', 'j'); mapBtn('btn-kick', 'k');

// Global functions for HTML buttons
window.startGame = function () {
    const startScreen = document.getElementById('start-screen');
    if (startScreen) startScreen.classList.add('hidden');
    init();
};

window.restartGame = function () {
    location.reload();
};

// Remove auto-init so we wait for button press
// init();
