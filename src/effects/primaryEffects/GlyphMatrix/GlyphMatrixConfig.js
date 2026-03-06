import {EffectConfig} from 'my-nft-gen/src/core/layer/EffectConfig.js';
import {ColorPicker} from 'my-nft-gen/src/core/layer/configType/ColorPicker.js';
import {Position} from 'my-nft-gen/src/core/position/Position.js';
import {Range} from 'my-nft-gen/src/core/layer/configType/Range.js';
import {DynamicRange} from 'my-nft-gen/src/core/layer/configType/DynamicRange.js';
import {PercentageRange} from 'my-nft-gen/src/core/layer/configType/PercentageRange.js';
import {PercentageShortestSide} from 'my-nft-gen/src/core/layer/configType/PercentageShortestSide.js';

export class GlyphMatrixConfig extends EffectConfig {
    constructor({
                    invertLayers = true,
                    layerOpacity = 0.8,
                    underLayerOpacity = 0.5,
                    center = new Position({x: 1080 / 2, y: 1920 / 2}),
                    innerColor = new ColorPicker(ColorPicker.SelectionType.colorBucket),
                    outerColor = new ColorPicker(ColorPicker.SelectionType.colorBucket),
                    stroke = 1,
                    thickness = 1.5,
                    fieldWidth = new PercentageRange(new PercentageShortestSide(0.3), new PercentageShortestSide(0.5)),
                    fieldHeight = new PercentageRange(new PercentageShortestSide(0.4), new PercentageShortestSide(0.8)),
                    columnCount = new Range(8, 20),
                    glyphSize = new Range(10, 20),
                    cascadeSpeed = new Range(1, 3),
                    glyphSegments = new Range(3, 6),
                    trailLength = new Range(4, 10),
                    glyphCurveChance = 0,
                    glyphArcChance = 0,
                    glyphDotChance = 0,
                    accentRange = new DynamicRange(new Range(1, 2), new Range(3, 6)),
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
        this.fieldWidth = fieldWidth;
        this.fieldHeight = fieldHeight;
        this.columnCount = columnCount;
        this.glyphSize = glyphSize;
        this.cascadeSpeed = cascadeSpeed;
        this.glyphSegments = glyphSegments;
        this.trailLength = trailLength;
        this.glyphCurveChance = glyphCurveChance;
        this.glyphArcChance = glyphArcChance;
        this.glyphDotChance = glyphDotChance;
        this.accentRange = accentRange;
        this.blurRange = blurRange;
        this.featherTimes = featherTimes;
    }
}
