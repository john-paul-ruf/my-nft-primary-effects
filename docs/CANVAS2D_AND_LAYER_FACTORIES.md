# Canvas2D & Layer Factories: Understanding the Rendering Architecture

This guide explains how **Canvas2DFactory** and **LayerFactory** work in `my-nft-gen`, and why **Canvas2D is not a typical HTML5 Canvas**.

## Quick Summary

| Component | Type | Purpose | Backend |
|-----------|------|---------|---------|
| **Canvas2D** | Vector Drawing | Geometric effects (shapes, paths, text) | SVG → Sharp |
| **Layer** | Raster Processing | Image compositing & filters | Sharp (image library) |

---

## 🎨 Canvas2D: Vector Drawing Engine

### ⚠️ CRITICAL: Canvas2D is NOT an HTML5 Canvas

**What students typically expect:**
```javascript
// ❌ This is NOT what Canvas2D is
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
ctx.drawImage(...);  // Pixel manipulation
```

**What Canvas2D actually is:**
```javascript
// ✅ This is Canvas2D
const canvas = await Canvas2dFactory.getNewCanvas(1024, 1024);
await canvas.drawRing2d(...);  // Vector drawing (SVG-based)
await canvas.drawBezierCurve(...);
```

### Why Vector (Not Raster)?

Canvas2D builds **SVG commands as strings**, not pixel data:

```
Your Code → Canvas2D.drawRing2d() 
    → SvgCanvasStrategy builds SVG elements
    → Accumulates: `<circle cx="512" cy="512" r="100" .../>`
    → Final: Converts entire SVG to PNG via Sharp
```

### Architecture: Strategy Pattern

```
Canvas2D (Facade)
    ↓
    ├─ Delegates all drawing to strategy
    └─ SvgCanvasStrategy
        ├─ Builds SVG DOM as strings
        ├─ Accumulates elements
        ├─ Generates final SVG XML
        └─ Converts to PNG (Sharp)
```

### Canvas2D API

**Creation:**
```javascript
import { Canvas2dFactory } from 'my-nft-gen';

const canvas = await Canvas2dFactory.getNewCanvas(
  width = 1024,
  height = 1024,
  strategy = 'svg'  // Only option currently
);
```

**All Drawing Methods:**

