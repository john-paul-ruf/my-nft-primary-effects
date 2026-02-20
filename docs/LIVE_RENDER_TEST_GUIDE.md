# Live Render Test Guide: How Real Objects Produce Real Output

This guide explains how the unified test renderer (`testRender.js`) works by creating real `my-nft-gen` framework objects and rendering actual visual effects to disk.

## Overview

The live render test is designed around a single principle: **Create real objects, use real APIs, produce real output**. It's not a mock or simulation—it's an actual NFT generation pipeline.

```
Command-line Arguments
        ↓
[Parse & Validate Options]
        ↓
[Load Registries & Effects]
        ↓
[Create Real Project Object]
        ↓
[Configure Effect with Preset]
        ↓
[Add to Project as Layer]
        ↓
[Call Project.generateRandomLoop()]
        ↓
[Render All Frames]
        ↓
[Save to Disk]
        ↓
[Report Results]
```

---

## The Real Objects Involved

### 1. **Project Object** (The Engine)

The `Project` class from `my-nft-gen` is the core rendering engine. It manages:
- **Frame generation lifecycle**
- **Layer composition** (primary, secondary, final effects)
- **Worker thread rendering** (parallel execution)
- **Output file management**

```javascript
const nftProject = new Project({
  artist: 'test-runner',
  projectName: 'nft-effects-test',
  colorScheme: new ColorScheme({}),      // Color palette management
  neutrals: ['#FFFFFF'],
  backgrounds: ['#000000'],
  lights: ['#FFFF00', '#FF00FF', ...],   // Color options
  numberOfFrame: 100,                     // Total frames to render
  longestSideInPixels: 1024,              // Canvas width
  shortestSideInPixels: 1024,             // Canvas height
  isHorizontal: false,
  projectDirectory: '/path/to/output',    // Where files are saved
  renderJumpFrames: 1,                    // Frame interval (1 = render all)
  frameStart: 0,
  pluginPaths: [projectRoot]              // Custom plugin location
});
```

**Key capabilities:**
- ✅ Manages frame numbering and sequencing
- ✅ Handles canvas creation per frame
- ✅ Coordinates worker threads
- ✅ Saves output files automatically

### 2. **LayerConfig Object** (Effect Configuration)

The `LayerConfig` defines how an effect is applied to the project:

```javascript
const layerConfig = new LayerConfig({
  effect: effectClass.effectClass,        // The effect class (e.g., TreeOfLifeEffect)
  currentEffectConfig: effectConfig,      // Configuration instance with parameters
  percentChance: 100,                     // 100% = always apply
  secondaryEffects: []                    // Enhancement effects (optional)
});
```

**What it does:**
- Specifies which effect to use
- Passes configuration parameters
- Sets probability of application
- Groups secondary effects

### 3. **Effect Config Object** (Parameters)

The configuration contains all effect parameters:

```javascript
const effectConfig = new AnimatedTreeOfLifeConfig({
  branchCount: 8,
  recursionDepth: 6,
  branchAngleVariance: 0.3,
  rootColor: new ColorPicker(ColorPicker.SelectionType.colorBucket),
  trunkColor: new ColorPicker(ColorPicker.SelectionType.colorBucket),
  // ... more parameters
});
```

**Preset system:**
The test runner applies presets that tune parameters:
- **default** - Balanced rendering
- **mystical** - Enhanced with glow and energy flow
- **minimal** - Lightweight, fast
- **dense** - High complexity
- **organic** - Natural asymmetry

### 4. **ColorPicker & ColorScheme** (Color Management)

These objects handle color selection:

```javascript
const picker = new ColorPicker(ColorPicker.SelectionType.colorBucket);
const scheme = new ColorScheme({
  neutrals: ['#FFFFFF'],
  backgrounds: ['#000000'],
  lights: ['#FFFF00', '#FF00FF', '#00FFFF', '#FF0000', '#00FF00', '#0000FF']
});
```

**What they do:**
- Provide color palette to effects
- Support random selection
- Enable color harmony

---

## The Rendering Pipeline

### Step 1: Initialize Registries

```javascript
const { EffectRegistry, PositionRegistry } = await import('my-nft-gen');
const { registerCoreEffects } = await import('my-nft-gen/src/core/registry/CoreEffectsRegistration.js');

await registerCoreEffects();  // Load built-in effects

// Register plugin effects
const pluginModule = await import('./src/index.js');
await pluginModule.register(EffectRegistry, PositionRegistry);
```

