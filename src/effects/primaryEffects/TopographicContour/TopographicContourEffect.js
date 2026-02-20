import {LayerEffect} from 'my-nft-gen/src/core/layer/LayerEffect.js';
import {Canvas2dFactory} from 'my-nft-gen/src/core/factory/canvas/Canvas2dFactory.js';
import {getRandomIntInclusive, randomNumber} from 'my-nft-gen/src/core/math/random.js';
import {findValue} from 'my-nft-gen/src/core/math/findValue.js';

import {Settings} from 'my-nft-gen/src/core/Settings.js';
import {TopographicContourConfig} from './TopographicContourConfig.js';

export class TopographicContourEffect extends LayerEffect {
    static _name_ = 'topographic-contour';
    static _displayName_ = 'Topographic Contour';
    static _description_ = 'Layered topographic contour map with elevation color banding and animated sweep with fuzz';
    static _version_ = '1.0.0';
    static _author_ = 'Zencoder';
    static _tags_ = ['effect', 'primary', 'topographic', 'contour', 'elevation', 'map', 'animated'];

    constructor({
                    name = TopographicContourEffect._name_,
                    requiresLayer = true,
                    config = new TopographicContourConfig({}),
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

        const fieldRadius = getRandomIntInclusive(this.config.fieldRadius.lower(this.finalSize), this.config.fieldRadius.upper(this.finalSize));
        const peakCount = getRandomIntInclusive(this.config.peakCount.lower, this.config.peakCount.upper);
        const resolution = getRandomIntInclusive(this.config.resolution.lower, this.config.resolution.upper);
        const contourLevels = getRandomIntInclusive(this.config.contourLevels.lower, this.config.contourLevels.upper);

        const peaks = [];
        for (let i = 0; i < peakCount; i++) {
            peaks.push({
                x: randomNumber(-0.7, 0.7),
                y: randomNumber(-0.7, 0.7),
                height: randomNumber(0.5, 1),
                spread: randomNumber(0.2, 0.6),
                driftPhase: randomNumber(0, Math.PI * 2),
                driftAmp: randomNumber(0.02, 0.08),
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
            fieldRadius,
            peaks,
            contourLevels,
            resolution,
            sweepSpeed: getRandomIntInclusive(this.config.sweepSpeed.lower, this.config.sweepSpeed.upper),
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

    #computeElevation(nx, ny, currentFrame, numberOfFrames) {
        const progress = (currentFrame % numberOfFrames) / numberOfFrames;
        const sweepPhase = progress * Math.PI * 2 * this.data.sweepSpeed;
        let elevation = 0;

        for (const peak of this.data.peaks) {
            const driftX = peak.driftAmp * Math.sin(peak.driftPhase + sweepPhase);
            const driftY = peak.driftAmp * Math.cos(peak.driftPhase * 1.3 + sweepPhase * 0.7);
            const dx = nx - (peak.x + driftX);
            const dy = ny - (peak.y + driftY);
            const dist = Math.sqrt(dx * dx + dy * dy);
            elevation += peak.height * Math.exp(-(dist * dist) / (2 * peak.spread * peak.spread));
        }

        return elevation;
    }

    #buildField(centerPos, currentFrame, numberOfFrames) {
        const res = this.data.resolution;
        const field = [];
        for (let gy = 0; gy <= res; gy++) {
            const row = [];
            for (let gx = 0; gx <= res; gx++) {
                const nx = (gx / res) * 2 - 1;
                const ny = (gy / res) * 2 - 1;
                row.push(this.#computeElevation(nx, ny, currentFrame, numberOfFrames));
            }
            field.push(row);
        }
        return field;
    }

    #extractContours(field, centerPos) {
        const res = this.data.resolution;
        const cellSize = (this.data.fieldRadius * 2) / res;
        const segments = [];

        for (let level = 1; level <= this.data.contourLevels; level++) {
            const threshold = level / (this.data.contourLevels + 1);

            for (let gy = 0; gy < res; gy++) {
                for (let gx = 0; gx < res; gx++) {
                    const tl = field[gy][gx];
                    const tr = field[gy][gx + 1];
                    const bl = field[gy + 1][gx];
                    const br = field[gy + 1][gx + 1];

                    const cellX = centerPos.x - this.data.fieldRadius + gx * cellSize;
                    const cellY = centerPos.y - this.data.fieldRadius + gy * cellSize;

                    const code = (tl > threshold ? 8 : 0) | (tr > threshold ? 4 : 0) | (br > threshold ? 2 : 0) | (bl > threshold ? 1 : 0);
                    if (code === 0 || code === 15) continue;

                    const lerp = (a, b) => {
                        const d = b - a;
                        if (Math.abs(d) < 0.0001) return 0.5;
                        return (threshold - a) / d;
                    };

                    const top = {x: cellX + lerp(tl, tr) * cellSize, y: cellY};
                    const bottom = {x: cellX + lerp(bl, br) * cellSize, y: cellY + cellSize};
                    const left = {x: cellX, y: cellY + lerp(tl, bl) * cellSize};
                    const right = {x: cellX + cellSize, y: cellY + lerp(tr, br) * cellSize};

                    const addSeg = (a, b) => segments.push({start: a, end: b, level});

                    switch (code) {
                        case 1: addSeg(left, bottom); break;
                        case 2: addSeg(bottom, right); break;
                        case 3: addSeg(left, right); break;
                        case 4: addSeg(top, right); break;
                        case 5: addSeg(top, left); addSeg(bottom, right); break;
                        case 6: addSeg(top, bottom); break;
                        case 7: addSeg(top, left); break;
                        case 8: addSeg(top, left); break;
                        case 9: addSeg(top, bottom); break;
                        case 10: addSeg(top, right); addSeg(left, bottom); break;
                        case 11: addSeg(top, right); break;
                        case 12: addSeg(left, right); break;
                        case 13: addSeg(bottom, right); break;
                        case 14: addSeg(left, bottom); break;
                    }
                }
            }
        }
        return segments;
    }

    async #drawContourLayer(canvas, centerPos, currentFrame, numberOfFrames, isUnderlay, theAccentGaston) {
        const field = this.#buildField(centerPos, currentFrame, numberOfFrames);
        const segments = this.#extractContours(field, centerPos);

        const color = isUnderlay ? this.data.outerColor : this.data.innerColor;

        for (const seg of segments) {
            const majorLine = seg.level % 5 === 0;
            const lineWidth = isUnderlay
                ? (majorLine ? this.data.thickness * 1.5 : this.data.thickness) + theAccentGaston
                : (majorLine ? this.data.thickness * 1.5 : this.data.thickness);

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
        return `${TopographicContourEffect._displayName_}: peaks=${this.data.peaks.length}, contours=${this.data.contourLevels}`;
    }
}