```javascript
// ═══════════════════════════════════════════════════════
// RINGS, CIRCLES, ELLIPSES, ARCS, DOTS
// ═══════════════════════════════════════════════════════

// Ring (inner/outer double-stroke circle)
await canvas.drawRing2d(pos, radius, innerStroke, innerColor, outerStroke, outerColor, alpha);

// Simple circle (single stroke)
await canvas.drawCircle2d(pos, radius, stroke, color, alpha);
await canvas.drawFilledCircle2d(pos, radius, fillColor, alpha);

// Ellipse
await canvas.drawEllipse2d(pos, rx, ry, stroke, color, alpha);
await canvas.drawFilledEllipse2d(pos, rx, ry, fillColor, alpha);

// Arc (partial circle)
await canvas.drawArc2d(pos, radius, startAngle, endAngle, stroke, color, alpha);
await canvas.drawFilledArc2d(pos, radius, startAngle, endAngle, fillColor, alpha);

// Dots (filled circles, simpler than drawCircle)
await canvas.drawDot(pos, radius, color, alpha);
await canvas.drawDots(positions, radius, color, alpha);  // Batch: array of {x,y}

// ═══════════════════════════════════════════════════════
// RECTANGLES
// ═══════════════════════════════════════════════════════

await canvas.drawRect2d(x, y, width, height, stroke, color, alpha);
await canvas.drawFilledRect2d(x, y, width, height, fillColor, alpha);
await canvas.drawRoundedRect2d(x, y, width, height, cornerRadius, stroke, color, alpha);
await canvas.drawFilledRoundedRect2d(x, y, width, height, cornerRadius, fillColor, alpha);

// ═══════════════════════════════════════════════════════
// POLYGONS
// ═══════════════════════════════════════════════════════

// Regular polygon (N sides, computed from center)
await canvas.drawPolygon2d(radius, pos, numberOfSides, startAngle, innerStroke, innerColor, outerStroke, outerColor, alpha);
await canvas.drawFilledPolygon2d(radius, pos, numberOfSides, startAngle, fillColor, alpha);

// Custom polygon (arbitrary points array [{x,y}, ...])
await canvas.drawCustomPolygon2d(points, stroke, color, alpha);
await canvas.drawFilledCustomPolygon2d(points, fillColor, alpha);

// ═══════════════════════════════════════════════════════
// STARS, CROSSES, ARROWS
// ═══════════════════════════════════════════════════════

await canvas.drawStar2d(pos, outerRadius, innerRadius, points, startAngle, stroke, color, alpha);
await canvas.drawFilledStar2d(pos, outerRadius, innerRadius, points, startAngle, fillColor, alpha);
await canvas.drawCross2d(pos, size, thickness, stroke, color, alpha);
await canvas.drawArrow2d(start, end, headLength, headWidth, stroke, color, alpha);

// ═══════════════════════════════════════════════════════
// LINES AND RAYS
// ═══════════════════════════════════════════════════════

// Line (inner/outer double-stroke)
await canvas.drawLine2d(startPos, endPos, innerStroke, innerColor, outerStroke, outerColor, alpha);

// Gradient lines
await canvas.drawGradientLine2d(startPos, endPos, stroke, startColor, endColor);
await canvas.drawLinearGradientLine2d(startPos, endPos, stroke, colorStops);  // Multi-stop

// Rays from center point
await canvas.drawRay2d(pos, angle, radius, length, innerStroke, innerColor, outerStroke, outerColor);
await canvas.drawRays2d(pos, radius, length, sparsityFactor, innerStroke, innerColor, outerStroke, outerColor);

// Dashed lines
await canvas.drawDashedLine2d(start, end, stroke, color, dashArray, alpha);

// ═══════════════════════════════════════════════════════
// CURVES AND PATHS
// ═══════════════════════════════════════════════════════

// Quadratic bezier (1 control point)
await canvas.drawBezierCurve(start, control, end, innerStroke, innerColor, outerStroke, outerColor);

// Cubic bezier (2 control points)
await canvas.drawCubicBezier(start, control1, control2, end, innerStroke, innerColor, outerStroke, outerColor, alpha);

// Catmull-Rom spline (smooth curve through points)
await canvas.drawSpline(points, tension, innerStroke, innerColor, outerStroke, outerColor, closed, alpha);

// Path (array of points or SVG path string)
await canvas.drawPath(segment, innerStroke, innerColor, outerStroke, outerColor);
await canvas.drawFilledPath2d(segment, fillColor, alpha);

// ═══════════════════════════════════════════════════════
// GRADIENTS
// ═══════════════════════════════════════════════════════

// colorStops = [{offset: 0, color: '#FF0000'}, {offset: 1, color: '#0000FF'}]
await canvas.drawGradientRect(x, y, width, height, colorStops);
await canvas.drawRadialGradient(pos, innerRadius, outerRadius, colorStops);
await canvas.drawGradientRing2d(pos, radius, stroke, colorStops);
await canvas.drawGradientPath2d(segment, stroke, colorStops);

// ═══════════════════════════════════════════════════════
// DASHED SHAPES AND GRIDS
// ═══════════════════════════════════════════════════════

// dashArray = [dashLength, gapLength] e.g. [10, 5]
await canvas.drawDashedRing2d(pos, radius, stroke, color, dashArray, alpha);
await canvas.drawDashedRect2d(x, y, width, height, stroke, color, dashArray, alpha);
await canvas.drawGrid2d(x, y, width, height, cellWidth, cellHeight, stroke, color, alpha);

// ═══════════════════════════════════════════════════════
// TEXT
// ═══════════════════════════════════════════════════════

await canvas.drawText(text, x, y, options);
// options: { fontFamily, fontSize, fontWeight, fontStyle, color, alpha,
//            textAnchor, dominantBaseline, letterSpacing, textDecoration,
//            strokeWidth, strokeColor, rotation }

await canvas.drawTextOnPath(text, pathData, options);
// pathData: array of {x,y} points or SVG path string
// options: { fontFamily, fontSize, fontWeight, color, alpha, startOffset, letterSpacing }

// ═══════════════════════════════════════════════════════
// IMAGE EMBEDDING
// ═══════════════════════════════════════════════════════

await canvas.drawImage(buffer, x, y, width, height, alpha);  // PNG buffer or base64

// ═══════════════════════════════════════════════════════
// STATE AND TRANSFORMS (Synchronous)
// ═══════════════════════════════════════════════════════

canvas.saveState();           // Push state (alpha, blend, transforms, filters, clips)
canvas.restoreState();        // Pop state
canvas.setGlobalAlpha(alpha); // Set opacity for subsequent draws (0-1)
canvas.setBlendMode(mode);    // Set SVG blend mode ('normal', 'multiply', 'screen', etc.)
canvas.translate(x, y);       // Add translation transform
canvas.rotate(angle, cx, cy); // Add rotation (degrees, optional center)
canvas.scale(sx, sy);         // Add scale transform
canvas.resetTransform();      // Clear all transforms

// ═══════════════════════════════════════════════════════
// GROUPING
// ═══════════════════════════════════════════════════════

canvas.beginGroup(options);   // options: { transform, opacity, blendMode, clipPath }
canvas.endGroup();

// ═══════════════════════════════════════════════════════
// CLIPPING (restrict drawing to region)
// ═══════════════════════════════════════════════════════

canvas.setClipRect(x, y, width, height);
canvas.setClipCircle(pos, radius);
canvas.setClipPath(points);   // Array of {x,y} or SVG path string
canvas.clearClip();

// ═══════════════════════════════════════════════════════
// SVG FILTERS (apply to subsequent draws)
// ═══════════════════════════════════════════════════════

canvas.applyGaussianBlur(stdDeviation);
canvas.applyDropShadow(dx, dy, stdDeviation, color);
canvas.applyGlow(stdDeviation, color);
canvas.clearFilters();

// ═══════════════════════════════════════════════════════
// LIFECYCLE AND EXPORT
// ═══════════════════════════════════════════════════════

await canvas.toFile('output.png');                    // Save to disk
const layer = await canvas.convertToLayer();          // Convert to Layer object
canvas.dispose();                                     // Clean up resources
```

### Canvas2D Data Flow

```
1. You call: canvas.drawRing2d(...)
   ↓
2. SvgCanvasStrategy adds SVG string: `<circle cx="..." cy="..." r="..."/>`
   ↓
3. You call: canvas.drawPolygon2d(...)
   ↓
4. Another SVG string is appended
   ↓
5. You call: canvas.toFile('out.png')
   ↓
6. SvgCanvasStrategy generates complete SVG XML
   ↓
7. Sharp converts SVG → PNG buffer
   ↓
8. PNG written to disk
```

### Real Example: Tree of Life Effect

```javascript
import { Canvas2dFactory } from 'my-nft-gen';

async apply() {
  const canvas = await Canvas2dFactory.getNewCanvas(1024, 1024);
  
  // Draw tree structure using vector commands
  for (let i = 0; i < branches.length; i++) {
    const branch = branches[i];
    
    // Draw as line (becomes SVG <line> element)
    await canvas.drawLine2d(
      branch.start,
      branch.end,
      2,  // stroke width
      '#8B4513',  // brown
      1,
      '#654321',
      1.0
    );
    
    // Draw node as filled polygon (becomes SVG <polygon>)
    await canvas.drawFilledPolygon2d(
      10,  // radius
      branch.end,
      6,  // hex
      0,
      '#FFD700',  // gold
      1.0
    );
  }
  
  // Save as PNG
  await canvas.toFile('tree.png');
}
```

**What actually saved to disk:**
- PNG file containing all the vector drawings rasterized
- NOT a pixel-by-pixel canvas buffer
- Sharp handled the conversion

---

## 📦 Layer: Raster Image Processing

### What is a Layer?

A **Layer** represents raster image data (pixel-based). It's built using **Sharp**, a high-performance image processing library.

**CRITICAL: Effects Receive Layer Objects**

When the framework executes an effect, it passes a Layer object to the effect's `invoke()` method:

```javascript
import { BaseEffect } from 'my-nft-gen';

export class MyEffect extends BaseEffect {
  async invoke(layer, currentFrame, numberOfFrames) {
    // ← layer is a Layer object (raster), not a Canvas2D
    // ← Effects work with this Layer as the primary interface
    
    await layer.blur(5);
    await layer.modulate({ brightness: 1.1 });
    return layer;  // Return modified layer
  }
}
```

