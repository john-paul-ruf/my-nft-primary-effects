# repo.md - Repository Overview

## Project

- **Name**: my-nft-primary-effects-plugin-pack
- **Version**: 1.0.0
- **Author**: John Ruf
- **License**: MIT
- **Module Type**: ESM (`"type": "module"`)
- **Entry Point**: `my-nft-primary-effects-plugins.js`
- **Exports**: `./plugin.js`

## Description

A plugin pack of 20 primary visual effects for NFT generative art, built for the [my-nft-gen](https://www.npmjs.com/package/my-nft-gen) framework. Each effect ships with 3 presets and supports animated, loop-safe rendering with fuzz (accent, blur, feather) post-processing.

## Dependencies

### Runtime
| Package | Source |
|---------|--------|
| `my-nft-gen` | Local (`file:../my-nft-gen`) |

### Dev
| Package | Version |
|---------|---------|
| `@babel/preset-env` | ^7.23.0 |
| `babel-jest` | ^29.0.0 |
| `jest` | ^29.0.0 |
| `sharp` | ^0.34.5 |

## Scripts

| Script | Command |
|--------|---------|
| `render` | `node scripts/testRender.js --help` |
| `test-all-random-preset` | `node scripts/testRender.js --all --preset random --frames 50 --width 1920 --height 1080 --save-frames --validate-loop` |

## Project Structure

```
my-nft-primary-effects/
├── my-nft-primary-effects-plugins.js   # Plugin entry: registers all 20 effects
├── src/
│   ├── index.js                        # Public re-exports (effects + presets)
│   └── effects/
│       ├── presets.js                   # All effect preset definitions
│       └── primaryEffects/
│           ├── index.js                 # Barrel exports for all effects
│           ├── CelticKnotwork/
│           ├── ChladniPlate/
│           ├── FractalDendrite/
│           ├── GlyphMatrix/
│           ├── GravityWell/
│           ├── LissajousCage/
│           ├── MoireInterference/
│           ├── NeuralMesh/
│           ├── PenroseTiling/
│           ├── PhyllotaxisSpiral/
│           ├── PlasmaCurrent/
│           ├── RadiolariaSkeleton/
│           ├── ReactionDiffusion/
│           ├── SacredMandala/
│           ├── SonicRosette/
│           ├── StainedGlass/
│           ├── TopographicContour/
│           ├── ToroidalFlow/
│           ├── VoronoiShatter/
│           └── WaveCollapse/
├── scripts/
│   └── testRender.js                   # CLI test renderer (502 lines)
├── docs/
│   ├── CANVAS2D_AND_LAYER_FACTORIES.md
│   ├── COLORPICKER_AND_POSITIONS.md
│   ├── LIVE_RENDER_TEST_GUIDE.md
│   ├── LOOP_FUNCTION_RULES.md
│   ├── QUICK_START_TESTING.md
│   └── TEMPLATE_ARCHITECTURE.md
├── output/                             # Rendered frame output (gitignored)
├── jest.config.js
├── AGENTS.md
├── README.md
├── LICENSE
└── package.json
```

## Codebase Stats

| Metric | Value |
|--------|-------|
| Effects | 20 |
| Presets per effect | 3 (60 total) |
| Source files (src/) | 41 JS files |
| Total source lines | ~6,431 |
| Each effect provides | `*Effect.js` + `*Config.js` |

## Effects

| # | Effect | Tags |
|---|--------|------|
| 1 | Fractal Dendrite | fractal, dendrite, tree, branching |
| 2 | Plasma Current | plasma, lightning, electric, arc |
| 3 | Sacred Mandala | mandala, sacred, geometric, symmetry |
| 4 | Voronoi Shatter | voronoi, tessellation, shatter, cells |
| 5 | Moire Interference | moire, interference, grid, lines |
| 6 | Reaction Diffusion | turing, reaction, diffusion, organic, contour |
| 7 | Toroidal Flow | toroid, flow, spiral, particle |
| 8 | Glyph Matrix | glyph, matrix, cascade, rain |
| 9 | Penrose Tiling | penrose, tiling, aperiodic, geometric |
| 10 | Gravity Well | gravity, spacetime, distortion, grid |
| 11 | Stained Glass | stained, glass, mosaic, polygon |
| 12 | Neural Mesh | neural, network, mesh, synapse |
| 13 | Chladni Plate | chladni, vibration, nodal, physics |
| 14 | Phyllotaxis Spiral | phyllotaxis, fibonacci, golden, spiral |
| 15 | Topographic Contour | topographic, contour, elevation, map |
| 16 | Radiolaria Skeleton | radiolaria, skeleton, lattice, microscopic |
| 17 | Celtic Knotwork | celtic, knot, weave, interlace |
| 18 | Lissajous Cage | lissajous, cage, 3d, harmonic |
| 19 | Wave Collapse | wave, collapse, tileset, procedural |
| 20 | Sonic Rosette | sonic, rosette, rhodonea, polar, harmonic |

## Architecture

- **Plugin system**: Effects are registered via `register(EffectRegistry, PositionRegistry)` in the plugin entry point
- **Effect pattern**: Each effect is a class pair -- `*Effect` (rendering logic) and `*Config` (JSON-hydratable configuration)
- **Registry**: Effects register as `PRIMARY` category in the global `EffectRegistry`
- **Presets**: Defined in `src/effects/presets.js`, each effect has 3 named presets with different visual intensities
- **Rendering**: Canvas 2D-based rendering pipeline; test renderer in `scripts/testRender.js` uses Sharp for frame output
- **Loop safety**: All effects support deterministic, seamless loop animation
- **Fuzz support**: All effects support accent, blur, and feather post-processing

## Testing

- **Framework**: Jest 29 with Babel (targeting Node 18)
- **Config**: `jest.config.js` (ESM via babel-jest transform)
- **Coverage threshold**: 50% (branches, functions, lines, statements)
- **Run**: `npx jest`
- **Render testing**: `node scripts/testRender.js --all` (validates effect rendering with optional loop validation)

## Keywords

`nft-generation` `visual-effects` `plugin-pack` `generative-art` `graphics-processing`
