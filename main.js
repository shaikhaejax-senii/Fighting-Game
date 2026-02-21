const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#000000',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1500 }, // Restored heavy gravity
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

// —————————————————————————————————————————————————————————————————————————————
// CONFIGURATION & CONSTANTS
// —————————————————————————————————————————————————————————————————————————————

const CHARACTERS = ['Player1', 'Player2', 'Player3'];
const ANIM_TYPES = {
    punch: { file: 'Punch.png', frames: 6, rate: 20, loop: false },
    kick: { file: 'Kick.png', frames: 6, rate: 20, loop: false },
    idle: { file: 'Idle.png', frames: 6, rate: 8, loop: true },
    jump: { file: 'Jump.png', frames: 10, rate: 14, loop: false },
    walk: { file: 'Walk.png', frames: 8, rate: 10, loop: true },
    run: { file: 'Run.png', frames: 8, rate: 14, loop: true },
    dead: { file: 'Dead.png', frames: 3, rate: 5, loop: false },
    hurt: { file: 'Hurt.png', frames: 3, rate: 10, loop: false },
    shield: { file: 'Shield.png', frames: 2, rate: 10, loop: false }
};

const ELEMENT_ASSETS = {
    water_ball: { path: 'assets/powers/water/water_ball/Water Ball_Frame_', frames: 12 },
    water_spell: { path: 'assets/powers/water/water_spell/Water Spell_Frame_', frames: 8 },
    water_arrow: { path: 'assets/powers/water/water_arrow/Water Arrow_Frame_', frames: 8 },
    fire_ball: { path: 'assets/powers/fire/fire_ball/Fire Ball_Frame_', frames: 8 },
    fire_spell: { path: 'assets/powers/fire/fire_spell/Fire Spell_Frame_', frames: 8 },
    fire_arrow: { path: 'assets/powers/fire/fire_arrow/Fire Arrow_Frame_', frames: 8 }
};

const STATES = {
    IDLE: 'idle',
    WALK: 'walk',
    RUN: 'run',
    JUMP: 'jump',
    PUNCH: 'punch',
    KICK: 'kick',
    DEAD: 'dead',
    HURT: 'hurt',
    SHIELD: 'shield'
};

const STATS = {
    speedWalk: 250,     // Base speed
    speedRun: 300,      // Max run speed
    jumpForce: -550,    // Restored jump height
    accel: 2500,        // Rapid acceleration for responsive feel
    drag: 1200,         // Strong deceleration (no ice-skating)
    attackCooldown: 200,
    damagePunch: 10,
    damageKick: 15,
    hitDistance: 70
};

const POWERS = {
    ball: { type: 'ball', speed: 600, damage: 25, cooldown: 3000, scale: 0.0525, offsetX: 50, offsetY: 15 },
    arrow: { type: 'arrow', speed: 600, damage: 15, cooldown: 1500, scale: 0.07, offsetX: 60, offsetY: 15 },
    spell: { type: 'spell', speed: 600, damage: 35, cooldown: 5000, scale: 0.0875, offsetX: 60, offsetY: 25 }
};

const DIFFICULTY = {
    EASY: {
        thinkMin: 800, thinkMax: 1500, // Very slow reactions
        blockChance: 0.1,              // Rare blocking
        attackDelay: 1200,             // Slow attacks
        powerChance: 0.3,              // Rare power usage
        chaseChance: 0.4               // 40% chase, 30% cast, 30% idle
    },
    MEDIUM: {
        thinkMin: 500, thinkMax: 1000,
        blockChance: 0.4,
        attackDelay: 800,
        powerChance: 0.5,
        chaseChance: 0.5               // 50% chase, 30% cast, 20% idle
    },
    HARD: {
        thinkMin: 300, thinkMax: 800,
        blockChance: 0.7,
        attackDelay: 400,
        powerChance: 0.7,
        chaseChance: 0.6               // 60% chase, 30% cast, 10% idle
    }
};

// —————————————————————————————————————————————————————————————————————————————
// GLOBAL VARIABLES
// —————————————————————————————————————————————————————————————————————————————

var player, enemy, ground;
var cursors;
var projectiles;
var keyJump, keyPunch, keyKick;
var keyA, keyD, keyS;
let keyQ, keyW, keyE;
let mobileInputs = { left: false, right: false, up: false, down: false, punch: false, kick: false, shield: false, ball: false, arrow: false, spell: false };
var isGameActive = false;

// Timer System
let gameTimer = 99;
let lastTimerUpdate = 0;

// UI Elements
const ui = {
    playerBar: null,
    enemyBar: null,
    playerName: null,
    enemyName: null,
    startScreen: null,
    gameOverScreen: null,
    gameOverText: null,
    inputPlayer: null,
    inputEnemy: null,
    cdQ: null,
    cdW: null,
    cdE: null,
    cdContainer: null,
    pElementLabel: null,
    eElementLabel: null
};

// —————————————————————————————————————————————————————————————————————————————
// PHASER FUNCTIONS
// —————————————————————————————————————————————————————————————————————————————

