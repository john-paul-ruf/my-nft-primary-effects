import {LayerEffect} from 'my-nft-gen/src/core/layer/LayerEffect.js';
import {Canvas2dFactory} from 'my-nft-gen/src/core/factory/canvas/Canvas2dFactory.js';
import {getRandomIntInclusive, randomNumber} from 'my-nft-gen/src/core/math/random.js';
import {findValue} from 'my-nft-gen/src/core/math/findValue.js';

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
                    const part = {
                        x1: randomNumber(-0.4, 0.4),
                        y1: randomNumber(-0.4, 0.4),
                        x2: randomNumber(-0.4, 0.4),
                        y2: randomNumber(-0.4, 0.4),
                        isCurve: randomNumber(0, 1) < this.config.glyphCurveChance,
                        ctrlX: randomNumber(-0.3, 0.3),
                        ctrlY: randomNumber(-0.3, 0.3),
                    };
                    glyphParts.push(part);
                }

                const hasArc = randomNumber(0, 1) < this.config.glyphArcChance;
                const hasDot = randomNumber(0, 1) < this.config.glyphDotChance;
                const arcData = hasArc ? {
                    cx: randomNumber(-0.2, 0.2),
                    cy: randomNumber(-0.2, 0.2),
                    r: randomNumber(0.1, 0.3),
                    startAngle: randomNumber(0, 180),
                    endAngle: randomNumber(180, 360),
                } : null;
                const dotData = hasDot ? {
                    dx: randomNumber(-0.3, 0.3),
                    dy: randomNumber(-0.3, 0.3),
                    dr: randomNumber(0.05, 0.12),
                } : null;
                glyphs.push({
                    parts: glyphParts,
                    arcData,
                    dotData,
                    wobblePhase: randomNumber(0, Math.PI * 2),
                    wobbleAmp: randomNumber(0.05, 0.15),
                    scalePhase: randomNumber(0, Math.PI * 2),
                    rotationPhase: randomNumber(0, Math.PI * 2),
                    rotationAmp: randomNumber(5, 25),
                });
            }

            columns.push({
                glyphs,
                cascadeOffset: randomNumber(0, 1),
                cascadeSpeedFactor: getRandomIntInclusive(1, 3),
                swayPhase: randomNumber(0, Math.PI * 2),
                swayAmp: randomNumber(3, 15),
                swayFreq: randomNumber(1, 3),
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
            glyphCurveChance: this.config.glyphCurveChance,
            glyphArcChance: this.config.glyphArcChance,
            glyphDotChance: this.config.glyphDotChance,
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

        const progress = (currentFrame % numberOfFrames) / numberOfFrames;
        const cascadeProgress = progress * this.data.cascadeSpeed;
        const startX = centerPos.x - this.data.fieldWidth / 2;
        const startY = centerPos.y - this.data.fieldHeight / 2;
        const colSpacing = this.data.fieldWidth / this.data.columnCount;

        for (let c = 0; c < this.data.columns.length; c++) {
            const col = this.data.columns[c];
            const colSway = col.swayAmp * Math.sin(col.swayPhase + progress * Math.PI * 2 * col.swayFreq);
            const colX = startX + c * colSpacing + colSpacing / 2 + colSway;

            const headPos = ((cascadeProgress * col.cascadeSpeedFactor + col.cascadeOffset) % 1) * (this.data.rowCount + this.data.trailLength);

            for (let r = 0; r < this.data.rowCount; r++) {
                const distFromHead = headPos - r;
                if (distFromHead < 0 || distFromHead > this.data.trailLength) continue;

                const fadeFactor = 1 - (distFromHead / this.data.trailLength);
                if (fadeFactor <= 0) continue;

                const glyphIdx = r % col.glyphs.length;
                const glyph = col.glyphs[glyphIdx];
                const wobbleOffset = glyph.wobbleAmp * Math.sin(glyph.wobblePhase + progress * Math.PI * 2 * 3) * this.data.glyphSize;
                const glyphScale = 0.8 + 0.3 * Math.sin(glyph.scalePhase + progress * Math.PI * 2 * 2) + 0.15 * Math.sin(glyph.scalePhase * 1.6 + progress * Math.PI * 2 * 3.3);
                const cellX = colX + wobbleOffset;
                const cellY = startY + r * this.data.glyphSize + this.data.glyphSize / 2;

                const scale = this.data.glyphSize * 0.9 * glyphScale;
                const glyphThickness = lineWidth * fadeFactor;
                const glyphRotDeg = glyph.rotationAmp * Math.sin(glyph.rotationPhase + progress * Math.PI * 2 * 2);
                const glyphRotRad = glyphRotDeg * Math.PI / 180;
                const cosGR = Math.cos(glyphRotRad);
                const sinGR = Math.sin(glyphRotRad);

                for (const part of glyph.parts) {
                    const rx1 = part.x1 * cosGR - part.y1 * sinGR;
                    const ry1 = part.x1 * sinGR + part.y1 * cosGR;
                    const rx2 = part.x2 * cosGR - part.y2 * sinGR;
                    const ry2 = part.x2 * sinGR + part.y2 * cosGR;
                    const sx = cellX + rx1 * scale;
                    const sy = cellY + ry1 * scale;
                    const ex = cellX + rx2 * scale;
                    const ey = cellY + ry2 * scale;

                    if (part.isCurve) {
                        const rcx = part.ctrlX * cosGR - part.ctrlY * sinGR;
                        const rcy = part.ctrlX * sinGR + part.ctrlY * cosGR;
                        const cx = cellX + rcx * scale;
                        const cy = cellY + rcy * scale;
                        await canvas.drawCubicBezier(
                            {x: sx, y: sy},
                            {x: cx, y: cy},
                            {x: cx, y: cy},
                            {x: ex, y: ey},
                            glyphThickness,
                            color,
                            isUnderlay ? theAccentGaston * fadeFactor * 0.3 : 0,
                            color
                        );
                    } else {
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

                if (glyph.arcData) {
                    const arcPos = {x: cellX + glyph.arcData.cx * scale, y: cellY + glyph.arcData.cy * scale};
                    await canvas.drawArc2d(arcPos, glyph.arcData.r * scale, glyph.arcData.startAngle, glyph.arcData.endAngle, glyphThickness, color);
                }

                if (glyph.dotData) {
                    const dotPos = {x: cellX + glyph.dotData.dx * scale, y: cellY + glyph.dotData.dy * scale};
                    await canvas.drawDot(dotPos, glyph.dotData.dr * scale, color);
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