The Project pipeline handles:
1. Loading initial image as Layer
2. Passing Layer to each effect's `invoke()` method
3. Collecting return value for next effect (or final output)

### Creating and Loading Layers

```javascript
import { LayerFactory } from 'my-nft-gen';

// Create new blank layer
const layer = await LayerFactory.getNewLayer(
  height = 1024,
  width = 1024,
  backgroundColor = '#000000',
  config = {
    finalImageSize: { width: 1024, height: 1024, longestSide: 1024, shortestSide: 1024 },
    workingDirectory: null,
    layerStrategy: 'sharp'  // Only option currently
  }
);

// Load from file
const layer = await LayerFactory.getLayerFromFile('image.png', config);

// Load from buffer
const layer = await LayerFactory.getLayerFromBuffer(pngBuffer, config);
```

### Architecture: Strategy Pattern

```
Layer (Facade)
    ↓
    ├─ Delegates to strategy
    └─ SharpLayerStrategy
        ├─ Wraps Sharp library
        ├─ Manages image buffers
        ├─ Performs transformations
        └─ Exports to files/buffers
```

### Layer API

**File Operations:**
```javascript
await layer.toFile(filename);           // Save to PNG file
await layer.fromFile(filename);         // Load from PNG file
await layer.toBuffer();                 // Export to buffer (PNG)
await layer.fromBuffer(buffer);         // Load from buffer
```

**Image Composition (Legacy):**
```javascript
// Composite another layer on top (full canvas)
await layer.compositeLayerOver(otherLayer, withoutResize = false);

// Composite at specific position
await layer.compositeLayerOverAtPoint(otherLayer, top, left);
```

**Image Composition (Recommended):**
```javascript
// Modern compositing with full control
const result = await baseLayer.composeOver(sourceLayer, options);

// Options object:
// {
//   left: 0,              // X offset
//   top: 0,               // Y offset
//   width: undefined,     // Override source width
//   height: undefined,    // Override source height
//   blend: 'over',        // Blend mode: 'over', 'multiply', 'screen', etc.
//   opacity: 1.0          // Opacity 0.0-1.0
// }
```

**Transformations:**
```javascript
await layer.resize(height, width, fitType);  // Resize (fitType: 'contain', 'cover', 'fill')
await layer.crop(left, top, width, height);  // Crop region
await layer.rotate(angle);                   // Rotate by degrees
await layer.extend({ top, bottom, left, right });  // Add border/padding
```

**Raster Effects:**
```javascript
await layer.blur(byPixels);                        // Gaussian blur
await layer.adjustLayerOpacity(opacity);           // 0.0 to 1.0
await layer.modulate({ brightness, saturation, contrast });  // Color adjustments
```

#### Blur and Opacity: Detailed Usage

**Blur - Gaussian Blur Effect**

```javascript
// Basic blur
await layer.blur(5);  // Blur radius in pixels

// Common blur amounts:
// 1-3px   = Subtle softness
// 5-10px  = Noticeable blur
// 15+px   = Strong blur/bokeh effect

// Example: Soft background effect
const softLayer = await LayerFactory.getNewLayer(1024, 1024, '#000000');
await softLayer.blur(20);  // Heavy blur for soft background
```

**Blur Use Cases:**
- Softening hard edges
- Creating bokeh/depth effects
- Smoothing out noise
- Backgrounds that shouldn't draw attention
- Motion blur simulation

**Opacity - Alpha Channel Control**

```javascript
// Set layer opacity (transparency)
await layer.adjustLayerOpacity(0.8);  // 80% visible, 20% transparent

// Common opacity levels:
// 0.0   = Fully transparent (invisible)
// 0.3   = 30% visible (mostly faded)
// 0.5   = 50% visible (semi-transparent)
// 0.7   = 70% visible (slightly faded)
// 1.0   = 100% visible (fully opaque)

// Example: Fading overlay
const overlay = await Canvas2dFactory.getNewCanvas(1024, 1024);
await overlay.drawRing2d({ x: 512, y: 512 }, 200, 2, '#FFFFFF', 2, '#CCCCCC');
const overlayLayer = await overlay.convertToLayer();
await overlayLayer.adjustLayerOpacity(0.6);  // 60% visible
```

**Opacity Use Cases:**
- Creating watermarks (light, semi-transparent)
- Layering effects on top of base image
- Fade-in/fade-out transitions
- Blending multiple layers
- Creating composite effects with varying strength

**Combining Blur + Opacity: Common Patterns**

```javascript
// Pattern 1: Soft glow effect
const glow = await LayerFactory.getNewLayer(1024, 1024, '#FFFF00');
await glow.blur(15);
await glow.adjustLayerOpacity(0.4);
const result = await baseLayer.composeOver(glow, { blend: 'screen' });

// Pattern 2: Faded shadow
const shadow = await LayerFactory.getNewLayer(1024, 1024, '#000000');
await shadow.blur(10);
await shadow.adjustLayerOpacity(0.3);
const withShadow = await baseLayer.composeOver(shadow, { blend: 'multiply' });

// Pattern 3: Soft texture overlay
const texture = await LayerFactory.getLayerFromFile('texture.png', config);
await texture.blur(3);
await texture.adjustLayerOpacity(0.2);
const textured = await baseLayer.composeOver(texture, { blend: 'overlay' });
```

**Real Example: Effect with Blur and Opacity**

```javascript
import { BaseEffect } from 'my-nft-gen';
import { Canvas2dFactory, LayerFactory } from 'my-nft-gen';

export class SoftGlowEffect extends BaseEffect {
  async invoke(layer, currentFrame, numberOfFrames) {
    // Create a glowing ring
    const canvas = await Canvas2dFactory.getNewCanvas(1024, 1024);
    await canvas.drawRing2d(
      { x: 512, y: 512 },
      300,        // radius
      5,          // inner stroke
      '#FF6B9D',  // hot pink
      3,
      '#FF1493'
    );
    
    // Convert to layer and apply effects
    const glowLayer = await canvas.convertToLayer();
    await glowLayer.blur(12);              // Soft glow
    await glowLayer.adjustLayerOpacity(0.6);  // Semi-transparent
    
    // Composite over input layer with additive blending
    const result = await layer.composeOver(glowLayer, {
      blend: 'screen'  // Additive blend for glow effect
    });
    
    return result;
  }
}
```

