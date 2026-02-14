# Stickman Fight - Technical Explanation

## Sprite Sheet Slicing & Frame Calculation
All assets were provided as single-row PNGs with a uniform height of **128px**.
Since the frames are square (or designed to fit in 128px width), the calculation for `frameWidth` is straightforward:
- **Formula**: `Total Width / Number of Frames`
- **Example (Jump)**: `1280px / 10 frames = 128px` frameWidth.
- **Example (Idle)**: `768px / 6 frames = 128px` frameWidth.

This uniformity allowed us to load all sprites using a simple loop over a configuration object, ensuring scalability if new assets are added.

## Animation State Management
We implemented a **Finite State Machine (FSM)** within the `Fighter` class.
- **States**: `IDLE`, `WALK`, `RUN`, `JUMP`, `PUNCH`, `KICK`, `SHIELD`, `HURT`, `DEAD`.
- **Locking Mechanism**: Certain states (Attack, Hurt, Dead) "lock" the character, preventing immediate transitions to other states until the animation completes or a higher-priority event (like Death) occurs.
- **Animation Complete Event**: We use Phaser's `animationcomplete` event to automatically revert non-looping states (Punch, Kick, Jump) back to `IDLE`, ensuring the character doesn't get stuck.

## Physics & Realism
To satisfy the "Acceleration & Deceleration" requirement, we avoided setting velocity directly for movement.
- **Acceleration**: Controls left/right movement (`setAccelerationX`). This creates a "wind-up" feeling.
- **Drag (Friction)**: We set a high drag value (`1000`) so the character slides to a halt rather than stopping instantly.
- **Gravity**: Set to `1000` for snappy but realistic jumps.

## Tweaking Speed & Gameplay
All balance constants are centralized in the `STATS` object in `main.js`:
```javascript
const STATS = {
    speedWalk: 160,
    speedRun: 320,
    accel: 600,       // How fast you reach top speed
    drag: 1000,       // How fast you stop
    jumpForce: -600,  // Jump height
    attackCooldown: 300 // ms between attacks
};
```
Adjusting these values immediately changes the "feel" of the game (e.g., lower drag = more slippery/ice-like movement).
