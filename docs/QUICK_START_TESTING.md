# Quick Start: Testing with Worker Thread Support

## TL;DR - Just Run This

```bash
# Test with 10 frames (fast, Project API with proper worker thread support)
node scripts/runWithPlugins.js --effect tree-of-life --frames 10

# Full test with 100 frames
node scripts/runWithPlugins.js --effect tree-of-life --frames 100

# High quality with verbose output
node scripts/runWithPlugins.js --effect tree-of-life --frames 100 --verbose
```

---

## Three Ways to Test

### 1. ⭐ **Recommended: Project API with Worker Thread Support**
```bash
node scripts/runWithPlugins.js --effect tree-of-life --frames 10 -v
```
- ✅ Uses my-nft-gen's Project API (sophisticated layer composition)
- ✅ Worker threads work correctly (plugin registry issue SOLVED)
- ✅ Fast parallel rendering
- ✅ Production-ready

### 2. **Manual Environment Setup** (Advanced)
```bash
NODE_OPTIONS="--require ./scripts/nftPluginPreload.cjs" \
  node scripts/renderTestLoop.js --effect tree-of-life --frames 10
```
- Same as above, but manual environment setup
- Use this if you need to understand how it works
- Otherwise use method 1

### 3. **Direct Rendering** (Debugging/Workaround)
```bash
node scripts/renderTestLoopDirect.js --effect tree-of-life --frames 10 -v
```
- ⚠️ No worker threads (simpler, but slower)
- ✅ Good for debugging
- ✅ Works without special setup

---

## Common Test Scenarios

### Quick Smoke Test (10 frames, fast)
```bash
node scripts/runWithPlugins.js --effect tree-of-life --frames 10
```

### Full Render (100 frames, production quality)
```bash
node scripts/runWithPlugins.js --effect tree-of-life --frames 100 --quality high
```

### High Resolution (2K, detailed)
```bash
node scripts/runWithPlugins.js --effect tree-of-life --frames 50 --width 2048 --height 2048
```

### Save Frames to Output Directory
```bash
node scripts/runWithPlugins.js --effect tree-of-life --frames 100 \
  --save-frames --output ./output --frame-interval 5
```

### Custom Seed (for reproducible results)
```bash
node scripts/runWithPlugins.js --effect tree-of-life --frames 100 --seed 12345
```

### With Preset
```bash
node scripts/runWithPlugins.js --effect tree-of-life --frames 100 --preset mystical
```

### Verbose Debugging
```bash
node scripts/runWithPlugins.js --effect tree-of-life --frames 10 --verbose --debug
```

---

## What Success Looks Like

```
╔═══════════════════════════════════════════════════════════════╗
║   NFT Plugin-Aware Test Runner Launcher                       ║
║   Sets up environment for worker thread plugin registration   ║
╚═══════════════════════════════════════════════════════════════╝

📋 Environment setup:
   Project root:           /Users/you/project
   Plugin preload:         /Users/you/project/scripts/nftPluginPreload.cjs
   NODE_OPTIONS:           --require /Users/you/project/scripts/nftPluginPreload.cjs

🔄 Spawning renderTestLoop with args: --effect tree-of-life --frames 10

[Plugin registered in main thread]
[Plugin registered in worker threads]

✅ Frame 1 rendered successfully
✅ Frame 2 rendered successfully
...
✅ All 10 frames rendered successfully!
```

**Key signs it's working:**
- No "Effect not found in registry" errors ✅
- Frames render with visible tree content ✅
- No worker thread fatal errors ✅
- Output shows "Successful frames: 10/10" ✅

---

## Troubleshooting

### "Effect 'tree-of-life' not found in registry"
```bash
# Make sure you're using the wrapper script
node scripts/runWithPlugins.js --effect tree-of-life --frames 10
# NOT
node scripts/renderTestLoop.js --effect tree-of-life --frames 10
```

### Node version issues
```bash
# Check your Node version (needs ES modules support)
node --version  # Should be v14+ (v16+ recommended)
```

### No output / No files generated
```bash
# Run with debug output to see what's happening
node scripts/runWithPlugins.js --effect tree-of-life --frames 10 --debug -v
```

### Worker thread crashes
```bash
# Use direct rendering to confirm the effect works
node scripts/renderTestLoopDirect.js --effect tree-of-life --frames 10 -v
```

---

## Performance Expectations

| Scenario | Time Per Frame | Total for 100 |
|----------|---|---|
| Small (1024x1024) | 100-300ms | 10-30s |
| Medium (1920x1920) | 300-800ms | 30-80s |
| Large (2048x2048) | 500-1500ms | 50-150s |

*(Actual times depend on CPU, tree complexity, and system load)*

---

## Next Steps

1. **Start with Quick Smoke Test**: `node scripts/runWithPlugins.js --effect tree-of-life --frames 10`
2. **Check rendered output**: Look for PNG files in output directory
3. **Review performance**: Check timing in the console output
4. **Customize parameters**: Try different presets, dimensions, seeds
5. **Save results**: Use `--save-frames --output ./my-renders`

For more details, see:
- `WORKER_THREADS_GUIDE.md` - Technical deep dive
- `.zencoder/rules/repo.md` - Architecture & troubleshooting
- `docs/TEST_RUNNER_GUIDE.md` - Advanced options

Happy rendering! 🌳✨