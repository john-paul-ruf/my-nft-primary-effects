# Loop Function Rules: Pure Functions & Seamless Animation

This guide explains the critical architecture pattern for loop functions in animation effects, ensuring smooth, seamless animations without glitches or discontinuities.

---

## 🎯 Core Principle: Loop as a Pure Function

A **loop function** must be a **pure function** that:
1. **Depends only on generated data** - uses no external mutable state or side effects
2. **Produces deterministic output** - same input always produces same output
3. **Has no side effects** - doesn't modify external state or random sources
4. **Is frame-independent** - works identically regardless of frame order

### Why This Matters

In animation rendering, effects are often processed:
- Out of order (distributed rendering, parallel processing)
- Multiple times (preview vs export)
- In different contexts (worker threads, different machines)

**Pure loop functions guarantee consistency regardless of execution context.**

---

## 🏗️ Architecture Pattern

```
Effect Constructor
    ↓
generate() function called
    ↓
Pre-generated data stored in this.data
    ↓
loop() called for each frame
    ↓
Uses ONLY this.data (pure function)
    ↓
Returns animated frame
```

### Step 1: Constructor - Initialize and Generate

```javascript
export class MyAnimationEffect extends BaseEffect {
  constructor({ config, settings = new Settings({}) } = {}) {
    super({ config, settings });
    
    // Call generate() ONCE in constructor
    // This generates all static/seed data needed for animation
    this.generate();
  }

  /**
   * Generate - Called ONCE in constructor
   * Purpose: Create all data that will be used across all frames
   * 
   * This is where you:
   * - Create random seed data (randomized once, then reused)
   * - Pre-calculate positions, colors, patterns
   * - Generate lookup tables
   * - Prepare any expensive calculations
   */
  generate() {
    // ✅ GOOD: Generate random data ONCE
    const randomSeed = Math.random();
    const positions = this.#generateRandomPositions();
    const colors = this.#generateColorPalette();
    
    // Store ALL data needed for loop()
    this.data = {
      randomSeed,
      positions,
      colors,
      timestamp: Date.now(),
      // ... any other pre-generated data
    };
  }
}
```

### Step 2: Loop - Use Only Generated Data

```javascript
export class MyAnimationEffect extends BaseEffect {
  /**
   * Loop - Called for EVERY frame
   * Purpose: Animate based on pre-generated data
   * 
   * CRITICAL RULES:
   * - Use ONLY this.data (generated in constructor)
   * - NO Math.random() calls (use this.data instead)
   * - NO Date.now() (calculate offset from this.data.timestamp)
   * - NO side effects or external state changes
   * - PURE FUNCTION behavior required
   */
  async invoke(layer, currentFrame, numberOfFrames) {
    const progress = currentFrame / (numberOfFrames - 1); // 0 to 1
    
    // ✅ GOOD: Use pre-generated data
    const animPosition = this.#interpolatePosition(
      progress,
      this.data.positions
    );
    
    const animColor = this.#selectColor(
      progress,
      this.data.colors
    );
    
    // ❌ WRONG: These would break purity
    // const random = Math.random();           // ← Random call!
    // const newColor = '#' + Math.random();   // ← Random call!
    // this.externalState.frame = currentFrame; // ← Side effect!
  }
}
```

---

## 🔄 First Frame = Last Frame Rule

### The Problem: Seamless Looping

When animation loops, frame 0 and frame N-1 play back-to-back:

```
Frame 0 → Frame 1 → Frame 2 → ... → Frame N-1 → Frame 0 (loop)
                                           ↓
                                    MUST match!
```

**If last frame ≠ first frame = visual glitch at loop boundary.**

### The Solution: Progress Calculation

```javascript
/**
 * CRITICAL: Progress must exclude 1.0 for perfect looping
 */
getProgress(currentFrame, numberOfFrames) {
  if (numberOfFrames <= 1) return 0;
  
  // ✅ CORRECT: Progress reaches 0 at frame 0, but only approaches 1 at final frame
  // Final frame gets: (numberOfFrames - 1) / (numberOfFrames - 1) = 1.0
  // But first frame of next loop gets: 0 / (numberOfFrames - 1) = 0.0
  // So the NEXT frame (which wraps to 0) matches the first frame
  return currentFrame / (numberOfFrames - 1);
}

// Example with 120 frames:
// Frame 0:   0 / 119 = 0.000
// Frame 119: 119 / 119 = 1.000 (approaches but differs from 0.000)
// Frame 120 (wraps to 0): 0 / 119 = 0.000 (matches!)
```

### Why NOT `currentFrame / numberOfFrames`

