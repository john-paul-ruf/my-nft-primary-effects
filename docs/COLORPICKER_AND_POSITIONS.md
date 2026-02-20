# ColorPicker & Position Classes: Data Management Guide

This guide explains how to use **ColorPicker** for dynamic color selection and **Position** classes for spatial data management in the my-nft-gen framework.

---

## 🎨 ColorPicker: Dynamic Color Selection

### What is ColorPicker?

**ColorPicker** allows you to define color parameters that can be:
- Set to specific hex colors
- Selected randomly from a color bucket
- Modified based on Settings (context)
- Used consistently across multiple renders

Unlike hardcoded color strings (`'#FF0000'`), ColorPicker gives you **flexible, reusable color definitions** for effect configurations.

### ColorPicker Selection Types

```javascript
import { ColorPicker } from 'my-nft-gen/src/core/layer/configType/ColorPicker.js';

// Type 1: Color Bucket (random selection)
const picker = new ColorPicker(ColorPicker.SelectionType.colorBucket);

// Type 2: Specific color (fixed)
const picker = new ColorPicker(ColorPicker.SelectionType.specific, '#FF0000');

// Type 3: Color scheme (harmony-based)
const picker = new ColorPicker(ColorPicker.SelectionType.colorScheme);
```

### Creating and Using ColorPicker

**Basic Setup in Config:**

```javascript
import { ColorPicker } from 'my-nft-gen/src/core/layer/configType/ColorPicker.js';
import { EffectConfig } from 'my-nft-gen/src/core/layer/EffectConfig.js';

export class MyEffectConfig extends EffectConfig {
  constructor({
    primaryColor = new ColorPicker(ColorPicker.SelectionType.colorBucket),
    accentColor = new ColorPicker(ColorPicker.SelectionType.colorBucket),
    glowColor = new ColorPicker(ColorPicker.SelectionType.colorBucket),
    // ... other parameters
  } = {}) {
    super();
    this.primaryColor = primaryColor;
    this.accentColor = accentColor;
    this.glowColor = glowColor;
  }
}
```

**Extracting Colors in Your Effect:**

```javascript
import { BaseEffect } from 'my-nft-gen';
import { Settings } from 'my-nft-gen/src/core/common/Settings.js';

export class MyEffect extends BaseEffect {
  async invoke(layer, currentFrame, numberOfFrames) {
    // Extract colors from ColorPicker instances
    const colors = this.#extractColors();
    
    // Use colors in your drawing
    await this.#drawWithColors(layer, colors);
    
    return layer;
  }

  #extractColors() {
    const defaultColors = {
      primaryColor: '#FF0000',
      accentColor: '#00FF00',
      glowColor: '#FFFF00',
    };

    // Get Settings context (contains color schemes, palettes)
    const settings = this.settings || new Settings({});

    return {
      primaryColor: this.config.primaryColor?.getColor?.(settings) || defaultColors.primaryColor,
      accentColor: this.config.accentColor?.getColor?.(settings) || defaultColors.accentColor,
      glowColor: this.config.glowColor?.getColor?.(settings) || defaultColors.glowColor,
    };
  }

  async #drawWithColors(layer, colors) {
    // Use extracted colors
    const canvas = await Canvas2dFactory.getNewCanvas(1024, 1024);
    
    await canvas.drawRing2d(
      { x: 512, y: 512 },
      100,
      3,
      colors.primaryColor,  // ← Use extracted color
      2,
      colors.accentColor
    );

    await canvas.drawFilledPolygon2d(
      50,
      { x: 512, y: 512 },
      6,
      0,
      colors.glowColor,  // ← Use extracted color
      1.0
    );

    const vectorLayer = await canvas.convertToLayer();
    return await layer.composeOver(vectorLayer, { blend: 'screen' });
  }
}
```

### ColorPicker API Details

**getColor(settings)**

```javascript
/**
 * Get the actual color value based on selection type
 * 
 * @param {Settings} settings - Context object containing color schemes, palettes
 * @returns {string|undefined} - Hex color code or undefined if not set
 * 
 * CRITICAL: This method can return undefined - always use fallback defaults
 */
const color = colorPicker.getColor(settings);

// Safe pattern with fallback
const safeColor = colorPicker.getColor(settings) || '#FFFFFF';
```

### ColorPicker Selection Behaviors

#### 1. **colorBucket** - Random from Palette

