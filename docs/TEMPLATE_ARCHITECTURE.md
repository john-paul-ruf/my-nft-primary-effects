# Effect Template Architecture Guide

## Overview

This document explains the **why** behind our effect templates. They're not just blank starters—they're carefully designed to integrate seamlessly with the **my-nft-gen framework** while providing production-grade patterns that scale from simple prototypes to complex effect chains.

---

## The Philosophy: Why Templates Matter

### Problem We Solved

Before this architecture:
- Effects were isolated, standalone classes
- No consistent way to integrate with the rendering pipeline
- Configuration validation was ad-hoc or missing entirely
- No frame awareness—animation support was fragile
- Debugging complex effect chains was difficult

### Solution: Framework-Aligned Templates

We aligned our templates with the **my-nft-gen** architectural patterns because:
1. **Consistency**: All effects speak the same language
2. **Reliability**: The framework handles lifecycle, chaining, and registration
3. **Features**: Built-in support for animations, validation, and debugging
4. **Scalability**: From simple effects to complex compositions

---

## Architectural Decisions & Their Rationale

### 1. **Extending `LayerEffect` Instead of Standalone Classes**

**What We Changed:**
```js
// ❌ Before: Isolated class
export class MyEffect { ... }

// ✅ After: Integrated with framework
export class MyEffect extends LayerEffect { ... }
```

**Why:**
- `LayerEffect` is the framework's base class that handles:
  - **Lifecycle management**: Proper initialization and cleanup
  - **Effect chaining**: `super.invoke()` enables composable effects
  - **Framework integration**: Works with the plugin registry
  - **Error boundaries**: Consistent error handling across all effects

**When This Matters:**
- When you stack multiple effects on a single layer
- When you need effects to respect each other's transformations
- When the framework needs to discover and register your effects

**Real Example:**
If you chain 3 effects (Blur → Glow → ColorShift), each calls `super.invoke()` to pass the modified layer to the next effect. Without extending LayerEffect, this chain breaks.

---

### 2. **Static Metadata (`_name_`, `_displayName_`, etc.)**

**What We Include:**
```js
static _name_ = 'my-effect';              // Unique identifier
static _displayName_ = 'My Effect';       // UI display name
static _description_ = 'Does X, Y, Z';    // What it does
static _version_ = '1.0.0';               // Version tracking
static _author_ = 'Your Name';            // Credit
static _tags_ = ['effect', 'animation'];  // Search/filter
```

**Why:**
- **Discovery**: The framework's registry uses `_name_` to locate and track effects
- **UI/UX**: `_displayName_` and `_description_` appear in tools and documentation
- **Organization**: `_tags_` enable categorization without changing code
- **Versioning**: `_version_` helps track updates and compatibility
- **Attribution**: `_author_` gives credit where due

**The Underscore Convention:**
The underscores (`_name_` not `name`) are intentional—this prevents accidental collision with instance properties while signaling these are framework metadata.

**When This Matters:**
- When an NFT generation pipeline needs to discover available effects
- When users search for "animation" effects by tag
- When debugging—you'll see `_displayName_` in logs instead of a cryptic class name

---

### 3. **Method Signature: `invoke()` with Frame Context**

**What We Changed:**
```js
// ❌ Before: No context
async apply() { ... }

// ✅ After: Frame-aware
async invoke(layer, currentFrame, numberOfFrames) {
  // currentFrame: which frame in the animation (0, 1, 2, ...)
  // numberOfFrames: total frames in the sequence (e.g., 60)
  // Enables: progress = currentFrame / numberOfFrames
}
```

**Why:**
- **Temporal Awareness**: Effects can respond to animation progress
- **Frame Accuracy**: Know exactly where you are in a sequence
- **Smooth Animations**: Progress enables easing, interpolation, morphing
- **Framework Requirement**: The rendering pipeline calls `invoke()` with this signature

**Real Examples:**

```js
// Fade in over first 20 frames
if (currentFrame < 20) {
  opacity = currentFrame / 20;  // 0 → 1
}

// Bounce effect that repeats 3 times
const cycleProgress = (currentFrame % (numberOfFrames / 3)) / (numberOfFrames / 3);
// Enables cyclical animations

// Keyframe interpolation
const progress = currentFrame / numberOfFrames;  // Always 0 → 1
const value = this.interpolate(startValue, endValue, progress);
```

