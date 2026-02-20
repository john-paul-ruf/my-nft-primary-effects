import {LayerEffect} from 'my-nft-gen/src/core/layer/LayerEffect.js';
import {Canvas2dFactory} from 'my-nft-gen/src/core/factory/canvas/Canvas2dFactory.js';
import {getRandomIntInclusive, randomNumber} from 'my-nft-gen/src/core/math/random.js';
import {findValue} from 'my-nft-gen/src/core/math/findValue.js';
import {findOneWayValue} from 'my-nft-gen/src/core/math/findOneWayValue.js';
import {Settings} from 'my-nft-gen/src/core/Settings.js';
import {GlyphMatrixConfig} from './GlyphMatrixConfig.js';

export class GlyphMatrixEffect extends LayerEffect {
    static _name_ = 'glyph-matrix';
    static _displayName_ = 'Glyph Matrix';
    static _description_ = 'Cascading columns of procedurally generated glyphs with fade trails and fuzz';
    static _version_ = '1.0.0';
    static _author_ = 'Zencoder';
    static _tags_ = ['effect', 'primary', 'glyph', 'matrix', 'cascade', 'rain', 'animated'];

    constructor({
                    name = GlyphMatrixEffect._name_,
                    requiresLayer = true,
                    config = new GlyphMatrixConfig({}),
                    additionalEffects = [],
                    ignoreAdditionalEffects = false,
                    settings = new Settings({}),
                } = {}) {
        super({name, requiresLayer, config, additionalEffects, ignoreAdditionalEffects, settings});
        this.#generate(settings);
    }

    #generate(settings) {
        const width = this.finalSize?.width || 1080;
        const height = this.finalSize?.height || 1920;

        const fieldWidth = getRandomIntInclusive(this.config.fieldWidth.lower(this.finalSize), this.config.fieldWidth.upper(this.finalSize));
        const fieldHeight = getRandomIntInclusive(this.config.fieldHeight.lower(this.finalSize), this.config.fieldHeight.upper(this.finalSize));
        const columnCount = getRandomIntInclusive(this.config.columnCount.lower, this.config.columnCount.upper);
        const glyphSize = getRandomIntInclusive(this.config.glyphSize.lower, this.config.glyphSize.upper);
        const trailLength = getRandomIntInclusive(this.config.trailLength.lower, this.config.trailLength.upper);

        const rowCount = Math.floor(fieldHeight / glyphSize);
        const columns = [];

        for (let c = 0; c < columnCount; c++) {
            const glyphs = [];
            const glyphsInColumn = rowCount + trailLength;

            for (let g = 0; g < glyphsInColumn; g++) {
                const segments = getRandomIntInclusive(this.config.glyphSegments.lower, this.config.glyphSegments.upper);
                const glyphParts = [];
                for (let s = 0; s < segments; s++) {
                    glyphParts.push({
                        x1: randomNumber(-0.4, 0.4),
                        y1: randomNumber(-0.4, 0.4),
                        x2: randomNumber(-0.4, 0.4),
                        y2: randomNumber(-0.4, 0.4),
                    });
                }
                glyphs.push({parts: glyphParts});
            }

            columns.push({
                glyphs,
                cascadeOffset: randomNumber(0, 1),
                cascadeSpeedFactor: 0.7 + randomNumber(0, 0.6),
            });
        }

