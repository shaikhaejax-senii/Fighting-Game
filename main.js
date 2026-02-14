const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#87CEEB',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1000 },
            debug: false // Set to true to see hitboxes
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

const ASSETS = {
    punch: { key: 'punch', file: 'assets/Punch.png', frames: 6, rate: 10, loop: false },
    kick: { key: 'kick', file: 'assets/Kick.png', frames: 6, rate: 10, loop: false },
    idle: { key: 'idle', file: 'assets/Idle.png', frames: 6, rate: 8, loop: true },
    jump: { key: 'jump', file: 'assets/Jump.png', frames: 10, rate: 14, loop: false },
    walk: { key: 'walk', file: 'assets/Walk.png', frames: 8, rate: 10, loop: true },
    dead: { key: 'dead', file: 'assets/Dead.png', frames: 3, rate: 5, loop: false },
    hurt: { key: 'hurt', file: 'assets/Hurt.png', frames: 3, rate: 10, loop: false },
    // Shield updated to 2 frames
    shield: { key: 'shield', file: 'assets/Shield.png', frames: 2, rate: 10, loop: false }
};

const STATES = {
    IDLE: 'idle',
    WALK: 'walk',
    JUMP: 'jump',
    PUNCH: 'punch',
    KICK: 'kick',
    DEAD: 'dead',
    HURT: 'hurt',
    SHIELD: 'shield'
};

const STATS = {
    speedWalk: 180,     // Restoring speed
    jumpForce: -600,    // Restoring jump
    accel: 1500,
    drag: 2000,
    attackCooldown: 500,
    damagePunch: 10,
    damageKick: 15,
    hitDistance: 80      // Tightened from 120
};

// —————————————————————————————————————————————————————————————————————————————
// GLOBAL VARIABLES
// —————————————————————————————————————————————————————————————————————————————

var player, enemy, ground;
var cursors;
var keyJump, keyPunch, keyKick;
var keyA, keyD, keyS;
var mobileInputs = { left: false, right: false, up: false, down: false, punch: false, kick: false };
var isGameActive = false;

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
    inputEnemy: null
};

// —————————————————————————————————————————————————————————————————————————————
// PHASER FUNCTIONS
// —————————————————————————————————————————————————————————————————————————————

function preload() {
    // Load spritesheets from PNG files
    Object.values(ASSETS).forEach(asset => {
        this.load.spritesheet(asset.key, asset.file, { frameWidth: 128, frameHeight: 128 });
    });
}

