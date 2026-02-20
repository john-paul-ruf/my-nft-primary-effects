import {LayerEffect} from 'my-nft-gen/src/core/layer/LayerEffect.js';
import {Canvas2dFactory} from 'my-nft-gen/src/core/factory/canvas/Canvas2dFactory.js';
import {getRandomIntInclusive, randomNumber} from 'my-nft-gen/src/core/math/random.js';
import {findValue} from 'my-nft-gen/src/core/math/findValue.js';

import {Settings} from 'my-nft-gen/src/core/Settings.js';
import {LissajousCageConfig} from './LissajousCageConfig.js';

export class LissajousCageEffect extends LayerEffect {
    static _name_ = 'lissajous-cage';
    static _displayName_ = 'Lissajous Cage';
    static _description_ = '3D Lissajous curve projection cage with multiple phase-shifted harmonics and fuzz';
    static _version_ = '1.0.0';
    static _author_ = 'Zencoder';
    static _tags_ = ['effect', 'primary', 'lissajous', 'cage', '3d', 'harmonic', 'animated'];

    constructor({
                    name = LissajousCageEffect._name_,
                    requiresLayer = true,
                    config = new LissajousCageConfig({}),
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

        const amplitude = getRandomIntInclusive(this.config.amplitude.lower(this.finalSize), this.config.amplitude.upper(this.finalSize));
        const curveCount = getRandomIntInclusive(this.config.curveCount.lower, this.config.curveCount.upper);
        const resolution = getRandomIntInclusive(this.config.resolution.lower, this.config.resolution.upper);
        const depthScale = getRandomIntInclusive(this.config.depthScale.lower, this.config.depthScale.upper);

        const curves = [];
        for (let c = 0; c < curveCount; c++) {
            curves.push({
                freqA: getRandomIntInclusive(this.config.freqA.lower, this.config.freqA.upper),
                freqB: getRandomIntInclusive(this.config.freqB.lower, this.config.freqB.upper),
                freqC: getRandomIntInclusive(this.config.freqC.lower, this.config.freqC.upper),
                phaseA: randomNumber(0, Math.PI * 2),
                phaseB: randomNumber(0, Math.PI * 2),
                phaseC: randomNumber(0, Math.PI * 2),
                amplitudeScale: 0.6 + randomNumber(0, 0.8),
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
            amplitude,
            curves,
            resolution,
            depthScale,
            speed: getRandomIntInclusive(this.config.speed.lower, this.config.speed.upper),
            tumbleFrequency: getRandomIntInclusive(this.config.tumbleFrequency.lower, this.config.tumbleFrequency.upper),
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

    #project3d(x3d, y3d, z3d, tumbleX, tumbleY) {
        let y1 = y3d * Math.cos(tumbleX) - z3d * Math.sin(tumbleX);
        let z1 = y3d * Math.sin(tumbleX) + z3d * Math.cos(tumbleX);
        let x1 = x3d * Math.cos(tumbleY) + z1 * Math.sin(tumbleY);
        let z2 = -x3d * Math.sin(tumbleY) + z1 * Math.cos(tumbleY);

        const perspectiveDist = 600;
        const scale = perspectiveDist / (perspectiveDist + z2);
        return {
            x: x1 * scale,
            y: y1 * scale,
            depth: z2,
        };
    }

    async #drawCageLayer(canvas, centerPos, currentFrame, numberOfFrames, isUnderlay, theAccentGaston) {
        const color = isUnderlay ? this.data.outerColor : this.data.innerColor;
        const baseWidth = isUnderlay ? this.data.thickness + theAccentGaston : this.data.thickness;

        const progress = (currentFrame % numberOfFrames) / numberOfFrames;
        const tumblePhase = progress * this.data.speed * Math.PI * 2;
        const tumbleX = findValue(-0.4, 0.4, this.data.tumbleFrequency, numberOfFrames, currentFrame) + tumblePhase * 0.3;
        const tumbleY = tumblePhase;

        for (const curve of this.data.curves) {
            const amp = this.data.amplitude * curve.amplitudeScale;

            for (let i = 0; i < this.data.resolution; i++) {
                const t1 = (i / this.data.resolution) * Math.PI * 2;
                const t2 = ((i + 1) / this.data.resolution) * Math.PI * 2;

                const x1_3d = amp * Math.sin(curve.freqA * t1 + curve.phaseA);
                const y1_3d = amp * Math.sin(curve.freqB * t1 + curve.phaseB);
                const z1_3d = amp * Math.sin(curve.freqC * t1 + curve.phaseC) * (this.data.depthScale / 100);

                const x2_3d = amp * Math.sin(curve.freqA * t2 + curve.phaseA);
                const y2_3d = amp * Math.sin(curve.freqB * t2 + curve.phaseB);
                const z2_3d = amp * Math.sin(curve.freqC * t2 + curve.phaseC) * (this.data.depthScale / 100);

                const p1 = this.#project3d(x1_3d, y1_3d, z1_3d, tumbleX, tumbleY);
                const p2 = this.#project3d(x2_3d, y2_3d, z2_3d, tumbleX, tumbleY);

                const depthFactor = 0.4 + 0.6 * ((p1.depth + this.data.amplitude) / (2 * this.data.amplitude));
                const lineWidth = baseWidth * Math.max(0.3, depthFactor);
                const glow = isUnderlay ? theAccentGaston * depthFactor * 0.3 : 0;

                await canvas.drawLine2d(
                    {x: centerPos.x + p1.x, y: centerPos.y + p1.y},
                    {x: centerPos.x + p2.x, y: centerPos.y + p2.y},
                    lineWidth,
                    color,
                    glow,
                    color
                );
            }
        }
    }

    async invoke(layer, currentFrame, numberOfFrames) {
        const centerPos = this.data.center.getPosition(currentFrame, numberOfFrames);
        const theAccentGaston = findValue(this.data.accentRange.lower, this.data.accentRange.upper, this.data.featherTimes, numberOfFrames, currentFrame);
        const theBlurGaston = Math.ceil(findValue(this.data.blurRange.lower, this.data.blurRange.upper, this.data.featherTimes, numberOfFrames, currentFrame));

        const topCanvas = await Canvas2dFactory.getNewCanvas(this.data.width, this.data.height);
        const bottomCanvas = await Canvas2dFactory.getNewCanvas(this.data.width, this.data.height);

        await this.#drawCageLayer(topCanvas, centerPos, currentFrame, numberOfFrames, false, 0);
        await this.#drawCageLayer(bottomCanvas, centerPos, currentFrame, numberOfFrames, true, theAccentGaston);

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
        return `${LissajousCageEffect._displayName_}: curves=${this.data.curves.length}, resolution=${this.data.resolution}`;
    }
}