```javascript
// ❌ WRONG - Creates glitch
const wrongProgress = currentFrame / numberOfFrames;

// With 120 frames:
// Frame 0:   0 / 120 = 0.000
// Frame 119: 119 / 120 = 0.992 (different from 0.000!)
// Gap at loop boundary!
```

### Implementation in Effects

```javascript
export class MyAnimationEffect extends BaseEffect {
  /**
   * Correct progress calculation for seamless loops
   */
  getProgress() {
    if (this.totalFrames <= 1) return 0;
    
    // Progress from 0 to 1, exclusive of boundary mismatch
    return this.frameNumber / (this.totalFrames - 1);
  }

  async invoke(layer, currentFrame, numberOfFrames) {
    this.frameNumber = currentFrame;
    this.totalFrames = numberOfFrames;
    
    const progress = this.getProgress();  // ✅ Safe for looping
    
    // Use progress for all animations
    const rotation = progress * Math.PI * 2;  // 0 to 2π
    const scale = 1.0 + Math.sin(progress * Math.PI * 2) * 0.5;
    
    // At loop boundary: progress wraps 1.0→0.0, so rotation/scale reset correctly
  }
}
```

---

## ⚙️ Ensuring Pure Loop Functions

### Anti-Pattern: Random Generation in Loop

```javascript
// ❌ WRONG - Breaks purity and consistency
async invoke(layer, currentFrame, numberOfFrames) {
  const randomColor = '#' + Math.random().toString(16).slice(2, 8);
  const randomPosition = {
    x: Math.random() * 1024,
    y: Math.random() * 1024
  };
  // Each frame gets different random values!
  // Out-of-order rendering produces different output!
}
```

### Pattern: Pre-Generate, Then Use

```javascript
// ✅ CORRECT - Pure function with pre-generated data
generate() {
  this.data = {
    // Generate random data ONCE
    baseColors: [
      this.#randomColor(),
      this.#randomColor(),
      this.#randomColor(),
    ],
    basePositions: [
      { x: Math.random() * 1024, y: Math.random() * 1024 },
      { x: Math.random() * 1024, y: Math.random() * 1024 },
    ],
    randomSeed: Math.random(),
  };
}

async invoke(layer, currentFrame, numberOfFrames) {
  const progress = this.getProgress();
  
  // Select from pre-generated data based on progress
  const colorIndex = Math.floor(progress * this.data.baseColors.length) 
                     % this.data.baseColors.length;
  const color = this.data.baseColors[colorIndex];
  
  // Animate using pre-generated positions
  const position = this.#interpolatePositions(progress, this.data.basePositions);
  
  // Deterministic: same currentFrame always produces same output
}
```

---

## 🔐 Purity Checklist

When implementing a loop function, verify:

| Check | ✅ Correct | ❌ Wrong |
|-------|-----------|---------|
| **Random values** | `this.data.randomValue` | `Math.random()` |
| **Timestamps** | `progress`, calculated offsets | `Date.now()` |
| **External state** | Read-only config, settings | Modifying `this.externalVar = x` |
| **Determinism** | Frame 5 always same | Frame 5 differs each run |
| **Frame order** | Works reversed, shuffled | Depends on sequence order |
| **Progress** | `frame / (total - 1)` | `frame / total` |

---

## 📊 Real Example: Parametric Animation

### Complete Pattern with Generate + Loop