```javascript
// When you create without a specific color
const colorBucket = new ColorPicker(ColorPicker.SelectionType.colorBucket);

// On getColor(), it:
// - Checks Settings.colorScheme for available colors
// - Randomly selects one from the color bucket
// - Returns consistent color for the same Settings instance
```

#### 2. **specific** - Fixed Color

```javascript
// Set a specific hex color
const fixedRed = new ColorPicker(ColorPicker.SelectionType.specific, '#FF0000');
const fixedGreen = new ColorPicker(ColorPicker.SelectionType.specific, '#00FF00');

// On getColor(), always returns the specified color
const color = fixedRed.getColor(settings);  // Always '#FF0000'
```

#### 3. **colorScheme** - Harmony-Based

```javascript
// Use color harmony from settings
const harmonyColor = new ColorPicker(ColorPicker.SelectionType.colorScheme);

// On getColor(), applies color harmony rules from Settings
// Useful for creating complementary or analogous colors
```

### Real Example: Complete Color-Based Effect

```javascript
import { BaseEffect } from 'my-nft-gen';
import { Canvas2dFactory, LayerFactory } from 'my-nft-gen';
import { EffectConfig } from 'my-nft-gen/src/core/layer/EffectConfig.js';
import { ColorPicker } from 'my-nft-gen/src/core/layer/configType/ColorPicker.js';
import { Settings } from 'my-nft-gen/src/core/common/Settings.js';

// Config with ColorPicker
export class ChromaWaveConfig extends EffectConfig {
  constructor({
    waveColor = new ColorPicker(ColorPicker.SelectionType.colorBucket),
    coreColor = new ColorPicker(ColorPicker.SelectionType.colorBucket),
    glowColor = new ColorPicker(ColorPicker.SelectionType.colorBucket),
    waveCount = 5,
    waveAmplitude = 20,
    animationSpeed = 2,
  } = {}) {
    super();
    this.waveColor = waveColor;
    this.coreColor = coreColor;
    this.glowColor = glowColor;
    this.waveCount = waveCount;
    this.waveAmplitude = waveAmplitude;
    this.animationSpeed = animationSpeed;
  }
}

// Effect using ColorPicker colors
export class ChromaWaveEffect extends BaseEffect {
  async invoke(layer, currentFrame, numberOfFrames) {
    const colors = this.#extractColors();
    const progress = (currentFrame / numberOfFrames);
    
    // Create waves with extracted colors
    const canvas = await Canvas2dFactory.getNewCanvas(1024, 1024);
    
    for (let i = 0; i < this.config.waveCount; i++) {
      const radius = 100 + (i * 50) + Math.sin(progress * Math.PI * 2) * this.config.waveAmplitude;
      const alpha = 1.0 - (i / this.config.waveCount);
      
      await canvas.drawRing2d(
        { x: 512, y: 512 },
        radius,
        2,
        colors.waveColor,  // ← Dynamic color
        1,
        colors.glowColor,
        alpha
      );
    }

    // Draw core
    await canvas.drawFilledPolygon2d(
      30,
      { x: 512, y: 512 },
      8,
      progress * Math.PI * 2,
      colors.coreColor,  // ← Dynamic color
      1.0
    );

    const waveLayer = await canvas.convertToLayer();
    const result = await layer.composeOver(waveLayer, { blend: 'screen' });
    
    return result;
  }

  #extractColors() {
    const settings = this.settings || new Settings({});
    
    return {
      waveColor: this.config.waveColor?.getColor?.(settings) || '#FF00FF',
      coreColor: this.config.coreColor?.getColor?.(settings) || '#00FFFF',
      glowColor: this.config.glowColor?.getColor?.(settings) || '#FFFF00',
    };
  }
}
```

### ColorPicker Best Practices

✅ **DO:**
- Always provide fallback default colors
- Use safe optional chaining: `colorPicker?.getColor?.(settings)`
- Extract colors once at the start of your effect
- Create ColorPickers in your Config, not in invoke()

❌ **DON'T:**
- Assume getColor() always returns a value (it can be undefined)
- Call getColor() every frame (expensive, extract once)
- Mix hardcoded colors with ColorPicker in the same effect
- Create ColorPicker instances dynamically in invoke()

---

## 📍 Position Classes: Spatial Data Management

### What are Position Classes?