function create() {
    // 1. CREATE ANIMATIONS
    Object.values(ASSETS).forEach(asset => {
        this.anims.create({
            key: asset.key,
            frames: this.anims.generateFrameNumbers(asset.key, { start: 0, end: asset.frames - 1 }),
            frameRate: asset.rate,
            repeat: asset.loop ? -1 : 0
        });
    });

    // 2. CREATE WORLD
    ground = this.add.rectangle(400, 570, 800, 40, 0x333333);
    this.physics.add.existing(ground, true);

    // 3. CREATE FIGHTERS
    player = createFighter(this, 200, 450, 'PLAYER');
    enemy = createFighter(this, 600, 450, 'ENEMY');

    // Collisions
    this.physics.add.collider(player, ground);
    this.physics.add.collider(enemy, ground);
    // this.physics.add.collider(player, enemy); // Allow pass-through

    // 4. INPUTS
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

    // 6. MOBILE CONTROLS
    createMobileControls(this);

    // Global hooks
    window.startGame = () => {
        // Update Names
        ui.playerName.textContent = ui.inputPlayer.value || "PLAYER";
        ui.enemyName.textContent = ui.inputEnemy.value || "ENEMY";

        resetGame(this);
        isGameActive = true;
        ui.startScreen.classList.add('hidden');
    };

    window.restartGame = () => {
        // Return to Start Screen with previous names pre-filled
        isGameActive = false;
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

function createFighter(scene, x, y, type) {
    const sprite = scene.physics.add.sprite(x, y, 'idle');
    sprite.setCollideWorldBounds(true);

    // Physics Body adjustments
    sprite.body.setSize(40, 90);
    sprite.body.setOffset(44, 38);
    sprite.body.setDragX(STATS.drag);
    // Strict cap on horizontal speed to ensure "Walking" only
    sprite.body.setMaxVelocity(STATS.speedWalk, 1000);

    // PROPERTIES
    sprite.type = type;
    sprite.hp = 100;
    sprite.maxHp = 100;
    sprite.isDead = false;
    sprite.currentState = STATES.IDLE;
    sprite.lastAttackTime = 0;

    // METHODS
    sprite.setState = function (newState, force = false) {
        if (this.isDead) return;
        if (this.currentState === newState && !force) return;

        this.currentState = newState;

        // Play animation
        const isAttack = (newState === STATES.PUNCH || newState === STATES.KICK || newState === STATES.HURT || newState === STATES.DEAD);

        // Handle Shield (Animation is now available)
        if (newState === STATES.SHIELD) {
            this.play(STATES.SHIELD, true);
        } else {
            this.play(newState, true);
        }

        if (isAttack) {
            this.once('animationcomplete', () => {
                if (this.anims.currentAnim && this.anims.currentAnim.key === newState) {
                    if (this.currentState === STATES.DEAD) return;
                    this.setState(STATES.IDLE);
                }
            });
        }
    };

    sprite.takeDamage = function (amount) {
        if (this.isDead) return;

        if (this.currentState === STATES.SHIELD) {
            // Blocked! Greatly Reduced damage
            amount = Math.ceil(amount * 0.1);
        }

        this.hp -= amount;
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
        this.isDead = true;
        this.setVelocity(0, 0);
        this.setAccelerationX(0);
        this.body.allowGravity = false;
        this.body.checkCollision.none = true;
        this.body.moves = false;

        this.play(STATES.DEAD, true);

        // Visual adjustment: Removed offset as -5 was floating and +5 was sinking.
        // 0 should be the correct baseline.

        setTimeout(() => {
            endGame(this.type === 'PLAYER' ? 'YOU LOST' : 'YOU WON');
        }, 2000);
    };

    sprite.play('idle');
    return sprite;
}

function handlePlayerInput(time) {
    if (player.isDead || player.currentState === STATES.HURT) return;

    const onGround = player.body.blocked.down || player.body.touching.down;

    // ATTACKS
    const canAttack = time > player.lastAttackTime + STATS.attackCooldown;

    // INPUT CHECKERS
    const isLeft = cursors.left.isDown || keyA.isDown || mobileInputs.left;
    const isRight = cursors.right.isDown || keyD.isDown || mobileInputs.right;
    const isBlock = cursors.down.isDown || keyS.isDown || mobileInputs.down;
    const isJump = Phaser.Input.Keyboard.JustDown(keyJump) || mobileInputs.up; // Note: mobileInputs.up needs to be handled carefully for JustDown behavior or continuous

    // For Touch, "JustDown" is hard with boolean. 
    // We'll treat jump as continuous hold for "air jump" logic or state change, 
    // but the state machine handles transitions so hold is fine.
    // However, repeated jumping might need reset. 
    // For now, let's just use the boolean.

    // SHIELD INPUT
    if (isBlock && onGround) {
        if (player.currentState !== STATES.PUNCH && player.currentState !== STATES.KICK) {
            player.setVelocityX(0);
            player.setAccelerationX(0);
            player.setState(STATES.SHIELD);
            return; // Block movement
        }
    } else {
        if (player.currentState === STATES.SHIELD) {
            player.setState(STATES.IDLE);
        }
    }

    // Note: Attack cooldown (canAttack) prevents rapid fire, so holding button is fine.
    if (canAttack) {
        if (Phaser.Input.Keyboard.JustDown(keyPunch) || mobileInputs.punch) { // J
            performAttack(player, enemy, STATES.PUNCH, STATS.damagePunch, time);
            mobileInputs.punch = false; // Reset to prevent auto-fire if we want strict tapping
            return;
        }
        if (Phaser.Input.Keyboard.JustDown(keyKick) || mobileInputs.kick) { // K
            performAttack(player, enemy, STATES.KICK, STATS.damageKick, time);
            mobileInputs.kick = false;
            return;
        }
    }

    // Lock movement during attack or shield
    if (player.currentState === STATES.PUNCH || player.currentState === STATES.KICK || player.currentState === STATES.SHIELD) {
        return;
    }

    // MOVEMENT
    if (isLeft) {
        player.flipX = true;
        if (onGround) {
            player.setAccelerationX(-STATS.accel);
            player.setState(STATES.WALK);
        } else {
            player.setAccelerationX(-STATS.accel * 0.05);
        }
    }
    else if (isRight) {
        player.flipX = false;
        if (onGround) {
            player.setAccelerationX(STATS.accel);
            player.setState(STATES.WALK);
        } else {
            player.setAccelerationX(STATS.accel * 0.05);
        }
    }
    else {
        player.setAccelerationX(0);
        if (onGround) {
            if (Math.abs(player.body.velocity.x) < 20) player.setState(STATES.IDLE);
        }
    }

    // JUMP
    if (isJump && onGround) {
        player.setVelocityY(STATS.jumpForce);
        player.setState(STATES.JUMP);
    }

    // Air Animation
    if (!onGround) {
        if (player.currentState !== STATES.JUMP && player.currentState !== STATES.PUNCH && player.currentState !== STATES.KICK) {
            player.setState(STATES.JUMP);
        }
    }
}

function handleEnemyAI(time) {
    if (enemy.isDead || enemy.currentState === STATES.HURT) return;

    const dist = Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y);
    const attackRange = 100;

    // Face Player
    if (player.x < enemy.x) enemy.flipX = true;
    else enemy.flipX = false;

    // ATTACK
    if (dist < attackRange) {
        enemy.setAccelerationX(0);
        enemy.setVelocityX(0);

        if (time > enemy.lastAttackTime + 2000) { // Slower attack rate
            const type = Math.random() > 0.5 ? STATES.PUNCH : STATES.KICK;
            const dmg = type === STATES.PUNCH ? STATS.damagePunch : STATS.damageKick;
            performAttack(enemy, player, type, dmg, time);
        } else {
            // Block if player is attacking? Or just random block
            if (enemy.currentState !== STATES.PUNCH &&
                enemy.currentState !== STATES.KICK &&
                enemy.currentState !== STATES.HURT) {

                // AI Shield logic
                if (Math.random() > 0.98) { // 2% chance per frame to block
                    enemy.setState(STATES.SHIELD);
                } else if (enemy.currentState === STATES.SHIELD && Math.random() > 0.95) {
                    // 5% chance to drop shield
                    enemy.setState(STATES.IDLE);
                } else if (enemy.currentState !== STATES.SHIELD) {
                    enemy.setState(STATES.IDLE);
                }
            }
        }
    }
    // MOVE
    else {
        // Drop shield if moving
        if (enemy.currentState === STATES.SHIELD) enemy.setState(STATES.IDLE);

        // Simple chase
        const dir = player.x < enemy.x ? -1 : 1;
        enemy.setAccelerationX(dir * STATS.accel);

        enemy.setState(STATES.WALK); // Always Walk, never Run
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
            // Pushback
            const pushDir = attacker.x < target.x ? 1 : -1;
            target.setVelocityX(pushDir * 150);
            target.setVelocityY(-100);
        }
    });
}