**Important Notes:**
- **Order matters**: Blur before opacity adjustment for natural results
- **Chaining**: Both methods chain in Sharp, so they execute together at export
- **Performance**: Blur is expensive (15+ pixels on 4K = slower processing)
- **Memory**: `adjustLayerOpacity()` adds alpha channel if not present

**Information:**
```javascript
const info = await layer.getInfo();
// Returns: { width, height, space: 'srgb', hasAlpha: true, ... }
```

### Layer Data Flow

```
1. Create or load layer (Sharp wraps image in memory)
   ↓
2. Perform operations (Sharp chain transforms)
   await layer.blur(5)
   await layer.adjustLayerOpacity(0.8)
   ↓
3. Sharp accumulates operations (doesn't execute until export)
   ↓
4. Call toFile() or toBuffer()
   ↓
5. Sharp executes entire chain on pixel data
   ↓
6. PNG encoded and saved/returned
```

### Real Example: Using Canvas2D Within an Effect

Effects receive Layer objects from the framework. To use Canvas2D, you create it **separately** inside your effect:

```javascript
import { BaseEffect } from 'my-nft-gen';
import { Canvas2dFactory } from 'my-nft-gen';

export class GeometricPatternEffect extends BaseEffect {
  async invoke(layer, currentFrame, numberOfFrames) {
    // ← Framework passes: layer (raster)
    // ← You optionally create: canvas (vector)
    
    // Step 1: Create vector canvas (separate from the layer)
    const canvas = await Canvas2dFactory.getNewCanvas(1024, 1024);
    
    // Step 2: Draw geometric pattern
    for (let i = 0; i < 10; i++) {
      await canvas.drawRing2d(
        { x: 512, y: 512 },
        50 + (i * 10),
        2,
        '#FFFFFF',
        2,
        '#CCCCCC'
      );
    }
    
    // Step 3: Convert vector to raster
    const vectorLayer = await canvas.convertToLayer();
    
    // Step 4: Composite vector onto input layer
    const result = await layer.composeOver(vectorLayer, {
      opacity: 0.8,
      blend: 'overlay'
    });
    
    // Step 5: Apply raster effects to result
    await result.blur(2);
    
    return result;  // Return to next effect or output
  }
}
```

**Key Points:**
- Framework provides: `layer` (raster, Sharp-based)
- You create separately: `canvas` (vector, SVG-based)
- Convert: `canvas.convertToLayer()` → raster
- Composite: `layer.composeOver(vectorLayer, options)`
- Return: modified layer to next effect

---

## 🔄 Canvas2D ↔ Layer Conversion

### Canvas2D → Layer (Rasterization)

```javascript
const canvas = await Canvas2dFactory.getNewCanvas(1024, 1024);
await canvas.drawRing2d(...);

// Convert: SVG → PNG → Layer
const layer = await canvas.convertToLayer();

// Now you can apply raster effects
await layer.blur(5);
await layer.rotate(45);
```

**Internally:**
```
Canvas2D (SVG elements)
    ↓
    SvgCanvasStrategy.convertToLayer()
    ↓
    Generate SVG XML
    ↓
    Sharp(svgBuffer).png().toBuffer()  ← Rasterization happens here
    ↓
    LayerFactory.getLayerFromBuffer(pngBuffer)
    ↓
    Layer (PNG in memory)
```

### Layer → Canvas2D? ❌

**Not directly supported.** You cannot convert a raster Layer back to vector Canvas2D.

Why not?
- Canvas2D is **mathematically defined** (SVG commands)
- Layer is **pixel data** (raster)
- Converting pixels → mathematical vectors = non-trivial problem (would require tracing/vectorization library)
- Not part of framework design

**Workaround (if needed):**
```javascript
// Save layer to file and load in another effect
await layer.toFile('temp.png');

// In a later effect, load and use as raster
const savedLayer = await LayerFactory.getLayerFromFile('temp.png', config);
```

---

## 🎨 ComposeOver: Advanced Layer Blending

`composeOver()` is the powerful method for combining layers with full control over blending and positioning.

### Method Signature

```javascript
const result = await baseLayer.composeOver(sourceLayer, options);
```

**Parameters:**
- `baseLayer` - The bottom/background layer
- `sourceLayer` - The top/overlay layer to place on top
- `options` - Configuration object (see below)

**Returns:** New Layer with sourceLayer composited on top of baseLayer

### Options Object

```javascript
const options = {
  // Positioning (pixels)
  left: 0,              // X offset where source is placed
  top: 0,               // Y offset where source is placed
  
  // Sizing (optional)
  width: undefined,     // Override source width (resizes to fit)
  height: undefined,    // Override source height (resizes to fit)
  
  // Blending
  blend: 'over',        // Blend mode - see modes below
  
  // Opacity
  opacity: 1.0          // 0.0 (transparent) to 1.0 (opaque)
};
```

### Blend Modes

```javascript
// Common blend modes (Sharp blending)
'over'         // Standard alpha blending (default)
'multiply'     // Darken: multiply colors
'screen'       // Lighten: inverse multiply
'overlay'      // Blend with both darken and lighten
'add'          // Addition: add color values
'subtract'     // Subtraction: subtract color values
'lighten'      // Keep lightest pixels
'darken'       // Keep darkest pixels
```

### Practical Examples

**Example 1: Simple Overlay with Opacity**

```javascript
async invoke(layer) {
  const canvas = await Canvas2dFactory.getNewCanvas(1024, 1024);
  await canvas.drawRing2d({ x: 512, y: 512 }, 200, 5, '#FFFFFF', 2, '#CCCCCC');
  const overlay = await canvas.convertToLayer();
  
  // Place overlay on top with 80% opacity
  const result = await layer.composeOver(overlay, {
    opacity: 0.8
  });
  
  return result;
}
```

**Example 2: Positioned Overlay with Blend Mode**

```javascript
async invoke(layer) {
  const canvas = await Canvas2dFactory.getNewCanvas(200, 200);
  await canvas.drawFilledPolygon2d(50, { x: 100, y: 100 }, 6, 0, '#FFD700', 1.0);
  const pattern = await canvas.convertToLayer();
  
  // Place at position (100, 100) with screen blend
  const result = await layer.composeOver(pattern, {
    left: 100,
    top: 100,
    blend: 'screen',
    opacity: 0.6
  });
  
  return result;
}
```