function preload() {
    // Dynamically load spritesheets for all characters
    CHARACTERS.forEach(char => {
        Object.keys(ANIM_TYPES).forEach(anim => {
            const asset = ANIM_TYPES[anim];
            this.load.spritesheet(`${char}_${anim}`, `assets/${char}/${asset.file}`, { frameWidth: 128, frameHeight: 128 });
        });
    });

    // Load Element Frame-by-Frame PNGs
    Object.keys(ELEMENT_ASSETS).forEach(key => {
        const asset = ELEMENT_ASSETS[key];
        for (let i = 1; i <= asset.frames; i++) {
            // zero-pad frame number "01", "02", etc
            const frameNum = String(i).padStart(2, '0');
            this.load.image(`${key}_${i}`, `${asset.path}${frameNum}.png`);
        }
    });

    // Load Background
    this.load.image('bg_scene', 'assets/Background/Scene1.png');
}

function create() {
    // 1. CREATE ANIMATIONS
    CHARACTERS.forEach(char => {
        Object.keys(ANIM_TYPES).forEach(anim => {
            const asset = ANIM_TYPES[anim];
            let frameEnd = asset.frames - 1;

            // Player3 uses a 4-frame (512x128) death animation instead of standard 3
            if (char === 'Player3' && anim === 'dead') {
                frameEnd = 3;
            }

            this.anims.create({
                key: `${char}_${anim}`,
                frames: this.anims.generateFrameNumbers(`${char}_${anim}`, { start: 0, end: frameEnd }),
                frameRate: asset.rate,
                repeat: asset.loop ? -1 : 0
            });
        });
    });

    // Create Elemental Animations
    Object.keys(ELEMENT_ASSETS).forEach(key => {
        const asset = ELEMENT_ASSETS[key];
        const frames = [];
        for (let i = 1; i <= asset.frames; i++) {
            frames.push({ key: `${key}_${i}` });
        }
        this.anims.create({
            key: `${key}_anim`,
            frames: frames,
            frameRate: 15, // Smooth baseline 
            repeat: -1     // Loop indefinitely for projectiles
        });
    });

    // 2. CREATE WORLD
    // Background — 955x2000 image with 3 scenes stacked (each ~667px tall)
    const bg = this.add.image(0, 0, 'bg_scene');
    bg.setOrigin(0, 0);
    const sceneHeight = Math.floor(bg.height / 3);   // ~667px per scene
    const bgScale = 800 / bg.width;                   // scale to fill 800px width
    bg.setScale(bgScale);
    bg.setDepth(-10);

    // Pick a random scene (0, 1, or 2), crop to just that slice, and position it
    const sceneIndex = Math.floor(Math.random() * 3);
    const cropY = sceneIndex * sceneHeight;
    bg.setCrop(0, cropY, bg.width, sceneHeight);      // clip to only this scene
    bg.setY(-cropY * bgScale + 120);                  // +120 shifts down so sprites stand on ground

    // Invisible ground (physics only — background already has ground art)
    ground = this.add.rectangle(400, 570, 800, 40);
    ground.setAlpha(0);
    this.physics.add.existing(ground, true);
    projectiles = this.physics.add.group({ allowGravity: false });

    // Assign Characters dynamically based on UI selections
    const pChar = window.playerCharacter || 'Player1';

    const remaining = CHARACTERS.filter(c => c !== pChar);
    const eChar = remaining[Math.floor(Math.random() * remaining.length)]; // Randomizes CPU

    player = createFighter(this, 200, 450, 'PLAYER', pChar);
    enemy = createFighter(this, 600, 450, 'ENEMY', eChar);

    // Collisions
    this.physics.add.collider(player, ground);
    this.physics.add.collider(enemy, ground);
    this.physics.add.overlap(projectiles, player, handleProjectileHit, null, this);
    this.physics.add.overlap(projectiles, enemy, handleProjectileHit, null, this);
    // this.physics.add.collider(player, enemy); // Allow pass-through

    // 4. INPUTS
    cursors = this.input.keyboard.createCursorKeys();

    // Action Keys
    keyJump = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    keyPunch = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);
    keyKick = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);

    // Extra Keys for WASD
    keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);

    // Power Keys
    keyQ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // 5. UI BINDING
    ui.playerBar = document.getElementById('player-health');
    ui.enemyBar = document.getElementById('enemy-health');
    ui.playerName = document.getElementById('player-name');
    ui.enemyName = document.getElementById('enemy-name'); // Ensure this ID exists in HTML
    ui.startScreen = document.getElementById('start-screen');
    ui.gameOverScreen = document.getElementById('game-over-screen');
    ui.gameOverText = document.getElementById('game-over-text');
    ui.inputPlayer = document.getElementById('input-player-name');
    ui.inputEnemy = document.getElementById('input-enemy-name');
    ui.cdQ = document.getElementById('cd-q');
    ui.cdW = document.getElementById('cd-w');
    ui.cdE = document.getElementById('cd-e');
    ui.cdContainer = document.getElementById('player-cooldowns');
    ui.eCdQ = document.getElementById('ecd-q');
    ui.eCdW = document.getElementById('ecd-w');
    ui.eCdE = document.getElementById('ecd-e');
    ui.eCdContainer = document.getElementById('enemy-cooldowns');
    ui.pElementLabel = document.getElementById('player-element-label');
    ui.eElementLabel = document.getElementById('enemy-element-label');
    ui.timer = document.getElementById('timer');

    // 6. MOBILE CONTROLS
    createMobileControls(this);

    // Global hooks
    window.startGame = () => {
        // Validation for element
        if (!window.playerElement) {
            alert("Please select an element first!");
            return;
        }

        // Apply Character Assignments
        const pChar = window.playerCharacter || 'Player1';
        const remaining = CHARACTERS.filter(c => c !== pChar);
        const eChar = remaining[Math.floor(Math.random() * remaining.length)];

        player.characterId = pChar;
        enemy.characterId = eChar;

        // Force Texture/Animation Update immediately
        player.play(`${pChar}_idle`, true);
        enemy.play(`${eChar}_idle`, true);

        // Bind Bot Difficulty Profile globally
        const diffKey = window.botDifficulty || 'HARD';
        enemy._diff = DIFFICULTY[diffKey];

        // Update Names & Elements dynamically based on class
        const classNames = { 'Player1': 'FIGHTER', 'Player2': 'SAMURAI', 'Player3': 'SHINOBI' };
        ui.playerName.textContent = classNames[pChar];
        ui.enemyName.textContent = classNames[eChar] + ` (${diffKey})`;

        ui.pElementLabel.textContent = "ELEMENT: " + window.playerElement;
        ui.eElementLabel.textContent = "ELEMENT: " + window.enemyElement;

        // Setup Player Elements
        player.element = window.playerElement.toLowerCase();
        enemy.element = window.enemyElement.toLowerCase();

        ui.cdContainer.classList.remove('hidden');
        ui.eCdContainer.classList.remove('hidden');

        resetGame(this);
        isGameActive = true;
        ui.startScreen.classList.add('hidden');
    };

    window.restartGame = () => {
        // Return to Start Screen with previous names pre-filled
        isGameActive = false;
        ui.cdContainer.classList.add('hidden');
        ui.gameOverScreen.classList.add('hidden');
        ui.startScreen.classList.remove('hidden');
    };

    // Initial State
    isGameActive = false;
    ui.startScreen.classList.remove('hidden');
    ui.gameOverScreen.classList.add('hidden');
}