**Result:** All effects are now available globally for lookup.

### Step 2: Lookup Effect Class

```javascript
const effectName = 'tree-of-life';
const normalizedName = 'TreeOfLifeEffect';

// Search registry
const effectClass = EffectRegistry.getGlobal()
  .find(e => e.name === normalizedName);

if (!effectClass) {
  throw new Error(`Effect '${effectName}' not found`);
}
```

**This is a real class**, not a string or reference—it will be instantiated for each frame.

### Step 3: Create Project Instance

```javascript
const project = new Project({
  // Configuration defining canvas size, frame count, etc.
  numberOfFrame: 100,
  longestSideInPixels: 1024,
  shortestSideInPixels: 1024,
  projectDirectory: './output'
});
```

**At this point:**
- The project is created but no rendering has started
- No canvas or frames exist yet
- The project is waiting for effects to be registered

### Step 4: Add Effect as Primary Effect

```javascript
const layerConfig = new LayerConfig({
  effect: effectClass,           // The actual class
  currentEffectConfig: effectConfig,
  percentChance: 100
});

project.addPrimaryEffect({ layerConfig });
```

**What happens internally:**
- Project registers the effect in its layer stack
- Effect will be applied to every frame
- Configuration is stored for instantiation later

### Step 5: Call generateRandomLoop() - The Magic Moment

```javascript
const result = await project.generateRandomLoop(saveFrames = true);
```

**This single call orchestrates everything:**

1. **Frame Loop** (100 times)
   ```
   For each frame (1 to 100):
     ├─ Create Canvas (1024x1024 pixel buffer)
     ├─ Get Random Seed
     ├─ Apply Background Color
     ├─ For each layer/effect:
     │  ├─ Instantiate Effect Class
     │  ├─ Call effect.apply()  ← Your effect code runs here
     │  └─ Effects modify canvas
     └─ Save frame to disk (if saveFrames=true)
   ```

2. **Worker Thread Distribution** (if configured)
   - Frames are queued to available worker threads
   - Multiple frames render in parallel
   - Results collected and saved sequentially

3. **Output Generation**
   - Each frame becomes a PNG file: `frame-001.png`, `frame-002.png`, etc.
   - Metadata stored alongside
   - Results aggregated

**Return Value:**
```javascript
{
  framesGenerated: 100,
  framesFailed: 0,
  failedFrames: [],
  totalTime: 12500,              // milliseconds
  outputPath: './output/render-123456'
}
```

---

## Real Output: What Gets Saved

### File Structure

When you run the test with `--save-frames`:

```
output/
└── render-1704067200000/
    ├── frame-001.png          ← Actual image file
    ├── frame-002.png
    ├── frame-003.png
    ├── ...
    ├── frame-100.png
    ├── metadata.json           ← Project metadata
    └── report.json             ← Render statistics
```

### PNG Files (Real Images)

Each frame is a **real PNG image file** containing:
- The rendered effect (your code produced this)
- Canvas resolution: 1024×1024 (or custom)
- Full color depth (24-bit RGB)
- Can be opened in any image viewer

**Example: Tree of Life Effect**
- Canvas is filled with fractal tree structure
- Colors selected from palette
- Branches, nodes, energy flow rendered
- Glow effects applied if enabled

### Metadata (Project Info)

```json
{
  "projectName": "nft-effects-test",
  "artist": "test-runner",
  "totalFrames": 100,
  "frameWidth": 1024,
  "frameHeight": 1024,
  "effectUsed": "TreeOfLifeEffect",
  "preset": "default",
  "renderDate": "2024-01-01T12:00:00Z"
}
```

### Report (Statistics)

```json
{
  "totalFrames": 100,
  "successCount": 100,
  "failureCount": 0,
  "totalTimeMs": 12500,
  "avgTimePerFrame": 125,
  "presetUsed": "default",
  "effectName": "TreeOfLifeEffect",
  "canvasSize": "1024x1024"
}
```

---

## How Canvas Modifications Become Output

### The Effect-to-Layer Flow

Your effect receives a real Layer object (raster image):

```javascript
// Inside your effect's invoke() method
async invoke(layer, currentFrame, numberOfFrames) {
  // Layer is a Sharp-backed raster object
  // Apply raster effects
  const modified = await layer
    .blur(5)
    .modulate({ brightness: 1.2 });
  
  return modified;
}
```

