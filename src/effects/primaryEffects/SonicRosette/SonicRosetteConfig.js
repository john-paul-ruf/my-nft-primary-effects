import {EffectConfig} from 'my-nft-gen/src/core/layer/EffectConfig.js';
import {ColorPicker} from 'my-nft-gen/src/core/layer/configType/ColorPicker.js';
import {Position} from 'my-nft-gen/src/core/position/Position.js';
import {Range} from 'my-nft-gen/src/core/layer/configType/Range.js';
import {DynamicRange} from 'my-nft-gen/src/core/layer/configType/DynamicRange.js';
import {PercentageRange} from 'my-nft-gen/src/core/layer/configType/PercentageRange.js';
import {PercentageShortestSide} from 'my-nft-gen/src/core/layer/configType/PercentageShortestSide.js';

export class SonicRosetteConfig extends EffectConfig {
    constructor({
                    invertLayers = true,
                    layerOpacity = 0.7,
                    underLayerOpacity = 0.5,
                    center = new Position({x: 1080 / 2, y: 1920 / 2}),
                    innerColor = new ColorPicker(ColorPicker.SelectionType.colorBucket),
                    outerColor = new ColorPicker(ColorPicker.SelectionType.colorBucket),
                    stroke = 1,
                    thickness = 1.5,
                    amplitude = new PercentageRange(new PercentageShortestSide(0.12), new PercentageShortestSide(0.35)),
                    petalNumerator = new Range(2, 9),
                    petalDenominator = new Range(1, 5),
                    layerCount = new Range(2, 5),
                    resolution = new Range(400, 800),
                    harmonicDepth = new Range(1, 3),
                    harmonicAmplitude = new Range(5, 25),
                    speed = new Range(1, 2),
                    breathFrequency = new Range(1, 3),
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
        this.amplitude = amplitude;
        this.petalNumerator = petalNumerator;
        this.petalDenominator = petalDenominator;
        this.layerCount = layerCount;
        this.resolution = resolution;
        this.harmonicDepth = harmonicDepth;
        this.harmonicAmplitude = harmonicAmplitude;
        this.speed = speed;
        this.breathFrequency = breathFrequency;
        this.accentRange = accentRange;
        this.blurRange = blurRange;
        this.featherTimes = featherTimes;
    }
}