function update(time, delta) {
    if (!isGameActive) return;

    // Timer Logic Updates 1x per second
    if (time > lastTimerUpdate + 1000 && gameTimer > 0) {
        // Only decrement if neither player is dead
        if (!player.isDead && !enemy.isDead) {
            gameTimer--;
            ui.timer.textContent = gameTimer;
            lastTimerUpdate = time;

            if (gameTimer <= 0) {
                gameTimer = 0;
                // Time up decision
                if (player.hp > enemy.hp) {
                    enemy.takeDamage(999);
                } else if (enemy.hp > player.hp) {
                    player.takeDamage(999);
                } else {
                    // Draw
                    enemy.takeDamage(999);
                    player.takeDamage(999);
                }
            }
        }
    }

    // AI Logic
    handleEnemyAI(time);

    // Player Input
    handlePlayerInput(time);

    // Check bounds
    if (player.y > 600) player.takeDamage(999);
    if (enemy.y > 600) enemy.takeDamage(999);
}


// —————————————————————————————————————————————————————————————————————————————
// GAME LOGIC HELPERS
// —————————————————————————————————————————————————————————————————————————————

function createFighter(scene, x, y, type, characterId) {
    const sprite = scene.physics.add.sprite(x, y, `${characterId}_idle`);
    sprite.setCollideWorldBounds(true);

    // Physics Body adjustments
    sprite.body.setSize(40, 90);
    sprite.body.setOffset(44, 38);
    sprite.body.setDragX(STATS.drag);
    sprite.body.setMaxVelocity(STATS.speedRun, 1000); // Absolute physics limit

    // PROPERTIES
    sprite.type = type;
    sprite.hp = 100;
    sprite.maxHp = 100;
    sprite.isDead = false;
    sprite.currentState = STATES.IDLE;
    sprite.characterId = characterId;
    sprite.lastAttackTime = 0;

    // Tracking continuous movement for Walk->Run transitions
    sprite.movingDirection = 0;
    sprite.movingStartTime = 0;

    // Cooldown trackers
    sprite.cd = {
        ball: 0,
        arrow: 0,
        spell: 0
    };

    // 100ms Input Buffer System
    sprite.inputBuffer = {
        action: null,
        timestamp: 0
    };

    sprite.bufferInput = function (action, time) {
        this.inputBuffer.action = action;
        this.inputBuffer.timestamp = time;
    };

    sprite.consumeBuffer = function (time) {
        if (this.inputBuffer.action && time - this.inputBuffer.timestamp <= 100) {
            const action = this.inputBuffer.action;
            this.inputBuffer.action = null; // Consume it
            return action;
        }
        return null; // Expired or empty
    };

    // METHODS
    sprite.setState = function (newState, force = false) {
        if (this.isDead) return;
        if (this.currentState === newState && !force) return;

        this.currentState = newState;

        // Apply updated max speeds based on state
        if (newState === STATES.RUN) {
            this.body.setMaxVelocity(STATS.speedRun, 1000);
        } else {
            // Revert back to walking bounds for any other motion
            this.body.setMaxVelocity(STATS.speedWalk, 1000);
        }

        // Play animation
        const isAttack = (newState === STATES.PUNCH || newState === STATES.KICK || newState === STATES.HURT || newState === STATES.DEAD);

        // Handle Shield (Animation is now available)
        if (newState === STATES.SHIELD) {
            this.play(`${this.characterId}_${STATES.SHIELD}`, true);
        } else {
            this.play(`${this.characterId}_${newState}`, true);
        }

        if (isAttack) {
            this.once('animationcomplete', () => {
                if (this.anims.currentAnim && this.anims.currentAnim.key === `${this.characterId}_${newState}`) {
                    if (this.currentState === STATES.DEAD) return;
                    this.setState(STATES.IDLE);
                }
            });
        }
    };

    sprite.takeDamage = function (amount) {
        if (this.isDead) return;

        let blocked = false;
        if (this.currentState === STATES.SHIELD) {
            // Blocked! Greatly Reduced damage
            amount = Math.ceil(amount * 0.1);
            blocked = true;
        }

        this.hp -= amount;

        // Add visual hit indication
        this.setTint(blocked ? 0xaaaaaa : 0xff0000); // Gray if blocked, red if hit
        this.scene.time.delayedCall(150, () => {
            if (!this.isDead) this.clearTint();
        });

        // Camera shake on hit (scaled down for polished feel)
        if (this.scene && this.scene.cameras && this.scene.cameras.main) {
            this.scene.cameras.main.shake(100, blocked ? 0.003 : 0.008);
        }

        if (this.hp <= 0) {
            this.hp = 0;
            this.die();
        } else {
            // Only play hurt if not blocking? 
            // Usually block absorbs hit reaction too, but let's keep it simple
            if (this.currentState !== STATES.SHIELD) {
                this.setVelocityX(0);
                this.setState(STATES.HURT, true);
            }
        }
        updateUI();
    };

    sprite.die = function () {
        this.setState(STATES.DEAD, true); // Trigger FSM animation BEFORE locking inputs
        this.isDead = true;

        // Retain gravity and collision so the body physically falls to the floor!
        // We only disable active horizontal movement commands.
        this.setAccelerationX(0);
        this.body.moves = true;
        this.body.allowGravity = true;

        // Visual adjustment: Removed offset as -5 was floating and +5 was sinking.
        // 0 should be the correct baseline.

        setTimeout(() => {
            if (player.isDead && enemy.isDead) {
                endGame('DRAW');
            } else {
                endGame(this.type === 'PLAYER' ? 'YOU LOST' : 'YOU WON');
            }
        }, 2000);
    };

    sprite.play(`${characterId}_idle`);
    return sprite;
}

