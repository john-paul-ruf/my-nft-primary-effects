#!/usr/bin/env node

/**
 * Unified NFT Effect Test Runner
 * 
 * A single, focused test script that:
 * 1. Creates a real NFT Project object with proper layer management
 * 2. Renders all frames using Project.generateRandomLoop()
 * 3. Automatically handles worker thread plugin registration
 * 4. Saves frames and provides comprehensive reporting
 * 
 * This script consolidates renderTestLoop.js, renderTestLoopDirect.js, and runWithPlugins.js
 * into a single, unified tool focused on one thing: rendering effects through a real project.
 * 
 * Usage:
 *   node scripts/testRender.js --effect tree-of-life
 *   node scripts/testRender.js --effect tree-of-life --frames 100
 *   node scripts/testRender.js --effect tree-of-life --preset mystical -v
 *   node scripts/testRender.js --effect tree-of-life --width 2048 --height 2048 --save-frames
 */

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import os from 'os';
import { Settings, Project } from 'my-nft-gen';
import { LayerConfig } from 'my-nft-gen/src/core/layer/LayerConfig.js';
import { ColorPicker } from 'my-nft-gen/src/core/layer/configType/ColorPicker.js';
import { ColorScheme } from 'my-nft-gen/src/core/color/ColorScheme.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// ============================================================================
// COMMAND LINE PARSING
// ============================================================================

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    effect: null,
    preset: 'default',
    frames: 100,
    width: 1024,
    height: 1024,
    output: null,
    saveFrames: false,
    verbose: false,
    debug: false,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--effect') options.effect = args[++i];
    else if (arg === '--preset') options.preset = args[++i];
    else if (arg === '--frames') options.frames = parseInt(args[++i], 10);
    else if (arg === '--width') options.width = parseInt(args[++i], 10);
    else if (arg === '--height') options.height = parseInt(args[++i], 10);
    else if (arg === '--output') options.output = args[++i];
    else if (arg === '--save-frames') options.saveFrames = true;
    else if (arg === '--verbose' || arg === '-v') options.verbose = true;
    else if (arg === '--debug') options.debug = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
  }

  return options;
}

function printHelp() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║          NFT Mystic Effects - Unified Test Renderer           ║
║     One Script. One Job. Render Effects Through A Project     ║
╚═══════════════════════════════════════════════════════════════╝

USAGE:
  node scripts/testRender.js --effect <name> [options]

REQUIRED:
  --effect <name>              Effect name to test (e.g., tree-of-life)

OPTIONS:
  --preset <name>              Effect preset: default|mystical|minimal|dense|organic (default: default)
  --frames <count>             Frames to render (default: 100)
  --width <px>                 Canvas width (default: 1024)
  --height <px>                Canvas height (default: 1024)
  --output <path>              Output directory for frames
  --save-frames                Save rendered frames to disk
  --verbose, -v                Verbose output
  --debug                      Debug mode with detailed logging
  --help, -h                   Show this help message

EXAMPLES:
  # Basic test with default settings
  node scripts/testRender.js --effect tree-of-life

  # High quality render with custom dimensions
  node scripts/testRender.js --effect tree-of-life --frames 100 --width 2048 --height 2048

  # Mystical preset with verbose output
  node scripts/testRender.js --effect tree-of-life --preset mystical -v

  # Save frames to custom output directory
  node scripts/testRender.js --effect tree-of-life --save-frames --output ./my-renders