function updateUI() {
    const pPct = Math.max(0, (player.hp / player.maxHp) * 100);
    const ePct = Math.max(0, (enemy.hp / enemy.maxHp) * 100);

    ui.playerBar.style.width = pPct + '%';
    ui.enemyBar.style.width = ePct + '%';

    ui.playerBar.style.backgroundColor = pPct < 30 ? '#ff0000' : '#00ff00';
    ui.enemyBar.style.backgroundColor = ePct < 30 ? '#ff0000' : '#ff0000';
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
    // Basic check for mobile environment
    const isMobile = scene.sys.game.device.os.android || scene.sys.game.device.os.iOS || scene.sys.game.device.input.touch;
    if (!isMobile) {
        // Optional: Force display for testing if needed, but per request usually hidden. 
        // For now, if desktop with mouse, we likely don't want them unless it's a touch laptop.
        // Let's rely on standard check.
        // return; 
    }

    // Actually, user said "Show touch controls only on mobile".
    if (!isMobile) return;

    const width = scene.scale.width;
    const height = scene.scale.height;

    // Helper to create button
    const createBtn = (x, y, color, text, key) => {
        const btn = scene.add.circle(x, y, 40, color, 0.5).setScrollFactor(0).setInteractive();
        // Add stroke
        btn.setStrokeStyle(2, 0xffffff);

        const label = scene.add.text(x, y, text, { fontSize: '24px', fontStyle: 'bold', fontFamily: 'Arial' }).setOrigin(0.5).setScrollFactor(0);

        const press = () => { btn.fillAlpha = 0.8; mobileInputs[key] = true; };
        const release = () => { btn.fillAlpha = 0.5; mobileInputs[key] = false; };

        btn.on('pointerdown', press);
        btn.on('pointerup', release);
        btn.on('pointerout', release);

        // Multi-touch support
        scene.input.addPointer(2); // Ensure we have enough pointers

        return btn;
    };

    // D-PAD (Bottom Left)
    createBtn(60, height - 70, 0x555555, '<', 'left');
    createBtn(160, height - 70, 0x555555, '>', 'right');

    // ACTIONS (Bottom Right)
    // Layout: 
    //      J (Jump)  
    //  K (Kick)   P (Punch)
    //      S (Shield)

    // Actually standard fight layout:
    // Punch (J)   Kick (K)
    // Jump (Space) Block (S)

    // Jump (Blue)
    createBtn(width - 60, height - 160, 0x0088ff, 'J', 'up');

    // Punch (Green)
    createBtn(width - 140, height - 80, 0x00cc00, 'P', 'punch');

    // Kick (Red)
    createBtn(width - 60, height - 80, 0xff4444, 'K', 'kick');

    // Block (Gray/Yellow) - Bottom center-ish or below jump?
    // Let's put Shield near Jump/Move or distinct.
    // User requested "Buttons must be positioned at bottom of screen".
    // Let's put Block next to Right arrow? Or standard fighting game layout.
    // Let's put Block as a smaller button or centrally.
    createBtn(width - 160, height - 180, 0xaaaa00, 'S', 'down');
}