**Positions** define spatial data for effects:
- Node locations (x, y coordinates)
- Normalized coordinates (0-1 relative, or pixel-based)
- Spatial metadata (names, meanings, activation orders)
- Geometry relationships (connections, hierarchies)

In the Tree of Life effect, **SEPHIROTH_POSITIONS** defines all 10 nodes and their spatial relationships.

### Position Structure

```javascript
export const SEPHIROTH_POSITIONS = {
  kether: {
    id: 1,
    name: 'KETHER',
    meaning: 'Crown',
    x: 0.5,           // Normalized 0-1 coordinate
    y: 0.08,
    color: '#FFFFFF',
    activation_order: { 
      awakening: 10,  // Phase-specific ordering
      ascension: 1 
    }
  },
  
  chokmah: {
    id: 2,
    name: 'CHOKMAH',
    meaning: 'Wisdom',
    x: 0.75,
    y: 0.22,
    color: '#0099FF',
    activation_order: { 
      awakening: 9, 
      ascension: 2 
    }
  },
  // ... more positions
};
```

### Position Object Properties

| Property | Type | Purpose | Example |
|----------|------|---------|---------|
| **id** | number | Unique identifier | `1`, `2`, `10` |
| **name** | string | Human-readable name | `'KETHER'`, `'TIFERETH'` |
| **meaning** | string | Semantic meaning | `'Crown'`, `'Beauty'` |
| **x** | number | X position (0-1 normalized) | `0.5` (center), `0.75` (right) |
| **y** | number | Y position (0-1 normalized) | `0.08` (top), `0.5` (middle) |
| **color** | string | Associated color (hex) | `'#FFFFFF'`, `'#FF0000'` |
| **activation_order** | object | Phase-specific ordering | `{ awakening: 10, ascension: 1 }` |

### Working with Positions

**Retrieving Positions:**

```javascript
import { SEPHIROTH_POSITIONS } from './SephirothGeometry.js';

// Get all positions as array
const allNodes = Object.values(SEPHIROTH_POSITIONS);

// Get specific position by name
const kether = SEPHIROTH_POSITIONS.kether;

// Find position by ID
const node = Object.values(SEPHIROTH_POSITIONS).find(n => n.id === 1);

// Get position by name (case-insensitive lookup helper)
function getPositionByName(name) {
  return SEPHIROTH_POSITIONS[name.toLowerCase()];
}
```

**Converting Normalized Coordinates to Pixel Coordinates:**

```javascript
// Positions use normalized coordinates (0-1)
// Convert to actual pixel coordinates based on canvas size

function transformCoordinate(normalizedX, normalizedY, canvasWidth, canvasHeight) {
  // Optional: Apply scale
  const scale = 1.0;  // Adjust as needed
  const centerX = 0.5;
  const centerY = 0.5;

  // Scale coordinates around center
  const scaledX = 0.5 + (normalizedX - 0.5) * scale;
  const scaledY = 0.5 + (normalizedY - 0.5) * scale;

  // Shift to center position
  const x = (scaledX - 0.5) + centerX;
  const y = (scaledY - 0.5) + centerY;

  // Convert to pixel coordinates
  return {
    x: x * canvasWidth,
    y: y * canvasHeight
  };
}

// Usage
const position = SEPHIROTH_POSITIONS.tifereth;
const pixelCoords = transformCoordinate(position.x, position.y, 1024, 1024);
// Result: { x: 512, y: 512 } (center of 1024x1024 canvas)
```

**Rendering with Positions:**

```javascript
async function renderPositions(canvas, width, height) {
  const positions = Object.values(SEPHIROTH_POSITIONS);

  for (const pos of positions) {
    // Convert normalized to pixel coordinates
    const pixelX = pos.x * width;
    const pixelY = pos.y * height;

    // Draw node at position
    await canvas.drawFilledPolygon2d(
      20,  // radius
      { x: pixelX, y: pixelY },
      6,   // hexagon
      0,
      pos.color,
      1.0
    );

    // Draw label (optional)
    await canvas.drawText(
      pos.name,
      pixelX,
      pixelY - 30,
      { fontSize: 12, fill: '#FFFFFF' }
    );
  }
}
```

### Path Connections with Positions

**Define relationships between positions:**