        this.data = {
            width,
            height,
            center: this.config.center,
            invertLayers: this.config.invertLayers,
            layerOpacity: this.config.layerOpacity,
            underLayerOpacity: this.config.underLayerOpacity,
            stroke: this.config.stroke,
            thickness: this.config.thickness,
            innerColor: this.config.innerColor.getColor(settings),
            outerColor: this.config.outerColor.getColor(settings),
            fieldWidth,
            fieldHeight,
            columnCount,
            glyphSize,
            rowCount,
            trailLength,
            columns,
            cascadeSpeed: getRandomIntInclusive(this.config.cascadeSpeed.lower, this.config.cascadeSpeed.upper),
            accentRange: {
                lower: getRandomIntInclusive(this.config.accentRange.bottom.lower, this.config.accentRange.bottom.upper),
                upper: getRandomIntInclusive(this.config.accentRange.top.lower, this.config.accentRange.top.upper),
            },
            blurRange: {
                lower: getRandomIntInclusive(this.config.blurRange.bottom.lower, this.config.blurRange.bottom.upper),
                upper: getRandomIntInclusive(this.config.blurRange.top.lower, this.config.blurRange.top.upper),
            },
            featherTimes: getRandomIntInclusive(this.config.featherTimes.lower, this.config.featherTimes.upper),
        };
    }

    async #drawGlyphLayer(canvas, centerPos, currentFrame, numberOfFrames, isUnderlay, theAccentGaston) {
        const color = isUnderlay ? this.data.outerColor : this.data.innerColor;
        const lineWidth = isUnderlay ? this.data.thickness + theAccentGaston : this.data.thickness;

        const cascadeProgress = findOneWayValue(0, this.data.cascadeSpeed, 1, numberOfFrames, currentFrame, false);
        const startX = centerPos.x - this.data.fieldWidth / 2;
        const startY = centerPos.y - this.data.fieldHeight / 2;
        const colSpacing = this.data.fieldWidth / this.data.columnCount;

        for (let c = 0; c < this.data.columns.length; c++) {
            const col = this.data.columns[c];
            const colX = startX + c * colSpacing + colSpacing / 2;

            const headPos = ((cascadeProgress * col.cascadeSpeedFactor + col.cascadeOffset) % 1) * (this.data.rowCount + this.data.trailLength);

            for (let r = 0; r < this.data.rowCount; r++) {
                const distFromHead = headPos - r;
                if (distFromHead < 0 || distFromHead > this.data.trailLength) continue;

                const fadeFactor = 1 - (distFromHead / this.data.trailLength);
                if (fadeFactor <= 0) continue;

                const glyphIdx = r % col.glyphs.length;
                const glyph = col.glyphs[glyphIdx];
                const cellX = colX;
                const cellY = startY + r * this.data.glyphSize + this.data.glyphSize / 2;

                const scale = this.data.glyphSize * 0.9;
                const glyphThickness = lineWidth * fadeFactor;

                for (const part of glyph.parts) {
                    const sx = cellX + part.x1 * scale;
                    const sy = cellY + part.y1 * scale;
                    const ex = cellX + part.x2 * scale;
                    const ey = cellY + part.y2 * scale;

                    await canvas.drawLine2d(
                        {x: sx, y: sy},
                        {x: ex, y: ey},
                        glyphThickness,
                        color,
                        isUnderlay ? theAccentGaston * fadeFactor * 0.3 : 0,
                        color
                    );
                }
            }
        }
    }

    async invoke(layer, currentFrame, numberOfFrames) {
        const centerPos = this.data.center.getPosition(currentFrame, numberOfFrames);
        const theAccentGaston = findValue(this.data.accentRange.lower, this.data.accentRange.upper, this.data.featherTimes, numberOfFrames, currentFrame);
        const theBlurGaston = Math.ceil(findValue(this.data.blurRange.lower, this.data.blurRange.upper, this.data.featherTimes, numberOfFrames, currentFrame));

        const topCanvas = await Canvas2dFactory.getNewCanvas(this.data.width, this.data.height);
        const bottomCanvas = await Canvas2dFactory.getNewCanvas(this.data.width, this.data.height);

        await this.#drawGlyphLayer(topCanvas, centerPos, currentFrame, numberOfFrames, false, 0);
        await this.#drawGlyphLayer(bottomCanvas, centerPos, currentFrame, numberOfFrames, true, theAccentGaston);

        const topLayer = await topCanvas.convertToLayer();
        const bottomLayer = await bottomCanvas.convertToLayer();

        await bottomLayer.blur(theBlurGaston);
        await bottomLayer.adjustLayerOpacity(this.data.underLayerOpacity);
        await topLayer.adjustLayerOpacity(this.data.layerOpacity);

        if (!this.data.invertLayers) {
            await layer.compositeLayerOver(bottomLayer);
            await layer.compositeLayerOver(topLayer);
        } else {
            await layer.compositeLayerOver(topLayer);
            await layer.compositeLayerOver(bottomLayer);
        }

        await super.invoke(layer, currentFrame, numberOfFrames);
    }

    getInfo() {
        return `${GlyphMatrixEffect._displayName_}: columns=${this.data.columnCount}, rows=${this.data.rowCount}`;
    }
}