### What the Project Does With It

After your effect runs:

```
1. Layer contains your modifications
   ↓
2. Project extracts raster data
   ↓
3. Encodes as PNG
   ↓
4. Writes to `frame-XXX.png`
   ↓
5. PNG is saved to disk
```

This happens **automatically**—you just modify the layer and return it.

---

## Canvas2D vs Layer in Effects

### Key Distinction

Effects work with **Layer** objects (raster), not Canvas2D:

```javascript
// ✅ What effects actually receive
async invoke(layer, currentFrame, numberOfFrames) {
  // 'layer' is raster-based (Sharp-backed)
  const result = await layer.blur(5);
  return result;
}

// ❌ NOT Canvas2D with getContext('2d')
// Canvas2D is a separate vector drawing tool used outside effects
```

### When to Use Canvas2D

Canvas2D is used **separately** to create vector graphics, then convert to Layer:

```javascript
// Step 1: Create vector graphics with Canvas2D
import { Canvas2dFactory } from 'my-nft-gen';

const canvas = await Canvas2dFactory.getNewCanvas(1024, 1024);
await canvas.drawRing2d(
  { x: 512, y: 512 },  // center position
  200,                  // radius
  10,                   // inner stroke
  '#FF0000',           // inner color
  20,                  // outer stroke
  '#00FF00'            // outer color
);

// Step 2: Convert Canvas2D to Layer
const layer = await canvas.convertToLayer();

// Now use layer in your effect
```

### Canvas2D Drawing API

Canvas2D is **not** like HTML5 Canvas. It provides specific geometric drawing methods:

```javascript
const canvas = await Canvas2dFactory.getNewCanvas(width, height);

// Geometric shapes
await canvas.drawRing2d(pos, radius, innerStroke, innerColor, outerStroke, outerColor, alpha);
await canvas.drawPolygon2d(radius, pos, numberOfSides, startAngle, innerStroke, innerColor, outerStroke, outerColor);
await canvas.drawFilledPolygon2d(radius, pos, numberOfSides, startAngle, fillColor, alpha);

// Lines and curves
await canvas.drawLine2d(startPos, endPos, innerStroke, innerColor, outerStroke, outerColor, alpha);
await canvas.drawBezierCurve(start, control, end, innerStroke, innerColor, outerStroke, outerColor);

// Export
const layer = await canvas.convertToLayer();  // Convert to raster Layer
await canvas.toFile('output.png');           // Save directly to file
```

### Using Canvas2D Graphics Inside an Effect

If your effect needs to combine Canvas2D vectors with raster operations:

```javascript
async invoke(layer, currentFrame, numberOfFrames) {
  // Start with the provided layer
  let result = layer;
  
  // Create vector graphics separately
  const { Canvas2dFactory } = await import('my-nft-gen');
  const canvas = await Canvas2dFactory.getNewCanvas(
    layer.width,
    layer.height
  );
  
  // Draw vector shapes
  await canvas.drawRing2d(
    { x: layer.width / 2, y: layer.height / 2 },
    150,
    5,
    '#0000FF',
    10,
    '#FF00FF'
  );
  
  // Convert to layer
  const vectorLayer = await canvas.convertToLayer();
  
  // Composite: start layer + vectors on top
  result = await result.composeOver(vectorLayer, { opacity: 0.8 });
  
  // Apply raster effects
  result = await result.blur(3);
  
  return result;
}
```

---

## Layer Compositing: ComposeOver

### What is ComposeOver?

`ComposeOver` is a layer compositing operation that places one layer **on top of** another with full control over blending, positioning, and opacity.

### ComposeOver Syntax

```javascript
const composited = await baseLayer.composeOver(sourceLayer, options);
```

**Parameters:**
- `baseLayer` - The background layer (bottom)
- `sourceLayer` - The layer to place on top
- `options` - Positioning and blending configuration

### ComposeOver Options

```javascript
{
  left: 0,              // X offset (pixels from left)
  top: 0,               // Y offset (pixels from top)
  width: undefined,     // Override source width (default: source width)
  height: undefined,    // Override source height (default: source height)
  blend: 'over',        // Blend mode: 'over', 'multiply', 'screen', 'overlay', etc.
  opacity: 1.0          // Source layer opacity (0.0 - 1.0)
}
```

