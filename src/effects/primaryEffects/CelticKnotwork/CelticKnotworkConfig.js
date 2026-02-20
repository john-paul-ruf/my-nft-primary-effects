import {EffectConfig} from 'my-nft-gen/src/core/layer/EffectConfig.js';
import {ColorPicker} from 'my-nft-gen/src/core/layer/configType/ColorPicker.js';
import {Position} from 'my-nft-gen/src/core/position/Position.js';
import {Range} from 'my-nft-gen/src/core/layer/configType/Range.js';
import {DynamicRange} from 'my-nft-gen/src/core/layer/configType/DynamicRange.js';
import {PercentageRange} from 'my-nft-gen/src/core/layer/configType/PercentageRange.js';
import {PercentageShortestSide} from 'my-nft-gen/src/core/layer/configType/PercentageShortestSide.js';

export class CelticKnotworkConfig extends EffectConfig {
    constructor({
                    invertLayers = true,
                    layerOpacity = 0.7,
                    underLayerOpacity = 0.5,
                    center = new Position({x: 1080 / 2, y: 1920 / 2}),
                    innerColor = new ColorPicker(ColorPicker.SelectionType.colorBucket),
                    outerColor = new ColorPicker(ColorPicker.SelectionType.colorBucket),
                    stroke = 1,
                    thickness = 3,
                    knotRadius = new PercentageRange(new PercentageShortestSide(0.15), new PercentageShortestSide(0.35)),
                    lobeCount = new Range(3, 8),
                    bandCount = new Range(2, 5),
                    weaveGap = new Range(4, 10),
                    lobeDepth = new Range(30, 80),
                    speed = new Range(1, 2),
                    pulseFrequency = new Range(1, 3),
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
        this.knotRadius = knotRadius;
        this.lobeCount = lobeCount;
        this.bandCount = bandCount;
        this.weaveGap = weaveGap;
        this.lobeDepth = lobeDepth;
        this.speed = speed;
        this.pulseFrequency = pulseFrequency;
        this.accentRange = accentRange;
        this.blurRange = blurRange;
        this.featherTimes = featherTimes;
    }
}