function handlePlayerInput(time) {
    if (player.isDead || player.currentState === STATES.HURT) return;

    const onGround = player.body.blocked.down || player.body.touching.down;

    // 1. POPULATE INPUT BUFFER (100ms window)
    if (Phaser.Input.Keyboard.JustDown(keyPunch) || mobileInputs.punch) { player.bufferInput('punch', time); mobileInputs.punch = false; }
    if (Phaser.Input.Keyboard.JustDown(keyKick) || mobileInputs.kick) { player.bufferInput('kick', time); mobileInputs.kick = false; }
    if (Phaser.Input.Keyboard.JustDown(keyQ) || mobileInputs.ball) { player.bufferInput('ball', time); mobileInputs.ball = false; }
    if (Phaser.Input.Keyboard.JustDown(keyW) || mobileInputs.arrow) { player.bufferInput('arrow', time); mobileInputs.arrow = false; }
    if (Phaser.Input.Keyboard.JustDown(keyE) || mobileInputs.spell) { player.bufferInput('spell', time); mobileInputs.spell = false; }
    if (Phaser.Input.Keyboard.JustDown(keyJump) || mobileInputs.up) { player.bufferInput('jump', time); mobileInputs.up = false; }

    const isLeft = cursors.left.isDown || keyA.isDown || mobileInputs.left;
    const isRight = cursors.right.isDown || keyD.isDown || mobileInputs.right;
    const isBlock = cursors.down.isDown || keyS.isDown || mobileInputs.down || mobileInputs.shield;

    // 2. ACTION LOCKING & STATE MACHINE
    const isActionLocked = [STATES.PUNCH, STATES.KICK, STATES.SHIELD].includes(player.currentState);

    if (isActionLocked) {
        // If Shielding, check if they released
        if (player.currentState === STATES.SHIELD) {
            if (!isBlock) {
                player.setState(STATES.IDLE);
            } else {
                return; // Keep shielding
            }
        } else {
            return; // Locked in attack animation, wait for completion
        }
    }

    // 3. SHIELD OVERRIDE
    if (isBlock && onGround) {
        player.setVelocityX(0);
        player.setAccelerationX(0);
        player.setState(STATES.SHIELD);
        return;
    }

    // 4. CONSUME BUFFER (Attacks & Jumps)
    const bufferedAction = player.consumeBuffer(time);
    if (bufferedAction) {
        if (bufferedAction === 'punch' && time > player.lastAttackTime + STATS.attackCooldown) {
            performAttack(player, enemy, STATES.PUNCH, STATS.damagePunch, time);
            return;
        } else if (bufferedAction === 'kick' && time > player.lastAttackTime + STATS.attackCooldown) {
            performAttack(player, enemy, STATES.KICK, STATS.damageKick, time);
            return;
        } else if (['ball', 'arrow', 'spell'].includes(bufferedAction)) {
            handlePowerUsage(player, bufferedAction, time);
            return;
        } else if (bufferedAction === 'jump' && onGround) {
            player.setVelocityY(STATS.jumpForce);
            player.setState(STATES.JUMP);
        }
    }

    // 5. MOVEMENT PHYSICS (Realistic Acceleration / Deceleration)
    if (isLeft) {
        player.flipX = true;
        player.setAccelerationX(-STATS.accel);
    } else if (isRight) {
        player.flipX = false;
        player.setAccelerationX(STATS.accel);
    } else {
        // Decelerate smoothly using Drag
        player.setAccelerationX(0);
    }

    // 6. ANIMATION TIMING (Strict FSM)
    if (!onGround) {
        player.body.setMaxVelocity(STATS.speedWalk, 1000);
        player.setState(STATES.JUMP);
    } else if (isLeft || isRight) {
        const dir = isLeft ? -1 : 1;
        if (player.movingDirection !== dir) {
            player.movingDirection = dir;
            player.movingStartTime = time;
        }

        // 500ms continuous hold to transition to RUN
        if (time - player.movingStartTime > 500 && Math.abs(player.body.velocity.x) > 50) {
            player.body.setMaxVelocity(STATS.speedRun, 1000);
            player.setState(STATES.RUN);
        } else {
            player.body.setMaxVelocity(STATS.speedWalk, 1000);
            player.setState(STATES.WALK);
        }
    } else {
        player.movingDirection = 0;
        player.body.setMaxVelocity(STATS.speedWalk, 1000);

        // Return to idle ONLY when actually stopped/nearly stopped moving
        if (Math.abs(player.body.velocity.x) < 30) {
            player.setState(STATES.IDLE);
        } else {
            // Sliding to halt
            player.setState(STATES.WALK);
        }
    }
}

