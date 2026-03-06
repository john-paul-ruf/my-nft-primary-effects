import {LayerEffect} from 'my-nft-gen/src/core/layer/LayerEffect.js';
import {Canvas2dFactory} from 'my-nft-gen/src/core/factory/canvas/Canvas2dFactory.js';
import {getRandomIntInclusive, randomNumber} from 'my-nft-gen/src/core/math/random.js';
import {findValue} from 'my-nft-gen/src/core/math/findValue.js';

import {Settings} from 'my-nft-gen/src/core/Settings.js';
import {SonicRosetteConfig} from './SonicRosetteConfig.js';

export class SonicRosetteEffect extends LayerEffect {
    static _name_ = 'sonic-rosette';
    static _displayName_ = 'Sonic Rosette';
    static _description_ = 'Polar-coordinate rose curves with harmonic frequency modulation and fuzz';
    static _version_ = '1.0.0';
    static _author_ = 'Zencoder';
    static _tags_ = ['effect', 'primary', 'sonic', 'rosette', 'rhodonea', 'polar', 'harmonic', 'animated'];

    constructor({
                    name = SonicRosetteEffect._name_,
                    requiresLayer = true,
                    config = new SonicRosetteConfig({}),
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
        const layerCount = getRandomIntInclusive(this.config.layerCount.lower, this.config.layerCount.upper);
        const resolution = getRandomIntInclusive(this.config.resolution.lower, this.config.resolution.upper);

        const roseLayers = [];
        for (let l = 0; l < layerCount; l++) {
            const n = getRandomIntInclusive(this.config.petalNumerator.lower, this.config.petalNumerator.upper);
            const d = getRandomIntInclusive(this.config.petalDenominator.lower, this.config.petalDenominator.upper);
            const harmonics = [];
            const harmonicCount = getRandomIntInclusive(this.config.harmonicDepth.lower, this.config.harmonicDepth.upper);
            for (let h = 0; h < harmonicCount; h++) {
                harmonics.push({
                    frequency: getRandomIntInclusive(2, 8),
                    amplitude: getRandomIntInclusive(this.config.harmonicAmplitude.lower, this.config.harmonicAmplitude.upper),
                    phase: randomNumber(0, Math.PI * 2),
                });
            }
            roseLayers.push({
                n,
                d,
                k: n / d,
                amplitudeScale: 0.6 + randomNumber(0, 0.8),
                rotationOffset: randomNumber(0, 360),
                harmonics,
                rotationSpeedMult: randomNumber(0.3, 2.5),
                breathPhase: randomNumber(0, Math.PI * 2),
                breathFreqMult: randomNumber(0.5, 2),
                thicknessPhase: randomNumber(0, Math.PI * 2),
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
            roseLayers,
            resolution,
            speed: getRandomIntInclusive(this.config.speed.lower, this.config.speed.upper),
            breathFrequency: getRandomIntInclusive(this.config.breathFrequency.lower, this.config.breathFrequency.upper),
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

    async #drawRosetteLayer(canvas, centerPos, currentFrame, numberOfFrames, isUnderlay, theAccentGaston) {
        const color = isUnderlay ? this.data.outerColor : this.data.innerColor;
        const baseWidth = isUnderlay ? this.data.thickness + theAccentGaston : this.data.thickness;

        const progress = (currentFrame % numberOfFrames) / numberOfFrames;
        const rotAngle = progress * this.data.speed * 360;
        const breathe = findValue(0.75, 1.25, this.data.breathFrequency, numberOfFrames, currentFrame);
        const harmonicPhaseShift = progress * Math.PI * 2 * this.data.speed;

        for (const roseLayer of this.data.roseLayers) {
            const layerBreath = 0.7 + 0.4 * Math.sin(roseLayer.breathPhase + progress * Math.PI * 2 * roseLayer.breathFreqMult * 2) + 0.2 * Math.sin(roseLayer.breathPhase * 1.5 + progress * Math.PI * 2 * roseLayer.breathFreqMult * 3.3);
            const amp = this.data.amplitude * roseLayer.amplitudeScale * breathe * layerBreath;
            const maxTheta = Math.PI * 2 * roseLayer.d;
            const layerRotAngle = rotAngle * roseLayer.rotationSpeedMult;

            for (let i = 0; i < this.data.resolution; i++) {
                const t1 = (i / this.data.resolution) * maxTheta;
                const t2 = ((i + 1) / this.data.resolution) * maxTheta;

                let r1 = amp * Math.cos(roseLayer.k * t1);
                let r2 = amp * Math.cos(roseLayer.k * t2);

                for (const harmonic of roseLayer.harmonics) {
                    const animPhase = harmonic.phase + harmonicPhaseShift * harmonic.frequency * 0.3 * roseLayer.rotationSpeedMult;
                    r1 += harmonic.amplitude * Math.sin(harmonic.frequency * t1 + animPhase);
                    r2 += harmonic.amplitude * Math.sin(harmonic.frequency * t2 + animPhase);
                }

                const rot = (layerRotAngle + roseLayer.rotationOffset) * Math.PI / 180;
                const a1 = t1 + rot;
                const a2 = t2 + rot;

                const x1 = centerPos.x + r1 * Math.cos(a1);
                const y1 = centerPos.y + r1 * Math.sin(a1);
                const x2 = centerPos.x + r2 * Math.cos(a2);
                const y2 = centerPos.y + r2 * Math.sin(a2);

                const rNorm = Math.abs(r1) / (amp || 1);
                const thicknessWave = 0.6 + 0.8 * Math.sin(roseLayer.thicknessPhase + progress * Math.PI * 2 * 2 + t1 * 3);
                const lineWidth = baseWidth * (0.5 + 0.5 * rNorm) * thicknessWave;
                const glow = isUnderlay ? theAccentGaston * rNorm * 0.3 : 0;

                await canvas.drawLine2d(
                    {x: x1, y: y1},
                    {x: x2, y: y2},
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

        await this.#drawRosetteLayer(topCanvas, centerPos, currentFrame, numberOfFrames, false, 0);
        await this.#drawRosetteLayer(bottomCanvas, centerPos, currentFrame, numberOfFrames, true, theAccentGaston);

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
        return `${SonicRosetteEffect._displayName_}: layers=${this.data.roseLayers.length}, resolution=${this.data.resolution}`;
    }
}