**Example 3: Tiled Overlay Pattern**

```javascript
async invoke(layer) {
  const canvas = await Canvas2dFactory.getNewCanvas(100, 100);
  await canvas.drawRing2d({ x: 50, y: 50 }, 30, 2, '#FF0000', 1, '#CC0000');
  const tile = await canvas.convertToLayer();
  
  let result = layer;
  
  // Tile pattern across canvas at 150px intervals
  for (let x = 0; x < 1024; x += 150) {
    for (let y = 0; y < 1024; y += 150) {
      result = await result.composeOver(tile, {
        left: x,
        top: y,
        blend: 'multiply',
        opacity: 0.3
      });
    }
  }
  
  return result;
}
```

**Example 4: Chained Compositing**

```javascript
async invoke(layer) {
  // Build up complex effect by compositing multiple layers
  let result = layer;
  
  // Add background pattern
  const pattern = await canvas1.convertToLayer();
  result = await result.composeOver(pattern, { opacity: 0.7 });
  
  // Add glow effect
  const glow = await canvas2.convertToLayer();
  result = await result.composeOver(glow, { 
    blend: 'screen', 
    opacity: 0.5 
  });
  
  // Add decorative border
  const border = await canvas3.convertToLayer();
  result = await result.composeOver(border, { 
    blend: 'overlay', 
    opacity: 0.4 
  });
  
  return result;
}
```

### Important Notes

1. **Layer Stacking Order:** `baseLayer.composeOver(sourceLayer)` means sourceLayer goes ON TOP
   - Result has sourceLayer above baseLayer
   - If you want reverse order, call with reversed arguments

2. **Blend Modes Matter:** Default `'over'` uses alpha blending
   - 'multiply' darkens the image (good for overlays)
   - 'screen' lightens the image (good for glows)
   - 'overlay' combines both (good for textures)

3. **Positioning:** left/top are applied to the source layer
   - left/top < 0 means source is partially off-canvas (gets clipped)
   - left/top > canvas size means source is placed far right/bottom

4. **Performance:** Compositing is expensive for large layers
   - Minimize the number of composeOver calls in tight loops
   - Consider resizing source to match base size to reduce processing

---

## 🔁 Round-Trip Workflows: Layer → Canvas2D → Layer

A common pattern is to layer raster and vector together:

### Use Case 1: Raster Background + Vector Overlay

```javascript
import { BaseEffect } from 'my-nft-gen';
import { Canvas2dFactory } from 'my-nft-gen';

export class RasterPlusVectorEffect extends BaseEffect {
  async invoke(layer, currentFrame, numberOfFrames) {
    // ← layer is raster (photo/background)
    
    // Create vector overlay
    const vectorCanvas = await Canvas2dFactory.getNewCanvas(1024, 1024);
    await vectorCanvas.drawRing2d({ x: 512, y: 512 }, 200, 5, '#FFD700', 2, '#FFA500');
    await vectorCanvas.drawFilledPolygon2d(150, { x: 512, y: 512 }, 6, 0, '#FF0000', 0.5);
    
    // Convert vector to raster
    const vectorLayer = await vectorCanvas.convertToLayer();
    
    // Blend: place vector on top of raster
    const result = await layer.composeOver(vectorLayer, {
      opacity: 0.9,
      blend: 'overlay'
    });
    
    return result;
  }
}
```

### Use Case 2: Multi-Pass Vector Effects

```javascript
import { BaseEffect } from 'my-nft-gen';
import { Canvas2dFactory } from 'my-nft-gen';

export class MultiPassVectorEffect extends BaseEffect {
  async invoke(layer, currentFrame, numberOfFrames) {
    let result = layer;
    
    // Pass 1: Draw base geometric pattern
    const canvas1 = await Canvas2dFactory.getNewCanvas(1024, 1024);
    for (let i = 0; i < 5; i++) {
      await canvas1.drawRing2d(
        { x: 512, y: 512 },
        100 + (i * 50),
        2,
        '#FFFFFF',
        1,
        '#CCCCCC'
      );
    }
    const pattern1 = await canvas1.convertToLayer();
    result = await result.composeOver(pattern1, { opacity: 0.7 });
    
    // Pass 2: Add decorative lines
    const canvas2 = await Canvas2dFactory.getNewCanvas(1024, 1024);
    for (let angle = 0; angle < 360; angle += 30) {
      const radians = (angle * Math.PI) / 180;
      const endX = 512 + Math.cos(radians) * 400;
      const endY = 512 + Math.sin(radians) * 400;
      await canvas2.drawLine2d(
        { x: 512, y: 512 },
        { x: endX, y: endY },
        1,
        '#FFD700',
        1,
        '#FFA500'
      );
    }
    const pattern2 = await canvas2.convertToLayer();
    result = await result.composeOver(pattern2, { opacity: 0.5, blend: 'screen' });
    
    return result;
  }
}
```

### Use Case 3: Memory-Efficient Pattern

Don't keep intermediate layers in memory longer than needed:

```javascript
import { BaseEffect } from 'my-nft-gen';
import { Canvas2dFactory } from 'my-nft-gen';

export class MemoryEfficientEffect extends BaseEffect {
  async invoke(layer, currentFrame, numberOfFrames) {
    // ✅ GOOD: Composite immediately, let garbage collection clean up
    const canvas = await Canvas2dFactory.getNewCanvas(1024, 1024);
    await canvas.drawRing2d(...);
    const vectorLayer = await canvas.convertToLayer();
    
    const result = await layer.composeOver(vectorLayer, { opacity: 0.8 });
    // vectorLayer is no longer referenced, can be garbage collected
    
    return result;
  }
}
```

Compare with:

```javascript
// ❌ BAD: Keeping unnecessary references
async invoke(layer, currentFrame, numberOfFrames) {
  const vector1 = await canvas1.convertToLayer();
  const vector2 = await canvas2.convertToLayer();
  const vector3 = await canvas3.convertToLayer();
  const vector4 = await canvas4.convertToLayer();  // All in memory!
  
  let result = layer;
  result = await result.composeOver(vector1, ...);
  result = await result.composeOver(vector2, ...);
  result = await result.composeOver(vector3, ...);
  result = await result.composeOver(vector4, ...);
  
  return result;  // Only now can garbage collection start
}
```

