import {LayerEffect} from 'my-nft-gen/src/core/layer/LayerEffect.js';
import {Canvas2dFactory} from 'my-nft-gen/src/core/factory/canvas/Canvas2dFactory.js';
import {getRandomIntInclusive, randomNumber} from 'my-nft-gen/src/core/math/random.js';
import {findValue} from 'my-nft-gen/src/core/math/findValue.js';

import {Settings} from 'my-nft-gen/src/core/Settings.js';
import {ChladniPlateConfig} from './ChladniPlateConfig.js';

export class ChladniPlateEffect extends LayerEffect {
    static _name_ = 'chladni-plate';
    static _displayName_ = 'Chladni Plate';
    static _description_ = 'Chladni plate vibration nodal line patterns with animated eigenmode morphing and fuzz';
    static _version_ = '1.0.0';
    static _author_ = 'Zencoder';
    static _tags_ = ['effect', 'primary', 'chladni', 'vibration', 'nodal', 'physics', 'animated'];

    constructor({
                    name = ChladniPlateEffect._name_,
                    requiresLayer = true,
                    config = new ChladniPlateConfig({}),
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

        const plateRadius = getRandomIntInclusive(this.config.plateRadius.lower(this.finalSize), this.config.plateRadius.upper(this.finalSize));
        const resolution = getRandomIntInclusive(this.config.resolution.lower, this.config.resolution.upper);

        const modes = [];
        const modeCount = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < modeCount; i++) {
            modes.push({
                m: getRandomIntInclusive(this.config.modeM.lower, this.config.modeM.upper),
                n: getRandomIntInclusive(this.config.modeN.lower, this.config.modeN.upper),
                weight: randomNumber(0.3, 1),
                phaseOffset: randomNumber(0, Math.PI * 2),
                weightOscPhase: randomNumber(0, Math.PI * 2),
                weightOscFreq: randomNumber(0.5, 2),
                weightOscAmp: randomNumber(0.2, 0.6),
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
            plateRadius,
            resolution,
            modes,
            morphSpeed: getRandomIntInclusive(this.config.morphSpeed.lower, this.config.morphSpeed.upper),
            nodalThreshold: randomNumber(this.config.nodalThreshold.lower, this.config.nodalThreshold.upper),
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

    #chladniValue(nx, ny, currentFrame, numberOfFrames) {
        const progress = (currentFrame % numberOfFrames) / numberOfFrames;
        const morph = progress * Math.PI * 2 * this.data.morphSpeed;
        let value = 0;

        for (const mode of this.data.modes) {
            const mShifted = mode.m + 1.2 * Math.sin(morph + mode.phaseOffset) + 0.5 * Math.sin(morph * 2.3 + mode.phaseOffset * 1.7);
            const nShifted = mode.n + 1.2 * Math.cos(morph + mode.phaseOffset) + 0.5 * Math.cos(morph * 1.7 + mode.phaseOffset * 1.3);
            const animWeight = mode.weight * (1 + mode.weightOscAmp * Math.sin(mode.weightOscPhase + progress * Math.PI * 2 * mode.weightOscFreq));
            value += animWeight * (
                Math.cos(mShifted * Math.PI * nx) * Math.cos(nShifted * Math.PI * ny)
                - Math.cos(nShifted * Math.PI * nx) * Math.cos(mShifted * Math.PI * ny)
            );
        }
        return value;
    }

    async #drawChladniLayer(canvas, centerPos, currentFrame, numberOfFrames, isUnderlay, theAccentGaston) {
        const color = isUnderlay ? this.data.outerColor : this.data.innerColor;
        const dotSize = isUnderlay ? this.data.thickness + theAccentGaston : this.data.thickness;
        const res = this.data.resolution;
        const progress = (currentFrame % numberOfFrames) / numberOfFrames;
        const radiusBreath = 0.9 + 0.2 * Math.sin(progress * Math.PI * 2 * this.data.speed * 0.5);
        const r = this.data.plateRadius * radiusBreath;
        const threshold = this.data.nodalThreshold / res;

        for (let gy = 0; gy < res; gy++) {
            for (let gx = 0; gx < res; gx++) {
                const nx = (gx / res) * 2 - 1;
                const ny = (gy / res) * 2 - 1;

                const distFromCenter = Math.sqrt(nx * nx + ny * ny);
                if (distFromCenter > 1) continue;

                const value = this.#chladniValue(nx, ny, currentFrame, numberOfFrames);

                if (Math.abs(value) < threshold) {
                    const px = centerPos.x + nx * r;
                    const py = centerPos.y + ny * r;
                    await canvas.drawRing2d(
                        {x: px, y: py},
                        dotSize * 0.5,
                        dotSize,
                        color,
                        isUnderlay ? theAccentGaston * 0.3 : 0,
                        color
                    );
                }
            }
        }

        await canvas.drawRing2d(centerPos, r, dotSize * 0.5, color, isUnderlay ? theAccentGaston * 0.2 : 0, color);
    }

    async invoke(layer, currentFrame, numberOfFrames) {
        const centerPos = this.data.center.getPosition(currentFrame, numberOfFrames);
        const theAccentGaston = findValue(this.data.accentRange.lower, this.data.accentRange.upper, this.data.featherTimes, numberOfFrames, currentFrame);
        const theBlurGaston = Math.ceil(findValue(this.data.blurRange.lower, this.data.blurRange.upper, this.data.featherTimes, numberOfFrames, currentFrame));

        const topCanvas = await Canvas2dFactory.getNewCanvas(this.data.width, this.data.height);
        const bottomCanvas = await Canvas2dFactory.getNewCanvas(this.data.width, this.data.height);

        await this.#drawChladniLayer(topCanvas, centerPos, currentFrame, numberOfFrames, false, 0);
        await this.#drawChladniLayer(bottomCanvas, centerPos, currentFrame, numberOfFrames, true, theAccentGaston);

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
        return `${ChladniPlateEffect._displayName_}: modes=${this.data.modes.length}, res=${this.data.resolution}`;
    }
}