function handleEnemyAI(time) {
    if (enemy.isDead || enemy.currentState === STATES.HURT) return;

    const dist = Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y);
    const attackRange = 70; // Tightened so the bot comes closer
    const p = enemy._diff || DIFFICULTY.HARD; // Default fallback to HARD

    // Face Player
    if (player.x < enemy.x) enemy.flipX = true;
    else enemy.flipX = false;

    // AI Think Timer (evaluates what to do every few hundred ms)
    if (!enemy.nextThinkTime || time > enemy.nextThinkTime) {
        enemy.nextThinkTime = time + Phaser.Math.Between(p.thinkMin, p.thinkMax);

        // Evaluate Situation
        const isPlayerAttacking = (player.currentState === STATES.PUNCH || player.currentState === STATES.KICK);

        if (isPlayerAttacking && dist < 120) {
            // High chance to block if player is attacking near
            if (Math.random() < p.blockChance) {
                enemy.aiState = 'BLOCKING';
            } else {
                enemy.aiState = 'IDLE'; // Or sometimes fail to block
            }
        } else {
            // Normal behavior
            const rand = Math.random();
            if (dist < attackRange) {
                enemy.aiState = 'ATTACKING';
            } else {
                if (rand < p.chaseChance) {
                    enemy.aiState = 'CHASING';
                } else if (rand < p.chaseChance + 0.3) {
                    // 30% chance to stand and cast a power 
                    enemy.aiState = 'CASTING';
                } else {
                    enemy.aiState = 'IDLE';
                }
            }
        }

        // Force drop shield if transitioning to non-blocking state
        if (enemy.aiState !== 'BLOCKING' && enemy.currentState === STATES.SHIELD) {
            enemy.setState(STATES.IDLE);
        }
    }

    // Execute state logic continuously
    if (enemy.aiState === 'BLOCKING') {
        enemy.movingDirection = 0;
        enemy.setAccelerationX(0);
        enemy.setVelocityX(0);
        enemy.setState(STATES.SHIELD);
    }
    else if (enemy.aiState === 'IDLE') {
        enemy.movingDirection = 0;
        enemy.setAccelerationX(0);
        if (enemy.currentState === STATES.SHIELD) enemy.setState(STATES.IDLE);
        // Only trigger walk->idle if we slow down enough
        else if (Math.abs(enemy.body.velocity.x) < 20 && (enemy.currentState === STATES.WALK || enemy.currentState === STATES.RUN)) {
            enemy.setState(STATES.IDLE);
        }
    }
    else if (enemy.aiState === 'ATTACKING') {
        enemy.movingDirection = 0;
        enemy.setAccelerationX(0);
        enemy.setVelocityX(0);
        if (enemy.currentState === STATES.SHIELD) enemy.setState(STATES.IDLE);

        // Ensure we don't spam attacks too fast
        if (time > enemy.lastAttackTime + p.attackDelay) {

            // Chance to use power close up
            if (Math.random() < p.powerChance) {
                const powers = ['ball', 'arrow', 'spell'];
                const pw = powers[Math.floor(Math.random() * powers.length)];
                if (time > enemy.cd[pw]) {
                    handlePowerUsage(enemy, pw, time);
                    enemy.lastAttackTime = time; // Shared cooldown to prevent instant punch
                    enemy.nextThinkTime = time + p.attackDelay;
                    return;
                }
            }

            const type = Math.random() > 0.5 ? STATES.PUNCH : STATES.KICK;
            const dmg = type === STATES.PUNCH ? STATS.damagePunch : STATS.damageKick;
            performAttack(enemy, player, type, dmg, time);
            enemy.nextThinkTime = time + p.attackDelay; // Pause thinking after attack
        }
    }
    else if (enemy.aiState === 'CASTING') {
        enemy.movingDirection = 0;
        enemy.setAccelerationX(0);
        enemy.setVelocityX(0);
        if (enemy.currentState === STATES.SHIELD) enemy.setState(STATES.IDLE);

        const powers = ['ball', 'arrow', 'spell'];
        const chosen = powers[Math.floor(Math.random() * powers.length)];

        if (time > enemy.cd[chosen] && time > enemy.lastAttackTime + 500) {
            handlePowerUsage(enemy, chosen, time);
            enemy.lastAttackTime = time; // Sync with melee cooldown so we don't spam
            enemy.nextThinkTime = time + 800; // Pause to cast
        } else {
            // Power on cooldown, default to chasing
            enemy.aiState = 'CHASING';
        }
    }
    else if (enemy.aiState === 'CHASING') {
        if (enemy.currentState === STATES.SHIELD) enemy.setState(STATES.IDLE);

        const dir = player.x < enemy.x ? -1 : 1;
        if (enemy.movingDirection !== dir) {
            enemy.movingDirection = dir;
            enemy.movingStartTime = time;
        }
        enemy.setAccelerationX(dir * STATS.accel);

        if (enemy.currentState !== STATES.JUMP) {
            if (time - enemy.movingStartTime > 1000) {
                if (enemy.currentState !== STATES.RUN) enemy.setState(STATES.RUN);
            } else {
                if (enemy.currentState !== STATES.WALK) enemy.setState(STATES.WALK);
            }
        }
    }
}