**When This Matters:**
- When creating animations that span multiple frames
- When you need effects to synchronize with each other
- When rendering video sequences (each frame needs consistent results)

---

### 4. **Configuration as Validated Classes**

**What We Changed:**
```js
// ❌ Before: Plain config object, no validation
export const MyEffectConfig = {
  intensity: 0.5,
  color: '#FF0000'
};

// ✅ After: Class with validation
export class MyEffectConfig {
  constructor({ intensity = 0.5, color = '#FF0000' } = {}) {
    this.intensity = intensity;
    this.color = color;
  }
  
  static validate(config) {
    const errors = [];
    if (typeof config.intensity !== 'number' || config.intensity < 0 || config.intensity > 1) {
      errors.push('intensity must be a number between 0 and 1');
    }
    if (!/^#[0-9A-F]{6}$/i.test(config.color)) {
      errors.push('color must be a valid hex color');
    }
    return { valid: errors.length === 0, errors };
  }
}
```

**Why:**
- **Type Safety**: Constructor ensures parameters are what you expect
- **Validation**: `validate()` catches bad config before effects execute
- **Clear Contracts**: Developers know exactly what parameters are valid
- **Debugging**: Validation errors point to the root cause immediately
- **Reusability**: Config class can have utility methods (`serialize()`, `clone()`, etc.)

**Real Problem This Solves:**
Without validation, a user might pass `intensity: "very high"` (a string instead of a number). Your effect crashes silently 50 frames into a 1000-frame render. With validation, you catch it immediately with a clear error message.

**When This Matters:**
- When effects have parameters that must be in specific ranges
- When wrong parameters could corrupt the render pipeline
- When you want to support config serialization (save/load effect chains)

---

### 5. **Error Handling & Validation in `invoke()`**

**What We Include:**
```js
async invoke(layer, currentFrame, numberOfFrames) {
  try {
    // Validate config before doing anything
    const validation = MyEffectConfig.validate(this.config);
    if (!validation.valid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }
    
    // Your effect logic
    // ...
    
    // Always call super.invoke() at the end
    await super.invoke(layer, currentFrame, numberOfFrames);
  } catch (error) {
    console.error(`Error in ${this._displayName_}:`, error);
    throw error;  // Re-throw for framework to handle
  }
}
```

**Why:**
- **Early Validation**: Catch problems before they propagate
- **Context in Errors**: Error messages include the effect name
- **Proper Propagation**: Framework can pause renders and report issues
- **Chaining Support**: `super.invoke()` enables the next effect in the chain

**Without This:**
- A typo in config cascades into rendering errors
- You don't know which effect caused the problem
- Effect chains break silently

**When This Matters:**
- When rendering long sequences (catch errors early, save time)
- When debugging effect chains (context-rich error messages)
- When validating user-provided configurations

---

### 6. **`getInfo()` for Debugging**

**What We Include:**
```js
getInfo() {
  return `${this._displayName_} (${this._name_}): intensity=${this.config.intensity || 'N/A'}`;
}
```

**Why:**
- **Logging**: When the framework logs effect progress, you see readable names
- **Debugging**: When something breaks, `getInfo()` tells you the effect state
- **Inspection**: Tools can call `getInfo()` to report effect chain status

**Example Output:**
```
Applying effects...
  → My Blur Effect (blur-effect): intensity=0.7
  → Glow (glow): intensity=0.5, color=#FF00FF
  → Color Shift (color-shift): targetColor=#0000FF
✓ Complete
```

**Without This:**
```
Applying effects...
  → Effect 1
  → Effect 2
  → Effect 3
✓ Complete
```

---

### 7. **Animation Helpers (KeyFrame Template)**

**What We Include:**
```js
// Linear interpolation
interpolate(start, end, progress) {
  return start + (end - start) * progress;
}

// Easing functions for smooth animation
easeInCubic(progress) { return progress * progress * progress; }
easeOutCubic(progress) { return 1 - Math.pow(1 - progress, 3); }
easeInOutCubic(progress) { 
  return progress < 0.5 
    ? 4 * progress * progress * progress 
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
}

// Frame-to-progress conversion
getProgress(currentFrame, numberOfFrames) {
  return Math.max(0, Math.min(1, currentFrame / numberOfFrames));
}
```

