import {LayerEffect} from 'my-nft-gen/src/core/layer/LayerEffect.js';
import {Canvas2dFactory} from 'my-nft-gen/src/core/factory/canvas/Canvas2dFactory.js';
import {getRandomIntInclusive, randomNumber} from 'my-nft-gen/src/core/math/random.js';
import {findValue} from 'my-nft-gen/src/core/math/findValue.js';
import {findOneWayValue} from 'my-nft-gen/src/core/math/findOneWayValue.js';
import {Settings} from 'my-nft-gen/src/core/Settings.js';
import {ReactionDiffusionConfig} from './ReactionDiffusionConfig.js';

export class ReactionDiffusionEffect extends LayerEffect {
    static _name_ = 'reaction-diffusion';
    static _displayName_ = 'Reaction Diffusion';
    static _description_ = 'Turing pattern simulation rendered as animated contour topology with organic spots and stripes with fuzz';
    static _version_ = '1.0.0';
    static _author_ = 'Zencoder';
    static _tags_ = ['effect', 'primary', 'turing', 'reaction', 'diffusion', 'organic', 'contour', 'animated'];

    constructor({
                    name = ReactionDiffusionEffect._name_,
                    requiresLayer = true,
                    config = new ReactionDiffusionConfig({}),
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

        const gridResolution = getRandomIntInclusive(this.config.gridResolution.lower, this.config.gridResolution.upper);
        const seedCount = getRandomIntInclusive(this.config.seedCount.lower, this.config.seedCount.upper);
        const noiseScale = getRandomIntInclusive(this.config.noiseScale.lower, this.config.noiseScale.upper);
        const fieldRadius = getRandomIntInclusive(this.config.fieldRadius.lower(this.finalSize), this.config.fieldRadius.upper(this.finalSize));

        const seeds = [];
        for (let i = 0; i < seedCount; i++) {
            seeds.push({
                x: randomNumber(-1, 1),
                y: randomNumber(-1, 1),
                frequency: randomNumber(1.5, 4),
                phase: randomNumber(0, Math.PI * 2),
                amplitude: randomNumber(0.3, 1),
            });
        }

        const harmonics = [];
        for (let i = 0; i < noiseScale; i++) {
            harmonics.push({
                freqX: randomNumber(1, 5),
                freqY: randomNumber(1, 5),
                phaseX: randomNumber(0, Math.PI * 2),
                phaseY: randomNumber(0, Math.PI * 2),
                weight: randomNumber(0.2, 1) / (i + 1),
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
            gridResolution,
            fieldRadius,
            contourLevels: getRandomIntInclusive(this.config.contourLevels.lower, this.config.contourLevels.upper),
            seeds,
            harmonics,
            waveFrequency: getRandomIntInclusive(this.config.waveFrequency.lower, this.config.waveFrequency.upper),
            speed: getRandomIntInclusive(this.config.speed.lower, this.config.speed.upper),
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

    #computeField(centerPos, currentFrame, numberOfFrames) {
        const timePhase = findOneWayValue(0, Math.PI * 2 * this.data.speed, 1, numberOfFrames, currentFrame, false);
        const res = this.data.gridResolution;
        const field = [];

        for (let gy = 0; gy <= res; gy++) {
            const row = [];
            for (let gx = 0; gx <= res; gx++) {
                const nx = (gx / res) * 2 - 1;
                const ny = (gy / res) * 2 - 1;

                let value = 0;
                for (const seed of this.data.seeds) {
                    const dx = nx - seed.x;
                    const dy = ny - seed.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    value += seed.amplitude * Math.sin(dist * seed.frequency * Math.PI + seed.phase + timePhase);
                }

                for (const h of this.data.harmonics) {
                    value += h.weight * Math.sin(nx * h.freqX * Math.PI + h.phaseX + timePhase)
                        * Math.cos(ny * h.freqY * Math.PI + h.phaseY + timePhase * 0.7);
                }

                row.push(value);
            }
            field.push(row);
        }
        return field;
    }

    #extractContourSegments(field, centerPos) {
        const res = this.data.gridResolution;
        const cellSize = (this.data.fieldRadius * 2) / res;
        const segments = [];

        for (let level = 0; level < this.data.contourLevels; level++) {
            const threshold = ((level + 0.5) / this.data.contourLevels) * 2 - 1;

            for (let gy = 0; gy < res; gy++) {
                for (let gx = 0; gx < res; gx++) {
                    const tl = field[gy][gx];
                    const tr = field[gy][gx + 1];
                    const bl = field[gy + 1][gx];
                    const br = field[gy + 1][gx + 1];

                    const cellX = centerPos.x - this.data.fieldRadius + gx * cellSize;
                    const cellY = centerPos.y - this.data.fieldRadius + gy * cellSize;

                    const edges = this.#marchSquareCell(tl, tr, bl, br, threshold, cellX, cellY, cellSize);
                    for (const edge of edges) {
                        segments.push({...edge, level});
                    }
                }
            }
        }
        return segments;
    }

    #marchSquareCell(tl, tr, bl, br, threshold, cellX, cellY, cellSize) {
        const code = (tl > threshold ? 8 : 0) | (tr > threshold ? 4 : 0) | (br > threshold ? 2 : 0) | (bl > threshold ? 1 : 0);
        if (code === 0 || code === 15) return [];

        const lerp = (a, b) => {
            const denom = b - a;
            if (Math.abs(denom) < 0.0001) return 0.5;
            return (threshold - a) / denom;
        };

        const top = {x: cellX + lerp(tl, tr) * cellSize, y: cellY};
        const bottom = {x: cellX + lerp(bl, br) * cellSize, y: cellY + cellSize};
        const left = {x: cellX, y: cellY + lerp(tl, bl) * cellSize};
        const right = {x: cellX + cellSize, y: cellY + lerp(tr, br) * cellSize};

        const lines = [];
        const addLine = (a, b) => lines.push({start: a, end: b});

        switch (code) {
            case 1: addLine(left, bottom); break;
            case 2: addLine(bottom, right); break;
            case 3: addLine(left, right); break;
            case 4: addLine(top, right); break;
            case 5: addLine(top, left); addLine(bottom, right); break;
            case 6: addLine(top, bottom); break;
            case 7: addLine(top, left); break;
            case 8: addLine(top, left); break;
            case 9: addLine(top, bottom); break;
            case 10: addLine(top, right); addLine(left, bottom); break;
            case 11: addLine(top, right); break;
            case 12: addLine(left, right); break;
            case 13: addLine(bottom, right); break;
            case 14: addLine(left, bottom); break;
        }
        return lines;
    }

    async #drawContourLayer(canvas, centerPos, currentFrame, numberOfFrames, isUnderlay, theAccentGaston) {
        const field = this.#computeField(centerPos, currentFrame, numberOfFrames);
        const segments = this.#extractContourSegments(field, centerPos);

        const color = isUnderlay ? this.data.outerColor : this.data.innerColor;
        const lineWidth = isUnderlay ? this.data.thickness + theAccentGaston : this.data.thickness;

        for (const seg of segments) {
            await canvas.drawLine2d(seg.start, seg.end, lineWidth, color, isUnderlay ? theAccentGaston * 0.3 : 0, color);
        }
    }

    async invoke(layer, currentFrame, numberOfFrames) {
        const centerPos = this.data.center.getPosition(currentFrame, numberOfFrames);
        const theAccentGaston = findValue(this.data.accentRange.lower, this.data.accentRange.upper, this.data.featherTimes, numberOfFrames, currentFrame);
        const theBlurGaston = Math.ceil(findValue(this.data.blurRange.lower, this.data.blurRange.upper, this.data.featherTimes, numberOfFrames, currentFrame));

        const topCanvas = await Canvas2dFactory.getNewCanvas(this.data.width, this.data.height);
        const bottomCanvas = await Canvas2dFactory.getNewCanvas(this.data.width, this.data.height);

        await this.#drawContourLayer(topCanvas, centerPos, currentFrame, numberOfFrames, false, 0);
        await this.#drawContourLayer(bottomCanvas, centerPos, currentFrame, numberOfFrames, true, theAccentGaston);

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
        return `${ReactionDiffusionEffect._displayName_}: grid=${this.data.gridResolution}, contours=${this.data.contourLevels}, seeds=${this.data.seeds.length}`;
    }
}
