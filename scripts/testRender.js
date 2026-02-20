#!/usr/bin/env node

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { Settings, Project } from 'my-nft-gen';
import { LayerConfig } from 'my-nft-gen/src/core/layer/LayerConfig.js';
import { ColorScheme } from 'my-nft-gen/src/core/color/ColorScheme.js';
import { ALL_PRESETS } from '../src/effects/presets.js';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    effect: null,
    preset: null,
    all: false,
    frames: 100,
    width: 1080,
    height: 1920,
    output: null,
    saveFrames: false,
    validateLoop: false,
    loopThreshold: 5,
    verbose: false,
    debug: false,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--effect') options.effect = args[++i];
    else if (arg === '--preset') options.preset = args[++i];
    else if (arg === '--all') options.all = true;
    else if (arg === '--frames') options.frames = parseInt(args[++i], 10);
    else if (arg === '--width') options.width = parseInt(args[++i], 10);
    else if (arg === '--height') options.height = parseInt(args[++i], 10);
    else if (arg === '--output') options.output = args[++i];
    else if (arg === '--save-frames') options.saveFrames = true;
    else if (arg === '--validate-loop') options.validateLoop = true;
    else if (arg === '--loop-threshold') options.loopThreshold = parseFloat(args[++i]);
    else if (arg === '--verbose' || arg === '-v') options.verbose = true;
    else if (arg === '--debug') options.debug = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
  }

  return options;
}

function printHelp() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║          NFT Primary Effects - Unified Test Renderer           ║
╚═══════════════════════════════════════════════════════════════╝

USAGE:
  node scripts/testRender.js --all [options]
  node scripts/testRender.js --effect <name> [options]

REQUIRED (one of):
  --all                        Test ALL registered effects
  --effect <name>              Test a single effect (e.g., fractal-dendrite)

OPTIONS:
  --preset <name>              Use a specific preset (e.g., sparse-sapling). Requires --effect.
                               Use --preset random to pick a random preset.
                               Use --preset list to show available presets for the effect.
  --frames <count>             Frames to render (default: 100)
  --width <px>                 Canvas width (default: 1080)
  --height <px>                Canvas height (default: 1920)
  --output <path>              Output directory for frames
  --save-frames                Save rendered frames to disk
  --validate-loop              Validate loop continuity (compares first vs last frame)
  --loop-threshold <pct>       Max allowed pixel diff % for loop validation (default: 5)
  --verbose, -v                Verbose output
  --debug                      Debug mode with detailed logging
  --help, -h                   Show this help message