**Why:**
- **Smooth Animations**: Easing creates natural motion (not linear jumps)
- **Common Patterns**: These are the most-used easing functions
- **DRY Principle**: Don't repeat these calculations in every effect

**Real Example:**
```js
// Without helpers: Complicated, error-prone
const scaleFactor = Math.max(0, Math.min(1, currentFrame / numberOfFrames));
const eased = scaleFactor < 0.5 
  ? 4 * scaleFactor * scaleFactor * scaleFactor
  : 1 - Math.pow(-2 * scaleFactor + 2, 3) / 2;

// With helpers: Clear intent
const progress = this.getProgress(currentFrame, numberOfFrames);
const scale = this.interpolate(1, 2, this.easeInOutCubic(progress));
```

**When This Matters:**
- Creating smooth animation transitions
- Keyframe effects that evolve over a sequence
- Temporal effects (fade, grow, morph, etc.)

---

### 8. **Comprehensive JSDoc**

**What We Include:**
```js
/**
 * Applies the effect to a layer across an animation sequence.
 * 
 * @param {Layer} layer - The layer to transform
 * @param {number} currentFrame - Current frame in sequence (0-based)
 * @param {number} numberOfFrames - Total frames in sequence
 * 
 * @returns {Promise<void>} Resolves when effect is applied
 * 
 * @throws {Error} If configuration is invalid
 * 
 * @example
 * const effect = new MyEffect({ config: new MyEffectConfig({ intensity: 0.5 }) });
 * await effect.invoke(layer, 0, 60);
 */
async invoke(layer, currentFrame, numberOfFrames) { ... }
```

**Why:**
- **IDE Support**: WebStorm/VS Code shows parameter hints and types
- **Self-Documentation**: Code explains itself without external docs
- **Onboarding**: New developers understand usage immediately
- **Fewer Bugs**: Types prevent mistakes (e.g., passing string instead of number)

**When This Matters:**
- Working in an IDE with autocomplete
- Maintaining code over time (your future self will thank you)
- Team collaboration (everyone understands expectations)

---

## Template Selection Guide

### **Use PrimaryEffectTemplate When:**
- Creating base visual elements (colors, shapes, patterns)
- Building effects that modify layer fundamentals
- Making the core visual foundation

**Example:** Background gradient, base texture layer

### **Use SecondaryEffectTemplate When:**
- Enhancing or modifying already-rendered content
- Applying post-processing effects
- Layering visual effects on top of primary elements
- Need blend mode support

**Example:** Blur, glow, color grading adjustments

### **Use KeyFrameEffectTemplate When:**
- Creating effects that animate over time
- Need easing functions and interpolation
- Building temporal transformations
- Animating property changes across frames

**Example:** Fade in, scale up, morph between states, pulsing glow

### **Use FinalEffectTemplate When:**
- Polishing the final composition
- Applying color grading or tone mapping
- Single-frame, non-sequential effects
- Finishing touches (contrast, saturation, etc.)

**Example:** Color grading, tone mapping, final brightness adjustment

---

## Integration with my-nft-gen

Our templates intentionally align with **my-nft-gen** because:

1. **Consistent API**: If you've used my-nft-gen effects, these will feel familiar
2. **Plugin Compatibility**: Your effects can be used in any my-nft-gen pipeline
3. **Best Practices**: We've adopted patterns proven in production
4. **Framework Features**: Chaining, validation, registration all work out of the box

**Key my-nft-gen Concepts Reflected:**
- `LayerEffect` base class inheritance
- Static metadata for registry
- `invoke()` method signature with frame context
- Configuration validation pattern
- Effect chaining via `super.invoke()`

---

## Preset System & Configuration Patterns

### What Are Presets?

Presets are **named, reusable configurations** for effects. Instead of manually configuring parameters every time, presets encapsulate best-practice or thematic settings that can be selected by name or randomly.

**Real-World Analogy:**
Just like a camera has preset "modes" (Portrait, Landscape, Night), effects have presets (Cinematic, Minimal, Intense). Each preset is a complete configuration recipe.