### Real Compositing Example: Multi-Layer Effect

```javascript
async invoke(layer, currentFrame, numberOfFrames) {
  // 'layer' is the starting raster provided by Project
  let result = layer;
  
  // Apply base modifications
  const bgGradient = await result.modulate({
    brightness: 0.5,
    saturation: 1.2
  });
  
  // Create vector graphics separately
  const { Canvas2dFactory } = await import('my-nft-gen');
  const canvas = await Canvas2dFactory.getNewCanvas(layer.width, layer.height);
  
  await canvas.drawRing2d(
    { x: layer.width / 2, y: layer.height / 2 },
    200,
    10,
    '#00ff00',
    15,
    '#00aa00'
  );
  
  const geometric = await canvas.convertToLayer();
  
  // Create glow effect
  const glow = await geometric.blur(20);
  
  // Composite: background ← geometric layer
  result = await bgGradient.composeOver(geometric, {
    left: 0,
    top: 0,
    opacity: 0.9
  });
  
  // Composite: result ← glow (semi-transparent)
  result = await result.composeOver(glow, {
    left: 50,          // Offset the glow slightly
    top: 50,
    opacity: 0.5,      // 50% transparency for glow effect
    blend: 'screen'    // Screen blend for glowing effect
  });
  
  return result;
}
```

### Layer Stack Order (Important!)

When compositing multiple layers, the order matters:

```javascript
// WRONG: Base is on top
const wrong = await decorativeLayer.composeOver(backgroundLayer);
// Result: Background hidden behind decoration

// CORRECT: Background first, decorations layered on top
const correct = await backgroundLayer
  .composeOver(effect1Layer, { opacity: 0.8 })
  .composeOver(effect2Layer, { opacity: 0.6 })
  .composeOver(glowLayer, { blend: 'screen' });
// Result: All layers visible in proper order
```

### Practical ComposeOver Patterns

**Pattern 1: Layered Effects with Offsets**
```javascript
const result = await backgroundLayer
  .composeOver(effectLayer1, { left: 50, top: 50 })
  .composeOver(effectLayer2, { left: -50, top: -50 })
  .composeOver(highlightLayer, { opacity: 0.3, blend: 'screen' });
```

**Pattern 2: Blend Modes for Texture**
```javascript
const textured = await baseImage
  .composeOver(noiseLayer, { blend: 'multiply', opacity: 0.2 })
  .composeOver(patternLayer, { blend: 'overlay', opacity: 0.4 });
```

**Pattern 3: Multiple Passes of Same Effect**
```javascript
let layer = await initialEffect.toLayer();
for (let i = 0; i < 3; i++) {
  const copy = await layer.blur(2);
  layer = await layer.composeOver(copy, { opacity: 0.5 });
}
```

### Canvas2D + Layer Compositing Combined

```javascript
async invoke(layer, currentFrame, numberOfFrames) {
  const { Canvas2dFactory } = await import('my-nft-gen');
  
  // Start with the provided layer
  let result = layer;
  
  // Create vector graphics with Canvas2D
  const canvas = await Canvas2dFactory.getNewCanvas(layer.width, layer.height);
  
  // Draw geometric pattern of rings
  for (let i = 0; i < 5; i++) {
    const hsl = `hsl(${i * 72}, 100%, 50%)`;
    await canvas.drawRing2d(
      { x: layer.width / 2, y: layer.height / 2 },
      100 + i * 50,
      3,
      hsl,
      3,
      hsl
    );
  }
  
  // Convert Canvas2D to Layer
  const baseLayer = await canvas.convertToLayer();
  
  // Create glow layer (raster effect)
  const glowLayer = await baseLayer.blur(15);
  
  // Composite: base + glow with blend mode
  result = await baseLayer.composeOver(glowLayer, {
    blend: 'screen',
    opacity: 0.7
  });
  
  return result;
}
```

---

## Layer to Canvas Conversion (and Back Again)

### The Round-Trip: Canvas ↔ Layer ↔ Canvas

You can convert between Canvas2D and Layer in a complete cycle:

```
Canvas2D (vector)
    ↓ export() → PNG buffer
Layer (raster)
    ↓ toBuffer() → PNG buffer
Canvas2D (vector or display)
    ↓ ...and repeat
```