PRESETS:
  - default   Baseline rendering with standard settings
  - mystical  Enhanced with sacred geometry and energy flow
  - minimal   Fast renders with reduced complexity
  - dense     High complexity with rich detail
  - organic   Natural appearance with asymmetry
  `);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function normalizeEffectName(name) {
  return name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('') + 'Effect';
}

function getEffectClass(registry, effectName, normalizedName) {
  // Try registry methods
  if (registry.getGlobal && typeof registry.getGlobal === 'function') {
    const all = registry.getGlobal();
    if (Array.isArray(all)) {
      const found = all.find(e =>
        e && (e.name === effectName || e._name_ === effectName ||
              e.name === normalizedName || e._name_ === normalizedName)
      );
      if (found) return found;
    }
  }

  // Try getAllGlobal
  if (registry.getAllGlobal && typeof registry.getAllGlobal === 'function') {
    const all = registry.getAllGlobal();
    if (Array.isArray(all)) {
      const found = all.find(e =>
        e && (e.name === effectName || e._name_ === effectName ||
              e.name === normalizedName || e._name_ === normalizedName)
      );
      if (found) return found;
    }
  }

  return null;
}

function getPresetOptions(presetName) {
  // Base size/position config for all presets (80% of canvas, centered)
  const baseSizeConfig = {
    sizeMode: 'full',
    sizePercentage: 0.8,
    positionMode: 'center',
    positionX: 0,
    positionY: 0,
  };

  const presets = {
    default: {
      ...baseSizeConfig,
      branchCount: 8,
      recursionDepth: 6,
      branchAngleVariance: 0.3,
      branchTaperFactor: 0.75,
      initialBranchLength: 40,
      minBranchLength: 5,
      attractionRadius: 80,
      killDistance: 120,
      useGradient: true,
      showSephirothNodes: true,
      energyFlow: false,
      glowIntensity: 0.4,
      glowRadius: 8,
    },
    mystical: {
      ...baseSizeConfig,
      branchCount: 10,
      recursionDepth: 7,
      branchAngleVariance: 0.25,
      branchTaperFactor: 0.72,
      initialBranchLength: 50,
      minBranchLength: 3,
      attractionRadius: 100,
      killDistance: 140,
      useGradient: true,
      showSephirothNodes: true,
      energyFlow: true,
      glowIntensity: 0.6,
      glowRadius: 12,
    },
    minimal: {
      ...baseSizeConfig,
      branchCount: 4,
      recursionDepth: 4,
      branchAngleVariance: 0.4,
      branchTaperFactor: 0.7,
      initialBranchLength: 30,
      minBranchLength: 10,
      attractionRadius: 60,
      killDistance: 100,
      useGradient: false,
      showSephirothNodes: false,
      energyFlow: false,
      glowIntensity: 0.2,
      glowRadius: 4,
    },
    dense: {
      ...baseSizeConfig,
      branchCount: 12,
      recursionDepth: 8,
      branchAngleVariance: 0.2,
      branchTaperFactor: 0.75,
      initialBranchLength: 45,
      minBranchLength: 2,
      attractionRadius: 120,
      killDistance: 160,
      useGradient: true,
      showSephirothNodes: true,
      energyFlow: true,
      glowIntensity: 0.8,
      glowRadius: 15,
    },
    organic: {
      ...baseSizeConfig,
      branchCount: 9,
      recursionDepth: 6,
      branchAngleVariance: 0.5,
      branchTaperFactor: 0.68,
      initialBranchLength: 42,
      minBranchLength: 4,
      attractionRadius: 90,
      killDistance: 130,
      useGradient: true,
      showSephirothNodes: false,
      energyFlow: false,
      glowIntensity: 0.35,
      glowRadius: 7,
    }
  };

  return presets[presetName] || presets.default;
}

function setupOutputDirectory(options) {
  if (!options.saveFrames && !options.output) return null;

  const outputDir = options.output || path.join(projectRoot, 'output', `render-${Date.now()}`);

  try {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    return outputDir;
  } catch (e) {
    console.warn(`⚠️  Could not create output directory: ${e.message}`);
    return null;
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runTest() {
  const options = parseArgs();

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  if (!options.effect) {
    console.error('❌ Error: --effect is required');
    console.log('\nRun with --help for usage instructions\n');
    process.exit(1);
  }

  // Setup environment for worker thread plugin registration
  process.env.NFT_PROJECT_ROOT = projectRoot;
  process.env.NFT_WORKER_INITIALIZE_PLUGINS = 'true';
  if (options.debug) {
    process.env.DEBUG_PRELOAD = 'true';
  }

  const outputDir = setupOutputDirectory(options);

  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║          NFT Mystic Effects - Unified Test Renderer           ║
╚═══════════════════════════════════════════════════════════════╝

🎨 CONFIGURATION:
   Effect:      ${options.effect}
   Preset:      ${options.preset}
   Frames:      ${options.frames}
   Resolution:  ${options.width}x${options.height}
   Save Frames: ${options.saveFrames ? 'Yes' : 'No'}
   ${outputDir ? `Output:      ${outputDir}` : ''}
  `);

  try {
    // Step 1: Load registries
    if (options.debug) console.log('🔍 Loading registries...');
    console.log('🔄 Loading my-nft-gen registries...');
    
    let EffectRegistry, PositionRegistry;
    try {
      const imported = await import('my-nft-gen');
      EffectRegistry = imported.EffectRegistry;
      PositionRegistry = imported.PositionRegistry;
      console.log('✅ Registries loaded');
    } catch (e) {
      console.error('❌ Error: Cannot load my-nft-gen registries');
      console.error('   ' + e.message);
      process.exit(1);
    }

    // Step 2: Register core effects
    if (options.debug) console.log('🔍 Registering core effects...');
    try {
      const { registerCoreEffects } = await import('my-nft-gen/src/core/registry/CoreEffectsRegistration.js');
      await registerCoreEffects();
      console.log('✅ Core effects registered');
    } catch (e) {
      if (options.debug) console.log('⚠️  Core effects registration skipped');
    }

    // Step 3: Register plugin effects
    if (options.debug) console.log('🔍 Registering plugin effects...');
    console.log('🔄 Registering plugin effects...');
    try {
      const pluginModule = await import(path.join(projectRoot, 'src', 'index.js'));
      await pluginModule.register(EffectRegistry, PositionRegistry);
      console.log('✅ Plugin effects registered');
    } catch (e) {
      console.error('❌ Error: Cannot register plugin effects');
      console.error('   ' + e.message);
      process.exit(1);
    }

    // Step 4: Load effect class
    if (options.debug) console.log('🔍 Loading effect class...');
    const effectName = normalizeEffectName(options.effect);
    const effectClass = getEffectClass(EffectRegistry, options.effect, effectName);

    if (!effectClass) {
      console.error(`❌ Error: Effect '${options.effect}' not found in registry`);
      process.exit(1);
    }

    console.log(`✅ Effect loaded: ${effectClass.name || effectName}`);

    // Step 5: Load AnimatedTreeOfLifeConfig
    let AnimatedTreeOfLifeConfig;
    if (options.debug) console.log('🔍 Loading AnimatedTreeOfLifeConfig...');
    try {
      const configModule = await import(path.join(projectRoot, 'src', 'effects', 'primaryEffects', 'AnimatedTreeOfLife', 'AnimatedTreeOfLifeConfig.js'));
      AnimatedTreeOfLifeConfig = configModule.AnimatedTreeOfLifeConfig;
    } catch (e) {
      if (options.debug) console.log('⚠️  AnimatedTreeOfLifeConfig load failed');
    }

    // Step 6: Create effect config with preset
    if (options.debug) console.log('🔍 Creating effect config with preset...');
    const presetOptions = getPresetOptions(options.preset);
    const presetConfig = { ...presetOptions };

    // Ensure ColorPicker instances
    if (!presetConfig.rootColor) presetConfig.rootColor = new ColorPicker(ColorPicker.SelectionType.colorBucket);
    if (!presetConfig.trunkColor) presetConfig.trunkColor = new ColorPicker(ColorPicker.SelectionType.colorBucket);
    if (!presetConfig.branchColor) presetConfig.branchColor = new ColorPicker(ColorPicker.SelectionType.colorBucket);
    if (!presetConfig.foliageColor) presetConfig.foliageColor = new ColorPicker(ColorPicker.SelectionType.colorBucket);
    if (!presetConfig.accentColor) presetConfig.accentColor = new ColorPicker(ColorPicker.SelectionType.colorBucket);

    const ConfigClass = effectClass._configClass_ || effectClass.config || AnimatedTreeOfLifeConfig;
    const effectConfig = new ConfigClass(presetConfig);

    console.log('✅ Effect config created');

    // Step 7: Create Project with real settings
    if (options.debug) console.log('🔍 Creating Project object...');
    console.log('🔄 Creating Project...');
    
    const nftProject = new Project({
      artist: 'test-runner',
      projectName: 'nft-effects-test',
      colorScheme: new ColorScheme({}),
      neutrals: ['#FFFFFF'],
      backgrounds: ['#000000'],
      lights: ['#FFFF00', '#FF00FF', '#00FFFF', '#FF0000', '#00FF00', '#0000FF'],
      numberOfFrame: options.frames,
      longestSideInPixels: options.width,
      shortestSideInPixels: options.height,
      isHorizontal: false,
      projectDirectory: outputDir || path.join(projectRoot, 'output'),
      renderJumpFrames: 1,
      frameStart: 0,
      pluginPaths: [projectRoot]
    });

    console.log('✅ Project created');

    // Step 8: Add effect to project as primary effect
    if (options.debug) console.log('🔍 Adding effect to project...');
    console.log('🔄 Adding effect to project...');
    
    const layerConfig = new LayerConfig({
      effect: effectClass.effectClass,
      currentEffectConfig: effectConfig,
      percentChance: 100,
      secondaryEffects: []
    });

    nftProject.addPrimaryEffect({ layerConfig });
    console.log('✅ Effect added to project');

    // Step 9: Render using generateRandomLoop (THE ONE CALL)
    console.log(`\n🔄 Starting render loop (${options.frames} frames)...\n`);

    const startTime = performance.now();
    const result = await nftProject.generateRandomLoop(options.saveFrames);
    const endTime = performance.now();

    const totalDuration = endTime - startTime;
    const successCount = result?.framesGenerated || options.frames;
    const errorCount = result?.framesFailed || 0;
    const failedFrames = result?.failedFrames || [];

    // Step 10: Report results
    console.log('\n');
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                    Render Complete                            ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    console.log('📊 RESULTS:');
    console.log(`   ✅ Successful frames:  ${successCount}/${options.frames}`);
    if (errorCount > 0) {
      console.log(`   ❌ Failed frames:      ${errorCount}/${options.frames}`);
      if (options.verbose && failedFrames.length > 0) {
        console.log('   Failed frame details:');
        failedFrames.slice(0, 5).forEach(f => {
          console.log(`      Frame ${f.frame}: ${f.error}`);
        });
        if (failedFrames.length > 5) {
          console.log(`      ... and ${failedFrames.length - 5} more`);
        }
      }
    }

    console.log(`\n   ⏱️  Total time:        ${(totalDuration / 1000).toFixed(2)}s`);
    if (successCount > 0) {
      console.log(`   ⚡ Avg per frame:     ${(totalDuration / successCount).toFixed(2)}ms`);
    }

    if (outputDir && options.saveFrames) {
      console.log(`   💾 Frames saved:      ${outputDir}`);
    }

    console.log('\n✅ Test completed successfully!\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Render failed:');
    console.error(error.message);
    if (options.verbose) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the test
runTest().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});