### Preset Structure

```js
{
  name: 'preset-name',              // Unique identifier within the effect
  effect: 'effect-id',              // Must match the effect's _name_
  percentChance: 50,                // Weight for random selection (0-100)
  currentEffectConfig: { ... }      // The actual configuration object
}
```

**Example:**
```js
{
  name: 'cinematic',
  effect: 'animated-tree-of-life',
  percentChance: 60,
  currentEffectConfig: {
    colors: ['#FF0000', '#0000FF'],
    speed: 1.5,
    amplitude: 0.8
  }
}
```

### Preset Methods on Every Effect

All templates include three preset methods:

#### 1. `getPresets()` - List All Presets
```js
const presets = MyEffect.getPresets();
// Returns: [{ name: 'cinematic', ... }, { name: 'minimal', ... }]
```

**Use Case:** Build a UI dropdown with all available presets

#### 2. `getPreset(name)` - Get Specific Preset
```js
const preset = MyEffect.getPreset('cinematic');
if (preset) {
  const effect = new MyEffect({ config: preset.currentEffectConfig });
}
```

**Use Case:** User selects "Cinematic" from dropdown

#### 3. `getRandomPreset()` - Random Weighted Selection
```js
const randomPreset = MyEffect.getRandomPreset();
// If 'cinematic' has 60% and 'minimal' has 40% chance:
//  ~60% of calls return cinematic preset
//  ~40% of calls return minimal preset
```

**Use Case:** Procedural generation with variety and control

### Setting Presets - Plugin Registration

Presets are typically set during plugin registration in `src/index.js`:

```js
export async function register(EffectRegistry, PositionRegistry) {
  // Import your effect
  const { MyEffectClass } = await import('./effects/MyEffect.js');
  const { MyEffectConfig } = await import('./effects/MyEffectConfig.js');
  
  // Define presets
  MyEffectClass.presets = [
    {
      name: 'cinematic',
      effect: 'my-effect',
      percentChance: 60,
      currentEffectConfig: new MyEffectConfig({
        intensity: 0.9,
        color: '#FF0000'
      })
    },
    {
      name: 'minimal',
      effect: 'my-effect',
      percentChance: 40,
      currentEffectConfig: new MyEffectConfig({
        intensity: 0.3,
        color: '#0000FF'
      })
    }
  ];
  
  // Register the effect
  EffectRegistry.registerGlobal(MyEffectClass, EffectCategories.PRIMARY, {
    displayName: 'My Effect',
    presets: MyEffectClass.presets  // Optionally expose to framework
  });
}
```

### Practical Examples

#### Example 1: User Selects from Presets
```js
// In a UI application
async function applySelectedPreset(effectName, presetName) {
  const EffectClass = effectRegistry.get(effectName);
  const preset = EffectClass.getPreset(presetName);
  
  if (!preset) {
    console.error(`Preset "${presetName}" not found`);
    return;
  }
  
  const effect = new EffectClass({ config: preset.currentEffectConfig });
  await layer.apply(effect);
}

// User clicks "Apply Cinematic"
applySelectedPreset('my-effect', 'cinematic');
```

#### Example 2: Procedural Generation with Variety
```js
// Generate 10 NFTs with varied effects, but consistent selection probability
for (let i = 0; i < 10; i++) {
  const layer = createBaseLayer();
  
  // Each has ~60% chance to be cinematic, ~40% chance minimal
  const preset = MyEffect.getRandomPreset();
  const effect = new MyEffect({ config: preset.currentEffectConfig });
  
  await layer.apply(effect);
  saveNFT(`nft_${i}.png`, layer);
}
```

#### Example 3: Show Available Options
```js
// Build UI dropdown
const presets = MyEffect.getPresets();
const options = presets.map(p => ({
  label: p.name,
  value: p.name,
  description: `${p.percentChance}% weight`
}));

console.log('Available presets:');
options.forEach(o => console.log(`  - ${o.label} (${o.description})`));
// Output:
//   - cinematic (60% weight)
//   - minimal (40% weight)
```

### Preset Best Practices

1. **Meaningful Names**: Use names that describe the visual outcome
   - ✅ `cinematic`, `minimal`, `ethereal`, `intense`
   - ❌ `preset1`, `config-a`, `version-2`