### Layer.toBuffer() - Export Raster to PNG

Extract a Layer as a PNG buffer:

```javascript
// Layer is a raster object
const layer = await layerFactory.create(1024, 1024);
const blurred = await layer.blur(10);

// Export to PNG buffer
const pngBuffer = await blurred.toBuffer();

// Now you have raw PNG data (Buffer object)
console.log(pngBuffer.length); // byte size
```

### Using Canvas2D After Layer Export

If you need to add vector graphics on top of a layer:

```javascript
const { Canvas2dFactory } = await import('my-nft-gen');

// Create Canvas2D
const canvas = await Canvas2dFactory.getNewCanvas(1024, 1024);

// Draw vector shapes
await canvas.drawRing2d(
  { x: 512, y: 512 },
  200,
  5,
  '#FF0000',
  10,
  '#00FF00'
);

// Convert to layer for compositing
const vectorLayer = await canvas.convertToLayer();

// Then composite with other layers
const result = await baseLayer.composeOver(vectorLayer, { opacity: 0.8 });
```

### Step-by-Step Round-Trip

```
1. Start with Layer (provided by invoke)
   └─ Apply raster effects (blur, modulate, etc.)

2. Create Canvas2D separately
   └─ Canvas2dFactory.getNewCanvas()

3. Draw vectors with Canvas2D methods
   └─ drawRing2d(), drawPolygon2d(), drawLine2d(), etc.
   └─ NOT getContext('2d') - use Canvas2D API

4. Canvas2D → convertToLayer()
   └─ Convert vector graphics to raster layer

5. Composite layers
   └─ result.composeOver(vectorLayer, options)

6. Apply more raster effects
   └─ Blur, modulate, etc. on the composite
```

### Complete Round-Trip Example: Layer → Canvas2D → Layer

```javascript
async invoke(layer, currentFrame, numberOfFrames) {
  const { Canvas2dFactory } = await import('my-nft-gen');
  
  // STEP 1: Modify the starting raster layer
  let result = layer;
  const withNoise = await result.modulate({
    brightness: 0.7,
    saturation: 1.5
  });
  
  // STEP 2: Create vector graphics with Canvas2D
  const canvas = await Canvas2dFactory.getNewCanvas(
    layer.width,
    layer.height
  );
  
  // STEP 3: Draw radiating lines from center
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI / 4);
    const endX = layer.width / 2 + Math.cos(angle) * 300;
    const endY = layer.height / 2 + Math.sin(angle) * 300;
    
    await canvas.drawLine2d(
      { x: layer.width / 2, y: layer.height / 2 },
      { x: endX, y: endY },
      2,        // inner stroke
      '#00FF00',
      4,        // outer stroke
      '#00AA00'
    );
  }
  
  // STEP 4: Convert canvas back to layer
  const vectorLayer = await canvas.convertToLayer();
  
  // STEP 5: Composite: raster + vectors
  result = await withNoise.composeOver(vectorLayer, { opacity: 0.9 });
  
  // STEP 6: Apply raster effects to the combined result
  const final = await result.blur(3);
  const enhanced = await final.modulate({ brightness: 1.1 });
  
  return enhanced;
}
```

### Practical Use Cases for Round-Tripping

**Use Case 1: Raster Background + Vector Overlay**
```javascript
async invoke(layer, currentFrame, numberOfFrames) {
  const { Canvas2dFactory } = await import('my-nft-gen');
  
  // Start with raster effect
  let result = await layer.blur(5);
  
  // Add vector shapes on top
  const canvas = await Canvas2dFactory.getNewCanvas(layer.width, layer.height);
  
  await canvas.drawFilledPolygon2d(
    100,  // radius
    { x: 150, y: 150 },  // position
    4,    // numberOfSides
    0,    // startAngle
    'rgba(255, 0, 0, 0.5)'  // fillColor
  );
  
  // Composite and apply more raster effects
  const vectorLayer = await canvas.convertToLayer();
  result = await result.composeOver(vectorLayer, { opacity: 0.8 });
  return await result.modulate({ saturation: 1.2 });
}
```