function performAttack(attacker, target, state, damage, time) {
    attacker.setVelocityX(0);
    attacker.setAccelerationX(0);
    attacker.setState(state, true);
    attacker.lastAttackTime = time;

    // hitbox check delayed to match animation frame
    attacker.scene.time.delayedCall(200, () => {
        if (attacker.isDead || target.isDead) return;

        // Simple distance check for hit
        const dist = Phaser.Math.Distance.Between(attacker.x, attacker.y, target.x, target.y);

        const facing = (attacker.x < target.x && !attacker.flipX) || (attacker.x > target.x && attacker.flipX);
        const isFacing = facing;

        const yDist = Math.abs(attacker.y - target.y);

        // LOGIC: Hit if close and facing, OR if extremely close (overlapping) ignore facing
        const isCloseEnough = dist < STATS.hitDistance;
        const isVeryClose = dist < 50;
        const isAlignedY = yDist < 100;

        if (isAlignedY && ((isCloseEnough && isFacing) || isVeryClose)) {
            // Hit!
            target.takeDamage(damage);

            // HIT-STOP mechanics (pause physics/animations for a fraction of a second)
            const scene = attacker.scene;
            scene.physics.world.isPaused = true;
            attacker.anims.pause();
            target.anims.pause();

            // Resume after very short duration (e.g. 60ms)
            scene.time.delayedCall(60, () => {
                scene.physics.world.isPaused = false;
                attacker.anims.resume();
                target.anims.resume();

                // Pushback occurs after hitstop
                const pushDir = attacker.x < target.x ? 1 : -1;
                target.setVelocityX(pushDir * 200);
                target.setVelocityY(-100);
            });
        }
    });
}

// Function to interpolate color smoothly from Green > Yellow > Red
function getColorForPercentage(pct) {
    if (pct > 50) {
        // Green to Yellow (50 to 100)
        // 100% = Green (0,255,0), 50% = Yellow (255,255,0)
        const g = 255;
        const r = Math.floor(255 * (1 - (pct - 50) / 50));
        return `rgb(${r}, ${g}, 0)`;
    } else {
        // Yellow to Red (0 to 50)
        // 50% = Yellow (255,255,0), 0% = Red (255,0,0)
        const r = 255;
        const g = Math.floor(255 * (pct / 50));
        return `rgb(${r}, ${g}, 0)`;
    }
}

function updateUI() {
    const pPct = Math.max(0, (player.hp / player.maxHp) * 100);
    const ePct = Math.max(0, (enemy.hp / enemy.maxHp) * 100);

    ui.playerBar.style.width = pPct + '%';
    ui.enemyBar.style.width = ePct + '%';

    ui.playerBar.style.backgroundColor = getColorForPercentage(pPct);
    ui.enemyBar.style.backgroundColor = getColorForPercentage(ePct);

    // Update Cooldown UI
    if (isGameActive && player.scene) {
        const time = player.scene.time.now;

        const updateCd = (el, fighter, type) => {
            if (time > fighter.cd[type]) {
                el.classList.remove('cooldown');
                el.classList.add('ready');
            } else {
                el.classList.add('cooldown');
                el.classList.remove('ready');
            }
        };
        // Player cooldowns
        updateCd(ui.cdQ, player, 'ball');
        updateCd(ui.cdW, player, 'arrow');
        updateCd(ui.cdE, player, 'spell');
        // Enemy cooldowns
        updateCd(ui.eCdQ, enemy, 'ball');
        updateCd(ui.eCdW, enemy, 'arrow');
        updateCd(ui.eCdE, enemy, 'spell');
    }
}

function resetGame(scene) {
    [player, enemy].forEach(fighter => {
        fighter.body.allowGravity = true;
        fighter.body.moves = true;
        fighter.body.checkCollision.none = false;
        fighter.setVelocity(0, 0);
        fighter.setAccelerationX(0);
        fighter.hp = fighter.maxHp;
        fighter.isDead = false;
        fighter.setState(STATES.IDLE, true);
        fighter.clearTint();
    });

    player.setPosition(200, 450);
    enemy.setPosition(600, 450);

    updateUI();
}