```javascript
import { BaseEffect } from 'my-nft-gen';
import { Canvas2dFactory } from 'my-nft-gen';
import { Settings } from 'my-nft-gen/src/core/common/Settings.js';

export class ParametricWaveEffect extends BaseEffect {
  constructor({ config, settings = new Settings({}) } = {}) {
    super({ config, settings });
    
    // ✅ Generate called ONCE
    this.generate();
  }

  /**
   * Phase 1: Generate
   * Creates all animation data statically
   */
  generate() {
    // Seeded randomness
    const seed = Math.random();
    
    // Pre-calculate animation parameters
    const waveCount = Math.floor(3 + seed * 4);  // 3-6 waves
    const amplitude = 30 + seed * 70;             // 30-100 amplitude
    const frequency = 1 + seed * 3;               // 1-4x frequency
    
    // Pre-generate color palette
    const colors = this.#generatePalette(seed);
    
    this.data = {
      seed,
      waveCount,
      amplitude,
      frequency,
      colors,
      canvasSize: 1024,
    };
  }

  /**
   * Phase 2: Loop (called for each frame)
   * Uses ONLY this.data - pure function
   */
  async invoke(layer, currentFrame, numberOfFrames) {
    this.frameNumber = currentFrame;
    this.totalFrames = numberOfFrames;
    
    const progress = this.getProgress();  // 0 to 1, perfect loop
    
    const canvas = await Canvas2dFactory.getNewCanvas(
      this.data.canvasSize,
      this.data.canvasSize
    );
    
    // Render waves based on pre-generated data
    for (let i = 0; i < this.data.waveCount; i++) {
      const phase = progress * Math.PI * 2;
      const wavePhase = phase + (i / this.data.waveCount) * Math.PI * 2;
      const color = this.data.colors[i % this.data.colors.length];
      
      // Draw parametric wave
      await this.#drawParametricWave(
        canvas,
        wavePhase,
        this.data.amplitude,
        this.data.frequency,
        color
      );
    }
    
    const waveLayer = await canvas.convertToLayer();
    return await layer.composeOver(waveLayer, { blend: 'screen' });
  }

  #generatePalette(seed) {
    // Use seed for reproducible color generation
    return [
      this.#seedColor(seed, 0),
      this.#seedColor(seed, 1),
      this.#seedColor(seed, 2),
    ];
  }

  #seedColor(seed, index) {
    const pseudoRandom = Math.sin(seed * 12.9898 + index * 78.233) * 43758.5453;
    const hue = (pseudoRandom - Math.floor(pseudoRandom)) * 360;
    return `hsl(${hue}, 100%, 50%)`;
  }

  #drawParametricWave(canvas, phase, amplitude, frequency, color) {
    // Implementation
  }

  getProgress() {
    if (this.totalFrames <= 1) return 0;
    return this.frameNumber / (this.totalFrames - 1);
  }
}
```

---

## 🎬 Animation Speed with Integer Multiples

For effects with cyclical patterns (pulses, spirals, waves), use **integer speed multipliers** to ensure perfect loops:

```javascript
export class MyConfig {
  constructor({
    pulseWaveSpeed = 2.0,   // ✅ MUST be integer
    spiralSpeed = 3.0,      // ✅ MUST be integer
    floatSpeed = 1.5,       // ❌ AVOID non-integers
  } = {}) {
    this.pulseWaveSpeed = pulseWaveSpeed;
    this.spiralSpeed = spiralSpeed;
  }
}

async invoke(layer, currentFrame, numberOfFrames) {
  const progress = this.getProgress();  // 0 to 1
  
  // With integer speeds, wave completes exact cycles
  const pulseCycle = progress * this.config.pulseWaveSpeed * Math.PI * 2;
  // If speed=2: completes exactly 2 full cycles (0→2π→4π)
  // Perfect! No glitch at boundary.
  
  const spiralRotation = progress * this.config.spiralSpeed * Math.PI * 2;
  // If speed=3: completes exactly 3 full rotations
  // Perfect loop!
}
```

### Why Integer Speeds Matter

- **Integer multiples** = exact cycle completions at frame boundary
- **Non-integers** = partial cycles = glitch at loop boundary
- **Example**: speed=2.5 means 2.5 cycles, leaving 0.5π phase offset at boundary

---

## 📝 Best Practices

✅ **DO:**
- Generate all animation data in constructor
- Use pure functions in loop/invoke
- Calculate progress as `frame / (total - 1)`
- Use integer speed multipliers for cyclic patterns
- Store pre-generated randomness in `this.data`
- Test animation by repeating it twice (watch for glitches)

❌ **DON'T:**
- Call `Math.random()` in loop function
- Call `Date.now()` in loop function
- Modify external state in loop function
- Use floating-point speed multipliers
- Calculate progress as `frame / total`
- Generate data on each frame

---

## 🧪 Testing for Seamless Loops

### Quick Test: Visual Continuity

```javascript
// Render twice in sequence
const frames = 120;
const allFrames = [];

// First loop
for (let f = 0; f < frames; f++) {
  allFrames.push(await effect.invoke(layer, f, frames));
}

// Second loop (should start seamlessly)
for (let f = 0; f < frames; f++) {
  allFrames.push(await effect.invoke(layer, f, frames));
}

// Play allFrames back to back
// If there's a visual glitch where the two sequences meet, 
// loop function isn't pure or progress calculation is wrong
```

### Test for Purity

```javascript
// Render frame 50 multiple times
const frame50A = await effect.invoke(layer, 50, 120);
const frame50B = await effect.invoke(layer, 50, 120);
const frame50C = await effect.invoke(layer, 50, 120);

// Compare outputs - must be identical
// If different, loop function has side effects or random calls
```

---

## 🔗 Related Patterns

- **Color Extraction**: Use ColorPicker in generate(), apply colors in loop
- **Position Systems**: Pre-generate position data in constructor
- **Easing Functions**: Pre-calculate easing curves if complex
- **Geometry Cache**: Pre-generate complex paths/shapes in generate()

See `COLORPICKER_AND_POSITIONS.md` for integration patterns.