**Use Case 2: Multiple Passes (Raster → Vector → Raster)**
```javascript
async invoke(layer, currentFrame, numberOfFrames) {
  const { Canvas2dFactory } = await import('my-nft-gen');
  
  // Pass 1: Raster effects
  let result = await layer.blur(5);
  
  // Pass 2: Add vector shapes
  const canvas = await Canvas2dFactory.getNewCanvas(layer.width, layer.height);
  
  await canvas.drawFilledPolygon2d(
    150,  // radius
    { x: layer.width / 2, y: layer.height / 2 },
    5,    // numberOfSides (pentagon)
    0,
    '#FFD700'  // gold
  );
  
  const vectorLayer = await canvas.convertToLayer();
  result = await result.composeOver(vectorLayer, { opacity: 0.9 });
  
  // Pass 3: More raster effects
  return await result.modulate({ brightness: 1.3 });
}
```

**Use Case 3: Composite Multiple Vector Effects**
```javascript
async invoke(layer, currentFrame, numberOfFrames) {
  const { Canvas2dFactory } = await import('my-nft-gen');
  
  // Effect 1: Red rings
  const canvas1 = await Canvas2dFactory.getNewCanvas(layer.width, layer.height);
  await canvas1.drawRing2d(
    { x: layer.width / 2, y: layer.height / 2 },
    150,
    10,
    '#FF0000',
    15,
    '#CC0000'
  );
  const layer1 = await canvas1.convertToLayer();
  
  // Effect 2: Blue rings
  const canvas2 = await Canvas2dFactory.getNewCanvas(layer.width, layer.height);
  await canvas2.drawRing2d(
    { x: layer.width / 2, y: layer.height / 2 },
    100,
    5,
    '#0000FF',
    8,
    '#0000CC'
  );
  const layer2 = await canvas2.convertToLayer();
  
  // Composite both effects
  let result = await layer1.composeOver(layer2, { opacity: 0.8 });
  result = await result.blur(2);
  
  return result;
}
```

### Important Notes on Round-Tripping

⚠️ **Information Loss During Conversion**
```
Canvas2D (vector) → export() → PNG → lossy rasterization
SVG commands become pixel data → some sharpness may reduce at low resolution

Recommendation: Use appropriate canvas size for your vector complexity
```

✅ **When Round-Tripping Makes Sense**
- Build a raster base, add vector details, apply filters
- Composite multiple effects created with different techniques
- Create complex layered effects that need both vector precision and raster filtering
- Iterative effects: process, add details, process again

❌ **When to Avoid Round-Tripping**
- If you only need simple vector drawing → just use Canvas2D
- If you only need raster effects → use Layer directly
- Multiple round-trips can degrade quality due to repeated rasterization

### Memory-Efficient Pattern

```javascript
// Instead of creating multiple layers and storing them
async invoke(layer, currentFrame, numberOfFrames) {
  const { Canvas2dFactory } = await import('my-nft-gen');
  
  // ❌ Inefficient - all layers stay in memory
  const v1 = await (await Canvas2dFactory.getNewCanvas(w, h)).convertToLayer();
  const v2 = await (await Canvas2dFactory.getNewCanvas(w, h)).convertToLayer();
  const v3 = await (await Canvas2dFactory.getNewCanvas(w, h)).convertToLayer();
  return await layer.composeOver(v1).composeOver(v2).composeOver(v3);
  
  // ✅ Efficient - compose immediately without storing intermediate layers
  let result = layer;
  
  const canvas = await Canvas2dFactory.getNewCanvas(layer.width, layer.height);
  await canvas.drawRing2d({ x: 512, y: 512 }, 150, 5, '#FF0000', 10, '#CC0000');
  result = await result.composeOver(await canvas.convertToLayer());
  
  const canvas2 = await Canvas2dFactory.getNewCanvas(layer.width, layer.height);
  await canvas2.drawRing2d({ x: 512, y: 512 }, 100, 3, '#0000FF', 6, '#0000CC');
  result = await result.composeOver(await canvas2.convertToLayer());
  
  // Only final result kept in memory
  return await result.blur(2);
}
```

---

## Real Usage Examples

### Basic Render (10 frames, default preset)

```bash
node scripts/testRender.js --effect tree-of-life --frames 10
```

**What happens:**
- 10 real PNG files generated
- Saved to default output directory
- Takes ~1-2 seconds (10-20ms per frame)

### High-Quality Render (4K resolution, mystical preset)

```bash
node scripts/testRender.js \
  --effect tree-of-life \
  --frames 50 \
  --width 2048 \
  --height 2048 \
  --preset mystical \
  --save-frames
```