---

## 🎯 When to Use Each

### Use Canvas2D for:

✅ **Geometric vector effects** (shapes, patterns)  
✅ **Crisp, clean lines** (no antialiasing needed)  
✅ **Scalable drawings** (mathematically defined)  
✅ **Performance** (SVG strings are lightweight)  

**Examples:**
- Tree of Life (branching structure)
- Spirals and mathematical curves
- Sacred geometry patterns
- Mandala designs
- Constellation/star maps

### Use Layer for:

✅ **Raster effects** (blur, glow, modulation)  
✅ **Photo compositing** (multiple images)  
✅ **Real images** (loaded from files)  
✅ **Complex filters** (all Sharp effects)  

**Examples:**
- Applying glow to canvas output
- Blurring backgrounds
- Compositing textures
- Adjusting opacity/color
- Cropping and resizing

---

## 🔀 Canvas2D vs Layer in Effects: Architecture

### The Mental Model

When writing an effect, understand what the framework provides vs. what you create:

```
┌─────────────────────────────────────────────────┐
│          EFFECT EXECUTION MODEL                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  Framework provides:                            │
│  ┌─────────────────────────────────────────┐  │
│  │ invoke(layer, currentFrame, ...NumberOfFrames) │ 
│  │         ↑     ↑           ↑             │  │
│  │      LAYER  FRAME      DURATION         │  │
│  │     (RASTER) (int)      (int)           │  │
│  └─────────────────────────────────────────┘  │
│                                                 │
│  You optionally create:                        │
│  ┌─────────────────────────────────────────┐  │
│  │ Canvas2dFactory.getNewCanvas(...)       │  │
│  │          ↓                               │  │
│  │ canvas (VECTOR, SVG-based)              │  │
│  │          ↓                               │  │
│  │ canvas.convertToLayer()                 │  │
│  │          ↓                               │  │
│  │ vectorLayer (RASTER, Sharp-backed)      │  │
│  └─────────────────────────────────────────┘  │
│                                                 │
│  You return:                                    │
│  ┌─────────────────────────────────────────┐  │
│  │ return layer;  // Modified by effects   │  │
│  └─────────────────────────────────────────┘  │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Decision Tree: When to Create Canvas2D?

```
Does your effect need VECTOR drawing (shapes, patterns)?
│
├─ YES → Create Canvas2D
│         await Canvas2dFactory.getNewCanvas()
│         Draw geometric patterns
│         canvas.convertToLayer() to rasterize
│         layer.composeOver(...) to blend with input
│         
├─ NO → Work directly with Layer
│        await layer.blur(...)
│        await layer.modulate(...)
│        return layer
│
└─ BOTH → Layer + Canvas2D combo (most powerful)
          Receive: layer (background)
          Create: canvas (overlay patterns)
          Convert: canvas → vectorLayer
          Composite: layer.composeOver(vectorLayer, ...)
          Apply effects to result
          return result
```

### Real Decision Examples

```javascript
// EXAMPLE 1: Pure raster effect (blur, opacity)
export class SimpleBlurEffect extends BaseEffect {
  async invoke(layer) {
    await layer.blur(5);
    return layer;  // No Canvas2D needed
  }
}

// EXAMPLE 2: Pure vector effect (geometric shapes)
export class RingsEffect extends BaseEffect {
  async invoke(layer) {
    const canvas = await Canvas2dFactory.getNewCanvas(1024, 1024);
    for (let i = 0; i < 5; i++) {
      await canvas.drawRing2d(...);  // Canvas2D
    }
    const vectorLayer = await canvas.convertToLayer();
    return await layer.composeOver(vectorLayer, { opacity: 0.7 });
  }
}

// EXAMPLE 3: Combined effect (raster + vector)
export class EnhancedGeometricEffect extends BaseEffect {
  async invoke(layer) {
    // Step 1: Enhance input with raster effects
    await layer.modulate({ brightness: 1.1 });
    
    // Step 2: Add vector overlay
    const canvas = await Canvas2dFactory.getNewCanvas(1024, 1024);
    await canvas.drawPolygon2d(...);
    const vectorLayer = await canvas.convertToLayer();
    
    // Step 3: Blend and apply more effects
    const result = await layer.composeOver(vectorLayer, ...);
    await result.blur(2);
    
    return result;
  }
}
```

---

## 📊 Complete Workflow Example

Real effect showing how the framework architecture works:

```javascript
import { BaseEffect } from 'my-nft-gen';
import { Canvas2dFactory } from 'my-nft-gen';

export class ComplexGeometricEffect extends BaseEffect {
  async invoke(layer, currentFrame, numberOfFrames) {
    // ← Framework passes: layer (raster input), currentFrame, numberOfFrames
    
    // ===== PHASE 1: Create Vector Canvas =====
    // Separate from the input layer
    const geometricCanvas = await Canvas2dFactory.getNewCanvas(1024, 1024);
    
    // ===== PHASE 2: Draw Geometric Pattern =====
    // Use animation frame for dynamic effects
    const animationProgress = currentFrame / numberOfFrames;
    
    for (let i = 0; i < 10; i++) {
      const radius = 50 + (i * 10) + (animationProgress * 20);
      await geometricCanvas.drawRing2d(
        { x: 512, y: 512 },
        radius,
        2,
        '#FFFFFF',
        2,
        '#CCCCCC'
      );
    }
    
    // ===== PHASE 3: Convert Vector to Raster =====
    const geometricLayer = await geometricCanvas.convertToLayer();
    
    // ===== PHASE 4: Composite Vector onto Input Layer =====
    let result = await layer.composeOver(geometricLayer, {
      opacity: 0.8,
      blend: 'overlay'
    });
    
    // ===== PHASE 5: Apply Raster Effects =====
    await result.blur(2);
    await result.adjustLayerOpacity(0.9);
    
    // ===== PHASE 6: Color Adjustments =====
    await result.modulate({
      brightness: 1.1 + (animationProgress * 0.2),
      saturation: 1.2,
      contrast: 1.05
    });
    
    // ===== PHASE 7: Return Result =====
    // Effect returns the modified layer to the next effect
    return result;
  }
}
```

**Architecture Flow:**
```
Project Framework
    ↓