```javascript
export const PATHS_CONNECTIONS = [
  { start: 1, end: 2 },  // Kether to Chokmah
  { start: 1, end: 3 },  // Kether to Binah
  { start: 2, end: 4 },  // Chokmah to Chesed
  // ... more connections
];

// Render paths between positions
async function renderPaths(canvas, width, height, pathConnections, positions) {
  for (const path of pathConnections) {
    // Find nodes by ID
    const fromNode = Object.values(positions).find(n => n.id === path.start);
    const toNode = Object.values(positions).find(n => n.id === path.end);

    if (!fromNode || !toNode) continue;

    // Convert to pixel coordinates
    const x1 = fromNode.x * width;
    const y1 = fromNode.y * height;
    const x2 = toNode.x * width;
    const y2 = toNode.y * height;

    // Draw line between positions
    await canvas.drawLine2d(
      { x: x1, y: y1 },
      { x: x2, y: y2 },
      2,  // stroke width
      '#CCCCCC',
      1,
      '#999999',
      0.8  // alpha
    );
  }
}
```

### Real Example: Custom Positioning System

```javascript
// Define custom positions for a celestial pattern
export const CELESTIAL_POSITIONS = {
  north: { id: 1, name: 'NORTH', x: 0.5, y: 0.1, color: '#00CCFF' },
  northeast: { id: 2, name: 'NORTHEAST', x: 0.8, y: 0.3, color: '#0099FF' },
  east: { id: 3, name: 'EAST', x: 0.9, y: 0.5, color: '#0066FF' },
  southeast: { id: 4, name: 'SOUTHEAST', x: 0.8, y: 0.7, color: '#0033FF' },
  south: { id: 5, name: 'SOUTH', x: 0.5, y: 0.9, color: '#0000FF' },
  southwest: { id: 6, name: 'SOUTHWEST', x: 0.2, y: 0.7, color: '#3300FF' },
  west: { id: 7, name: 'WEST', x: 0.1, y: 0.5, color: '#6600FF' },
  northwest: { id: 8, name: 'NORTHWEST', x: 0.2, y: 0.3, color: '#9900FF' },
  center: { id: 9, name: 'CENTER', x: 0.5, y: 0.5, color: '#FFFF00' }
};

export const CELESTIAL_CONNECTIONS = [
  { start: 1, end: 2 }, { start: 2, end: 3 }, { start: 3, end: 4 },
  { start: 4, end: 5 }, { start: 5, end: 6 }, { start: 6, end: 7 },
  { start: 7, end: 8 }, { start: 8, end: 1 },
  // Spokes to center
  { start: 1, end: 9 }, { start: 3, end: 9 }, { start: 5, end: 9 }, { start: 7, end: 9 }
];

// Usage in effect
async function renderCelestialChart(canvas, width, height) {
  // Draw paths first (background)
  await renderPaths(canvas, width, height, CELESTIAL_CONNECTIONS, CELESTIAL_POSITIONS);

  // Draw nodes on top
  const nodes = Object.values(CELESTIAL_POSITIONS);
  for (const node of nodes) {
    const x = node.x * width;
    const y = node.y * height;

    await canvas.drawRing2d(
      { x, y },
      30,
      3,
      node.color,
      1,
      '#FFFFFF',
      1.0
    );
  }
}
```

### Position Best Practices

✅ **DO:**
- Use normalized coordinates (0-1) for flexibility across canvas sizes
- Store positions in separate geometry files (like SephirothGeometry.js)
- Define connections separately from position data
- Use meaningful names and IDs for positions
- Add metadata (color, meaning) for UI representation

❌ **DON'T:**
- Hardcode pixel coordinates directly in effects
- Mix normalized (0-1) and pixel coordinates without converting
- Store position data inline in effects (use separate files)
- Forget to handle missing positions with safe lookups
- Use overly complex position hierarchies without documentation

### PositionRegistry vs Position Data

**PositionRegistry** (in my-nft-gen framework):
- System for registering custom position systems
- Passed to `register()` function in plugins
- Can register multiple position definitions
- Enables UI position pickers and position presets

**Position Data** (like SEPHIROTH_POSITIONS):
- Actual position coordinates and metadata
- Used within effects for rendering
- Can be custom objects matching the Position interface
- No framework registration required for simple use cases

---

## 🔄 Integration: ColorPicker + Positions

### Complete Example: Colored Position Network