**What happens:**
- 50 frames rendered at 2048×2048 pixels
- Mystical preset applied (enhanced glow, energy flow)
- 50 high-resolution PNG files generated
- Takes ~30-60 seconds (600-1200ms per frame)

### Quick Preview (Verbose Output)

```bash
node scripts/testRender.js \
  --effect tree-of-life \
  --frames 5 \
  -v \
  --save-frames
```

**Output shows:**
```
✅ Project created
✅ Effect loaded: TreeOfLifeEffect
✅ Effect config created
✅ Frame 1 rendered successfully (125ms)
✅ Frame 2 rendered successfully (118ms)
✅ Frame 3 rendered successfully (122ms)
✅ Frame 4 rendered successfully (119ms)
✅ Frame 5 rendered successfully (121ms)

✅ Successful frames: 5/5
⏱️  Total time: 0.61s
⚡ Avg per frame: 122.0ms
💾 Frames saved: ./output/render-1704067200000
```

---

## Performance Characteristics

### Timing by Resolution

| Resolution | Per-Frame Time | 100 Frames | Notes |
|-----------|---|---|---|
| 1024×1024 | 100-150ms | 10-15s | Standard |
| 1920×1920 | 300-600ms | 30-60s | Medium |
| 2048×2048 | 500-1200ms | 50-120s | High quality |

### Preset Performance Impact

| Preset | Complexity | Time Factor | Quality |
|--------|-----------|---|---|
| minimal | Low | 0.8x | Fast preview |
| default | Medium | 1.0x | Balanced |
| organic | Medium | 1.1x | Natural |
| mystical | High | 1.3x | Enhanced |
| dense | Very High | 1.6x | Maximum detail |

---

## Debugging & Inspection

### Verbose Mode

```bash
node scripts/testRender.js --effect tree-of-life --frames 5 -v
```

Shows:
- Each frame's render time
- Which effects are being applied
- Color selections
- Any warnings or non-fatal issues

### Debug Mode

```bash
node scripts/testRender.js --effect tree-of-life --frames 5 --debug
```

Shows:
- Registry loading details
- Effect lookup process
- Canvas creation
- Plugin registration
- Full diagnostic info

### Inspect Output Files

```bash
# On macOS, open files in image viewer
open ./output/render-*/frame-001.png

# Check metadata
cat ./output/render-*/metadata.json | jq

# View statistics
cat ./output/render-*/report.json | jq
```

---

## Troubleshooting

### "Effect not found in registry"

**Problem:** Effect class can't be located.

**Check:**
1. Is the effect registered in `src/index.js`?
2. Is the effect exported correctly?
3. Run with `--debug` to see registry contents

**Solution:**
```bash
node scripts/testRender.js --effect tree-of-life --debug
# Look for "Effect loaded" message
```

### No Output Files Generated

**Problem:** Frames rendered but no PNG files saved.

**Causes:**
- `--save-frames` flag not provided
- Output directory permission denied
- Disk full

**Solution:**
```bash
# Use explicit output directory with write permissions
node scripts/testRender.js \
  --effect tree-of-life \
  --save-frames \
  --output ./my-renders
```

### Slow Rendering

**Problem:** Frames taking too long to render.

**Solutions:**
1. Use smaller resolution: `--width 512 --height 512`
2. Use minimal preset: `--preset minimal`
3. Render fewer frames: `--frames 5` for testing

---

## Key Takeaways

✅ **Real Objects:** Project, LayerConfig, Effect instances are genuine framework objects  
✅ **Real APIs:** Uses `Project.generateRandomLoop()` with full layer composition  
✅ **Real Output:** PNG files written to disk, ready for use  
✅ **Full Control:** Presets, resolution, frame count, seed all configurable  
✅ **Observable:** Verbose/debug modes let you inspect the entire pipeline  
✅ **Production-Ready:** Same rendering system used for actual NFT generation  

---

## Next Steps

1. **Try a quick render:** `node scripts/testRender.js --effect tree-of-life --frames 10`
2. **Inspect output:** Check the PNG files and metadata
3. **Experiment with presets:** Try `--preset mystical`, `--preset dense`, etc.
4. **Custom parameters:** Create your own effect and test it
5. **Batch rendering:** Script multiple test runs with different presets

For more details on effect development, see `DEVELOPMENT_GUIDE.md`.