EXAMPLES:
  # Test all effects
  node scripts/testRender.js --all

  # Test all effects with fewer frames (faster)
  node scripts/testRender.js --all --frames 10

  # Test a single effect
  node scripts/testRender.js --effect fractal-dendrite

  # Test with a specific preset
  node scripts/testRender.js --effect fractal-dendrite --preset sparse-sapling

  # Test with a random preset
  node scripts/testRender.js --effect fractal-dendrite --preset random

  # List available presets for an effect
  node scripts/testRender.js --effect fractal-dendrite --preset list

  # Test all effects with random presets
  node scripts/testRender.js --all --preset random

  # Save frames to disk
  node scripts/testRender.js --effect fractal-dendrite --save-frames --output ./my-renders
  `);
}

function setupOutputDirectory(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    return dirPath;
  } catch (e) {
    console.warn(`⚠️  Could not create output directory: ${e.message}`);
    return null;
  }
}

async function loadRegistries(options) {
  if (options.debug) console.log('🔍 Loading registries...');

  let EffectRegistry, PositionRegistry;
  try {
    const imported = await import('my-nft-gen');
    EffectRegistry = imported.EffectRegistry;
    PositionRegistry = imported.PositionRegistry;
  } catch (e) {
    console.error('❌ Error: Cannot load my-nft-gen registries');
    console.error('   ' + e.message);
    process.exit(1);
  }

  try {
    const { registerCoreEffects } = await import('my-nft-gen/src/core/registry/CoreEffectsRegistration.js');
    await registerCoreEffects();
  } catch (e) {
    if (options.debug) console.log('⚠️  Core effects registration skipped');
  }

  try {
    const pluginModule = await import(path.join(projectRoot, 'my-nft-primary-effects-plugins.js'));
    await pluginModule.register(EffectRegistry, PositionRegistry);
  } catch (e) {
    console.error('❌ Error: Cannot register plugin effects');
    console.error('   ' + e.message);
    process.exit(1);
  }

  return { EffectRegistry, PositionRegistry };
}

function getAllEffects() {
  return [
    { dir: 'FractalDendrite', effectFile: 'FractalDendriteEffect.js', configFile: 'FractalDendriteConfig.js', effectClass: 'FractalDendriteEffect', configClass: 'FractalDendriteConfig' },
    { dir: 'PlasmaCurrent', effectFile: 'PlasmaCurrentEffect.js', configFile: 'PlasmaCurrentConfig.js', effectClass: 'PlasmaCurrentEffect', configClass: 'PlasmaCurrentConfig' },
    { dir: 'SacredMandala', effectFile: 'SacredMandalaEffect.js', configFile: 'SacredMandalaConfig.js', effectClass: 'SacredMandalaEffect', configClass: 'SacredMandalaConfig' },
    { dir: 'VoronoiShatter', effectFile: 'VoronoiShatterEffect.js', configFile: 'VoronoiShatterConfig.js', effectClass: 'VoronoiShatterEffect', configClass: 'VoronoiShatterConfig' },
    { dir: 'MoireInterference', effectFile: 'MoireInterferenceEffect.js', configFile: 'MoireInterferenceConfig.js', effectClass: 'MoireInterferenceEffect', configClass: 'MoireInterferenceConfig' },
    { dir: 'ReactionDiffusion', effectFile: 'ReactionDiffusionEffect.js', configFile: 'ReactionDiffusionConfig.js', effectClass: 'ReactionDiffusionEffect', configClass: 'ReactionDiffusionConfig' },
    { dir: 'ToroidalFlow', effectFile: 'ToroidalFlowEffect.js', configFile: 'ToroidalFlowConfig.js', effectClass: 'ToroidalFlowEffect', configClass: 'ToroidalFlowConfig' },
    { dir: 'GlyphMatrix', effectFile: 'GlyphMatrixEffect.js', configFile: 'GlyphMatrixConfig.js', effectClass: 'GlyphMatrixEffect', configClass: 'GlyphMatrixConfig' },
    { dir: 'PenroseTiling', effectFile: 'PenroseTilingEffect.js', configFile: 'PenroseTilingConfig.js', effectClass: 'PenroseTilingEffect', configClass: 'PenroseTilingConfig' },
    { dir: 'GravityWell', effectFile: 'GravityWellEffect.js', configFile: 'GravityWellConfig.js', effectClass: 'GravityWellEffect', configClass: 'GravityWellConfig' },
    { dir: 'StainedGlass', effectFile: 'StainedGlassEffect.js', configFile: 'StainedGlassConfig.js', effectClass: 'StainedGlassEffect', configClass: 'StainedGlassConfig' },
    { dir: 'NeuralMesh', effectFile: 'NeuralMeshEffect.js', configFile: 'NeuralMeshConfig.js', effectClass: 'NeuralMeshEffect', configClass: 'NeuralMeshConfig' },
    { dir: 'ChladniPlate', effectFile: 'ChladniPlateEffect.js', configFile: 'ChladniPlateConfig.js', effectClass: 'ChladniPlateEffect', configClass: 'ChladniPlateConfig' },
    { dir: 'PhyllotaxisSpiral', effectFile: 'PhyllotaxisSpiralEffect.js', configFile: 'PhyllotaxisSpiralConfig.js', effectClass: 'PhyllotaxisSpiralEffect', configClass: 'PhyllotaxisSpiralConfig' },
    { dir: 'TopographicContour', effectFile: 'TopographicContourEffect.js', configFile: 'TopographicContourConfig.js', effectClass: 'TopographicContourEffect', configClass: 'TopographicContourConfig' },
    { dir: 'RadiolariaSkeleton', effectFile: 'RadiolariaSkeletonEffect.js', configFile: 'RadiolariaSkeletonConfig.js', effectClass: 'RadiolariaSkeletonEffect', configClass: 'RadiolariaSkeletonConfig' },
    { dir: 'CelticKnotwork', effectFile: 'CelticKnotworkEffect.js', configFile: 'CelticKnotworkConfig.js', effectClass: 'CelticKnotworkEffect', configClass: 'CelticKnotworkConfig' },
    { dir: 'LissajousCage', effectFile: 'LissajousCageEffect.js', configFile: 'LissajousCageConfig.js', effectClass: 'LissajousCageEffect', configClass: 'LissajousCageConfig' },
    { dir: 'WaveCollapse', effectFile: 'WaveCollapseEffect.js', configFile: 'WaveCollapseConfig.js', effectClass: 'WaveCollapseEffect', configClass: 'WaveCollapseConfig' },
    { dir: 'SonicRosette', effectFile: 'SonicRosetteEffect.js', configFile: 'SonicRosetteConfig.js', effectClass: 'SonicRosetteEffect', configClass: 'SonicRosetteConfig' },
  ];
}

async function compareFrames(framePath0, framePathLast) {
  const [raw0, rawLast] = await Promise.all([
    sharp(framePath0).raw().ensureAlpha().toBuffer({ resolveWithObject: true }),
    sharp(framePathLast).raw().ensureAlpha().toBuffer({ resolveWithObject: true }),
  ]);

  const buf0 = raw0.data;
  const bufLast = rawLast.data;
  const pixelCount = buf0.length / 4;
  let totalDiff = 0;

  for (let i = 0; i < buf0.length; i += 4) {
    const dr = Math.abs(buf0[i] - bufLast[i]);
    const dg = Math.abs(buf0[i + 1] - bufLast[i + 1]);
    const db = Math.abs(buf0[i + 2] - bufLast[i + 2]);
    totalDiff += (dr + dg + db) / 3;
  }

  const meanDiff = totalDiff / pixelCount;
  const diffPercent = (meanDiff / 255) * 100;
  return { meanDiff, diffPercent, pixelCount };
}

async function renderEffect({ EffectRegistry, effectEntry, options }) {
  const effectsBase = path.join(projectRoot, 'src', 'effects', 'primaryEffects');
  const effectModule = await import(path.join(effectsBase, effectEntry.dir, effectEntry.effectFile));
  const configModule = await import(path.join(effectsBase, effectEntry.dir, effectEntry.configFile));

  const EffectClass = effectModule[effectEntry.effectClass];
  const ConfigClass = configModule[effectEntry.configClass];
  const effectName = EffectClass._name_;

  const kebab = effectEntry.dir.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  let presetUsed = null;
  let configOverrides = {};

  if (options.preset) {
    const presets = ALL_PRESETS[kebab];
    if (presets && presets.length > 0) {
      let chosen;
      if (options.preset === 'random') {
        chosen = presets[Math.floor(Math.random() * presets.length)];
      } else {
        chosen = presets.find(p => p.name === options.preset);
        if (!chosen) {
          console.log(`\n⚠️  Preset '${options.preset}' not found for ${kebab}. Using random preset.`);
          chosen = presets[Math.floor(Math.random() * presets.length)];
        }
      }
      presetUsed = chosen.name;
      configOverrides = chosen.currentEffectConfig || {};
    }
  }

  const effectConfig = new ConfigClass(configOverrides);

  const outputDir = options.saveFrames
    ? setupOutputDirectory(options.output || path.join(projectRoot, 'output', `render-${effectName}-${Date.now()}`))
    : path.join(projectRoot, 'output');

  if (outputDir && !fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const nftProject = new Project({
    artist: 'test-runner',
    projectName: `test-${effectName}`,
    colorScheme: new ColorScheme({
      colorBucket: ['#FFFF00', '#FF00FF', '#00FFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFFFF', '#FFA500'],
    }),
    neutrals: ['#FFFFFF'],
    backgrounds: ['#000000'],
    lights: ['#FFFF00', '#FF00FF', '#00FFFF', '#FF0000', '#00FF00', '#0000FF'],
    numberOfFrame: options.frames,
    longestSideInPixels: options.width,
    shortestSideInPixels: options.height,
    isHorizontal: false,
    projectDirectory: outputDir,
    renderJumpFrames: 1,
    frameStart: 0,
    pluginPaths: [projectRoot]
  });

  const layerConfig = new LayerConfig({
    effect: EffectClass,
    currentEffectConfig: effectConfig,
    percentChance: 100,
    secondaryEffects: []
  });

  nftProject.addPrimaryEffect({ layerConfig });

  let capturedWorkingDir = null;
  let capturedFinalFileName = null;
  nftProject.on('generationCompleted', (data) => {
    capturedWorkingDir = data.workingDirectory;
    capturedFinalFileName = data.finalFileName;
  });

  const keepFrames = options.saveFrames || options.validateLoop;

  const startTime = performance.now();
  const result = await nftProject.generateRandomLoop(keepFrames);
  const endTime = performance.now();

  const totalDuration = endTime - startTime;
  const successCount = result?.framesGenerated || options.frames;
  const errorCount = result?.framesFailed || 0;
  const failedFrames = result?.failedFrames || [];

  let loopValidation = null;
  if (options.validateLoop && capturedWorkingDir && capturedFinalFileName) {
    const frame0Path = `${capturedWorkingDir}${capturedFinalFileName}-frame-0.png`;
    const lastFrameNum = options.frames - 1;
    const frameLastPath = `${capturedWorkingDir}${capturedFinalFileName}-frame-${lastFrameNum}.png`;

    if (fs.existsSync(frame0Path) && fs.existsSync(frameLastPath)) {
      const comparison = await compareFrames(frame0Path, frameLastPath);
      loopValidation = {
        ...comparison,
        passed: comparison.diffPercent <= options.loopThreshold,
        frame0: frame0Path,
        frameLast: frameLastPath,
      };
    } else {
      loopValidation = { error: 'Frame files not found', passed: false };
    }

    if (!options.saveFrames && capturedWorkingDir) {
      fs.rmSync(capturedWorkingDir, { recursive: true, force: true });
    }
  }

  return { effectName, presetUsed, totalDuration, successCount, errorCount, failedFrames, loopValidation };
}

async function runTest() {
  const options = parseArgs();

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  if (!options.effect && !options.all) {
    console.error('❌ Error: --effect <name> or --all is required');
    console.log('\nRun with --help for usage instructions\n');
    process.exit(1);
  }

  process.env.NFT_PROJECT_ROOT = projectRoot;
  process.env.NFT_WORKER_INITIALIZE_PLUGINS = 'true';
  if (options.debug) {
    process.env.DEBUG_PRELOAD = 'true';
  }

  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║          NFT Primary Effects - Unified Test Renderer          ║
╚═══════════════════════════════════════════════════════════════╝
  `);

  const { EffectRegistry } = await loadRegistries(options);
  console.log('✅ Registries loaded and plugin effects registered\n');

  const allEffects = getAllEffects();

  let effectsToTest;
  if (options.all) {
    effectsToTest = allEffects;
    console.log(`🎨 Testing ALL ${effectsToTest.length} effects (${options.frames} frames each)\n`);
  } else {
    const match = allEffects.find(e => {
      const effectModule = e.effectClass;
      const kebab = e.dir.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
      return kebab === options.effect || e.dir.toLowerCase() === options.effect.toLowerCase();
    });

    if (!match) {
      console.error(`❌ Error: Effect '${options.effect}' not found.`);
      console.log('\nAvailable effects:');
      allEffects.forEach(e => {
        const kebab = e.dir.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
        console.log(`  - ${kebab}`);
      });
      process.exit(1);
    }

    const matchKebab = match.dir.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

    if (options.preset === 'list') {
      const presets = ALL_PRESETS[matchKebab] || [];
      if (presets.length === 0) {
        console.log(`No presets found for ${matchKebab}`);
      } else {
        console.log(`Available presets for ${matchKebab}:`);
        presets.forEach(p => {
          console.log(`  - ${p.name}: ${p.description || p.displayName || ''}`);
        });
      }
      process.exit(0);
    }

    effectsToTest = [match];
    const presetLabel = options.preset ? ` [preset: ${options.preset}]` : '';
    console.log(`🎨 Testing: ${options.effect}${presetLabel} (${options.frames} frames)\n`);
  }

  const results = [];
  let passed = 0;
  let failed = 0;

  for (let i = 0; i < effectsToTest.length; i++) {
    const entry = effectsToTest[i];
    const kebab = entry.dir.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    const label = `[${i + 1}/${effectsToTest.length}] ${kebab}`;

    process.stdout.write(`🔄 ${label}...`);

    try {
      const result = await renderEffect({ EffectRegistry, effectEntry: entry, options });
      results.push({ ...result, status: 'pass' });
      passed++;
      const presetInfo = result.presetUsed ? ` [preset: ${result.presetUsed}]` : '';
      console.log(` ✅${presetInfo} ${result.successCount} frames in ${(result.totalDuration / 1000).toFixed(2)}s (${(result.totalDuration / result.successCount).toFixed(1)}ms/frame)`);

      if (result.errorCount > 0) {
        console.log(`   ⚠️  ${result.errorCount} frame(s) failed`);
        if (options.verbose && result.failedFrames.length > 0) {
          result.failedFrames.slice(0, 3).forEach(f => {
            console.log(`      Frame ${f.frame}: ${f.error}`);
          });
        }
      }

      if (result.loopValidation) {
        const lv = result.loopValidation;
        if (lv.error) {
          console.log(`   🔄 Loop: ⚠️  ${lv.error}`);
        } else if (lv.passed) {
          console.log(`   🔄 Loop: ✅ PASS (diff: ${lv.diffPercent.toFixed(2)}%, threshold: ${options.loopThreshold}%)`);
        } else {
          console.log(`   🔄 Loop: ❌ FAIL (diff: ${lv.diffPercent.toFixed(2)}%, threshold: ${options.loopThreshold}%)`);
        }
      }
    } catch (error) {
      results.push({ effectName: kebab, status: 'fail', error: error.message });
      failed++;
      console.log(` ❌ FAILED: ${error.message}`);
      if (options.verbose) {
        console.log(`   ${error.stack?.split('\n').slice(1, 4).join('\n   ')}`);
      }
    }
  }

  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                    Test Results Summary                       ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  const totalTime = results.reduce((sum, r) => sum + (r.totalDuration || 0), 0);
  console.log(`📊 RESULTS: ${passed} passed, ${failed} failed, ${results.length} total`);
  console.log(`⏱️  Total time: ${(totalTime / 1000).toFixed(2)}s\n`);

  if (failed > 0) {
    console.log('❌ FAILED EFFECTS:');
    results.filter(r => r.status === 'fail').forEach(r => {
      console.log(`   - ${r.effectName}: ${r.error}`);
    });
    console.log('');
  }

  if (passed > 0) {
    console.log('✅ PASSED EFFECTS:');
    results.filter(r => r.status === 'pass').forEach(r => {
      const pInfo = r.presetUsed ? ` [${r.presetUsed}]` : '';
      console.log(`   - ${r.effectName}${pInfo} (${(r.totalDuration / 1000).toFixed(2)}s, ${r.successCount} frames)`);
    });
    console.log('');
  }

  if (options.validateLoop) {
    const loopResults = results.filter(r => r.loopValidation);
    const loopPassed = loopResults.filter(r => r.loopValidation?.passed);
    const loopFailed = loopResults.filter(r => r.loopValidation && !r.loopValidation.passed);

    console.log('🔄 LOOP VALIDATION RESULTS:');
    console.log(`   ${loopPassed.length} passed, ${loopFailed.length} failed (threshold: ${options.loopThreshold}%)\n`);

    if (loopFailed.length > 0) {
      console.log('   ❌ BROKEN LOOPS:');
      loopFailed.forEach(r => {
        const lv = r.loopValidation;
        const detail = lv.error || `diff: ${lv.diffPercent.toFixed(2)}%`;
        console.log(`      - ${r.effectName}: ${detail}`);
      });
      console.log('');
    }

    if (loopPassed.length > 0) {
      console.log('   ✅ PERFECT LOOPS:');
      loopPassed.forEach(r => {
        console.log(`      - ${r.effectName}: diff ${r.loopValidation.diffPercent.toFixed(2)}%`);
      });
      console.log('');
    }
  }

  const loopFailures = options.validateLoop ? results.filter(r => r.loopValidation && !r.loopValidation.passed).length : 0;
  const totalFailures = failed + loopFailures;

  if (totalFailures > 0) {
    console.log(`\n❌ ${failed} render failure(s), ${loopFailures} loop failure(s)!\n`);
    process.exit(1);
  } else {
    console.log(`\n✅ All ${passed} effects passed!\n`);
    process.exit(0);
  }
}

runTest().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