Load Image as Layer
    ↓
Effect 1 receives Layer → returns modified Layer
    ↓
Effect 2 receives Layer from Effect 1 → returns modified Layer
    ↓
Effect 3 (ComplexGeometricEffect)
  - Receives: layer (raster)
  - Creates: canvas (vector)
  - Converts: canvas → vectorLayer
  - Composites: layer + vectorLayer = result
  - Modifies: result with raster effects
  - Returns: result
    ↓
Final Output Layer
```

---

## ⚙️ Performance Considerations

### Canvas2D (SVG → PNG)

**Performance:** Fast for drawing, slower at conversion

```
✅ Fast: Drawing 1000s of vectors (just SVG strings)
❌ Slower: Converting to PNG (Sharp rasterization)

Typical: 50-200ms for 1024×1024 SVG rasterization
```

**Memory:** Low during drawing, burst at conversion

```
✅ Low: SVG elements are lightweight strings
❌ Spike: Sharp needs full PNG buffer in memory
```

### Layer (Sharp Processing)

**Performance:** Depends on operation

```
✅ Fast: Simple operations (opacity, rotate)
❌ Slower: Complex operations (blur, resize)

Typical: 10-50ms per operation
```

**Memory:** Streaming where possible

```
✅ Efficient: Sharp uses streams for file I/O
✅ Smart: Layer operations chained (not executed until export)
```

### Framework Context: Effect Execution

When effects are part of a Project pipeline, memory becomes critical:

```
Project.renderFrame(frameNumber)
├─ Load source image → Layer
├─ Execute Effect 1 (may create Canvas2D, Layer objects)
├─ Pass result to Effect 2
├─ Pass result to Effect 3
├─ ... up to 10+ effects
└─ Final export to PNG

Total memory = All intermediate layers in play
```

Each effect should minimize intermediate layer references to avoid memory buildup.

### Optimization Tips

**For Canvas2D:**
```javascript
// ✅ Good: Draw many vectors, convert once
async invoke(layer) {
  const canvas = await Canvas2dFactory.getNewCanvas(1024, 1024);
  for (let i = 0; i < 1000; i++) {
    await canvas.drawRing2d(...);  // All SVG strings
  }
  const vectorLayer = await canvas.convertToLayer();  // Convert once
  return await layer.composeOver(vectorLayer, ...);
}

// ❌ Bad: Convert repeatedly
async invoke(layer) {
  let result = layer;
  for (let i = 0; i < 1000; i++) {
    const canvas = await Canvas2dFactory.getNewCanvas(1024, 1024);
    await canvas.drawRing2d(...);
    const vectorLayer = await canvas.convertToLayer();  // Wasteful!
    result = await result.composeOver(vectorLayer, ...);
  }
  return result;
}
```

**For Layer Compositing:**
```javascript
// ✅ Good: Release references immediately
async invoke(layer) {
  let result = layer;
  
  const v1 = await canvas1.convertToLayer();
  result = await result.composeOver(v1, ...);
  // v1 can be GC'd now
  
  const v2 = await canvas2.convertToLayer();
  result = await result.composeOver(v2, ...);
  // v2 can be GC'd now
  
  return result;
}

// ❌ Bad: Keep all references in memory
async invoke(layer) {
  const v1 = await canvas1.convertToLayer();
  const v2 = await canvas2.convertToLayer();
  const v3 = await canvas3.convertToLayer();
  const v4 = await canvas4.convertToLayer();  // All in memory!
  
  let result = layer;
  result = await result.composeOver(v1, ...);
  result = await result.composeOver(v2, ...);
  result = await result.composeOver(v3, ...);
  result = await result.composeOver(v4, ...);
  
  return result;
}
```

**For Effect Chaining:**
```javascript
// ✅ Good: Return layer immediately for next effect
async invoke(layer) {
  await layer.blur(5);
  await layer.modulate({ brightness: 1.1 });
  return layer;  // Don't keep temp copies
}

// ❌ Bad: Create unnecessary copies
async invoke(layer) {
  const temp1 = layer;  // Unnecessary reference
  const temp2 = await temp1.blur(5);  // Creates new layer
  const temp3 = await temp2.modulate(...);  // Creates another
  return temp3;  // temp1, temp2 still referenced
}
```

---

## 🐛 Common Mistakes

### ❌ Mistake 1: Treating Canvas2D Like HTML5 Canvas

```javascript
// ❌ WRONG - Canvas2D doesn't have getContext()
const ctx = canvas.getContext('2d');
ctx.fillRect(...);
ctx.drawImage(...);

// ✅ RIGHT - Use Canvas2D methods directly
await canvas.drawFilledPolygon2d(...);
await canvas.drawRing2d(...);
```

**Why:** Canvas2D is SVG-based vector drawing, not pixel manipulation. HTML5 Canvas API doesn't apply.

### ❌ Mistake 2: Forgetting `await`

```javascript
// ❌ WRONG - All Canvas2D and Layer methods are async
canvas.drawRing2d(...);  // Promise never resolved!

// ✅ RIGHT
await canvas.drawRing2d(...);
```

**Why:** All operations on Canvas2D and Layer are async. Not awaiting leads to race conditions.

### ❌ Mistake 3: Using `apply()` Instead of `invoke()`

```javascript
// ❌ WRONG - Old method name
async apply() {
  // This won't be called by the framework!
}

// ✅ RIGHT - Correct framework signature
async invoke(layer, currentFrame, numberOfFrames) {
  return layer;  // Always return the modified layer
}
```

**Why:** The framework uses dependency injection to call `invoke()` with Layer and animation parameters.

### ❌ Mistake 4: Confusing Framework Layer with Canvas2D

```javascript
// ❌ WRONG - Thinking the framework passes Canvas2D
async invoke(canvas) {  // ← Wrong! Not Canvas2D!
  // canvas is actually a Layer (raster)
  canvas.drawRing2d(...);  // ← Not a Canvas2D method!
}