function endGame(message) {
    isGameActive = false;
    ui.gameOverText.innerText = message;
    ui.gameOverScreen.classList.remove('hidden');
}

function createMobileControls(scene) {
    const isMobile = scene.sys.game.device.os.android || scene.sys.game.device.os.iOS || scene.sys.game.device.input.touch;
    if (!isMobile) return;

    const width = scene.scale.width;
    const height = scene.scale.height;
    const unit = Math.min(width, height);  // Proportional sizing base

    // Enable multi-touch for Running + Jumping + Attacking simultaneously
    scene.input.addPointer(4);

    // ==========================================
    // SAFE MARGINS (8% from edges)
    // ==========================================
    const safeMarginX = width * 0.08;
    const safeMarginY = height * 0.08;

    // ==========================================
    // 1. VIRTUAL JOYSTICK (LEFT SIDE — anchored bottom-left)
    // ==========================================
    const joyX = safeMarginX + unit * 0.09;
    const joyY = height - safeMarginY - unit * 0.09;
    const joyBaseRadius = unit * 0.09;
    const joyThumbRadius = unit * 0.045;

    // Visuals
    const joyBase = scene.add.circle(joyX, joyY, joyBaseRadius, 0x888888, 0.2).setScrollFactor(0).setDepth(100);
    joyBase.setStrokeStyle(Math.max(2, unit * 0.005), 0xffffff, 0.2);

    const joyThumb = scene.add.circle(joyX, joyY, joyThumbRadius, 0xcccccc, 0.6).setScrollFactor(0).setDepth(101);
    joyThumb.setStrokeStyle(2, 0xffffff, 0.5);

    // Invisible Input Zone covering the bottom-left quadrant
    const joyZone = scene.add.zone(0, height / 2, width / 2, height / 2).setOrigin(0).setScrollFactor(0).setInteractive();

    let isDraggingJoy = false;
    let joyPointer = null;

    joyZone.on('pointerdown', (pointer) => {
        isDraggingJoy = true;
        joyPointer = pointer;
        updateJoystick(pointer);
    });

    scene.input.on('pointermove', (pointer) => {
        if (isDraggingJoy && pointer === joyPointer) {
            updateJoystick(pointer);
        }
    });

    const resetJoystick = (pointer) => {
        if (pointer === joyPointer) {
            isDraggingJoy = false;
            joyPointer = null;
            joyThumb.setPosition(joyX, joyY);
            mobileInputs.left = false;
            mobileInputs.right = false;
        }
    };

    joyZone.on('pointerup', resetJoystick);
    joyZone.on('pointerout', resetJoystick);

    function updateJoystick(pointer) {
        const dx = pointer.x - joyX;
        const dy = pointer.y - joyY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let tx = pointer.x;
        let ty = pointer.y;

        if (dist > joyBaseRadius) {
            const angle = Math.atan2(dy, dx);
            tx = joyX + Math.cos(angle) * joyBaseRadius;
            ty = joyY + Math.sin(angle) * joyBaseRadius;
        }

        joyThumb.setPosition(tx, ty);

        const threshold = unit * 0.025;
        const localDx = tx - joyX;

        if (localDx < -threshold) {
            mobileInputs.left = true;
            mobileInputs.right = false;
        } else if (localDx > threshold) {
            mobileInputs.right = true;
            mobileInputs.left = false;
        } else {
            mobileInputs.left = false;
            mobileInputs.right = false;
        }
    }

    // ==========================================
    // 2. ACTION BUTTONS (RIGHT SIDE — anchored bottom-right)
    // ==========================================
    const btnRadiusLg = unit * 0.06;     // Main attack
    const btnRadiusMd = unit * 0.045;    // Jump/Kick/Shield
    const btnRadiusSm = unit * 0.035;    // Powers
    const btnSpacing = unit * 0.12;

    const createActionButton = (vX, vY, radius, color, icon, inputKey) => {
        const btn = scene.add.circle(vX, vY, radius, color, 0.3).setScrollFactor(0).setDepth(100).setInteractive();
        btn.setStrokeStyle(Math.max(2, unit * 0.004), color, 0.6);

        const labelText = scene.add.text(vX, vY, icon, {
            fontSize: Math.floor(radius * 0.8) + 'px',
            fontStyle: 'bold',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

        const press = () => {
            btn.fillAlpha = 0.7;
            btn.setScale(1.1);
            mobileInputs[inputKey] = true;
        };

        const release = () => {
            btn.fillAlpha = 0.3;
            btn.setScale(1.0);
            mobileInputs[inputKey] = false;
        };

        btn.on('pointerdown', press);
        btn.on('pointerup', release);
        btn.on('pointerout', release);

        return btn;
    };

    // Anchor point: bottom-right with safe margin
    const anchorX = width - safeMarginX - btnRadiusLg;
    const anchorY = height - safeMarginY - btnRadiusLg;

    // Punch (Main Attack — largest, center of cluster)
    createActionButton(anchorX, anchorY, btnRadiusLg, 0x00aaff, 'P', 'punch');

    // Jump (Top of cluster)
    createActionButton(anchorX, anchorY - btnSpacing, btnRadiusMd, 0xffffff, 'J', 'up');

    // Kick (Right of cluster)
    createActionButton(anchorX + btnSpacing * 0.85, anchorY - btnSpacing * 0.3, btnRadiusMd, 0xff3333, 'K', 'kick');

    // Shield (Left of cluster)
    createActionButton(anchorX - btnSpacing * 0.85, anchorY + btnSpacing * 0.15, btnRadiusMd, 0xffaa00, 'S', 'down');

    // ==========================================
    // 3. POWERS (Fanning outward from top of cluster)
    // ==========================================
    createActionButton(anchorX - btnSpacing * 0.35, anchorY - btnSpacing * 1.7, btnRadiusSm, 0x00ffaa, 'Q', 'ball');
    createActionButton(anchorX + btnSpacing * 0.45, anchorY - btnSpacing * 1.5, btnRadiusSm, 0x00ffaa, 'W', 'arrow');
    createActionButton(anchorX + btnSpacing * 0.95, anchorY - btnSpacing * 1.1, btnRadiusSm, 0x00ffaa, 'E', 'spell');
}

// —————————————————————————————————————————————————————————————————————————————
// PROJECTILE & POWER SYSTEM
// —————————————————————————————————————————————————————————————————————————————

function handlePowerUsage(fighter, powerType, time) {
    if (time < fighter.cd[powerType]) return; // On Cooldown

    // Set Cooldown
    fighter.cd[powerType] = time + POWERS[powerType].cooldown;

    // Slight punch animation for cast
    fighter.setState(STATES.PUNCH, true);

    // Wait for punch frame 1 before spawning
    fighter.scene.time.delayedCall(150, () => {
        if (fighter.isDead) return;
        spawnProjectile(fighter, powerType);
    });
}

function spawnProjectile(fighter, powerType) {
    const element = fighter.element; // 'water' or 'fire'
    const animKey = `${element}_${powerType}_anim`;
    const pConfig = POWERS[powerType];

    // Spawn X offset (originates from player hand) + slight Y offset
    const offsetX = fighter.flipX ? -pConfig.offsetX : pConfig.offsetX;
    const offsetY = pConfig.offsetY;

    // Ensure we grab the first frame to setup texture correctly
    const firstFrameKey = `${element}_${powerType}_1`;

    const proj = projectiles.create(fighter.x + offsetX, fighter.y + offsetY, firstFrameKey);

    if (!proj) return; // Physics group failed?

    proj.play(animKey);

    // Properties
    proj.owner = fighter;
    proj.powerType = powerType;
    proj.damage = pConfig.damage;

    // Flip horizontally compared to fighter to render correctly
    proj.flipX = fighter.flipX;

    // Apply dynamic scaling
    proj.setScale(pConfig.scale);

    // Maintain correct physics body size and alignment
    const scaledWidth = proj.width * pConfig.scale;
    const scaledHeight = proj.height * pConfig.scale;

    proj.body.setSize(scaledWidth, scaledHeight);
    proj.body.setOffset(
        (proj.width - scaledWidth) / 2,
        (proj.height - scaledHeight) / 2
    );
    // Apply Velocity
    const speed = pConfig.speed;
    const vDir = proj.flipX ? -1 : 1;
    proj.setVelocityX(speed * vDir);

    // Spooky floating
    proj.body.allowGravity = false;

    // Apply Glow FX
    const glowColor = element === 'fire' ? 0xff4400 : 0x00aaff;
    if (proj.preFX) proj.preFX.addGlow(glowColor, 2, 0, false);

    // Auto cleanup with Fade-out
    fighter.scene.time.delayedCall(2700, () => {
        if (proj && proj.active) {
            fighter.scene.tweens.add({
                targets: proj,
                alpha: 0,
                duration: 300,
                onComplete: () => {
                    if (proj.active) proj.destroy();
                }
            });
        }
    });

    // POINT-BLANK COLLISION FIX
    // If the target is standing closer than the projectile's spawn offset, it visually bypasses their hitbox in the physics engine.
    const target = fighter.type === 'PLAYER' ? enemy : player;
    const absDistX = Math.abs(fighter.x - target.x);
    const absDistY = Math.abs(fighter.y - target.y);
    const isFacing = (fighter.flipX && fighter.x > target.x) || (!fighter.flipX && fighter.x < target.x);

    // If target is inside the spawn gap and y-aligned, or completely overlapping
    if (absDistY < 100 && ((isFacing && absDistX < Math.abs(offsetX) + 40) || absDistX < 40)) {
        // Delay 1 frame to ensure projectile renders briefly before exploding instantly
        fighter.scene.time.delayedCall(10, () => {
            if (proj.active && !target.isDead) {
                handleProjectileHit(target, proj);
            }
        });
    }
}

function handleProjectileHit(target, projectile) {
    if (!projectile.active) return;

    // Ignore self hits
    if (projectile.owner === target) return;

    const damage = projectile.damage;
    const element = projectile.owner.element;

    // Apply damage & effects
    target.takeDamage(damage);

    // 1. Impact Spark Glow
    const color = element === 'fire' ? 0xff8800 : 0x00ffff;
    const spark = target.scene.add.circle(projectile.x, projectile.y, 100 * projectile.scale, color);
    spark.setBlendMode(Phaser.BlendModes.ADD);

    target.scene.tweens.add({
        targets: spark,
        scale: 2.5,
        alpha: 0,
        duration: 250,
        onComplete: () => spark.destroy()
    });

    // 2. Extra Camera Shake for powers
    // Scale intensity by damage (e.g. 25dmg -> 0.0125)
    target.scene.cameras.main.shake(200, damage / 2000);

    // Destroy projectile
    projectile.destroy();
}