```javascript
import { BaseEffect } from 'my-nft-gen';
import { Canvas2dFactory } from 'my-nft-gen';
import { ColorPicker } from 'my-nft-gen/src/core/layer/configType/ColorPicker.js';
import { EffectConfig } from 'my-nft-gen/src/core/layer/EffectConfig.js';
import { Settings } from 'my-nft-gen/src/core/common/Settings.js';

// Config with both ColorPicker and Position support
export class EnergyNetworkConfig extends EffectConfig {
  constructor({
    nodeColor = new ColorPicker(ColorPicker.SelectionType.colorBucket),
    pathColor = new ColorPicker(ColorPicker.SelectionType.colorBucket),
    glowColor = new ColorPicker(ColorPicker.SelectionType.colorBucket),
    nodeSize = 25,
    pathThickness = 2,
    glowIntensity = 0.8,
  } = {}) {
    super();
    this.nodeColor = nodeColor;
    this.pathColor = pathColor;
    this.glowColor = glowColor;
    this.nodeSize = nodeSize;
    this.pathThickness = pathThickness;
    this.glowIntensity = glowIntensity;
  }
}

export class EnergyNetworkEffect extends BaseEffect {
  async invoke(layer, currentFrame, numberOfFrames) {
    const colors = this.#extractColors();
    const positions = this.#getPositions();
    const connections = this.#getConnections();

    const canvas = await Canvas2dFactory.getNewCanvas(1024, 1024);
    const width = 1024;
    const height = 1024;

    // Draw paths first
    for (const conn of connections) {
      const fromPos = positions.find(p => p.id === conn.start);
      const toPos = positions.find(p => p.id === conn.end);
      if (!fromPos || !toPos) continue;

      const x1 = fromPos.x * width;
      const y1 = fromPos.y * height;
      const x2 = toPos.x * width;
      const y2 = toPos.y * height;

      await canvas.drawLine2d(
        { x: x1, y: y1 },
        { x: x2, y: y2 },
        this.config.pathThickness,
        colors.pathColor,
        1,
        colors.glowColor,
        0.6
      );
    }

    // Draw nodes with color
    for (const pos of positions) {
      const x = pos.x * width;
      const y = pos.y * height;

      await canvas.drawRing2d(
        { x, y },
        this.config.nodeSize,
        2,
        colors.nodeColor,
        1,
        colors.glowColor,
        1.0
      );
    }

    const networkLayer = await canvas.convertToLayer();
    await networkLayer.adjustLayerOpacity(this.config.glowIntensity);
    
    return await layer.composeOver(networkLayer, { blend: 'screen' });
  }

  #extractColors() {
    const settings = this.settings || new Settings({});
    return {
      nodeColor: this.config.nodeColor?.getColor?.(settings) || '#FF00FF',
      pathColor: this.config.pathColor?.getColor?.(settings) || '#00FFFF',
      glowColor: this.config.glowColor?.getColor?.(settings) || '#FFFF00',
    };
  }

  #getPositions() {
    // Return array of position objects
    return Object.values(SEPHIROTH_POSITIONS);
  }

  #getConnections() {
    // Return array of connection objects
    return PATHS_CONNECTIONS;
  }
}
```

---

## 🎯 Quick Reference

### ColorPicker
```javascript
// Create
const picker = new ColorPicker(ColorPicker.SelectionType.colorBucket);

// Extract (in effect)
const color = picker.getColor(settings) || '#FFFFFF';

// Use
await canvas.drawRing2d({ x, y }, r, w, color, ...);
```

### Positions
```javascript
// Define
const POSITIONS = { node1: { id: 1, x: 0.5, y: 0.5, ... }, ... };

// Access
const node = POSITIONS.node1;
const allNodes = Object.values(POSITIONS);

// Convert to pixels
const pixelX = node.x * canvasWidth;
const pixelY = node.y * canvasHeight;
```

### Connections
```javascript
// Define
const CONNECTIONS = [
  { start: 1, end: 2 },
  { start: 2, end: 3 },
];

// Iterate and render
for (const conn of CONNECTIONS) {
  const from = positions.find(p => p.id === conn.start);
  const to = positions.find(p => p.id === conn.end);
  // Draw line from to...
}
```

---

## 📚 See Also

- **CANVAS2D_AND_LAYER_FACTORIES.md** - Working with vector and raster layers
- **LIVE_RENDER_TEST_GUIDE.md** - Testing effects with configurations
- **TEMPLATE_ARCHITECTURE.md** - Creating custom effects