import {EffectConfig} from 'my-nft-gen/src/core/layer/EffectConfig.js';
import {ColorPicker} from 'my-nft-gen/src/core/layer/configType/ColorPicker.js';
import {Position} from 'my-nft-gen/src/core/position/Position.js';
import {Range} from 'my-nft-gen/src/core/layer/configType/Range.js';
import {DynamicRange} from 'my-nft-gen/src/core/layer/configType/DynamicRange.js';
import {PercentageRange} from 'my-nft-gen/src/core/layer/configType/PercentageRange.js';
import {PercentageShortestSide} from 'my-nft-gen/src/core/layer/configType/PercentageShortestSide.js';

export class SacredMandalaConfig extends EffectConfig {
    constructor({
                    invertLayers = true,
                    layerOpacity = 0.7,
                    underLayerOpacity = 0.5,
                    center = new Position({x: 1080 / 2, y: 1920 / 2}),
                    innerColor = new ColorPicker(ColorPicker.SelectionType.colorBucket),
                    outerColor = new ColorPicker(ColorPicker.SelectionType.colorBucket),
                    stroke = 1,
                    thickness = 2,
                    symmetryFold = new Range(6, 12),
                    concentricRings = new Range(4, 8),
                    maxRadius = new PercentageRange(new PercentageShortestSide(0.2), new PercentageShortestSide(0.45)),
                    petalLayers = new Range(2, 4),
                    dotCount = new Range(6, 18),
                    dotRadius = new Range(2, 6),
                    speed = new Range(1, 3),
                    breathFrequency = new Range(1, 3),
                    breathAmplitude = 0.08,
                    useCurvedPetals = false,
                    dashedRings = false,
                    intersectionDots = false,
                    innerRosetteRings = new Range(0, 0),
                    accentRange = new DynamicRange(new Range(1, 2), new Range(3, 7)),
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
        this.symmetryFold = symmetryFold;
        this.concentricRings = concentricRings;
        this.maxRadius = maxRadius;
        this.petalLayers = petalLayers;
        this.dotCount = dotCount;
        this.dotRadius = dotRadius;
        this.speed = speed;
        this.breathFrequency = breathFrequency;
        this.breathAmplitude = breathAmplitude;
        this.useCurvedPetals = useCurvedPetals;
        this.dashedRings = dashedRings;
        this.intersectionDots = intersectionDots;
        this.innerRosetteRings = innerRosetteRings;
        this.accentRange = accentRange;
        this.blurRange = blurRange;
        this.featherTimes = featherTimes;
    }
}
