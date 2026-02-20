import {EffectConfig} from 'my-nft-gen/src/core/layer/EffectConfig.js';
import {ColorPicker} from 'my-nft-gen/src/core/layer/configType/ColorPicker.js';
import {Position} from 'my-nft-gen/src/core/position/Position.js';
import {Range} from 'my-nft-gen/src/core/layer/configType/Range.js';
import {DynamicRange} from 'my-nft-gen/src/core/layer/configType/DynamicRange.js';
import {PercentageRange} from 'my-nft-gen/src/core/layer/configType/PercentageRange.js';
import {PercentageShortestSide} from 'my-nft-gen/src/core/layer/configType/PercentageShortestSide.js';

export class PlasmaCurrentConfig extends EffectConfig {
    constructor({
                    invertLayers = true,
                    layerOpacity = 0.8,
                    underLayerOpacity = 0.6,
                    center = new Position({x: 1080 / 2, y: 1920 / 2}),
                    innerColor = new ColorPicker(ColorPicker.SelectionType.colorBucket),
                    outerColor = new ColorPicker(ColorPicker.SelectionType.colorBucket),
                    stroke = 1,
                    thickness = 2,
                    numberOfArcs = new Range(4, 8),
                    arcRadius = new PercentageRange(new PercentageShortestSide(0.15), new PercentageShortestSide(0.40)),
                    forkDepth = new Range(2, 5),
                    forkAngleSpread = new Range(15, 40),
                    segmentsPerArc = new Range(8, 16),
                    jaggedness = new Range(5, 20),
                    speed = new Range(1, 3),
                    pulseFrequency = new Range(2, 6),
                    accentRange = new DynamicRange(new Range(2, 4), new Range(6, 12)),
                    blurRange = new DynamicRange(new Range(2, 4), new Range(5, 10)),
                    featherTimes = new Range(2, 8),
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
        this.numberOfArcs = numberOfArcs;
        this.arcRadius = arcRadius;
        this.forkDepth = forkDepth;
        this.forkAngleSpread = forkAngleSpread;
        this.segmentsPerArc = segmentsPerArc;
        this.jaggedness = jaggedness;
        this.speed = speed;
        this.pulseFrequency = pulseFrequency;
        this.accentRange = accentRange;
        this.blurRange = blurRange;
        this.featherTimes = featherTimes;
    }
}