2. **Balance Weights**: For procedural generation, weights should sum to intended distribution
   - If you want equal variety: use 50/50, 33/33/33, etc.
   - If you have a "default": give it higher weight

3. **Validate Presets**: Ensure preset configs pass validation
   ```js
   MyEffectClass.presets = [
     {
       name: 'cinematic',
       effect: 'my-effect',
       percentChance: 100,
       currentEffectConfig: new MyEffectConfig({ intensity: 0.9 })
     }
   ];
   
   // Validate before setting
   for (const preset of MyEffectClass.presets) {
     const validation = MyEffectConfig.validate(preset.currentEffectConfig);
     if (!validation.valid) {
       throw new Error(`Invalid preset "${preset.name}": ${validation.errors.join(', ')}`);
     }
   }
   ```

4. **Document Presets**: Add comments explaining each preset
   ```js
   // Cinematic: High intensity, dramatic colors, slow animation
   // Best for: Story-driven, visual impact
   { name: 'cinematic', ... }
   
   // Minimal: Low intensity, subtle colors, fast animation
   // Best for: Clean, modern aesthetics
   { name: 'minimal', ... }
   ```

5. **Extensible Design**: Make presets easy to add/remove without code changes
   - Consider loading presets from JSON files
   - Use a preset factory function
   - Export presets separately for easy importing

### When NOT to Use Presets

- **One-off effects**: If effect is only used once, no preset needed
- **User-configured**: If user will always customize, preset doesn't help
- **Experimental**: During development, skip presets until settings stabilize

### Extending the Preset System

**Create a preset factory:**
```js
function createPreset(name, config, percentChance = 100) {
  return {
    name,
    effect: MyEffect._name_,
    percentChance,
    currentEffectConfig: new MyEffectConfig(config)
  };
}

MyEffect.presets = [
  createPreset('cinematic', { intensity: 0.9, color: '#FF0000' }, 60),
  createPreset('minimal', { intensity: 0.3, color: '#0000FF' }, 40)
];
```

**Load presets from external file:**
```js
const presets = await import('./presets/my-effect-presets.js');
MyEffect.presets = presets.default;
```

---

## Common Patterns & Best Practices

### Pattern 1: Frame-Aware Effects
```js
// Fade in over first half of sequence
const progress = currentFrame / numberOfFrames;
if (progress < 0.5) {
  layer.opacity = (progress * 2);  // 0 → 1
}
```

### Pattern 2: Looping Animations
```js
// Effect repeats twice
const loopCount = 2;
const cycleProgress = (currentFrame % (numberOfFrames / loopCount)) / (numberOfFrames / loopCount);
// Now cycleProgress goes 0→1 twice
```

### Pattern 3: Triggered Effects
```js
// Effect activates after frame 30
if (currentFrame >= 30) {
  // Apply effect
}
```

### Pattern 4: Config-Driven Behavior
```js
// Different behavior based on config
if (this.config.animationType === 'ease-in') {
  const progress = this.getProgress(currentFrame, numberOfFrames);
  return this.easeInCubic(progress);
} else if (this.config.animationType === 'ease-out') {
  const progress = this.getProgress(currentFrame, numberOfFrames);
  return this.easeOutCubic(progress);
}
```

---

## Migration Path for Existing Effects

If you have effects using older patterns, migrate them step-by-step:

1. **Change class declaration** to extend `LayerEffect`
2. **Add static metadata** (`_name_`, `_displayName_`, etc.)
3. **Rename `apply()` to `invoke()`** with correct signature
4. **Create a Config class** with `validate()` method
5. **Wrap logic in try-catch** with validation
6. **Add `getInfo()` method** for debugging
7. **Call `super.invoke()`** at the end

See `TEMPLATE_UPDATES.md` for detailed before/after examples.

---

## Debugging with Template Features

### Scenario 1: Effect Not Showing
```js
// Use getInfo() to verify effect is applied
console.log(effect.getInfo());
// Output: "My Effect (my-effect): intensity=0.5"
```

### Scenario 2: Configuration Error
```js
// Validation catches it immediately
const validation = MyEffectConfig.validate(badConfig);
if (!validation.valid) {
  console.error(validation.errors);
  // Output: ["intensity must be between 0 and 1", "color format invalid"]
}
```

