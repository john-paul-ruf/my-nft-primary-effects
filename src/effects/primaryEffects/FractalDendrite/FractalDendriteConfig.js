import {EffectConfig} from 'my-nft-gen/src/core/layer/EffectConfig.js';
import {ColorPicker} from 'my-nft-gen/src/core/layer/configType/ColorPicker.js';
import {Position} from 'my-nft-gen/src/core/position/Position.js';
import {Range} from 'my-nft-gen/src/core/layer/configType/Range.js';
import {DynamicRange} from 'my-nft-gen/src/core/layer/configType/DynamicRange.js';
import {PercentageRange} from 'my-nft-gen/src/core/layer/configType/PercentageRange.js';
import {PercentageShortestSide} from 'my-nft-gen/src/core/layer/configType/PercentageShortestSide.js';

export class FractalDendriteConfig extends EffectConfig {
    constructor({
                    invertLayers = true,
                    layerOpacity = 0.7,
                    underLayerOpacity = 0.5,
                    center = new Position({x: 1080 / 2, y: 1920 / 2}),
                    innerColor = new ColorPicker(ColorPicker.SelectionType.colorBucket),
                    outerColor = new ColorPicker(ColorPicker.SelectionType.colorBucket),
                    stroke = 1,
                    thickness = 2,
                    maxDepth = new Range(6, 10),
                    branchCount = new Range(2, 4),
                    trunkLength = new PercentageRange(new PercentageShortestSide(0.15), new PercentageShortestSide(0.25)),
                    branchShrink = 0.68,
                    branchAngleSpread = new Range(20, 45),
                    speed = new Range(1, 2),
                    growthOscillation = new Range(1, 3),
                    accentRange = new DynamicRange(new Range(1, 2), new Range(4, 8)),
                    blurRange = new DynamicRange(new Range(1, 2), new Range(3, 6)),
                    featherTimes = new Range(2, 6),
                } = {}) {
        super();
        this.invertLayers = invertLayers;
        this.layerOpacity = layerOpacity;
        this.underLayerOpacity = underLayerOpacity;
        this.center = center;
        this.innerColor = innerColor;
        this.outerColor = outerColor;
        this.stroke = stroke;
        this.thickness = thickness;
        this.maxDepth = maxDepth;
        this.branchCount = branchCount;
        this.trunkLength = trunkLength;
        this.branchShrink = branchShrink;
        this.branchAngleSpread = branchAngleSpread;
        this.speed = speed;
        this.growthOscillation = growthOscillation;
        this.accentRange = accentRange;
        this.blurRange = blurRange;
        this.featherTimes = featherTimes;
    }
}
