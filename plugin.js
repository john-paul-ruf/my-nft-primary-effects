export const name = 'my-nft-primary-effects-plugin-pack';
export const version = '1.0.0';

export async function register(EffectRegistry, PositionRegistry) {
    try {
        const {EffectCategories} = await import('my-nft-gen/src/core/registry/EffectCategories.js');

        const {FractalDendriteEffect} = await import('./src/effects/primaryEffects/FractalDendrite/FractalDendriteEffect.js');
        const {FractalDendriteConfig} = await import('./src/effects/primaryEffects/FractalDendrite/FractalDendriteConfig.js');
        const {PlasmaCurrentEffect} = await import('./src/effects/primaryEffects/PlasmaCurrent/PlasmaCurrentEffect.js');
        const {PlasmaCurrentConfig} = await import('./src/effects/primaryEffects/PlasmaCurrent/PlasmaCurrentConfig.js');
        const {SacredMandalaEffect} = await import('./src/effects/primaryEffects/SacredMandala/SacredMandalaEffect.js');
        const {SacredMandalaConfig} = await import('./src/effects/primaryEffects/SacredMandala/SacredMandalaConfig.js');
        const {VoronoiShatterEffect} = await import('./src/effects/primaryEffects/VoronoiShatter/VoronoiShatterEffect.js');
        const {VoronoiShatterConfig} = await import('./src/effects/primaryEffects/VoronoiShatter/VoronoiShatterConfig.js');
        const {MoireInterferenceEffect} = await import('./src/effects/primaryEffects/MoireInterference/MoireInterferenceEffect.js');
        const {MoireInterferenceConfig} = await import('./src/effects/primaryEffects/MoireInterference/MoireInterferenceConfig.js');
        const {ReactionDiffusionEffect} = await import('./src/effects/primaryEffects/ReactionDiffusion/ReactionDiffusionEffect.js');
        const {ReactionDiffusionConfig} = await import('./src/effects/primaryEffects/ReactionDiffusion/ReactionDiffusionConfig.js');
        const {ToroidalFlowEffect} = await import('./src/effects/primaryEffects/ToroidalFlow/ToroidalFlowEffect.js');
        const {ToroidalFlowConfig} = await import('./src/effects/primaryEffects/ToroidalFlow/ToroidalFlowConfig.js');
        const {GlyphMatrixEffect} = await import('./src/effects/primaryEffects/GlyphMatrix/GlyphMatrixEffect.js');
        const {GlyphMatrixConfig} = await import('./src/effects/primaryEffects/GlyphMatrix/GlyphMatrixConfig.js');
        const {PenroseTilingEffect} = await import('./src/effects/primaryEffects/PenroseTiling/PenroseTilingEffect.js');
        const {PenroseTilingConfig} = await import('./src/effects/primaryEffects/PenroseTiling/PenroseTilingConfig.js');
        const {GravityWellEffect} = await import('./src/effects/primaryEffects/GravityWell/GravityWellEffect.js');
        const {GravityWellConfig} = await import('./src/effects/primaryEffects/GravityWell/GravityWellConfig.js');
        const {StainedGlassEffect} = await import('./src/effects/primaryEffects/StainedGlass/StainedGlassEffect.js');
        const {StainedGlassConfig} = await import('./src/effects/primaryEffects/StainedGlass/StainedGlassConfig.js');
        const {NeuralMeshEffect} = await import('./src/effects/primaryEffects/NeuralMesh/NeuralMeshEffect.js');
        const {NeuralMeshConfig} = await import('./src/effects/primaryEffects/NeuralMesh/NeuralMeshConfig.js');
        const {ChladniPlateEffect} = await import('./src/effects/primaryEffects/ChladniPlate/ChladniPlateEffect.js');
        const {ChladniPlateConfig} = await import('./src/effects/primaryEffects/ChladniPlate/ChladniPlateConfig.js');
        const {PhyllotaxisSpiralEffect} = await import('./src/effects/primaryEffects/PhyllotaxisSpiral/PhyllotaxisSpiralEffect.js');
        const {PhyllotaxisSpiralConfig} = await import('./src/effects/primaryEffects/PhyllotaxisSpiral/PhyllotaxisSpiralConfig.js');
        const {TopographicContourEffect} = await import('./src/effects/primaryEffects/TopographicContour/TopographicContourEffect.js');
        const {TopographicContourConfig} = await import('./src/effects/primaryEffects/TopographicContour/TopographicContourConfig.js');
        const {RadiolariaSkeletonEffect} = await import('./src/effects/primaryEffects/RadiolariaSkeleton/RadiolariaSkeletonEffect.js');
        const {RadiolariaSkeletonConfig} = await import('./src/effects/primaryEffects/RadiolariaSkeleton/RadiolariaSkeletonConfig.js');
        const {CelticKnotworkEffect} = await import('./src/effects/primaryEffects/CelticKnotwork/CelticKnotworkEffect.js');
        const {CelticKnotworkConfig} = await import('./src/effects/primaryEffects/CelticKnotwork/CelticKnotworkConfig.js');
        const {LissajousCageEffect} = await import('./src/effects/primaryEffects/LissajousCage/LissajousCageEffect.js');
        const {LissajousCageConfig} = await import('./src/effects/primaryEffects/LissajousCage/LissajousCageConfig.js');
        const {WaveCollapseEffect} = await import('./src/effects/primaryEffects/WaveCollapse/WaveCollapseEffect.js');
        const {WaveCollapseConfig} = await import('./src/effects/primaryEffects/WaveCollapse/WaveCollapseConfig.js');
        const {SonicRosetteEffect} = await import('./src/effects/primaryEffects/SonicRosette/SonicRosetteEffect.js');
        const {SonicRosetteConfig} = await import('./src/effects/primaryEffects/SonicRosette/SonicRosetteConfig.js');

        const {
            FRACTAL_DENDRITE_PRESETS,
            PLASMA_CURRENT_PRESETS,
            SACRED_MANDALA_PRESETS,
            VORONOI_SHATTER_PRESETS,
            MOIRE_INTERFERENCE_PRESETS,
            REACTION_DIFFUSION_PRESETS,
            TOROIDAL_FLOW_PRESETS,
            GLYPH_MATRIX_PRESETS,
            PENROSE_TILING_PRESETS,
            GRAVITY_WELL_PRESETS,
            STAINED_GLASS_PRESETS,
            NEURAL_MESH_PRESETS,
            CHLADNI_PLATE_PRESETS,
            PHYLLOTAXIS_SPIRAL_PRESETS,
            TOPOGRAPHIC_CONTOUR_PRESETS,
            RADIOLARIA_SKELETON_PRESETS,
            CELTIC_KNOTWORK_PRESETS,
            LISSAJOUS_CAGE_PRESETS,
            WAVE_COLLAPSE_PRESETS,
            SONIC_ROSETTE_PRESETS,
        } = await import('./src/effects/presets.js');

        const effects = [
            {Effect: FractalDendriteEffect, Config: FractalDendriteConfig, presets: FRACTAL_DENDRITE_PRESETS},
            {Effect: PlasmaCurrentEffect, Config: PlasmaCurrentConfig, presets: PLASMA_CURRENT_PRESETS},
            {Effect: SacredMandalaEffect, Config: SacredMandalaConfig, presets: SACRED_MANDALA_PRESETS},
            {Effect: VoronoiShatterEffect, Config: VoronoiShatterConfig, presets: VORONOI_SHATTER_PRESETS},
            {Effect: MoireInterferenceEffect, Config: MoireInterferenceConfig, presets: MOIRE_INTERFERENCE_PRESETS},
            {Effect: ReactionDiffusionEffect, Config: ReactionDiffusionConfig, presets: REACTION_DIFFUSION_PRESETS},
            {Effect: ToroidalFlowEffect, Config: ToroidalFlowConfig, presets: TOROIDAL_FLOW_PRESETS},
            {Effect: GlyphMatrixEffect, Config: GlyphMatrixConfig, presets: GLYPH_MATRIX_PRESETS},
            {Effect: PenroseTilingEffect, Config: PenroseTilingConfig, presets: PENROSE_TILING_PRESETS},
            {Effect: GravityWellEffect, Config: GravityWellConfig, presets: GRAVITY_WELL_PRESETS},
            {Effect: StainedGlassEffect, Config: StainedGlassConfig, presets: STAINED_GLASS_PRESETS},
            {Effect: NeuralMeshEffect, Config: NeuralMeshConfig, presets: NEURAL_MESH_PRESETS},
            {Effect: ChladniPlateEffect, Config: ChladniPlateConfig, presets: CHLADNI_PLATE_PRESETS},
            {Effect: PhyllotaxisSpiralEffect, Config: PhyllotaxisSpiralConfig, presets: PHYLLOTAXIS_SPIRAL_PRESETS},
            {Effect: TopographicContourEffect, Config: TopographicContourConfig, presets: TOPOGRAPHIC_CONTOUR_PRESETS},
            {Effect: RadiolariaSkeletonEffect, Config: RadiolariaSkeletonConfig, presets: RADIOLARIA_SKELETON_PRESETS},
            {Effect: CelticKnotworkEffect, Config: CelticKnotworkConfig, presets: CELTIC_KNOTWORK_PRESETS},
            {Effect: LissajousCageEffect, Config: LissajousCageConfig, presets: LISSAJOUS_CAGE_PRESETS},
            {Effect: WaveCollapseEffect, Config: WaveCollapseConfig, presets: WAVE_COLLAPSE_PRESETS},
            {Effect: SonicRosetteEffect, Config: SonicRosetteConfig, presets: SONIC_ROSETTE_PRESETS},
        ];

        for (const {Effect, Config, presets} of effects) {
            Effect._configClass_ = Config;
            Effect.presets = presets;

            if (EffectRegistry.hasGlobal && EffectRegistry.hasGlobal(Effect._name_)) {
                console.log(`ℹ️ Effect '${Effect._name_}' is already registered, skipping...`);
                continue;
            }

            EffectRegistry.registerGlobal(Effect, EffectCategories.PRIMARY, {
                displayName: Effect._displayName_,
                description: Effect._description_,
                version: Effect._version_,
                author: Effect._author_,
                tags: Effect._tags_,
            });
            console.log(`✅ Registered: ${Effect._name_} as PRIMARY effect`);
        }

        const primaryEffects = EffectRegistry.getByCategoryGlobal(EffectCategories.PRIMARY);
        console.log(`📊 PRIMARY effects after registration:`, Object.keys(primaryEffects));

        return true;
    } catch (error) {
        console.error('❌ [Plugin] Registration failed:', error.message);
        console.error('❌ [Plugin] Stack:', error.stack);
        throw error;
    }
}
