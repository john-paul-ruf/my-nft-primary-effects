import {EffectConfig} from 'my-nft-gen/src/core/layer/EffectConfig.js';
import {ColorPicker} from 'my-nft-gen/src/core/layer/configType/ColorPicker.js';
import {Position} from 'my-nft-gen/src/core/position/Position.js';
import {Range} from 'my-nft-gen/src/core/layer/configType/Range.js';
import {DynamicRange} from 'my-nft-gen/src/core/layer/configType/DynamicRange.js';
import {PercentageRange} from 'my-nft-gen/src/core/layer/configType/PercentageRange.js';
import {PercentageShortestSide} from 'my-nft-gen/src/core/layer/configType/PercentageShortestSide.js';

export class PhyllotaxisSpiralConfig extends EffectConfig {
    constructor({
                    invertLayers = true,
                    layerOpacity = 0.7,
                    underLayerOpacity = 0.5,
                    center = new Position({x: 1080 / 2, y: 1920 / 2}),
                    innerColor = new ColorPicker(ColorPicker.SelectionType.colorBucket),
                    outerColor = new ColorPicker(ColorPicker.SelectionType.colorBucket),
                    stroke = 1,
                    thickness = 2,
                    spiralRadius = new PercentageRange(new PercentageShortestSide(0.2), new PercentageShortestSide(0.45)),
                    dotCount = new Range(100, 300),
                    dotMinRadius = new Range(1, 3),
                    dotMaxRadius = new Range(4, 10),
                    goldenAngleOffset = new Range(-2, 2),
                    speed = new Range(1, 2),
                    breathFrequency = new Range(1, 3),
                    breathAmplitude = 0.06,
                    dotShape = 'ring',
                    polygonSides = new Range(5, 6),
                    showSpiralArms = false,
                    spiralArmCount = new Range(5, 8),
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
        this.spiralRadius = spiralRadius;
        this.dotCount = dotCount;
        this.dotMinRadius = dotMinRadius;
        this.dotMaxRadius = dotMaxRadius;
        this.goldenAngleOffset = goldenAngleOffset;
        this.speed = speed;
        this.breathFrequency = breathFrequency;
        this.breathAmplitude = breathAmplitude;
        this.dotShape = dotShape;
        this.polygonSides = polygonSides;
        this.showSpiralArms = showSpiralArms;
        this.spiralArmCount = spiralArmCount;
        this.accentRange = accentRange;
        this.blurRange = blurRange;
        this.featherTimes = featherTimes;
    }
}
