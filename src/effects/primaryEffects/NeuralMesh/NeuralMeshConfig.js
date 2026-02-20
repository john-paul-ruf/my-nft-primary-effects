import {EffectConfig} from 'my-nft-gen/src/core/layer/EffectConfig.js';
import {ColorPicker} from 'my-nft-gen/src/core/layer/configType/ColorPicker.js';
import {Position} from 'my-nft-gen/src/core/position/Position.js';
import {Range} from 'my-nft-gen/src/core/layer/configType/Range.js';
import {DynamicRange} from 'my-nft-gen/src/core/layer/configType/DynamicRange.js';
import {PercentageRange} from 'my-nft-gen/src/core/layer/configType/PercentageRange.js';
import {PercentageShortestSide} from 'my-nft-gen/src/core/layer/configType/PercentageShortestSide.js';

export class NeuralMeshConfig extends EffectConfig {
    constructor({
                    invertLayers = true,
                    layerOpacity = 0.7,
                    underLayerOpacity = 0.5,
                    center = new Position({x: 1080 / 2, y: 1920 / 2}),
                    innerColor = new ColorPicker(ColorPicker.SelectionType.colorBucket),
                    outerColor = new ColorPicker(ColorPicker.SelectionType.colorBucket),
                    stroke = 1,
                    thickness = 1.5,
                    fieldRadius = new PercentageRange(new PercentageShortestSide(0.2), new PercentageShortestSide(0.45)),
                    neuronCount = new Range(20, 50),
                    neuronRadius = new Range(3, 8),
                    connectionMaxDist = new Range(60, 140),
                    maxConnections = new Range(3, 6),
                    pulseFrequency = new Range(2, 6),
                    speed = new Range(1, 2),
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
        this.fieldRadius = fieldRadius;
        this.neuronCount = neuronCount;
        this.neuronRadius = neuronRadius;
        this.connectionMaxDist = connectionMaxDist;
        this.maxConnections = maxConnections;
        this.pulseFrequency = pulseFrequency;
        this.speed = speed;
        this.accentRange = accentRange;
        this.blurRange = blurRange;
        this.featherTimes = featherTimes;
    }
}