### Scenario 3: Effect Chain Issues
```js
// super.invoke() passes to next effect
// If it fails, error includes effect name
// Error logs: "Error in My Blur Effect (blur): Cannot read property X"
```

---

## Performance Considerations

### Why These Patterns Matter
- **Validation upfront**: Prevents runtime errors mid-sequence
- **Frame awareness**: Enables optimization (cache pre-computed values)
- **Configuration classes**: Can implement caching patterns
- **Error boundaries**: Prevent cascading failures

### Optimization Tips
1. **Cache computed values** in configuration when possible
2. **Pre-compute easing** if effects are identical
3. **Use `if (currentFrame === 0)` checks** to initialize once
4. **Profile with frame sequences** (not single frames)

---

## Why We Don't Do X

### Why not loose config objects?
They lack type safety and validation—errors surface late in the pipeline.

### Why not standalone classes?
They can't integrate with effect chaining or the plugin registry.

### Why not skip `super.invoke()`?
You lose effect composition, a powerful feature for complex NFT generation.

### Why not keep `apply()`?
The framework's rendering loop calls `invoke()` with frame context. `apply()` breaks that contract.

---

## Creating Your First Effect - With Presets

When designing a new effect, plan for presets early:

### 1. Start with Your Effect Class
```js
// MyAwesomeEffect.js
export class MyAwesomeEffect extends LayerEffect {
  static _name_ = 'my-awesome-effect';
  static _displayName_ = 'My Awesome Effect';
  static presets = [];  // Will be populated later
  
  // ... rest of effect implementation
}
```

### 2. Define Your Configuration Class
```js
export class MyAwesomeEffectConfig {
  constructor({
    intensity = 0.5,
    color = '#FF0000',
    style = 'vibrant'
  } = {}) {
    this.intensity = intensity;
    this.color = color;
    this.style = style;
  }
  
  static validate(config) {
    // ... validation logic
  }
}
```

### 3. Create Preset Instances
Identify 2-3 common use cases and create presets:

```js
// presets.js
import { MyAwesomeEffectConfig } from './MyAwesomeEffectConfig.js';

export const VIBRANT = new MyAwesomeEffectConfig({
  intensity: 0.9,
  color: '#FF0000',
  style: 'vibrant'
});

export const SUBTLE = new MyAwesomeEffectConfig({
  intensity: 0.3,
  color: '#0000FF',
  style: 'minimal'
});

export const BALANCED = new MyAwesomeEffectConfig({
  intensity: 0.6,
  color: '#00FF00',
  style: 'balanced'
});
```

### 4. Register with Presets
In your plugin's `src/index.js`:

```js
const { MyAwesomeEffect } = await import('./effects/MyAwesomeEffect.js');
const { VIBRANT, SUBTLE, BALANCED } = await import('./effects/presets.js');

MyAwesomeEffect.presets = [
  {
    name: 'vibrant',
    effect: 'my-awesome-effect',
    percentChance: 40,
    currentEffectConfig: VIBRANT
  },
  {
    name: 'subtle',
    effect: 'my-awesome-effect',
    percentChance: 40,
    currentEffectConfig: SUBTLE
  },
  {
    name: 'balanced',
    effect: 'my-awesome-effect',
    percentChance: 20,
    currentEffectConfig: BALANCED
  }
];

EffectRegistry.registerGlobal(MyAwesomeEffect, EffectCategories.PRIMARY);
```

### 5. Use Your Presets
```js
// Random with bias: 40% vibrant, 40% subtle, 20% balanced
const preset = MyAwesomeEffect.getRandomPreset();
const effect = new MyAwesomeEffect({ config: preset.currentEffectConfig });

// Specific preset by user selection
const userPreset = MyAwesomeEffect.getPreset('vibrant');
```

---

## Next Steps

1. **Create your first effect** using the appropriate template
2. **Follow the patterns** for configuration and validation
3. **Define presets** that capture your best configurations
4. **Test with frame sequences** (not just single frames)
5. **Use getInfo()** while debugging
6. **Register your effect** in `src/index.js` with metadata and presets

See `DEVELOPMENT_GUIDE.md` for step-by-step instructions on creating effects.