// ✅ RIGHT - Understanding what you receive
async invoke(layer, currentFrame, numberOfFrames) {
  // ← layer is a Layer object (raster)
  
  // If you need Canvas2D, create it separately
  const vectorCanvas = await Canvas2dFactory.getNewCanvas(1024, 1024);
  await vectorCanvas.drawRing2d(...);  // ← Canvas2D method
  
  const vectorLayer = await vectorCanvas.convertToLayer();
  return await layer.composeOver(vectorLayer, { opacity: 0.8 });
}
```

**Why:** The framework provides Layer (raster), but you can optionally create Canvas2D (vector) if needed.

### ❌ Mistake 5: Converting Canvas2D Too Early

```javascript
// ❌ WRONG - Converts prematurely, then draws more
const layer = await canvas.convertToLayer();
await canvas.drawRing2d(...);  // Too late! Conversion already happened

// ✅ RIGHT - Draw everything first
await canvas.drawRing2d(...);
await canvas.drawPolygon2d(...);
const layer = await canvas.convertToLayer();
```

**Why:** Once converted, the Canvas2D is rasterized. New drawings won't be included.

### ❌ Mistake 6: Modifying Layer After Compositing

```javascript
// ❌ WRONG - Modifications don't affect already-composited result
const backgroundLayer = await LayerFactory.getNewLayer(...);
const result = await backgroundLayer.composeOver(overlayLayer);
await overlayLayer.blur(5);  // Too late!

// ✅ RIGHT - Modify before compositing
await overlayLayer.blur(5);
const result = await backgroundLayer.composeOver(overlayLayer);
```

**Why:** Compositing creates a new Layer. Modifying the source after doesn't affect the result.

### ❌ Mistake 7: Keeping Too Many Intermediate Layers

```javascript
// ❌ BAD - Memory pressure with many references
async invoke(layer) {
  const vector1 = await canvas1.convertToLayer();
  const vector2 = await canvas2.convertToLayer();
  const vector3 = await canvas3.convertToLayer();
  const vector4 = await canvas4.convertToLayer();
  
  let result = layer;
  result = await result.composeOver(vector1, ...);
  result = await result.composeOver(vector2, ...);
  result = await result.composeOver(vector3, ...);
  result = await result.composeOver(vector4, ...);
  // All 4 vectors still in memory!
  
  return result;
}

// ✅ GOOD - Composite and release as you go
async invoke(layer) {
  let result = layer;
  
  const vector1 = await canvas1.convertToLayer();
  result = await result.composeOver(vector1, ...);
  // vector1 can be GC'd now
  
  const vector2 = await canvas2.convertToLayer();
  result = await result.composeOver(vector2, ...);
  // vector2 can be GC'd now
  
  return result;
}
```

**Why:** Keeping references prevents garbage collection, increasing memory pressure and frame drop risk.

---

## 🔍 Debugging Tips

### Debug Effect with Logging

```javascript
import { BaseEffect } from 'my-nft-gen';
import { Canvas2dFactory } from 'my-nft-gen';

export class DebugEffect extends BaseEffect {
  async invoke(layer, currentFrame, numberOfFrames) {
    const name = this.constructor.name;
    
    console.log(`[${name}] Frame ${currentFrame}/${numberOfFrames}`);
    
    const inputInfo = await layer.getInfo();
    console.log(`[${name}] Input layer: ${inputInfo.width}x${inputInfo.height}`);
    
    // Create and debug Canvas2D
    console.log(`[${name}] Creating vector canvas...`);
    const canvas = await Canvas2dFactory.getNewCanvas(1024, 1024);
    
    console.log(`[${name}] Drawing patterns...`);
    await canvas.drawRing2d(...);
    
    console.log(`[${name}] Converting to raster...`);
    const vectorLayer = await canvas.convertToLayer();
    
    console.log(`[${name}] Compositing...`);
    const result = await layer.composeOver(vectorLayer, { opacity: 0.8 });
    
    console.log(`[${name}] Applying effects...`);
    await result.blur(3);
    
    console.log(`[${name}] Done!`);
    return result;
  }
}
```

### Save Intermediate Results for Inspection

```javascript
export class DebugSaveEffect extends BaseEffect {
  async invoke(layer, currentFrame, numberOfFrames) {
    // Save input for inspection
    await layer.toFile(`debug-frame-${currentFrame}-input.png`);
    
    // Create and save Canvas2D result
    const canvas = await Canvas2dFactory.getNewCanvas(1024, 1024);
    await canvas.drawRing2d(...);
    const vectorLayer = await canvas.convertToLayer();
    await vectorLayer.toFile(`debug-frame-${currentFrame}-vector.png`);
    
    // Save composite result
    const result = await layer.composeOver(vectorLayer, ...);
    await result.toFile(`debug-frame-${currentFrame}-composite.png`);
    
    return result;
  }
}
```

### Inspect Layer Information

```javascript
const layer = await LayerFactory.getNewLayer(1024, 1024, '#000000');
const info = await layer.getInfo();
console.log(info);
// Output:
// {
//   width: 1024,
//   height: 1024,
//   space: 'srgb',
//   hasAlpha: true,
//   depth: 'uchar',
//   density: 72,
//   chromaSubsampling: '4:2:0',
//   isProgressive: false,
//   pages: 1,
//   pageHeight: 1024,
//   loop: 0,
//   pageSizes: [ 1024 ]
// }
```

### Monitor Memory Usage During Frame Render

```javascript
export class MemoryAwareEffect extends BaseEffect {
  async invoke(layer, currentFrame, numberOfFrames) {
    if (currentFrame === 0) {
      console.log(`[Memory] Initial: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
    }
    
    // Do work
    const canvas = await Canvas2dFactory.getNewCanvas(1024, 1024);
    for (let i = 0; i < 100; i++) {
      await canvas.drawRing2d(...);
    }
    const vectorLayer = await canvas.convertToLayer();
    
    console.log(`[Memory] After convert: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
    
    const result = await layer.composeOver(vectorLayer, ...);
    
    console.log(`[Memory] After composite: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
    
    return result;
  }
}
```

---

## 📚 Further Reading

- **Sharp Documentation**: High-performance image processing library powering Layer
- **SVG Specification**: Vector format used by Canvas2D
- **Strategy Pattern**: Design pattern used by both Canvas2D and Layer factories
- **LIVE_RENDER_TEST_GUIDE.md**: How Canvas2D and Layer work in the Project effect pipeline
- **TEMPLATE_ARCHITECTURE.md**: Structure of Effect classes and how invoke() is called
